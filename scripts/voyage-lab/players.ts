// Joueurs automatiques du laboratoire du voyage : ceux de `balance-modes.mjs` et de
// `caprices-lab.mjs` (expert, moyen, petit, massues, gros), avec trois différences.
// 1. Ils posent d'abord les alliés offerts par le sac de voyage.
// 2. Ceux qui achètent « une voie après l'autre » (moyen, apprenti, petit, gros) commencent
//    par une voie qui dépend de la graine du combat, et non toujours par la première.
// 3. L'apprenti est nouveau : le joueur moyen, arrêté à quatre achats par vague. Il se place
//    entre le petit (deux achats) et le moyen (tout dépenser), là où jouent sans doute les
//    enfants.
// Un joueur automatique n'est pas un enfant : il ne répare pas le cristal, n'entraîne pas le
// héros, ne regarde pas la carte du voyage et ne se trompe jamais de bouton.
import { LANES, laneDefense } from '../../src/ai.ts';
import { kinds } from '../../src/data.ts';
import type { Kind } from '../../src/data.ts';
import type { Game } from '../../src/game.ts';
import { REWARDS } from '../../src/rewards.ts';

export const PROFILES = ['expert', 'moyen', 'apprenti', 'petit', 'massues', 'gros'] as const;
export type Profile = (typeof PROFILES)[number];
export type StageResult = {
  status: 'won' | 'lost' | 'timeout';
  /** Vague atteinte (1 à 4). */
  wave: number;
  /** Cristal à la fin de l'étape, et au plus bas pendant l'étape. */
  base: number;
  minBase: number;
  /** Secondes de combat simulées, hors préparation. */
  seconds: number;
  deaths: number;
  /** Pièces non dépensées à la fin. */
  gold: number;
};

const STEP = 1 / 30;
const PREPARATION_STEPS = 90;
const WAVE_LIMIT_SECONDS = 300;
const FRONT = [660, 708, 756, 804, 852, 900, 948];
const REAR = [900, 948, 852, 804, 756, 708, 660];
const ROTATION: Kind[] = ['club', 'shield', 'archer'];
const EXPERT_ORDER: Kind[] = ['archer', 'shield', 'club'];
/** Achats par vague des joueurs qui ne dépensent pas tout. */
const PURCHASES_PER_WAVE: Partial<Record<Profile, number>> = { petit: 2, apprenti: 4 };
const BIG = (Object.keys(kinds) as Kind[])
  .filter((kind) => !['hero', 'wall', 'medic', 'nurse'].includes(kind))
  .sort((a, b) => kinds[b].cost - kinds[a].cost);

/** Les gestes d'achat d'un joueur sur une partie. */
function shopper(game: Game) {
  // Acheter « une voie après l'autre » marie la sorte d'allié à la voie : dans une vague,
  // chaque voie ne reçoit qu'une sorte, et la voie de départ décide laquelle a les archers.
  // Un cadeau du sac posé d'abord décale ce mariage. Mesuré sur 200 graines sans aucun
  // allié offert : 37 % de voyages terminés en partant de la première voie, 61 % en partant
  // d'une autre. La voie de départ suit donc la graine du combat, brassée parce qu'une
  // mission pose déjà ses nids selon la graine modulo trois.
  let rotation = (Math.imul(game.initialSeed ?? 0, 2654435761) >>> 16) % 3;
  const affordable = (kind: Kind) =>
    game.isUnlocked(kind) &&
    game.capriceAllows(kind) &&
    game.gold - game.caprice.reserve >= game.recruitCost(kind);
  function place(kind: Kind, lane: number): boolean {
    for (const x of kinds[kind].range >= 100 ? REAR : FRONT)
      for (const offset of [0, -48, 48])
        if (game.recruit(kind, x, LANES[lane] + offset)) return true;
    return false;
  }
  /** Sur la voie la moins défendue d'abord. */
  function buyWhereWeak(kind: Kind): boolean {
    if (!affordable(kind)) return false;
    const scores = laneDefense(game.units);
    const lanes = [0, 1, 2].sort((a, b) => scores[a] - scores[b] || a - b);
    return lanes.some((lane) => place(kind, lane));
  }
  /** Une voie après l'autre, sans regarder le plateau. */
  function buyInTurn(kind: Kind): boolean {
    if (!affordable(kind)) return false;
    for (let k = 0; k < 3; k++) {
      const lane = (rotation + k) % 3;
      if (place(kind, lane)) {
        rotation = (lane + 1) % 3;
        return true;
      }
    }
    return false;
  }
  return { buyWhereWeak, buyInTurn };
}

/** Les alliés offerts par le sac : tout joueur pose un cadeau, même le plus petit. */
function placeGifts(game: Game, buy: (kind: Kind) => boolean) {
  for (const choice of [...game.rewards.choices]) {
    const kind = choice.id === 'skip' || choice.used ? null : REWARDS[choice.id].kind;
    if (kind) buy(kind);
  }
}

function prepare(game: Game, profile: Profile, wave: number, shop: ReturnType<typeof shopper>) {
  const { buyWhereWeak, buyInTurn } = shop;
  placeGifts(game, profile === 'expert' || profile === 'massues' ? buyWhereWeak : buyInTurn);
  if (profile === 'massues') {
    for (let i = 0; i < 60; i++) if (!buyWhereWeak('club')) break;
  } else if (profile === 'gros') {
    for (let i = 0; i < 40; i++) if (!BIG.some(buyInTurn)) break;
  } else if (profile === 'expert') {
    const healer: Kind = game.isUnlocked('medic') ? 'medic' : 'nurse';
    const hasHealer = game.units.some((unit) => unit.kind === 'medic' || unit.kind === 'nurse');
    if (!game.caprice.kinds && game.capriceAllows(healer) && !hasHealer) buyWhereWeak(healer);
    for (let i = 0; i < 16; i++) {
      const order = [...EXPERT_ORDER.slice(i % 3), ...EXPERT_ORDER.slice(0, i % 3)];
      if (!order.some(buyWhereWeak)) break;
    }
  } else {
    const limit = PURCHASES_PER_WAVE[profile] ?? 40;
    let bought = 0;
    for (let i = 0; i < 60 && bought < limit; i++) {
      if (buyInTurn(ROTATION[(wave + i) % 3]) || ROTATION.some(buyInTurn)) bought++;
      else break;
    }
  }
}

/** Seul l'expert sert le miel collant et encourage ses alliés. */
function useHelps(game: Game) {
  const near = game.enemies.find((enemy) => enemy.x > 570);
  if (!game.feastUsed && near) game.offerFeast(near.lane, 'sticky');
  const fighting =
    game.units.some((unit) => unit.state === 'attack') ||
    game.enemies.some((enemy) => enemy.state === 'attack');
  if (!game.encouragementUsed && fighting) game.encourage();
}

/** Joue une partie entière (une étape du voyage, ou une mission) avec un joueur automatique. */
export function playStage(game: Game, profile: Profile): StageResult {
  const result: StageResult = {
    status: 'lost',
    wave: 0,
    base: 0,
    minBase: 100,
    seconds: 0,
    deaths: 0,
    gold: 0,
  };
  const shop = shopper(game);
  const step = () => {
    const before = game.units.length;
    game.step(STEP);
    result.deaths += Math.max(0, before - game.units.length);
    result.minBase = Math.min(result.minBase, game.base);
  };
  for (let wave = 1; wave <= game.totalWaves; wave++) {
    prepare(game, profile, wave, shop);
    for (let i = 0; i < PREPARATION_STEPS; i++) step();
    if (!game.startWave()) break;
    const started = game.time;
    while (game.status === 'fighting' && game.time - started < WAVE_LIMIT_SECONDS) {
      step();
      if (profile === 'expert') useHelps(game);
    }
    result.seconds += game.time - started;
    result.wave = wave;
    if (game.status === 'fighting') result.status = 'timeout';
    if (game.status !== 'preparing') break;
  }
  if (game.status === 'won') result.status = 'won';
  result.base = Math.round(game.base);
  result.minBase = Math.round(result.minBase);
  result.gold = Math.round(game.gold);
  return result;
}
