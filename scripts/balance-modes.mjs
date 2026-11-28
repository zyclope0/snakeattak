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
//                  hasard, epargnant, parent, enfant, fils
//                  hasard (26 novembre 2026, rapport du conseil sur l'aventure sans fin) :
//                  alliés, places permises du camp et cadeaux tirés au hasard ; dépense tout
//                  avant chaque vague et toutes les trois secondes pendant la vague.
//                  epargnant : le même hasard, mais n'achète, en masse, que quand le cristal
//                  vient d'être touché. Leur hasard a sa propre graine : il ne touche jamais
//                  celui du jeu. Les autres joueurs n'achètent jamais pendant une vague et ne
//                  connaissent que leurs 63 places : leurs résultats ne changent pas.
//                  parent et enfant (27 novembre 2026, critique du parent : le hasard vide
//                  sa bourse toutes les trois secondes et ne répare jamais le cristal) : deux
//                  joueurs qui ne font que ce que l'écran permet, sans rien savoir du moteur.
//                  parent : alliés, places et cadeaux au hasard ; PARENT_BUYS (2) alliés par
//                  camp ; répare le cristal tombé à 75 ou moins ; entraîne le héros (au
//                  hasard) ; miel au hasard (voie et goût) ; encourage au premier serpent
//                  dans le camp ; quand le cristal est touché, vide sa bourse au hasard
//                  (« on économise beaucoup, puis on vide la bourse dès que ça se corse » ;
//                  PARENT_RUSH=0 pour ne pas le faire) et répare à 50 ou moins.
//                  enfant : joue simple et régulier ; répare le cristal jusqu'en haut,
//                  entraîne la force du héros, un soigneur pour huit combattants, sinon le
//                  plus grand allié qu'il peut payer, posé devant la voie qui a le moins
//                  d'alliés (combattants vers le milieu du camp, tireurs et soigneurs près
//                  du cristal) ; miel collant sur la voie la plus chargée, encouragement au
//                  premier serpent dans le camp ; reprend ses cadeaux (même goût que les
//                  autres) ; répare à 75 ou moins pendant la vague, un allié de plus quand
//                  le cristal est touché.
//                  Pendant une vague, une réparation au plus toutes les trois secondes (le
//                  menu se ferme après chacune). Les deux restent au camp CAMP_SECONDS
//                  (défaut 10) : les soigneurs soignent pendant ce temps, comme dans le jeu.
//                  Mesures de ce qui tient un camp (parent et enfant seulement) :
//                  REAL_SKIP_KINDS=tank,… (jamais achetés), REAL_SKIP_BOONS=vue,… (jamais
//                  pris), REAL_OFF=repair,tactics (ni réparation, ni miel et encouragement).
//                  TRACE=1 écrit sur la sortie d'erreur le camp à la fin de chaque vague.
//                  fils (27 novembre 2026, la vraie sauvegarde du fils : 7 rois, vague 85) :
//                  achète comme sa sauvegarde (15 bébés dragons, 6 tanks, 7 dinosaures,
//                  quelques autres ; un soigneur pour FILS_HEAL (2,7) combattants, infirmiers
//                  et médecins comme 9 pour 4), FILS_BUYS (2) alliés par camp en moyenne
//                  (FILS_BUYS_FIRST (2) au premier tour), et après le premier roi garde
//                  FILS_KEEP (2 500) pièces ; cadeaux solide, marché, longue-vue, forge,
//                  armure, jamais la rente ; n'entraîne jamais le héros ; répare, miel et
//                  encouragement comme l'enfant, mais à la vague du roi il les garde pour
//                  King Snake (FILS_KING=0 pour ne pas le faire).
//   DINO=spinosaurus  le grand dinosaure du joueur « dino » (un expert qui en recrute deux dès
//                  qu'il arrive) : spinosaurus (révision 7) ou trex, pour comparer les deux
//   ENDLESS=1      l'aventure sans fin seule (à la place des modes), jusqu'à la défaite ou
//                  ENDLESS_ROUNDS rois (défaut 15 depuis le 27 novembre 2026 ; 6 avant) ;
//                  ENDLESS_HP, ENDLESS_BITE, ENDLESS_COIN :
//                  les pas d'un roi à l'autre à essayer (défaut : src/endless.ts, version 1) ;
//                  BOONS : les cadeaux préférés des joueurs, dans l'ordre
//   ENDLESS_FORMULA=v2  les règles sans fin version 2 telles que le jeu les joue (F1 codée
//                  le 27 novembre 2026 ; la carte suit la vague du tour)
//   ENDLESS_FORMULA=v1|F1|F1b  mesure seulement (lot C, rien ne change pour les joueurs) :
//                  F1 = dès le tour 2, la vague w se joue comme la vague min(11, 6 + ⌈w/2⌉)
//                  (nombre, vie, morsure, vitesse, prime, spécialistes, nouveaux serpents,
//                  œufs, intelligence des voies) ; F1b = F1 avec ×1,35 / ×1,15 par roi.
//                  Le script fait jouer au moteur la vague correspondante puis remet le
//                  numéro de la vague : seule la carte (trois rochers) suit la vague jouée.
//   PURSE_CAP=1500 mesure seulement : la bourse ne dépasse jamais ce nombre de pièces
//   CRYSTAL_BITE=1 mesure seulement : un serpent qui entre fait au cristal 9 fois la hausse
//                  de la morsure (×1,2 par roi en version 1) au lieu de 9
//   LOT_C=1        ajoute aux anciens joueurs les colonnes du lot C (rien d'autre ne change)
//   LOT_C=2        ajoute aussi les vagues 7 à 12 des tours après le premier, et celles où le
//                  cristal a perdu des points (toujours là avec v2 ou ENDLESS_LEVERS)
//   ENDLESS_LEVERS=coins,crystal,king,tank  mesure seulement (les pistes du parent, 27
//                  novembre 2026 ; le jeu ne change pas) : coins = les 12 pièces d'un serpent
//                  et la rente suivent les rois comme la prime ; crystal = les 9 dégâts au
//                  cristal suivent les rois comme la morsure ; king = le pas du roi
//                  ×(1 + KING_STEP) par roi battu (0,05), KING_CAP au plus (1,5) ; tank =
//                  chaque serpent pris dans l'obus, sauf celui visé, reçoit TANK_SPLASH du
//                  coup (0,5) ; dragon = la même chose pour le souffle des dragons
//                  (DRAGON_SPLASH, une note à part). Le script réécrit en mémoire, au
//                  chargement, une ou deux lignes du moteur ; une ligne introuvable arrête
//                  la mesure.
// Sans modes.json : tous les modes. Avec : liste { id, missionId, rules?, classic?, profiles?, sets? }.
// Avec un seul shard, affiche un résumé par mode et par joueur.
import { readFile, writeFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
const R = new URL('../src/', import.meta.url).href;
// ——— Lot C, the four leads of the parent (27 November 2026), measure only. ———
// ENDLESS_LEVERS=coins,crystal,king,tank (and dragon, a note apart): the script rewrites, as
// it loads them, one line or two of the engine in memory; the files of the game never change
// and a game without ENDLESS_LEVERS plays the engine as it is. Each rewritten line must be
// found exactly once, or the measure stops.
const LEVERS = process.env.ENDLESS_LEVERS ? process.env.ENDLESS_LEVERS.split(',') : [];
for (const lever of LEVERS)
  if (!['coins', 'crystal', 'king', 'tank', 'dragon'].includes(lever))
    throw new Error('ENDLESS_LEVERS : coins, crystal, king, tank, dragon');
/** King: his pace ×(1 + KING_STEP) per king beaten, KING_CAP at most. */
const KING_STEP = Number(process.env.KING_STEP ?? 0.05);
const KING_CAP = Number(process.env.KING_CAP ?? 1.5);
/** Tank (dragon): each snake caught by the blast, but the one aimed at, takes this share. */
const TANK_SPLASH = Number(process.env.TANK_SPLASH ?? 0.5);
const DRAGON_SPLASH = Number(process.env.DRAGON_SPLASH ?? 0.5);
const LEVER_LINES = {
  // The 12 coins of a snake and the rente follow the kings as the wave's coins do (×0.9).
  coins: [
    [
      'engine/outcome.ts',
      'game.gold += e.boss ? KING_BOUNTY : SNAKE_BOUNTY;',
      'game.gold += e.boss ? KING_BOUNTY : globalThis.lotC.coins(game, SNAKE_BOUNTY);',
    ],
    [
      'engine/outcome.ts',
      "game.gold += reward + game.boonGain('rente');",
      "game.gold += reward + globalThis.lotC.coins(game, game.boonGain('rente'));",
    ],
  ],
  // The 9 the crystal loses grow with the kings as the bite does (×1.2).
  crystal: [
    [
      'engine/enemyTurn.ts',
      'const absorbed = e.boss ? 0 : Math.min(CRYSTAL_DAMAGE, game.rewards.ward);',
      'const bite = globalThis.lotC.crystal(game, CRYSTAL_DAMAGE); const absorbed = e.boss ? 0 : Math.min(bite, game.rewards.ward);',
    ],
    [
      'engine/enemyTurn.ts',
      '(e.boss ? KING_CRYSTAL_DAMAGE : CRYSTAL_DAMAGE - absorbed)',
      '(e.boss ? KING_CRYSTAL_DAMAGE : bite - absorbed)',
    ],
  ],
  king: [
    [
      'engine/damage.ts',
      '(e.boss ? KING_PACE : enemySpeed(e.variant, game.time))',
      '(e.boss ? KING_PACE * globalThis.lotC.kingPace(game) : enemySpeed(e.variant, game.time))',
    ],
  ],
  tank: [
    [
      'engine/allies.ts',
      'damage * (enemy === target ? 1 : game.tuning.splashSecondaryFactor)',
      'damage * (enemy === target ? 1 : globalThis.lotC.splash(game, u))',
    ],
  ],
};
LEVER_LINES.dragon = LEVER_LINES.tank;
const patches = [...new Set(LEVERS.flatMap((lever) => LEVER_LINES[lever]))];
const patched = new Set();
if (LEVERS.length) {
  registerHooks({
    load(url, context, nextLoad) {
      const result = nextLoad(url, context);
      const mine = patches.filter(([file]) => url.endsWith('/src/' + file));
      if (!mine.length) return result;
      let source =
        typeof result.source === 'string' ? result.source : new TextDecoder().decode(result.source);
      for (const [file, from, to] of mine) {
        if (source.split(from).length !== 2) throw new Error(`ENDLESS_LEVERS : ${file} a changé`);
        source = source.replace(from, to);
        patched.add(from);
      }
      return { ...result, source };
    },
  });
}
const { Game } = await import(R + 'game.ts');
if (patches.some(([, from]) => !patched.has(from)))
  throw new Error("ENDLESS_LEVERS : une ligne du moteur n'a pas été réécrite");
const { CURRENT_MISSION_PATHS, MISSIONS, createMissionRun } = await import(R + 'missions.ts');
const { LANES, laneDefense } = await import(R + 'ai.ts');
const { kinds } = await import(R + 'data.ts');
const { CAMP_LEFT, CAMP_RIGHT, CAMP_TOP, CAMP_BOTTOM } = await import(R + 'boardLandmarks.ts');
const { isMilestone } = await import(R + 'rewards.ts');
const { LASTING_BOONS: LASTING } = await import(R + 'boons.ts');
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
const ENDLESS_ROUNDS = Number(process.env.ENDLESS_ROUNDS ?? 15);
const FORMULA = process.env.ENDLESS_FORMULA ?? 'v1';
if (!['v1', 'v2', 'F1', 'F1b'].includes(FORMULA))
  throw new Error('ENDLESS_FORMULA : v1, v2, F1 ou F1b');
/** The formulas of the council report (lot C): the wave a wave of a later round plays. Only
 * F1 and F1b: the game plays v2 itself, and mapping it again would play the waves twice
 * as far (found on 27 November 2026, after the first measure of v2). */
const MAPPED = FORMULA === 'F1' || FORMULA === 'F1b';
const PURSE_CAP = process.env.PURSE_CAP ? Number(process.env.PURSE_CAP) : null;
/** The columns of the second part of lot C (27 November 2026): never added to the older
 * measures, whose lines of results stay the same, field by field. */
const LOT_C2 = FORMULA === 'v2' || LEVERS.length > 0 || process.env.LOT_C === '2';
/** The waves of a round from which the parent wants the crystal threatened. */
const LATE_FROM = 7;
const CAMP_SECONDS = Number(process.env.CAMP_SECONDS ?? 10);
/** Measures of what holds a camp (parent and enfant only): what they never buy, never take,
 * never do (repair, tactics = honey and encouragement). */
const list = (name) => (process.env[name] ? process.env[name].split(',') : []);
const REAL_SKIP_KINDS = list('REAL_SKIP_KINDS');
const REAL_SKIP_BOONS = list('REAL_SKIP_BOONS');
const REAL_OFF = list('REAL_OFF');
/** Measure only: the crystal loses as much more per snake as the bite grew with the kings. */
const CRYSTAL_BITE = process.env.CRYSTAL_BITE === '1';
// v2: the rules of version 2 as the game plays them (formula F1, coded on 27 November 2026).
const endlessRules = {
  ...ENDLESS_RULES[FORMULA === 'v2' ? 2 : 1],
  ...(FORMULA === 'F1b' ? { hpStep: 0.35, biteStep: 0.15 } : {}),
  ...(process.env.ENDLESS_HP ? { hpStep: Number(process.env.ENDLESS_HP) } : {}),
  ...(process.env.ENDLESS_BITE ? { biteStep: Number(process.env.ENDLESS_BITE) } : {}),
  ...(process.env.ENDLESS_COIN ? { coinStep: Number(process.env.ENDLESS_COIN) } : {}),
  // Measure only (27 November 2026, the parent: a gentler start after each king): the wave
  // the first wave of a later round plays, minus one (version 2 only).
  ...(process.env.ENDLESS_ROUND_START
    ? { roundStart: Number(process.env.ENDLESS_ROUND_START) }
    : {}),
};
if (process.env.ENDLESS_ROUND_START && FORMULA !== 'v2')
  throw new Error('ENDLESS_ROUND_START : seulement avec ENDLESS_FORMULA=v2');

/** What the leads do, read by the lines ENDLESS_LEVERS rewrote. */
const { endlessStats } = await import(R + 'endless.ts');
const grown = (step, kings) => {
  let factor = 1;
  for (let king = 0; king < kings; king++) factor *= 1 + step;
  return factor;
};
globalThis.lotC = {
  coins: (game, coins) =>
    endlessStats({ hp: 0, damage: 0, reward: coins }, game.endless, game.kings).reward,
  crystal: (game, damage) =>
    endlessStats({ hp: 0, damage, reward: 0 }, game.endless, game.kings).damage,
  kingPace: (game) => Math.min(KING_CAP, grown(KING_STEP, game.endless ? game.kings : 0)),
  splash: (game, u) =>
    u.kind === 'tank' && LEVERS.includes('tank')
      ? TANK_SPLASH
      : u.kind === 'dragon' && LEVERS.includes('dragon')
        ? DRAGON_SPLASH
        : game.tuning.splashSecondaryFactor,
};
/** Every legal-looking point of the camp, 12 units apart: `recruit` says which are free. */
const CAMP_SPOTS = [];
for (let x = CAMP_LEFT; x <= CAMP_RIGHT; x += 12)
  for (let y = CAMP_TOP; y <= CAMP_BOTTOM; y += 12) CAMP_SPOTS.push([x, y]);
/** The players who play at random, with their own seeded draw. */
const RANDOM_PROFILES = new Set(['hasard', 'epargnant']);
/** The players who play as the screen lets a real player play (27 November 2026). */
const REAL_PROFILES = new Set(['parent', 'enfant', 'fils']);
/** Their own seeds: the draws of the older players stay what they were. */
const REAL_SEEDS = { parent: 0xc2b2ae35, enfant: 0x27d4eb2f, fils: 0x165667b1 };
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
    : REAL_PROFILES.has(profile)
      ? randomStream((seed ^ REAL_SEEDS[profile]) >>> 0)
      : null;
  const real = REAL_PROFILES.has(profile);
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
  // ——— The players who play as the screen lets a real player play (27 November 2026). ———
  const HEALERS = ['medic', 'nurse'];
  const isHealer = (k) => HEALERS.includes(k);
  const buyable = (k) =>
    k !== 'hero' && g.isUnlocked(k) && allows(k) && !REAL_SKIP_KINDS.includes(k);
  /** An ally offered by a gift: free to place (its card says so on the screen). */
  function placeOffered() {
    for (const k of Object.keys(kinds))
      if (buyable(k) && g.recruitCost(k) === 0) {
        for (let i = 0; i < 40; i++) {
          const [x, y] = pick(CAMP_SPOTS);
          if (g.recruit(k, x, y)) break;
        }
      }
  }
  /** « parent » : one ally the purse can pay, at random, on a random free point of the camp. */
  function parentBuy() {
    const open = Object.keys(kinds).filter((k) => buyable(k) && afford(k));
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
  /** « parent » buys this many allies in a camp, and empties its purse when the crystal is
   * hit (its own words: « on économise beaucoup, puis on vide la bourse dès que ça se corse »). */
  const PARENT_BUYS = Number(process.env.PARENT_BUYS ?? 2);
  const PARENT_RUSH = process.env.PARENT_RUSH !== '0';
  /** « enfant » : a healer for this many fighters; fighters around this column, shooters and
   * healers around that one. */
  const CHILD_HEAL = 8;
  const CHILD_FRONT_X = 700;
  const CHILD_REAR_X = 900;
  /** How many allies stand before each lane: what the child sees on the board. */
  const laneCounts = () =>
    LANES.map((y) => g.units.filter((u) => u.kind !== 'hero' && Math.abs(u.y - y) <= 72).length);
  /** « enfant » : a healer for some fighters, else one of the biggest allies it can pay. */
  function childKind() {
    const open = Object.keys(kinds).filter(
      (k) => buyable(k) && k !== 'wall' && g.gold >= g.recruitCost(k),
    );
    if (!open.length) return null;
    const healers = g.units.filter((u) => isHealer(u.kind)).length;
    const fighters = g.units.length - healers;
    const healer = ['medic', 'nurse'].find((k) => open.includes(k));
    if (healer && healers < Math.floor(fighters / CHILD_HEAL)) return healer;
    // The biggest it can pay; between two of the same price, either.
    const choices = open.filter((k) => !isHealer(k));
    const top = Math.max(...choices.map((k) => g.recruitCost(k)));
    const big = choices.filter((k) => g.recruitCost(k) === top);
    return big.length ? pick(big) : null;
  }
  /** In front of the lane with the fewest allies: fighters ahead, shooters and healers behind. */
  function childPlace(kind) {
    const counts = laneCounts();
    const lanes = [0, 1, 2].sort((a, b) => counts[a] - counts[b] || a - b);
    const rear = isHealer(kind) || kinds[kind].range >= 100;
    for (const lane of lanes) {
      const spots = CAMP_SPOTS.filter(([, y]) => Math.abs(y - LANES[lane]) <= 60)
        .map(([x, y]) => [
          x,
          y,
          Math.abs(x - (rear ? CHILD_REAR_X : CHILD_FRONT_X)) + random() * 60,
        ])
        .sort((a, b) => a[2] - b[2]);
      for (const [x, y] of spots) {
        const cost = g.recruitCost(kind);
        if (g.recruit(kind, x, y)) {
          r.spent += cost;
          return true;
        }
      }
    }
    // The front is full: anywhere in the camp.
    for (let i = 0; i < 60; i++) {
      const [x, y] = pick(CAMP_SPOTS);
      const cost = g.recruitCost(kind);
      if (g.recruit(kind, x, y)) {
        r.spent += cost;
        return true;
      }
    }
    return false;
  }
  function childBuy() {
    const kind = childKind();
    return kind ? childPlace(kind) : false;
  }
  // « fils » (27 novembre 2026) : buys like the real save of the son (7 kings, wave 85):
  // 15 baby dragons, 13 healers, 6 tanks, 7 dinosaurs and a few others among 48 allies.
  /** The fighters of his save, in the same shares; a healer for SON_HEAL fighters. */
  const SON_MIX = {
    dragon: 15,
    tank: 6,
    triceratops: 3,
    trex: 2,
    twohead: 2,
    archer: 2,
    stegosaurus: 1,
    spinosaurus: 1,
    knight: 1,
    shield: 1,
    ninja: 1,
  };
  /** His healers: 9 nurses and 4 medics. */
  const SON_HEALERS = { nurse: 9, medic: 4 };
  const SON_HEAL = Number(process.env.FILS_HEAL ?? 2.7);
  /** This many allies a camp on average; after the first king, he keeps SON_KEEP coins. */
  const SON_BUYS = Number(process.env.FILS_BUYS ?? 2);
  const SON_KEEP = Number(process.env.FILS_KEEP ?? 2500);
  /** The first round is the great adventure he has already won: he buys more there. */
  const SON_BUYS_FIRST = Number(process.env.FILS_BUYS_FIRST ?? 2);
  const SON_CREDIT_MOST = 3;
  /** He keeps the honey and the encouragement of the king's wave for the king. */
  const SON_KING = process.env.FILS_KING !== '0';
  let sonCredit = 0;
  /** Where he puts them (his save): fighters ahead, dragons a little behind them, tanks,
   * archers and healers further back, a wide spread around each. */
  const SON_X = { melee: 690, dragon: 740, healer: 820, shooter: 880 };
  const SON_SPREAD = 140;
  /** A draw among the kinds open now, weighted by their share. */
  function weighted(mix) {
    const open = Object.entries(mix).filter(([k]) => buyable(k));
    const total = open.reduce((n, [, w]) => n + w, 0);
    let roll = random() * total;
    for (const [k, w] of open) if ((roll -= w) < 0) return k;
    return open.at(-1)?.[0] ?? null;
  }
  /** The ally he wants next: kept until he can pay it (he saves for it). */
  let sonWish = null;
  function sonKind() {
    if (sonWish && buyable(sonWish)) return sonWish;
    const healers = g.units.filter((u) => isHealer(u.kind)).length;
    const fighters = g.units.filter((u) => u.kind !== 'hero' && !isHealer(u.kind)).length;
    sonWish = healers < fighters / SON_HEAL ? weighted(SON_HEALERS) : weighted(SON_MIX);
    return sonWish;
  }
  function sonPlace(kind) {
    const counts = laneCounts();
    const lanes = [0, 1, 2].sort((a, b) => counts[a] - counts[b] || a - b);
    const x0 = isHealer(kind)
      ? SON_X.healer
      : kind === 'dragon'
        ? SON_X.dragon
        : kinds[kind].range >= 100
          ? SON_X.shooter
          : SON_X.melee;
    for (const lane of lanes) {
      const spots = CAMP_SPOTS.filter(([, y]) => Math.abs(y - LANES[lane]) <= 60)
        .map(([x, y]) => [x, y, Math.abs(x - x0) + random() * SON_SPREAD])
        .sort((a, b) => a[2] - b[2]);
      for (const [x, y] of spots) {
        const cost = g.recruitCost(kind);
        if (g.recruit(kind, x, y)) {
          r.spent += cost;
          return true;
        }
      }
    }
    return false;
  }
  /** One ally if the purse pays it beyond what he keeps. */
  function sonBuy() {
    const kind = sonKind();
    if (!kind || g.gold - g.recruitCost(kind) < (g.kings > 0 ? SON_KEEP : 0)) return false;
    if (!sonPlace(kind)) return false;
    sonWish = null;
    return true;
  }
  /** The gift of a camp, before anything else: the screen shows it first. */
  function realGift() {
    if (!g.endless || g.rewards.pending == null) return;
    const offer = g.boonOffer.filter((id) => !REAL_SKIP_BOONS.includes(id));
    if (!offer.length) return void g.skipReward();
    if (profile === 'parent') {
      const id = pick(offer);
      const replace = g.boonNeedsPlace(id) ? pick(g.boons).id : undefined;
      if (!g.chooseReward(id, replace)) g.skipReward();
      return;
    }
    // « enfant » : a gift it has climbs; else the first it likes, never one pushing out a
    // gift it built up; else a card « once ». « fils » : the same with the five gifts of his
    // save, in this order, and never the rente.
    const owned = g.boons.map((b) => b.id);
    const full = g.boons.length >= g.boonRules.places;
    const taste = profile === 'fils' ? SON_GIFTS : BOON_TASTE;
    const choice =
      offer.find((id) => owned.includes(id)) ??
      taste.find((id) => offer.includes(id) && !(full && g.boonNeedsPlace(id))) ??
      offer.find((id) => !g.boonNeedsPlace(id) && (profile !== 'fils' || !isLasting(id)));
    if (!choice || !g.chooseReward(choice)) g.skipReward();
  }
  /** The five gifts of the son's save, all at level 3. */
  const SON_GIFTS = ['solide', 'marche', 'vue', 'forge', 'armure'];
  const isLasting = (id) => LASTING.includes(id);
  /** Mends the crystal while it is below `until` and the purse allows. */
  function mend(until) {
    if (REAL_OFF.includes('repair')) return;
    for (let i = 0; i < 4 && g.base < until && g.repair(); i++);
  }
  /** Everything a real player does in the camp, then the time it spends there. */
  function realCamp() {
    realGift();
    placeOffered();
    // The son never trained his hero (his save says so).
    if (g.heroTrainingOpen && g.campaign.training === 'none' && profile !== 'fils')
      g.trainHero(profile === 'enfant' || random() < 0.5 ? 'force' : 'guard');
    if (profile === 'parent') {
      if (g.base <= 75) mend(100);
      for (let i = 0; i < PARENT_BUYS; i++) if (!parentBuy()) break;
    } else if (profile === 'fils') {
      mend(100);
      // SON_BUYS allies a camp on average (0.5: one every other camp), up to three at once
      // after camps where he was saving.
      sonCredit = Math.min(SON_CREDIT_MOST, sonCredit + (g.kings > 0 ? SON_BUYS : SON_BUYS_FIRST));
      while (sonCredit >= 1 && sonBuy()) sonCredit--;
    } else {
      mend(100);
      for (let i = 0; i < 60; i++) if (!childBuy()) break;
    }
    for (let i = 0; i < Math.round(CAMP_SECONDS / dt); i++) step();
  }
  let nextRepair = 0;
  /** During the wave: honey, encouragement, repair, an ally more when the crystal is hit. */
  function realWave(hit) {
    const coming = g.enemies.filter((e) => e.hp > 0 && e.x > 480);
    const tactics = !REAL_OFF.includes('tactics');
    // « fils » with SON_KING : at the king's wave he keeps his honey and his encouragement
    // for King Snake (sticky honey on the king's lane, encouragement when he enters the camp).
    const king = g.enemies.find((e) => e.boss && e.hp > 0);
    const waitsForKing =
      profile === 'fils' && SON_KING && g.wave === g.totalWaves && !(king && king.x > 480);
    if (tactics && !g.feastUsed && waitsForKing) {
      // Not yet: the king is not on the bridges.
    } else if (tactics && !g.feastUsed && profile === 'fils' && SON_KING && king) {
      g.offerFeast(king.lane, 'sticky');
    } else if (tactics && !g.feastUsed && coming.length) {
      if (profile === 'parent')
        g.offerFeast(pick(g.enemyLanes), random() < 0.5 ? 'lure' : 'sticky');
      else {
        const crowd = g.enemyLanes
          .map((lane) => [lane, coming.filter((e) => e.lane === lane).length])
          .sort((a, b) => b[1] - a[1] || a[0] - b[0]);
        g.offerFeast(crowd[0][0], 'sticky');
      }
    }
    const kingWave = profile === 'fils' && SON_KING && g.wave === g.totalWaves;
    if (
      tactics &&
      !g.encouragementUsed &&
      (kingWave ? king && king.x >= CAMP_LEFT : g.enemies.some((e) => e.hp > 0 && e.x >= CAMP_LEFT))
    )
      g.encourage();
    // One repair at a time: the menu closes after each one, and opening it again takes a
    // moment (three taps).
    if (
      !REAL_OFF.includes('repair') &&
      g.base <= (profile === 'parent' ? 50 : 75) &&
      g.time >= nextRepair &&
      g.repair()
    )
      nextRepair = g.time + 3;
    if (hit && profile === 'parent' && PARENT_RUSH)
      for (let i = 0; i < 60; i++) if (!parentBuy()) break;
    if (hit) profile === 'parent' ? parentBuy() : profile === 'fils' ? sonBuy() : childBuy();
  }
  const order = ['club', 'shield', 'archer'];
  // The « dino » player plays as the expert does, with its two big dinosaurs on top.
  const skilled = profile === 'expert' || profile === 'dino';
  const step = () => {
    const count = g.units.length,
      purse = g.gold,
      crystal = g.base;
    g.step(dt);
    if (CRYSTAL_BITE && g.endless && g.kings > 0 && g.base < crystal && g.base > 0) {
      let grown = 1;
      for (let k = 0; k < g.kings; k++) grown *= 1 + g.endless.biteStep;
      g.base = Math.max(0, g.base - (crystal - g.base) * (grown - 1));
      // The engine checked for defeat before this extra damage: a crystal it empties falls
      // now, before the player can repair it.
      if (g.base <= 0) g.status = 'lost';
    }
    r.deaths += Math.max(0, count - g.units.length);
    earned += Math.max(0, g.gold - purse);
    // Measure only: a purse that never holds more than PURSE_CAP coins.
    if (PURSE_CAP !== null && g.gold > PURSE_CAP) g.gold = PURSE_CAP;
  };
  let minBase = 100,
    // Coins the game paid (snakes, end of wave, gifts that pay at each wave).
    earned = 0;
  // Endless columns: the waves the crystal took no damage in, and the largest purse held.
  let cleanWaves = 0,
    cleanAfterKing = 0,
    wavesAfterKing = 0,
    maxGold = g.gold;
  // Lot C columns: waves where the crystal was hit but held, the most snakes alive at once,
  // the life of every snake that came in a wave (by round and wave of the round), the waves
  // before the king and how low the crystal went in them after the first king.
  let tenseAfterKing = 0,
    maxAlive = 0,
    minBaseBeforeKing = 100;
  const waveLife = [];
  // « fils » : his camp and purse in the camp after each king (allies, coins).
  const atKing = [];
  // Lot C, second part: the waves 7 to 12 of the rounds after the first, and those of them
  // where the crystal lost points (the parent's goal: one in two at least).
  let lateWaves = 0,
    lateHurt = 0;
  // In the endless adventure, `wave` counts from the very first wave, rounds included.
  const lastWave = g.endless ? ENDLESS_ROUNDS * g.totalWaves : g.totalWaves;
  for (let wave = 1; wave <= lastWave; wave++) {
    if (real) realCamp();
    else if (profile === 'hasard') spendAll();
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
    if (!real) for (let i = 0; i < 90; i++) step();
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
    if (PURSE_CAP !== null && g.gold > PURSE_CAP) g.gold = PURSE_CAP;
    // Lot C (measure only): from the second round on, the engine plays the wave the formula
    // names, then the wave of the round is put back.
    const local = g.wave + 1;
    const played =
      MAPPED && g.endless && g.kings > 0 && local < g.totalWaves
        ? Math.min(g.totalWaves - 1, 6 + Math.ceil(local / 2))
        : local;
    if (played !== local) g.wave = played - 1;
    if (!g.startWave()) {
      g.wave = local - 1;
      r.status = 'blocked:' + g.status;
      break;
    }
    const t = g.time;
    const startBase = g.base;
    let waveMin = g.base,
      seen = g.base,
      ticks = 0,
      life = 0;
    const met = new Set();
    while (g.status === 'fighting' && g.time - t < 300) {
      const before = g.base;
      step();
      minBase = Math.min(minBase, g.base);
      if (ENDLESS) {
        let alive = 0;
        for (const e of g.enemies)
          if (e.hp > 0) {
            alive++;
            if (!met.has(e.id)) {
              met.add(e.id);
              life += e.maxHp;
            }
          }
        maxAlive = Math.max(maxAlive, alive);
      }
      if (real && g.status === 'fighting') realWave(g.base < before);
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
    if (played !== local) {
      g.wave = local;
      // The gifts follow the waves of the round (after its 4th and 8th wave), not the waves
      // played: the camp of the played wave is answered as the round's would be.
      if (g.status === 'preparing')
        g.rewards.pending = isMilestone(local) && !g.offerAnswered(local) ? local : null;
    }
    r.seconds += g.time - t;
    r.wave = wave;
    if (process.env.TRACE)
      console.error(
        `TRACE ${profile} k${g.kings} w${local} base ${Math.round(startBase)}->${Math.round(waveMin)} gold ${Math.round(g.gold)} units ${g.units.length} ${Object.entries(
          g.units.reduce((n, u) => ((n[u.kind] = (n[u.kind] ?? 0) + 1), n), {}),
        )
          .map(([k, n]) => k + ':' + n)
          .join(' ')} | ${g.boons.map((b) => b.id + b.level).join(' ')} ${g.status}`,
      );
    if (ENDLESS && g.status !== 'fighting') {
      const clean = waveMin >= startBase && g.status !== 'lost';
      if (clean) cleanWaves++;
      if (wave > g.totalWaves) {
        wavesAfterKing++;
        if (clean) cleanAfterKing++;
        if (!clean && g.status !== 'lost') tenseAfterKing++;
        if (local >= LATE_FROM) {
          lateWaves++;
          if (!clean) lateHurt++;
        }
        if (local < g.totalWaves && g.status !== 'lost')
          minBaseBeforeKing = Math.min(minBaseBeforeKing, waveMin);
      }
      waveLife.push(Math.round(life));
    }
    if (profile === 'fils' && g.kings > atKing.length)
      atKing.push([g.units.filter((u) => u.kind !== 'hero').length, Math.round(g.gold)]);
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
  // The newer columns, only for the newer players and the lot C measures: the older lines
  // of results stay the same, field by field.
  if (ENDLESS && (real || MAPPED || PURSE_CAP !== null || LOT_C2 || process.env.LOT_C === '1'))
    Object.assign(r, {
      tenseAfterKing,
      maxAlive,
      minBaseBeforeKing: Math.round(minBaseBeforeKing),
      waveLife,
      earned: Math.round(earned),
      fellAtKing: g.status === 'lost' && g.wave === g.totalWaves,
      training: g.campaign.training,
      boons: g.boons.map((b) => `${b.id}${b.level}`).join(' '),
      camp: Object.entries(g.units.reduce((n, u) => ((n[u.kind] = (n[u.kind] ?? 0) + 1), n), {}))
        .sort((a, b) => b[1] - a[1])
        .map(([k, n]) => `${k}:${n}`)
        .join(' '),
    });
  if (profile === 'fils') r.atKing = atKing;
  if (ENDLESS && (LOT_C2 || profile === 'fils')) Object.assign(r, { lateWaves, lateHurt });
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
      const kings = Array.from({ length: Math.max(9, ENDLESS_ROUNDS) }, (_, i) => i + 1).map(
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
      if (list[0].waveLife) {
        // Lot C: tense waves, the most snakes alive, the life of the first wave of a round
        // against the 11th of the round before, how low the crystal went before a king.
        const median = (values) => {
          const v = values.filter(Number.isFinite).sort((a, b) => a - b);
          return v.length ? v[Math.floor(v.length / 2)] : NaN;
        };
        const ratios = list.flatMap((r) =>
          r.waveLife
            .map((life, i) => (i >= 12 && i % 12 === 0 ? life / r.waveLife[i - 2] : NaN))
            .filter(Number.isFinite),
        );
        const alive = list.map((r) => r.maxAlive);
        console.log(
          `${''.padEnd(38)} vagues tendues après le 1er roi ${share(sum('tenseAfterKing'), sum('wavesAfterKing'))} %, début de tour ÷ vague 11 ${median(ratios).toFixed(2)}, serpents vivants au plus ${median(alive)} (max ${Math.max(...alive)}), cristal le plus bas avant un roi (après le 1er) médian ${median(list.filter((r) => r.kings > 0).map((r) => r.minBaseBeforeKing))}, chutes au roi ${share(list.filter((r) => r.fellAtKing).length, list.filter((r) => r.status === 'lost').length)} %`,
        );
      }
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
