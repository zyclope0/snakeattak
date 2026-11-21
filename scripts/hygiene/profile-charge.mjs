// Où va le temps pendant un combat chargé : la vague 11 avec 48 alliés (le camp de
// `reference-charge.mjs`), processeur ralenti, relevé par le profileur du navigateur.
// Il faut un paquet aux noms lisibles :
//   npx vite build --mode android --minify false --outDir artifacts/perf/lisible
//   node --experimental-strip-types scripts/hygiene/profile-charge.mjs artifacts/perf/lisible [secondes] [ralenti] [noms…]
// `DETAIL=nom` ajoute ce que cette fonction appelle directement, du plus long au plus court.
// Donne, pour chaque fonction nommée, le temps passé dedans et dessous, en millisecondes par
// seconde de combat. Sans carte graphique : compare deux versions, ne dit rien d'un téléphone.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { open, start, status, boardReady, text } from './harness.mjs';

const { Game } = await import('../../src/game.ts');
const { encodeCheckpoint } = await import('../../src/checkpoints.ts');
const { CAMP_STORAGE_KEY } = await import('../../src/storageKeys.ts');
const [dir = 'artifacts/perf/lisible', seconds = '30', slowdown = '4', ...asked] =
  process.argv.slice(2);
const names = asked.length
  ? asked
  : ['saveAndRedraw', 'recordGame', 'sync', 'writeFamilyBackup', 'refresh', 'step'];

function denseCamp() {
  const game = new Game(1234);
  game.wave = 10;
  game.normalizeCamp();
  game.gold = 9000;
  const kinds = ['ninja', 'club', 'archer', 'medic', 'shield'];
  let n = 0;
  for (let x = 612; x <= 972; x += 60)
    for (let y = 132; y <= 516; y += 64) if (game.recruit(kinds[n % kinds.length], x, y)) n++;
  return { raw: encodeCheckpoint(game), units: game.units.length };
}
const camp = denseCamp();
const { browser, context, page, report } = await open({
  dir,
  storage: { [CAMP_STORAGE_KEY]: camp.raw },
});
try {
  const cdp = await context.newCDPSession(page);
  await start(page);
  await page.locator('#home-classic').click();
  await page.locator('#home-continue').click();
  await boardReady(page);
  assert.equal(await text(page, '#army-count'), String(camp.units));
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(slowdown) });
  await page.locator('#start').click();
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
  await cdp.send('Profiler.start');
  await page.waitForTimeout(Number(seconds) * 1000);
  const { profile } = await cdp.send('Profiler.stop');
  const during = await status(page);
  assert.deepEqual(report.errors, []);

  // Time under each node, then, by name, under its outermost calls only.
  const byId = new Map(profile.nodes.map((node) => [node.id, node]));
  const self = new Map();
  const deltas = profile.timeDeltas;
  profile.samples.forEach((id, i) => self.set(id, (self.get(id) ?? 0) + (deltas[i] ?? 0)));
  const under = new Map();
  const total = (node) => {
    let sum = self.get(node.id) ?? 0;
    for (const child of node.children ?? []) sum += total(byId.get(child));
    under.set(node.id, sum);
    return sum;
  };
  const root = profile.nodes[0];
  const all = total(root);
  const inside = Object.fromEntries(names.map((name) => [name, 0]));
  const walk = (node, open) => {
    const name = node.callFrame.functionName;
    const counted = name in inside && !open.has(name);
    if (counted) inside[name] += under.get(node.id);
    const next = counted ? new Set(open).add(name) : open;
    for (const child of node.children ?? []) walk(byId.get(child), next);
  };
  walk(root, new Set());
  // What the function named by DETAIL calls directly.
  const detail = {};
  for (const node of profile.nodes)
    if (node.callFrame.functionName === process.env.DETAIL)
      for (const child of node.children ?? []) {
        const name = byId.get(child).callFrame.functionName || '(sans nom)';
        detail[name] = (detail[name] ?? 0) + under.get(child);
      }
  const idle = profile.nodes
    .filter((node) => node.callFrame.functionName === '(idle)')
    .reduce((sum, node) => sum + (self.get(node.id) ?? 0), 0);
  const perSecond = (micro) => +(micro / 1000 / Number(seconds)).toFixed(2);
  const out = {
    recipe: 'profile-charge',
    dir,
    units: camp.units,
    seconds: Number(seconds),
    slowdown: Number(slowdown),
    during,
    busyMsPerSecond: perSecond(all - idle),
    msPerSecond: Object.fromEntries(names.map((name) => [name, perSecond(inside[name])])),
    ...(process.env.DETAIL
      ? {
          detail: Object.fromEntries(
            Object.entries(detail)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12)
              .map(([name, micro]) => [name, perSecond(micro)]),
          ),
        }
      : {}),
  };
  await mkdir('artifacts/hygiene', { recursive: true });
  await writeFile(
    `artifacts/hygiene/profile-charge-${dir.replace(/\W+/g, '_')}.json`,
    JSON.stringify(out, null, 2),
  );
  console.log(JSON.stringify(out));
} finally {
  await browser.close();
}
