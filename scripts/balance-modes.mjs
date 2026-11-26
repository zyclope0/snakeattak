// Laboratoire des modes : joue la grande aventure, les 6 missions et les 36 défis avec des joueurs
// automatiques sur le vrai moteur (30 Hz, sans navigateur). Écrit par Claude pour l'audit du
// 10 novembre 2026 (44 092 parties sur la v0.36.0), adapté ensuite aux révisions d'équilibrage.
//
// Usage : node scripts/balance-modes.mjs <sortie.json> [shard] [shards] [modes.json]
//   REVISION=1…5   révision d'équilibrage des départs (défaut : la révision courante).
//                  Les révisions 3 et suivantes n'existent que dans la grande aventure : les
//                  missions et les défis se jouent alors en révision 2.
//   SETS=12        lots de 18 départs par mission (12 = 216 parties par mode et par joueur)
//   CLASSIC=200    parties de grande aventure par joueur
//   PROFILES=expert,moyen,petit   joueurs : expert, moyen, petit, massues, gros, dino,
//                  hasard, epargnant
//                  hasard (26 novembre 2026, rapport du conseil sur l'aventure sans fin) :
//                  alliés, places permises du camp et cadeaux tirés au hasard ; dépense tout
//                  avant chaque vague et toutes les trois secondes pendant la vague.
//                  epargnant : le même hasard, mais n'achète, en masse, que quand le cristal
//                  vient d'être touché. Leur hasard a sa propre graine : il ne touche jamais
//                  celui du jeu. Les autres joueurs n'achètent jamais pendant une vague et ne
//                  connaissent que leurs 63 places : leurs résultats ne changent pas.
//   DINO=spinosaurus  le grand dinosaure du joueur « dino » (un expert qui en recrute deux dès
//                  qu'il arrive) : spinosaurus (révision 7) ou trex, pour comparer les deux
//   ENDLESS=1      l'aventure sans fin seule (à la place des modes), jusqu'à la défaite ou
//                  ENDLESS_ROUNDS rois (défaut 6) ; ENDLESS_HP, ENDLESS_BITE, ENDLESS_COIN :
//                  les pas d'un roi à l'autre à essayer (défaut : src/endless.ts, version 1) ;
//                  BOONS : les cadeaux préférés des joueurs, dans l'ordre
// Sans modes.json : tous les modes. Avec : liste { id, missionId, rules?, classic?, profiles?, sets? }.
// Avec un seul shard, affiche un résumé par mode et par joueur.
import { readFile, writeFile } from 'node:fs/promises';
const R = new URL('../src/', import.meta.url).href;
const { Game } = await import(R + 'game.ts');
const { CURRENT_MISSION_PATHS, MISSIONS, createMissionRun } = await import(R + 'missions.ts');
const { LANES, laneDefense } = await import(R + 'ai.ts');
const { kinds } = await import(R + 'data.ts');
const { CAMP_LEFT, CAMP_RIGHT, CAMP_TOP, CAMP_BOTTOM } = await import(R + 'boardLandmarks.ts');
const BIG = Object.keys(kinds)
  .filter((k) => !['hero', 'wall', 'medic', 'nurse'].includes(k))
  .sort((a, b) => kinds[b].cost - kinds[a].cost);
const { CAPRICES, CREATOR_CHALLENGES, capriceById, defineCaprice } = await import(
  R + 'caprices.ts'
);

const [outPath, shardArg = '0', shardsArg = '1', extraPath = ''] = process.argv.slice(2);
const shard = Number(shardArg),
  shards = Number(shardsArg);
const dt = 1 / 30;
const PROFILES = (process.env.PROFILES ?? 'expert,moyen,petit').split(',');
const SETS = Number(process.env.SETS ?? 12);
const { CURRENT_BALANCE_REVISION } = await import(R + 'balanceRevision.ts');
const REVISION = Number(process.env.REVISION ?? CURRENT_BALANCE_REVISION);
const MISSION_REVISION = Math.min(REVISION, 2);
// The path rules of the new departures; PATHS=1 plays again those of before 21 November 2026.
const MISSION_PATHS = process.env.PATHS === '1' ? undefined : CURRENT_MISSION_PATHS;
const CLASSIC = Number(process.env.CLASSIC ?? 200);
const DINO = process.env.DINO ?? 'spinosaurus';
const { ENDLESS_RULES } = await import(R + 'endless.ts');
const ENDLESS = process.env.ENDLESS === '1';
// The gifts the automatic players prefer, best first (BOONS=… to try another taste).
const BOON_TASTE = (process.env.BOONS ?? 'forge,armure,rente,marche,solide,vue,miel,pieces').split(
  ',',
);
const ENDLESS_ROUNDS = Number(process.env.ENDLESS_ROUNDS ?? 6);
const endlessRules = {
  ...ENDLESS_RULES[1],
  ...(process.env.ENDLESS_HP ? { hpStep: Number(process.env.ENDLESS_HP) } : {}),
  ...(process.env.ENDLESS_BITE ? { biteStep: Number(process.env.ENDLESS_BITE) } : {}),
  ...(process.env.ENDLESS_COIN ? { coinStep: Number(process.env.ENDLESS_COIN) } : {}),
};

/** Every legal-looking point of the camp, 12 units apart: `recruit` says which are free. */
const CAMP_SPOTS = [];
for (let x = CAMP_LEFT; x <= CAMP_RIGHT; x += 12)
  for (let y = CAMP_TOP; y <= CAMP_BOTTOM; y += 12) CAMP_SPOTS.push([x, y]);
/** The players who play at random, with their own seeded draw. */
const RANDOM_PROFILES = new Set(['hasard', 'epargnant']);
/** A small seeded draw (mulberry32), apart from the game's: the game never sees it. */
function randomStream(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function play(g, profile, seed = 0) {
  const r = { status: null, deaths: 0, seconds: 0, spent: 0 };
  const random = RANDOM_PROFILES.has(profile)
    ? randomStream((seed ^ (profile === 'hasard' ? 0x9e3779b9 : 0x85ebca6b)) >>> 0)
    : null;
  const pick = (list) => list[Math.floor(random() * list.length)];
  let rotation = 0;
  const allows = (k) => (g.capriceAllows ? g.capriceAllows(k) : true);
  const afford = (k) => g.gold - (g.caprice?.reserve ?? 0) >= g.recruitCost(k);
  function place(kind, lane) {
    const rear = kinds[kind].range >= 100;
    for (const x of rear
      ? [900, 948, 852, 804, 756, 708, 660]
      : [660, 708, 756, 804, 852, 900, 948])
      for (const offset of [0, -48, 48]) {
        const cost = g.recruitCost(kind);
        if (g.recruit(kind, x, LANES[lane] + offset)) {
          r.spent += cost;
          return true;
        }
      }
    return false;
  }
  function buyExpert(kind) {
    if (!g.isUnlocked(kind) || !allows(kind) || !afford(kind)) return false;
    const scores = laneDefense(g.units),
      lanes = [0, 1, 2].sort((a, b) => scores[a] - scores[b] || a - b);
    for (const lane of lanes) if (place(kind, lane)) return true;
    return false;
  }
  function buyRotating(kind) {
    if (!g.isUnlocked(kind) || !allows(kind) || !afford(kind)) return false;
    for (let k = 0; k < 3; k++) {
      const lane = (rotation + k) % 3;
      if (place(kind, lane)) {
        rotation = (lane + 1) % 3;
        return true;
      }
    }
    return false;
  }
  /** A random ally the camp can pay, on a random free point of the camp. */
  function buyRandom() {
    const open = Object.keys(kinds).filter(
      (k) => k !== 'hero' && g.isUnlocked(k) && allows(k) && afford(k),
    );
    if (!open.length) return false;
    const kind = pick(open);
    for (let i = 0; i < 40; i++) {
      const [x, y] = pick(CAMP_SPOTS);
      const cost = g.recruitCost(kind);
      if (g.recruit(kind, x, y)) {
        r.spent += cost;
        return true;
      }
    }
    return false;
  }
  /** Spends the purse at random, as long as something can be paid and placed. */
  function spendAll() {
    for (let i = 0; i < 60; i++) if (!buyRandom()) break;
  }
  const order = ['club', 'shield', 'archer'];
  // The « dino » player plays as the expert does, with its two big dinosaurs on top.
  const skilled = profile === 'expert' || profile === 'dino';
  const step = () => {
    const count = g.units.length;
    g.step(dt);
    r.deaths += Math.max(0, count - g.units.length);
  };
  let minBase = 100;
  // Endless columns: the waves the crystal took no damage in, and the largest purse held.
  let cleanWaves = 0,
    cleanAfterKing = 0,
    wavesAfterKing = 0,
    maxGold = g.gold;
  // In the endless adventure, `wave` counts from the very first wave, rounds included.
  const lastWave = g.endless ? ENDLESS_ROUNDS * g.totalWaves : g.totalWaves;
  for (let wave = 1; wave <= lastWave; wave++) {
    if (profile === 'hasard') spendAll();
    else if (profile === 'epargnant') {
      // Buys nothing between waves: the crystal says when.
    } else if (profile === 'massues') {
      for (let i = 0; i < 60; i++) if (!buyExpert('club')) break;
    } else if (profile === 'gros') {
      for (let i = 0; i < 40; i++) if (!BIG.some(buyRotating)) break;
    } else if (profile === 'expert' || profile === 'dino') {
      if (profile === 'dino')
        while (g.units.filter((u) => u.kind === DINO).length < 2 && buyExpert(DINO));
      const healer = g.isUnlocked('medic') ? 'medic' : 'nurse';
      if (
        !g.caprice?.kinds &&
        allows(healer) &&
        !g.units.some((u) => ['medic', 'nurse'].includes(u.kind))
      )
        buyExpert(healer);
      for (let i = 0; i < 16; i++) {
        const o = ['archer', 'shield', 'club'];
        if (
          !o
            .slice(i % 3)
            .concat(o.slice(0, i % 3))
            .some(buyExpert)
        )
          break;
      }
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
    if (random && g.endless && g.rewards.pending != null) {
      // A gift at random; with the five places taken, a new lasting one takes the place of
      // a gift drawn at random.
      const id = pick(g.boonOffer);
      const replace = g.boonNeedsPlace(id) ? pick(g.boons).id : undefined;
      if (!g.chooseReward(id, replace)) g.skipReward();
    }
    if (g.endless && g.rewards.pending != null) {
      // The endless gifts: climb a gift already taken, else the first one of BOON_TASTE that
      // is offered; with the five places full, the lowest gift gives its place.
      // With the five places full, a new lasting gift would push out one the player built
      // up: the player climbs a gift it has, or takes a card « once », or passes.
      const offer = g.boonOffer;
      const owned = g.boons.map((b) => b.id);
      const full = g.boons.length >= g.boonRules.places;
      const pick =
        offer.find((id) => owned.includes(id)) ??
        BOON_TASTE.find((id) => offer.includes(id) && !(full && g.boonNeedsPlace(id))) ??
        offer.find((id) => !g.boonNeedsPlace(id));
      if (!pick || !g.chooseReward(pick)) g.skipReward();
    }
    if (random && g.rewards?.pending != null) {
      const offer = g.rewardOffer ?? [];
      if (!offer.length || !g.chooseReward(pick(offer))) g.skipReward?.();
    }
    if (g.rewards?.pending != null) {
      const offer = g.rewardOffer ?? [];
      // Expert : pièces ; autres : première carte proposée.
      if (!g.chooseReward(skilled && offer.includes('pieces') ? 'pieces' : offer[0]))
        g.skipReward?.();
    }
    if (!g.startWave()) {
      r.status = 'blocked:' + g.status;
      break;
    }
    const t = g.time;
    const startBase = g.base;
    let waveMin = g.base,
      seen = g.base,
      ticks = 0;
    while (g.status === 'fighting' && g.time - t < 300) {
      step();
      minBase = Math.min(minBase, g.base);
      if (random) {
        // The random players buy during the wave too (the engine allows it): « hasard »
        // every three seconds, « epargnant » in a rush when the crystal was just hit.
        ticks++;
        if (profile === 'hasard' && ticks % 90 === 0) spendAll();
        if (profile === 'epargnant' && g.base < seen) spendAll();
        seen = g.base;
      }
      if (ENDLESS) {
        waveMin = Math.min(waveMin, g.base);
        maxGold = Math.max(maxGold, g.gold);
      }
      if (skilled) {
        if (!g.feastUsed && g.enemies.some((e) => e.x > 570))
          g.offerFeast(g.enemies.find((e) => e.x > 570).lane, 'sticky');
        if (
          !g.encouragementUsed &&
          (g.units.some((u) => u.state === 'attack') || g.enemies.some((e) => e.state === 'attack'))
        )
          g.encourage();
      }
    }
    r.seconds += g.time - t;
    r.wave = wave;
    if (ENDLESS && g.status !== 'fighting') {
      const clean = waveMin >= startBase && g.status !== 'lost';
      if (clean) cleanWaves++;
      if (wave > g.totalWaves) {
        wavesAfterKing++;
        if (clean) cleanAfterKing++;
      }
    }
    if (g.status === 'fighting') {
      r.status = 'timeout';
      break;
    }
    if (g.status === 'lost') break;
    if (g.status === 'reward' || g.pendingRewards?.length) {
      try {
        g.chooseReward?.(0);
      } catch {}
    }
  }
  r.status ??= g.status;
  r.kings = g.kings ?? 0;
  r.minBase = Math.round(minBase);
  r.base = Math.round(g.base);
  r.gold = Math.round(g.gold);
  r.stars = g.missionStars ?? 0;
  r.units = g.units.length;
  if (ENDLESS) Object.assign(r, { cleanWaves, cleanAfterKing, wavesAfterKing, maxGold });
  return r;
}

const jobs = [];
const modes = [
  ...MISSIONS.map((m) => ({ mode: `${m.id}`, missionId: m.id })),
  ...[...CAPRICES, ...CREATOR_CHALLENGES].map((c) => ({
    mode: c.id,
    missionId: c.missionId,
    caprice: c.id,
  })),
];
if (extraPath) {
  modes.length = 0;
  for (const c of JSON.parse(await readFile(extraPath, 'utf8'))) {
    if (c.rules && !capriceById(c.id))
      defineCaprice({
        id: c.id,
        set: 'serpents',
        missionId: c.missionId,
        tier: 'petit',
        name: c.id,
        announce: '',
        rules: c.rules,
      });
    modes.push({
      mode: c.id,
      missionId: c.missionId,
      caprice: c.rules || capriceById(c.id) ? c.id : undefined,
      classic: c.classic,
      profiles: c.profiles,
      sets: c.sets,
    });
  }
} else if (ENDLESS) {
  modes.length = 0;
  modes.push({ mode: 'sans-fin', classic: true, endless: true });
} else modes.push({ mode: 'grande-aventure', classic: true });
for (const m of modes) {
  if (m.classic) {
    for (let i = 0; i < CLASSIC; i++)
      for (const profile of m.profiles ?? PROFILES)
        jobs.push({ ...m, profile, seed: (20261110 + i * 7919) >>> 0 });
    continue;
  }
  const mi = MISSIONS.findIndex((x) => x.id === m.missionId);
  for (let set = 0; set < (m.sets ?? SETS); set++)
    for (const layout of [0, 1, 2])
      for (const assault of ['balanced', 'rush', 'escort'])
        for (const nest of ['spread', 'clustered']) {
          const seed = (20261109 + mi * 104729 + layout * 997 + set * 7919) >>> 0;
          const base =
            MISSION_REVISION === 2
              ? createMissionRun(m.missionId, seed, null, 2, MISSION_PATHS)
              : createMissionRun(m.missionId, seed);
          const run = {
            ...base,
            layout,
            assault,
            nest,
            ...(m.caprice ? { caprice: m.caprice } : {}),
          };
          for (const profile of m.profiles ?? PROFILES) jobs.push({ ...m, profile, run });
        }
}
const mine = jobs.filter((_, i) => i % shards === shard);
const started = performance.now();
const results = [];
for (const j of mine) {
  const g = j.endless
    ? new Game(j.seed, undefined, undefined, REVISION, undefined, endlessRules)
    : j.classic
      ? new Game(j.seed, undefined, undefined, REVISION)
      : new Game(j.run.seed, undefined, j.run, MISSION_REVISION);
  let out;
  try {
    out = play(g, j.profile, j.classic ? j.seed : j.run.seed);
  } catch (e) {
    out = { status: 'error:' + String(e).slice(0, 80) };
  }
  results.push({
    endless: ENDLESS ? endlessRules : undefined,
    mode: j.mode,
    mission: j.missionId ?? 'classique',
    profile: j.profile,
    ...out,
  });
}
if (outPath)
  await writeFile(
    outPath,
    JSON.stringify({ revision: REVISION, seconds: (performance.now() - started) / 1000, results }),
  );
if (shards === 1) {
  const groups = new Map();
  for (const r of results) {
    const key = `${r.mode.padEnd(28)} ${r.profile}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  for (const [key, list] of groups) {
    if (ENDLESS) {
      const reached = list.map((r) => r.wave ?? 0).sort((a, b) => a - b);
      const at = (q) => reached[Math.min(reached.length - 1, Math.floor(q * reached.length))];
      const kings = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(
        (k) =>
          `${k}:${Math.round((100 * list.filter((r) => (r.kings ?? 0) >= k).length) / list.length)}%`,
      );
      console.log(
        `${key.padEnd(38)} vague atteinte médiane ${at(0.5)} (q1 ${at(0.25)}, q3 ${at(0.75)}, max ${reached.at(-1)}), rois battus ${kings.join(' ')} (${list.length} parties)`,
      );
      // The two columns of the council report: waves without crystal damage (all, and after
      // the first king), and the largest purse held (median of the games, and the largest).
      const sum = (f) => list.reduce((n, r) => n + (r[f] ?? 0), 0);
      const share = (a, b) => (b ? Math.round((100 * a) / b) : 0);
      const purses = list.map((r) => r.maxGold ?? 0).sort((a, b) => a - b);
      console.log(
        `${''.padEnd(38)} vagues sans dégât au cristal ${share(
          sum('cleanWaves'),
          list.reduce((n, r) => n + (r.wave ?? 0), 0),
        )} % (après le 1er roi ${share(sum('cleanAfterKing'), sum('wavesAfterKing'))} %), stock maximum médian ${Math.round(purses[Math.floor(purses.length / 2)])} (max ${Math.round(purses.at(-1))})`,
      );
      continue;
    }
    const wins = list.filter((r) => r.status === 'won').length;
    const base = list.reduce((n, r) => n + (r.minBase ?? 0), 0) / list.length;
    console.log(
      `${key.padEnd(38)} ${String(Math.round((100 * wins) / list.length)).padStart(3)} % victoires, cristal min ${Math.round(base)} % (${list.length} parties)`,
    );
  }
}
console.log(
  `shard ${shard}: ${results.length} parties en ${((performance.now() - started) / 1000).toFixed(0)} s`,
);
