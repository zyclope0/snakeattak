import { ensureMedical } from '../healing.ts';
import type { MedicalState } from '../healing.ts';
import type { CourtState } from '../bossCourt.ts';
import type { BossState } from '../boss.ts';
import type { EnemyKind } from '../enemies.ts';
import { kinds } from '../data.ts';
import type { Kind } from '../data.ts';
import type { Point } from '../navigation.ts';
import type { Game } from '../game.ts';
import { nextSeed, seedShare } from '../seededRandom.ts';

export type Entity = Point & {
  id: number;
  kind: Kind | 'snake';
  variant: EnemyKind;
  broodCool: number;
  charge: number;
  guardCool: number;
  rattleCool: number;
  confusedFor: number;
  confusionImmunity: number;
  hp: number;
  maxHp: number;
  cool: number;
  path: Point[];
  nav: number;
  boss: boolean;
  bossState?: BossState;
  /** Blows a ninja snake still dodges. Absent on every other fighter. */
  dodges?: number;
  /** Carapace d'un caprice : plus lente, plus solide, blindée. Absente sinon. */
  shell?: true;
  medical?: MedicalState;
  court?: CourtState;
  courtReleased?: boolean;
  state: 'idle' | 'move' | 'attack' | 'heal';
  facing: number;
  lane: number;
  stage: number;
  homeX: number;
  homeY: number;
  turnY: number | null;
  targetId: number | null;
};
export type Egg = Point & {
  id: number;
  lane: number;
  hatchIn: number;
  duration: number;
  count: number;
};
export type Effect = Point & {
  sourceId?: number;
  targetId?: number;
  tx: number;
  ty: number;
  kind: 'hit' | 'heal' | 'arrow' | 'gold' | 'fire' | 'poison' | 'shell' | 'honey' | 'block';
  life: number;
};
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
/** Sort order: the nearest to `origin` first, the oldest fighter on a tie. */
export const closerTo = (origin: Point, a: Entity, b: Entity) =>
  distance(a, origin) - distance(b, origin) || a.id - b.id;
/** Turns a fighter towards what it fights. */
export function faceToward(entity: Entity, target: Point) {
  entity.facing = target.x >= entity.x ? 1 : -1;
}
/** Drops the current path, so the next move plans a new one at once. */
export function forgetPath(entity: Entity) {
  entity.path = [];
  entity.nav = 0;
}
/** Seul tirage aléatoire du combat : chaque appel avance la graine de la partie. */
export function nextRandom(game: Game) {
  game.rng = nextSeed(game.rng);
  return seedShare(game.rng);
}
export function addEffect(game: Game, a: Point, b: Point, kind: Effect['kind']) {
  game.effects.push({
    sourceId: 'id' in a && typeof a.id === 'number' ? a.id : undefined,
    targetId: 'id' in b && typeof b.id === 'number' ? b.id : undefined,
    x: a.x,
    y: a.y,
    tx: b.x,
    ty: b.y,
    kind,
    life: kind === 'honey' ? 0.9 : 0.3,
  });
}
export function createEntity(
  game: Game,
  kind: Entity['kind'],
  x: number,
  y: number,
  hp: number,
): Entity {
  const entity: Entity = {
    id: ++game.nextId,
    kind,
    variant: 'normal',
    broodCool: 10,
    charge: 0,
    guardCool: 0,
    rattleCool: 0,
    confusedFor: 0,
    confusionImmunity: 0,
    x,
    y,
    hp,
    maxHp: hp,
    cool: 0,
    path: [],
    nav: 0,
    boss: false,
    state: 'idle',
    facing: kind === 'snake' ? 1 : -1,
    lane: 0,
    stage: 0,
    homeX: x,
    homeY: y,
    turnY: null,
    targetId: null,
  };
  if (game.tuning.tacticalRulesEnabled) ensureMedical(entity);
  return entity;
}
export function addAlly(game: Game, kind: Kind, x: number, y: number) {
  const e = createEntity(game, kind, x, y, kinds[kind].hp);
  game.units.push(e);
  return e;
}
