// Laboratoire de « La Grande Expédition » (20 novembre 2026) : joue des expéditions entières
// sur le vrai moteur, avec les joueurs automatiques du laboratoire du voyage.
//
// Usage : node --experimental-strip-types scripts/balance-expedition.mjs [sortie.json] [shard] [shards]
//   SEEDS=40       expéditions par joueur et par façon de choisir le chemin
//   PROFILES=expert,moyen,apprenti
//   PATHS=calme,brave,mixte   chemin calme partout, brave partout, ou brave une fois sur deux
//   TRIES=3        essais d'une même bataille avant d'abandonner l'expédition
// Une bataille perdue se rejoue depuis le camp d'avant (règle proposée au parent).
import { writeFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.webp') || url.includes('.mp3'))
      return { format: 'module', source: 'export default "x";', shortCircuit: true };
    return nextLoad(url, context);
  },
});
const X = await import('../src/expedition.ts');
const { isLastingBoon } = await import('../src/boons.ts');
const { playStage } = await import('./voyage-lab/players.ts');

const [outPath = '', shardArg = '0', shardsArg = '1'] = process.argv.slice(2);
const shard = Number(shardArg),
  shards = Number(shardsArg);
const SEEDS = Number(process.env.SEEDS ?? 40);
const PROFILES = (process.env.PROFILES ?? 'expert,moyen,apprenti').split(',');
const PATHS = (process.env.PATHS ?? 'calme,brave,mixte').split(',');
const TRIES = Number(process.env.TRIES ?? 3);
// Settings to try instead of version 1's: HP=0.1 BITE=0.05 STIPEND=120.
const T = X.EXPEDITION_TUNINGS[1];
if (process.env.HP || process.env.BITE)
  T.strength = {
    hpStep: Number(process.env.HP ?? T.strength.hpStep),
    biteStep: Number(process.env.BITE ?? T.strength.biteStep),
  };
if (process.env.STIPEND) T.stipend = Number(process.env.STIPEND);
const TASTE = ['forge', 'armure', 'rente', 'marche', 'solide', 'vue', 'miel', 'pieces'];
const seedAt = (i) => Math.imul(i + 1, 0x9e3779b1) >>> 12;

function chooseGift(state) {
  const offer = X.giftOffer(state);
  const owned = state.boons.map((b) => b.id);
  const full = state.boons.length >= 5;
  const pick =
    offer.find((id) => owned.includes(id)) ??
    TASTE.find((id) => offer.includes(id) && !(full && isLastingBoon(id))) ??
    offer.find((id) => !isLastingBoon(id) || !full);
  return (pick && X.chooseGift(state, pick)) || X.skipGift(state);
}

function halt(plan, state) {
  const step = plan.tableaux[state.tableau][state.step];
  const low = (state.camp?.base ?? 100) < 60;
  const choice = step.halts.indexOf(low && step.halts.includes('feu') ? 'feu' : 'roulotte');
  let next = X.chooseHalt(plan, state, choice < 0 ? 0 : choice);
  if (next?.pending?.kind === 'roulotte') {
    for (const item of [...X.roulotteOffer(next).climb, ...X.roulotteOffer(next).buy]) {
      const bought = X.buyAtRoulotte(next, item.id);
      if (bought) {
        next = bought;
        break;
      }
    }
    next = X.leaveRoulotte(next);
  }
  return next;
}

function playExpedition(seed, profile, policy) {
  const plan = X.planExpedition(seed);
  let state = X.startExpedition(seed);
  const r = { battles: 0, losses: 0, tableau: 0, seconds: 0, status: 'travelling', boons: 0 };
  let fork = 0;
  while (state.status === 'travelling') {
    if (state.pending?.kind === 'gift') {
      state = chooseGift(state);
      continue;
    }
    const step = plan.tableaux[state.tableau][state.step];
    if (step.kind === 'halt') {
      state = halt(plan, state);
      continue;
    }
    const path =
      step.kind === 'fork'
        ? policy === 'calme'
          ? 'calm'
          : policy === 'brave'
            ? 'brave'
            : fork++ % 2
              ? 'brave'
              : 'calm'
        : undefined;
    let won = null;
    for (let tri = 0; tri < TRIES && !won; tri++) {
      const game = X.createExpeditionGame(plan, state, path);
      if (!game) throw Error(`no game at ${state.tableau}:${state.step}`);
      const out = playStage(game, profile);
      r.seconds += out.seconds;
      r.battles++;
      if (game.status === 'won') won = X.winBattle(plan, state, game, path);
      else r.losses++;
    }
    if (!won) {
      r.status = 'abandoned';
      break;
    }
    state = won;
    r.tableau = state.tableau;
  }
  if (state.status === 'arrived') {
    r.status = 'arrived';
    r.tableau = 3;
  }
  r.boons = state.boons.reduce((n, b) => n + b.level, 0);
  return r;
}

const jobs = [];
for (const profile of PROFILES)
  for (const policy of PATHS)
    for (let i = 0; i < SEEDS; i++) jobs.push({ profile, policy, seed: seedAt(i) });
const results = [];
for (const [i, job] of jobs.entries()) {
  if (i % shards !== shard) continue;
  results.push({ ...job, ...playExpedition(job.seed, job.profile, job.policy) });
}
if (outPath) await writeFile(outPath, JSON.stringify(results));
if (shards === 1) summarize(results);

export function summarize(list) {
  const groups = new Map();
  for (const r of list) {
    const key = `${r.profile.padEnd(9)} ${r.policy.padEnd(6)}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  for (const [key, rows] of groups) {
    const pct = (f) => Math.round((100 * rows.filter(f).length) / rows.length);
    const mean = (f) => Math.round(rows.reduce((n, r) => n + f(r), 0) / rows.length);
    console.log(
      `${key} arrivés ${pct((r) => r.status === 'arrived')} % · tableau 2 atteint ${pct((r) => r.tableau >= 1)} % · tableau 3 ${pct((r) => r.tableau >= 2)} % · défaites ${mean((r) => r.losses)} · minutes ${mean((r) => r.seconds / 60)} (${rows.length})`,
    );
  }
}
