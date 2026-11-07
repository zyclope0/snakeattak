import type { Game, Entity, Effect } from '../game.ts';
import type { CharacterAction } from './characterMotion.ts';
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
type Snapshot = { x: number; y: number; hp: number; kind: Entity['kind'] };
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
  private game: Game | undefined;
  private units = new Map<number, Snapshot>();
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
    if (this.floats.length > 40) this.floats.shift();
  }
  update(game: Game, deltaMs: number) {
    this.encounter = encounterReadout(game);
    const fresh = this.game !== game;
    if (fresh) {
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
    const dt =
      game.paused || !Number.isFinite(deltaMs) ? 0 : Math.max(0, Math.min(0.1, deltaMs / 1000));
    this.clock += dt;
    for (const [id, action] of this.actions) {
      action.age += dt;
      if (action.age >= 0.55) this.actions.delete(id);
    }
    this.fortDamage = Math.max(0, this.fortDamage - dt * 2.5);
    this.fortRepair = Math.max(0, this.fortRepair - dt * 1.5);
    for (const a of this.arrivals) a.age += dt;
    this.arrivals = this.arrivals.filter((a) => a.age < 0.9);
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
    for (const f of this.floats) f.age += dt;
    this.floats = this.floats.filter((f) => f.age < f.duration);
    for (const b of this.bursts) b.age += dt;
    this.bursts = this.bursts.filter((b) => b.age < 0.6);
    for (const [id, r] of this.reactions) {
      r.hurt = Math.max(0, r.hurt - dt * 4);
      r.heal = Math.max(0, r.heal - dt * 2);
      if (!r.hurt && !r.heal) this.reactions.delete(id);
    }
    if (this.notice) {
      this.notice.remaining -= dt;
      if (this.notice.remaining <= 0) this.notice = null;
    }
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
            : 'Préparez les prochains renforts.',
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
    const seen = new Set<number>();
    for (const e of [...game.units, ...game.enemies]) {
      seen.add(e.id);
      if (e.boss && e.hp > 0 && e.bossState) {
        const previous = this.bossArmor.get(e.id),
          state = e.bossState;
        if (previous && state.phase > previous.phase)
          this.text(e.x, e.y - 115, `Phase ${state.phase} : protection !`, '#bce9f0');
        else if (previous && state.shieldsBroken > previous.broken)
          this.text(e.x, e.y - 115, 'Protection brisée !', '#bce9f0');
        this.bossArmor.set(e.id, { phase: state.phase, broken: state.shieldsBroken });
      }
      const old = this.units.get(e.id);
      if (old && old.hp !== e.hp) {
        if (
          e.kind === 'snake' &&
          e.variant === 'clockwork' &&
          old.hp > e.maxHp * 0.5 &&
          e.hp <= e.maxHp * 0.5
        ) {
          this.text(e.x, e.y - 62, 'Clac !', '#efc382');
          this.bursts.push({ x: e.x, y: e.y - 10, age: 0, color: 0xd9ad62 });
        }
        const change = e.hp - old.hp;
        if (Math.abs(change) >= 0.5) {
          const heal = change > 0;
          this.text(
            e.x,
            e.y - 72,
            `${heal ? '+' : '−'}${Math.round(Math.abs(change))}`,
            heal ? '#c2f4a8' : '#ffe0b4',
          );
          const r = this.reactions.get(e.id) ?? { hurt: 0, heal: 0 };
          if (heal) r.heal = 1;
          else r.hurt = 1;
          this.reactions.set(e.id, r);
        }
      } else if (!old && !fresh) {
        if (e.kind !== 'snake') this.text(e.x, e.y - 72, 'En renfort !', '#c6e8ed');
        else
          this.arrivals.push({
            id: e.id,
            x: e.x,
            y: e.y,
            lane: e.lane,
            boss: e.boss,
            age: 0,
            source: e.x < 160 ? 'den' : 'egg',
          });
      }
      this.units.set(e.id, { x: e.x, y: e.y, hp: e.hp, kind: e.kind });
    }
    for (const [id, old] of this.units)
      if (!seen.has(id)) {
        if (old.kind !== 'snake') {
          this.text(old.x, old.y - 40, 'Tombé', '#d4d5c8');
          this.announce({
            kind: 'fallen',
            title: 'Un allié est tombé',
            subtitle: 'Les médecins soignent les vivants ; les renforts prennent la relève.',
            duration: 1.8,
            priority: 0,
          });
        }
        this.units.delete(id);
        this.bossArmor.delete(id);
        this.reactions.delete(id);
        this.actions.delete(id);
        this.roared.delete(id);
      }
    for (const e of game.effects)
      if (!this.heard.has(e)) {
        this.heard.add(e);
        if (
          e.sourceId !== undefined &&
          ['hit', 'fire', 'arrow', 'shell', 'block'].includes(e.kind)
        ) {
          this.actions.set(e.sourceId, { age: 0, kind: e.kind });
          const source = game.units.find((u) => u.id === e.sourceId);
          if (
            source?.kind === 'dino' &&
            e.kind === 'hit' &&
            this.clock - (this.roared.get(source.id) ?? -10) >= 3
          ) {
            this.text(source.x, source.y - 66, 'Grrr !', '#e4e6ae');
            this.roared.set(source.id, this.clock);
          }
        }
        if (e.kind === 'block') {
          const recipient = game.enemies.find((u) => u.id === e.targetId);
          this.text(
            e.tx,
            e.ty - 60,
            recipient ? 'Poc !' : 'Protégé !',
            recipient ? '#dceeb1' : '#b4e4ed',
          );
        }
        if (e.kind === 'honey') {
          this.text(e.x, e.y - 45, 'Miam !', '#ffe3a0');
        }
        if (e.kind === 'gold') {
          this.text(e.x, e.y - 25, '+ pièces', '#ffdf8b');
          this.bursts.push({ x: e.x, y: e.y, age: 0, color: 0xecc96c });
        }
        if (e.kind === 'hit') this.bursts.push({ x: e.tx, y: e.ty - 8, age: 0, color: 0xffdf9c });
      }
    if (this.bursts.length > 24) this.bursts = this.bursts.slice(-24);
    if (this.arrivals.length > 24) this.arrivals = this.arrivals.slice(-24);
    while (this.actions.size > 64) this.actions.delete(this.actions.keys().next().value!);
    this.wave = game.wave;
    this.status = game.status;
    this.hatched = game.hatched;
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
