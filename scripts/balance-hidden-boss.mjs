// Laboratoire du boss caché (lot 2, 26 novembre 2026) : joue le combat du boss caché sur le
// vrai moteur (30 Hz, sans navigateur) avec les joueurs automatiques des autres laboratoires
// (`scripts/lab/players.ts` : expert, moyen, apprenti, petit…), pour chacun des réglages
// proposés au parent (`HIDDEN_BOSS_CANDIDATES`, src/hiddenBossTuning.ts).
//
// Usage : node --experimental-strip-types scripts/balance-hidden-boss.mjs [sortie.json]
//   GAMES=200                     parties par réglage et par joueur
//   PROFILES=expert,moyen,apprenti
//   CANDIDATES=doux,moyen,costaud réglages joués (noms de HIDDEN_BOSS_CANDIDATES)
//   TUNE='{"ringHp":300}'         valeurs essayées par-dessus chaque réglage (pour chercher)
//   MIEL=attirant|collant|attirant-fort
//                                 chaque joueur pose aussi ce miel : l'attirant sur la voie de
//                                 la tête dès qu'elle sort de l'antre, le collant sur sa voie
//                                 quand elle entre dans le camp, l'« attirant-fort » sur la voie
//                                 la mieux défendue dès qu'elle sort (pour mesurer ce que coûte
//                                 et rapporte le miel que le boss mange)
//
// Ce que le joueur automatique ne fait pas : il n'achète qu'en préparation, jamais pendant le
// combat (les pièces des anneaux cassés ne lui servent donc à rien), il ne répare pas le
// cristal et seul l'expert sert le miel collant et encourage. Ce n'est pas un enfant.
import { writeFile } from 'node:fs/promises';
const R = new URL('../src/', import.meta.url).href;
const { HiddenBossGame } = await import(R + 'hiddenBoss.ts');
const { HIDDEN_BOSS_CANDIDATES, HIDDEN_BOSS_VERSIONS, CURRENT_HIDDEN_BOSS_VERSION } = await import(
  R + 'hiddenBossTuning.ts'
);
const { playStage } = await import('./lab/players.ts');

const [outPath = ''] = process.argv.slice(2);
const GAMES = Number(process.env.GAMES ?? 200);
const PROFILES = (process.env.PROFILES ?? 'expert,moyen,apprenti').split(',');
const CANDIDATES = (process.env.CANDIDATES ?? Object.keys(HIDDEN_BOSS_CANDIDATES).join(',')).split(
  ',',
);
const TUNE = JSON.parse(process.env.TUNE ?? '{}');
const { laneDefense } = await import(R + 'ai.ts');
const HONEY = process.env.MIEL ?? '';
if (HONEY && !['attirant', 'collant', 'attirant-fort'].includes(HONEY))
  throw new RangeError(`Miel inconnu : ${HONEY}`);
/** The player of `MIEL`: after each step, its honey, once, where and when `MIEL` says. */
function servingHoney(game) {
  const step = game.step.bind(game);
  game.step = (dt) => {
    step(dt);
    const head = game.hiddenBoss.chain?.head;
    if (!head || game.feastUsed) return;
    if (HONEY === 'collant') {
      if (head.x >= 600) game.offerFeast(head.lane, 'sticky');
    } else if (HONEY === 'attirant') game.offerFeast(head.lane, 'lure');
    else {
      const scores = laneDefense(game.units);
      game.offerFeast(scores.indexOf(Math.max(...scores)), 'lure');
    }
  };
}
/** The seeds of the laboratory: the same for every tuning and every player. */
const seedOf = (i) => (20261126 + i * 7919) >>> 0;

const started = performance.now();
const results = [];
const percent = (part, whole) => `${String(Math.round((100 * part) / whole)).padStart(3)} %`;
const mean = (list, pick) => list.reduce((sum, r) => sum + pick(r), 0) / list.length;
for (const name of CANDIDATES) {
  const base = HIDDEN_BOSS_CANDIDATES[name];
  if (!base) throw new RangeError(`Réglage inconnu : ${name}`);
  const tuning = { ...base, ...TUNE };
  const current = HIDDEN_BOSS_VERSIONS[CURRENT_HIDDEN_BOSS_VERSION] === base && !process.env.TUNE;
  console.log(
    `\n${name}${current ? ' (version 1, par défaut)' : ''}${HONEY ? ` miel ${HONEY}` : ''} ${JSON.stringify(tuning)}`,
  );
  for (const profile of PROFILES) {
    const list = [];
    for (let i = 0; i < GAMES; i++) {
      const game = new HiddenBossGame(seedOf(i), undefined, tuning);
      if (HONEY) servingHoney(game);
      const outcome = playStage(game, profile);
      const chain = game.hiddenBoss.chain;
      list.push({
        candidate: name,
        profile,
        seed: seedOf(i),
        status: outcome.status,
        seconds: outcome.seconds,
        deaths: outcome.deaths,
        rings: chain ? game.enemies.filter((e) => e.chainRing).length : null,
        most: chain?.most ?? 0,
        grown: chain?.grown ?? 0,
        allies: chain?.allies ?? 0,
        honey: chain?.honey ?? 0,
        broken: chain?.broken ?? 0,
      });
    }
    results.push(...list);
    const won = list.filter((r) => r.status === 'won');
    const lost = list.filter((r) => r.status === 'lost');
    const timeout = list.length - won.length - lost.length;
    const grew = list.filter((r) => r.grown > 0).length;
    console.log(
      `  ${profile.padEnd(9)} ${percent(won.length, list.length)} victoires,` +
        ` ${percent(lost.length, list.length)} défaites, ${percent(timeout, list.length)} trop longues ;` +
        ` durée moyenne ${Math.round(mean(list, (r) => r.seconds))} s` +
        ` (victoires ${won.length ? Math.round(mean(won, (r) => r.seconds)) : '-'} s) ;` +
        ` anneaux au plus ${mean(list, (r) => r.most).toFixed(1)} ;` +
        ` a grandi ${percent(grew, list.length)} des combats` +
        ` (+${mean(list, (r) => r.grown).toFixed(1)} : ${mean(list, (r) => r.allies).toFixed(1)} alliés,` +
        ` ${mean(list, (r) => r.honey).toFixed(2)} miel) ; alliés tombés ${mean(list, (r) => r.deaths).toFixed(1)}`,
    );
  }
}
if (outPath)
  await writeFile(
    outPath,
    JSON.stringify({ seconds: (performance.now() - started) / 1000, tune: TUNE, results }),
  );
console.log(
  `\n${results.length} parties en ${((performance.now() - started) / 1000).toFixed(0)} s`,
);
