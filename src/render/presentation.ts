import type { Game, Entity, Effect } from '../game.ts';
import { dustSpacing } from './characterMotion.ts';
import type { CharacterAction, Gait } from './characterMotion.ts';
import { encounterReadout } from './encounterReadout.ts';
import type { EncounterReadout } from './encounterReadout.ts';
export type Notice = {
  kind: 'wave' | 'boss' | 'clear' | 'egg' | 'fallen';
  title: string;
  subtitle: string;
  remaining: number;
  duration: number;
  priority: number;
};
export type Float = {
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
  duration: number;
};
export type Burst = { x: number; y: number; age: number; color: number };
export type Arrival = {
  id: number;
  x: number;
  y: number;
  lane: number;
  boss: boolean;
  age: number;
  source: 'den' | 'egg';
};
/** One-frame cosmetic cues for BattleJuice; rebuilt at every update. */
export type Spark = { kind: 'ally' | 'egg' | 'coin' | 'boss' | 'dust'; x: number; y: number };
type Snapshot = { x: number; y: number; hp: number; kind: Entity['kind'] };
/** Visual seconds a blow keeps its pose. */
export const ACTION_SECONDS = 0.55;
/** Visual seconds before a fighter that was just hit can flash again. */
const FLASH_REST_SECONDS = 0.3;
/** Visual seconds of the little pop of an ally that was just placed. */
export const PLACED_SECONDS = 0.35;
/** Visual seconds a den or an egg keeps telling that a snake came out of it. */
export const ARRIVAL_SECONDS = 0.9;
const BURST_SECONDS = 0.6;
/** The queues are bounded: a crowded board never grows them without limit. */
const MAX_FLOATS = 40,
  MAX_BURSTS = 24,
  MAX_ARRIVALS = 24,
  MAX_ACTIONS = 64;
/** A snake first seen left of this line came out of a den; further right, out of an egg. */
const DEN_EDGE = 160;
/** Effects that show their author striking, shooting or shielding. */
const BLOWS = new Set<Effect['kind']>(['hit', 'fire', 'arrow', 'shell', 'block']);

/** Ages the entries of `ages` by `dt` and drops those that reached `lifetime`. */
function ageOut(ages: Map<number, number>, dt: number, lifetime: number) {
  for (const [id, age] of ages)
    if (age + dt >= lifetime) ages.delete(id);
    else ages.set(id, age + dt);
}
/** Ages every item by `dt` and returns those still younger than `lifetime`. */
function aged<T extends { age: number }>(items: T[], dt: number, lifetime: number): T[] {
  for (const item of items) item.age += dt;
  return items.filter((item) => item.age < lifetime);
}

export class Presentation {
  clock = 0;
  encounter: EncounterReadout = { eggs: [], confusion: null, encouragement: null, shot: null };
  notice: Notice | null = null;
  floats: Float[] = [];
  bursts: Burst[] = [];
  arrivals: Arrival[] = [];
  actions = new Map<number, CharacterAction>();
  fortDamage = 0;
  fortRepair = 0;
  reactions = new Map<number, { hurt: number; heal: number }>();
  sparks: Spark[] = [];
  /** Age of the pale flash of a fighter that was just hit; it cannot restart before 0.3 s. */
  flashes = new Map<number, number>();
  /** Age of an ally that was just placed, for its little pop. */
  placed = new Map<number, number>();
  /** Ground covered by each fighter, so that its walk follows its real movement. */
  gaits = new Map<number, Gait>();
  /** Seconds since this battle was won in front of the player; Infinity otherwise. */
  victoryAge = Infinity;
  private game: Game | undefined;
  private units = new Map<number, Snapshot>();
  /** Fighters met during the current update: whoever is missing from it has left the board. */
  private seen = new Set<number>();
  private wave = 0;
  private status: Game['status'] = 'preparing';
  private hatched = 0;
  private bossSeen = false;
  private heard = new WeakSet<Effect>();
  private base = 100;
  private bossArmor = new Map<number, { phase: number; broken: number }>();
  private roared = new Map<number, number>();
  private announce(notice: Omit<Notice, 'remaining'>) {
    if (this.notice && this.notice.priority > notice.priority) return;
    this.notice = { ...notice, remaining: notice.duration };
  }
  private text(x: number, y: number, text: string, color: string) {
    this.floats.push({ x, y, text, color, age: 0, duration: 0.9 });
    if (this.floats.length > MAX_FLOATS) this.floats.shift();
  }
  /** Observes one frame of the game. The order of the steps is the order of the cues. */
  update(game: Game, deltaMs: number) {
    this.encounter = encounterReadout(game);
    const fresh = this.game !== game;
    this.sparks.length = 0;
    if (fresh) this.reset(game);
    // The visual clock freezes in pause and never jumps after a slow frame.
    const dt =
      game.paused || !Number.isFinite(deltaMs) ? 0 : Math.max(0, Math.min(0.1, deltaMs / 1000));
    this.clock += dt;
    this.ageMarks(dt);
    this.victoryAge += dt;
    if (!fresh && this.status !== 'won' && game.status === 'won') this.victoryAge = 0;
    this.watchRefuge(game, fresh);
    this.ageFeedback(dt);
    this.announceTurns(game, fresh);
    this.seen.clear();
    for (const e of game.units) this.watchFighter(e, fresh, dt);
    for (const e of game.enemies) this.watchFighter(e, fresh, dt);
    this.forgetDeparted();
    this.hearEffects(game);
    this.boundQueues();
    this.wave = game.wave;
    this.status = game.status;
    this.hatched = game.hatched;
  }
  /** Another game: nothing seen in the previous one may leak into it. */
  private reset(game: Game) {
    this.flashes.clear();
    this.placed.clear();
    this.gaits.clear();
    this.victoryAge = Infinity;
    this.game = game;
    this.units.clear();
    this.floats = [];
    this.bursts = [];
    this.arrivals = [];
    this.actions.clear();
    this.roared.clear();
    this.bossArmor.clear();
    this.fortDamage = 0;
    this.fortRepair = 0;
    this.base = game.base;
    this.reactions.clear();
    this.notice = null;
    this.wave = game.wave;
    this.status = game.status;
    this.hatched = game.hatched;
    this.bossSeen = false;
    this.heard = new WeakSet();
    this.clock = 0;
  }
  /** Poses, flashes, pops, the tints of the refuge and the pulses of the dens fade with time. */
  private ageMarks(dt: number) {
    for (const [id, action] of this.actions) {
      action.age += dt;
      if (action.age >= ACTION_SECONDS) this.actions.delete(id);
    }
    ageOut(this.flashes, dt, FLASH_REST_SECONDS);
    ageOut(this.placed, dt, PLACED_SECONDS);
    this.fortDamage = Math.max(0, this.fortDamage - dt * 2.5);
    this.fortRepair = Math.max(0, this.fortRepair - dt * 1.5);
    this.arrivals = aged(this.arrivals, dt, ARRIVAL_SECONDS);
  }
  /** A refuge that was hit or repaired says so, with its tint and a number. */
  private watchRefuge(game: Game, fresh: boolean) {
    if (!fresh && game.base !== this.base) {
      const change = game.base - this.base;
      if (change < 0) this.fortDamage = 1;
      else this.fortRepair = 1;
      this.text(
        1002,
        232,
        `Camp ${change > 0 ? '+' : '−'}${Math.round(Math.abs(change))}`,
        change > 0 ? '#c2f4a8' : '#ffd49d',
      );
    }
    this.base = game.base;
  }
  /** Floating words, bursts, reactions and the banner live their short life. */
  private ageFeedback(dt: number) {
    for (const f of this.floats) f.age += dt;
    this.floats = this.floats.filter((f) => f.age < f.duration);
    this.bursts = aged(this.bursts, dt, BURST_SECONDS);
    for (const [id, r] of this.reactions) {
      r.hurt = Math.max(0, r.hurt - dt * 4);
      r.heal = Math.max(0, r.heal - dt * 2);
      if (!r.hurt && !r.heal) this.reactions.delete(id);
    }
    if (this.notice) {
      this.notice.remaining -= dt;
      if (this.notice.remaining <= 0) this.notice = null;
    }
  }
  /** Banners for what just changed: a new wave, the king, a wave repelled, eggs hatching. */
  private announceTurns(game: Game, fresh: boolean) {
    if (!fresh && game.wave !== this.wave) {
      const chapter = game.briefing;
      this.announce({
        kind: 'wave',
        title: `Vague ${game.wave} · ${chapter.title}`,
        subtitle: chapter.tip,
        duration: 2.6,
        priority: 1,
      });
    }
    const boss = game.enemies.find((e) => e.boss && e.hp > 0);
    if (boss && !this.bossSeen) {
      this.bossSeen = true;
      if (!fresh) this.sparks.push({ kind: 'boss', x: boss.x, y: boss.y });
      this.announce({
        kind: 'boss',
        title: 'LE ROI À TROIS TÊTES ENTRE DANS LA VALLÉE',
        subtitle: 'S’il atteint le cristal, la partie est perdue. Attention à ses œufs !',
        duration: 4,
        priority: 4,
      });
    }
    if (!fresh && this.status === 'fighting' && game.status === 'preparing')
      this.announce({
        kind: 'clear',
        title: `Vague ${game.wave} repoussée !`,
        subtitle:
          !game.mission && (game.wave === 4 || game.wave === 8)
            ? `Nouvelle clairière : ${game.level.name}.`
            : 'Prépare les prochains alliés.',
        duration: 2.8,
        priority: 2,
      });
    if (game.hatched > this.hatched) {
      this.announce({
        kind: 'egg',
        title: 'CRAC ! Les œufs ont éclos',
        subtitle: 'De nouveaux gourmands arrivent…',
        duration: 1.8,
        priority: 0,
      });
    }
  }
  /** Compares a fighter with what was seen of it at the previous update. */
  private watchFighter(e: Entity, fresh: boolean, dt: number) {
    this.seen.add(e.id);
    if (e.boss && e.hp > 0 && e.bossState) this.watchRoyalArmor(e, e.bossState);
    const old = this.units.get(e.id);
    if (!old) {
      if (!fresh) this.welcome(e);
      this.units.set(e.id, { x: e.x, y: e.y, hp: e.hp, kind: e.kind });
      return;
    }
    this.followWalk(e, old, dt);
    if (old.hp !== e.hp) this.watchHealth(e, old.hp);
    old.x = e.x;
    old.y = e.y;
    old.hp = e.hp;
    old.kind = e.kind;
  }
  /** The king's protection is named when a phase raises it and when it breaks. */
  private watchRoyalArmor(king: Entity, state: NonNullable<Entity['bossState']>) {
    const previous = this.bossArmor.get(king.id);
    if (previous && state.phase > previous.phase)
      this.text(king.x, king.y - 115, `Phase ${state.phase} : protection !`, '#bce9f0');
    else if (previous && state.shieldsBroken > previous.broken)
      this.text(king.x, king.y - 115, 'Protection brisée !', '#bce9f0');
    this.bossArmor.set(king.id, { phase: state.phase, broken: state.shieldsBroken });
  }
  /** Feeds the walk with the ground really covered, and raises dust under heavy steps. */
  private followWalk(e: Entity, old: Snapshot, dt: number) {
    // Each fighter starts on its own foot: a squad never hops as one block.
    let gait = this.gaits.get(e.id);
    if (!gait) this.gaits.set(e.id, (gait = { travel: (e.id * 7.3) % 40, rest: 1 }));
    const moved = Math.hypot(e.x - old.x, e.y - old.y);
    // A leap across the board is not a walk (a camp put back in place, a new map).
    if (!(moved > 0.01 && moved < 40)) {
      gait.rest += dt;
      return;
    }
    const spacing = dustSpacing(e);
    if (spacing && Math.floor((gait.travel + moved) / spacing) > Math.floor(gait.travel / spacing))
      this.sparks.push({ kind: 'dust', x: e.x - e.facing * 12, y: e.y });
    gait.travel += moved;
    gait.rest = 0;
  }
  /** A wound or a cure shows its number and makes the body react. */
  private watchHealth(e: Entity, before: number) {
    const half = e.maxHp * 0.5;
    if (e.kind === 'snake' && e.variant === 'clockwork' && before > half && e.hp <= half) {
      this.text(e.x, e.y - 62, 'Clac !', '#efc382');
      this.bursts.push({ x: e.x, y: e.y - 10, age: 0, color: 0xd9ad62 });
    }
    const change = e.hp - before;
    if (!(Math.abs(change) >= 0.5)) return;
    const heal = change > 0;
    this.text(
      e.x,
      e.y - 72,
      `${heal ? '+' : '−'}${Math.round(Math.abs(change))}`,
      heal ? '#c2f4a8' : '#ffe0b4',
    );
    const r = this.reactions.get(e.id) ?? { hurt: 0, heal: 0 };
    if (heal) r.heal = 1;
    else {
      r.hurt = 1;
      if (!this.flashes.has(e.id)) this.flashes.set(e.id, 0);
    }
    this.reactions.set(e.id, r);
  }
  /** A newcomer: an ally just placed, or a snake out of its den or its egg. */
  private welcome(e: Entity) {
    if (e.kind !== 'snake') {
      this.text(e.x, e.y - 72, 'À la rescousse !', '#c6e8ed');
      this.placed.set(e.id, 0);
      this.sparks.push({ kind: 'ally', x: e.x, y: e.y });
      return;
    }
    if (e.x >= DEN_EDGE) this.sparks.push({ kind: 'egg', x: e.x, y: e.y });
    this.arrivals.push({
      id: e.id,
      x: e.x,
      y: e.y,
      lane: e.lane,
      boss: e.boss,
      age: 0,
      source: e.x < DEN_EDGE ? 'den' : 'egg',
    });
  }
  /** Whoever was not met in this update has left the board: say it once, then forget it. */
  private forgetDeparted() {
    for (const [id, old] of this.units) {
      if (this.seen.has(id)) continue;
      if (old.kind !== 'snake') {
        this.text(old.x, old.y - 40, 'Tombé', '#d4d5c8');
        this.announce({
          kind: 'fallen',
          title: 'Un allié est tombé',
          subtitle: 'Les médecins soignent les vivants ; les alliés prennent la relève.',
          duration: 1.8,
          priority: 0,
        });
      }
      this.units.delete(id);
      this.bossArmor.delete(id);
      this.reactions.delete(id);
      this.flashes.delete(id);
      this.placed.delete(id);
      this.gaits.delete(id);
      this.actions.delete(id);
      this.roared.delete(id);
    }
  }
  /** Each effect of the rules is heard once: a pose for its author, a word, a burst. */
  private hearEffects(game: Game) {
    for (const e of game.effects) {
      if (this.heard.has(e)) continue;
      this.heard.add(e);
      if (e.sourceId !== undefined && BLOWS.has(e.kind)) this.strike(game, e, e.sourceId);
      this.voice(game, e);
    }
  }
  /** The author of a blow takes its pose; a little dinosaur roars, three seconds apart at most. */
  private strike(game: Game, e: Effect, sourceId: number) {
    this.actions.set(sourceId, {
      age: 0,
      kind: e.kind,
      // A block points at the ally being protected, not at the snake: keep the rules' side.
      facing: e.kind === 'block' ? undefined : e.tx > e.x ? 1 : e.tx < e.x ? -1 : undefined,
    });
    const source = game.units.find((u) => u.id === sourceId);
    if (
      source?.kind === 'dino' &&
      e.kind === 'hit' &&
      this.clock - (this.roared.get(source.id) ?? -10) >= 3
    ) {
      this.text(source.x, source.y - 66, 'Grrr !', '#e4e6ae');
      this.roared.set(source.id, this.clock);
    }
  }
  /** The floating word and the burst of an effect. */
  private voice(game: Game, e: Effect) {
    if (e.kind === 'block') {
      const recipient = game.enemies.find((u) => u.id === e.targetId);
      this.text(
        e.tx,
        e.ty - 60,
        recipient ? 'Poc !' : 'Protégé !',
        recipient ? '#dceeb1' : '#b4e4ed',
      );
    }
    if (e.kind === 'honey') this.text(e.x, e.y - 45, 'Miam !', '#ffe3a0');
    if (e.kind === 'gold') {
      this.text(e.x, e.y - 25, '+ pièces', '#ffdf8b');
      this.bursts.push({ x: e.x, y: e.y, age: 0, color: 0xecc96c });
      this.sparks.push({ kind: 'coin', x: e.x, y: e.y });
    }
    if (e.kind === 'hit') this.bursts.push({ x: e.tx, y: e.ty - 8, age: 0, color: 0xffdf9c });
  }
  private boundQueues() {
    if (this.bursts.length > MAX_BURSTS) this.bursts = this.bursts.slice(-MAX_BURSTS);
    if (this.arrivals.length > MAX_ARRIVALS) this.arrivals = this.arrivals.slice(-MAX_ARRIVALS);
    while (this.actions.size > MAX_ACTIONS) this.actions.delete(this.actions.keys().next().value!);
  }
}

/** Small visual offsets. Returns a view only; never moves a fighter in the simulation. */
export function visualPose(
  entity: Entity,
  clock: number,
  reactions: Map<number, { hurt: number; heal: number }>,
  reduced: boolean,
): Entity {
  if (reduced) return entity;
  const reaction = reactions.get(entity.id),
    hurt = reaction?.hurt ?? 0,
    heal = reaction?.heal ?? 0;
  const idle = entity.state === 'idle' ? Math.sin(clock * 3 + entity.id) * 0.6 : 0;
  const pulse =
    entity.state === 'attack'
      ? Math.max(0, Math.sin(Math.min(1, Math.max(0, entity.cool)) * Math.PI)) * 3
      : 0;
  return {
    ...entity,
    x: entity.x + entity.facing * (pulse - hurt * 3),
    y: entity.y + idle - heal * 1.5,
  };
}
