// Laboratoire des caprices : vrai moteur à 30 Hz, sans navigateur ni enfant.
// Usage : node scripts/caprices-lab.mjs [catalogue|candidats.json] [sortie.json] [shard] [shards] [graines] [révision=2] [chemins=2]
// « chemins » : 2 (défaut) pour les règles de chemin des nouveaux départs, 1 pour celles
// d'avant le 21 novembre 2026 (un allié pouvait rester contre un rocher) ; révision 2 seulement.
// « catalogue » (défaut) joue les 18 caprices validés et chaque mission normale ; un fichier
// de candidats permet d'essayer d'autres réglages ({ id, missionId, rules, profiles? }).
// Avec un seul shard, affiche le taux de victoire et le cristal minimal moyen par joueur.
// Profils : expert (stratégie « mixed » du bilan 0.34.1), moyen (dépense tout, voies en
// rotation, ni miel ni encouragement), petit (deux achats par vague, voies en rotation).
import { readFile, writeFile } from 'node:fs/promises';
import { Game } from '../src/game.ts';
import { MISSIONS, createMissionRun } from '../src/missions.ts';
import { LANES, laneDefense } from '../src/ai.ts';
import { CAPRICES, CREATOR_CHALLENGES, capriceById, defineCaprice } from '../src/caprices.ts';

const [
  candidatesPath = 'catalogue',
  outPath = '',
  shardArg = '0',
  shardsArg = '1',
  seedSetsArg = '3',
  revisionArg = '2',
  pathsArg = '2',
] = process.argv.slice(2);
const shard = Number(shardArg),
  shards = Number(shardsArg),
  seedSets = Number(seedSetsArg);
const revision = Number(revisionArg);
if (pathsArg !== '1' && pathsArg !== '2')
  throw new RangeError('Chemins invalides : 1 ou 2 attendu');
// The second path rules only exist with the second balance revision.
const paths = revision === 2 && pathsArg === '2' ? 2 : undefined;
if (revisionArg !== '1' && revisionArg !== '2')
  throw new RangeError('Révision invalide : 1 ou 2 attendu');
const candidates =
  candidatesPath === 'catalogue'
    ? [
        ...MISSIONS.map((m) => ({ id: 'base', missionId: m.id })),
        ...[...CAPRICES, ...CREATOR_CHALLENGES].map((c) => ({ id: c.id, missionId: c.missionId })),
      ]
    : JSON.parse(await readFile(candidatesPath, 'utf8'));
const dt = 1 / 30;
const PROFILES = ['expert', 'moyen', 'petit'];

function play(run, profile) {
  const g = new Game(run.seed, undefined, run);
  const r = { status: null, minBase: 100, seconds: 0, deaths: 0, stars: 0 };
  let rotation = 0;
  function place(kind, lane) {
    const rear = ['archer', 'medic', 'nurse', 'dragon'].includes(kind);
    for (const x of rear
      ? [900, 948, 852, 804, 756, 708, 660]
      : [660, 708, 756, 804, 852, 900, 948])
      for (const offset of [0, -48, 48]) if (g.recruit(kind, x, LANES[lane] + offset)) return true;
    return false;
  }
  function buyExpert(kind) {
    if (!g.isUnlocked(kind) || !g.capriceAllows(kind) || g.gold < g.recruitCost(kind)) return false;
    const scores = laneDefense(g.units),
      lanes = [0, 1, 2].sort((a, b) => scores[a] - scores[b] || a - b);
    for (const lane of lanes) if (place(kind, lane)) return true;
    return false;
  }
  function buyRotating(kind) {
    if (!g.isUnlocked(kind) || !g.capriceAllows(kind) || g.gold < g.recruitCost(kind)) return false;
    for (let k = 0; k < 3; k++) {
      const lane = (rotation + k) % 3;
      if (place(kind, lane)) {
        rotation = (lane + 1) % 3;
        return true;
      }
    }
    return false;
  }
  const order = ['club', 'shield', 'archer'];
  function step() {
    const count = g.units.length;
    g.step(dt);
    r.deaths += Math.max(0, count - g.units.length);
  }
  for (let wave = 1; wave <= g.totalWaves; wave++) {
    if (profile === 'expert') {
      const healer = g.isUnlocked('medic') ? 'medic' : 'nurse';
      if (
        !g.caprice.kinds &&
        g.capriceAllows(healer) &&
        !g.units.some((u) => ['medic', 'nurse'].includes(u.kind))
      )
        buyExpert(healer);
      for (let i = 0; i < 16; i++)
        if (
          !['archer', 'shield', 'club']
            .slice(i % 3)
            .concat(['archer', 'shield', 'club'].slice(0, i % 3))
            .some(buyExpert)
        )
          break;
    } else {
      const limit = profile === 'petit' ? 2 : 40;
      let bought = 0;
      for (let i = 0; i < 60 && bought < limit; i++) {
        const kind = order[(wave + i) % 3];
        if (buyRotating(kind) || order.some(buyRotating)) bought++;
        else break;
      }
    }
    for (let i = 0; i < 90; i++) step();
    if (!g.startWave()) throw Error('Départ de vague bloqué');
    const t = g.time;
    while (g.status === 'fighting' && g.time - t < 240) {
      step();
      if (profile === 'expert') {
        if (!g.feastUsed && g.enemies.some((e) => e.x > 570)) {
          const e = g.enemies.find((e) => e.x > 570);
          g.offerFeast(e.lane, 'sticky');
        }
        const fighting =
          g.units.some((u) => u.state === 'attack') || g.enemies.some((e) => e.state === 'attack');
        if (!g.encouragementUsed && fighting) g.encourage();
      }
    }
    r.seconds += g.time - t;
    if (g.status === 'fighting') {
      r.status = 'timeout';
      break;
    }
    if (g.status === 'lost') break;
  }
  r.status ??= g.status;
  r.minBase = g.missionMinBase;
  r.stars = g.missionStars;
  return r;
}

const jobs = [];
for (const c of candidates) {
  if (c.id !== 'base' && !capriceById(c.id))
    defineCaprice({
      id: c.id,
      set: 'serpents',
      missionId: c.missionId,
      tier: 'petit',
      name: c.id,
      announce: '',
      rules: c.rules,
    });
  const mi = MISSIONS.findIndex((m) => m.id === c.missionId);
  for (let set = 0; set < seedSets; set++)
    for (const layout of [0, 1, 2])
      for (const assault of ['balanced', 'rush', 'escort'])
        for (const nest of ['spread', 'clustered']) {
          const seed = (20261109 + mi * 104729 + layout * 997 + set * 7919) >>> 0;
          const run = {
            ...createMissionRun(
              c.missionId,
              seed,
              undefined,
              revision === 2 ? 2 : undefined,
              paths,
            ),
            layout,
            assault,
            nest,
            ...(c.id === 'base' ? {} : { caprice: c.id }),
          };
          for (const profile of c.profiles ?? PROFILES)
            jobs.push({ c: c.id, mission: c.missionId, profile, run });
        }
}
const mine = jobs.filter((_, i) => i % shards === shard);
const started = performance.now();
const results = mine.map((j) => ({
  c: j.c,
  mission: j.mission,
  profile: j.profile,
  run: j.run,
  revision,
  ...play(j.run, j.profile),
}));
if (outPath)
  await writeFile(
    outPath,
    JSON.stringify({ revision, seconds: (performance.now() - started) / 1000, results }),
  );
if (shards === 1) {
  const groups = new Map();
  for (const r of results) {
    const key = `${r.mission.padEnd(12)} ${r.c.padEnd(20)} ${r.profile}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  for (const [key, list] of groups) {
    const wins = list.filter((r) => r.status === 'won').length;
    const base = list.reduce((n, r) => n + r.minBase, 0) / list.length;
    console.log(
      `${key.padEnd(42)} ${String(Math.round((100 * wins) / list.length)).padStart(3)} % victoires, cristal min ${Math.round(base)} % (${list.length} parties)`,
    );
  }
}
console.log(
  `shard ${shard}: ${results.length} parties en ${((performance.now() - started) / 1000).toFixed(0)} s`,
);
