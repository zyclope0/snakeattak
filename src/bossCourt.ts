import { BOSS_HEAD_IDS, type BossState } from './boss.ts';

export type CourtState = {
  bossId: number;
  role: 'guard' | 'healer';
  charges: number;
  cool: number;
};

/** These three escorts replace ordinary wave slots; the king is the fourth slot. */
export const BOSS_COURT = [
  { role: 'guard', variant: 'armored', hpFactor: 0.85, offsetX: 25, offsetY: -28 },
  { role: 'guard', variant: 'armored', hpFactor: 0.85, offsetX: 25, offsetY: 28 },
  { role: 'healer', variant: 'courtHealer', hpFactor: 0.65, offsetX: -42, offsetY: 0 },
] as const;

/** The king and his court take the last four places of the wave that brings them. */
export const COURT_SLOTS = 4;
export const COURT_HEAL = Object.freeze({ charges: 6, amount: 35, interval: 3, range: 110 });

export type CourtHealTarget = {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  variant?: string;
  bossState?: BossState;
  court?: CourtState;
};

function missingHealth(target: CourtHealTarget, court: CourtState): number {
  if (target.hp <= 0) return 0;
  if (target.id === court.bossId && target.bossState?.heads) {
    const heads = target.bossState.heads;
    return BOSS_HEAD_IDS.reduce((sum, id) => {
      const h = heads[id];
      return sum + (h.hp > 0 ? h.maxHp - h.hp : 0);
    }, 0);
  }
  if (
    target.court?.role === 'guard' &&
    target.court.bossId === court.bossId &&
    target.variant === 'armored'
  )
    return Math.max(0, target.maxHp - target.hp);
  return 0;
}

/** Chooses one real heal and consumes its bandage; Game applies the returned HP. */
export function tickCourtHeal<T extends CourtHealTarget>(
  court: CourtState,
  dt: number,
  origin: { x: number; y: number },
  targets: readonly T[],
): { target: T; amount: number } | undefined {
  if (court.role !== 'healer') return;
  if (!Number.isFinite(dt) || dt < 0) return;
  court.cool = Math.max(0, court.cool - dt);
  if (court.charges <= 0 || court.cool > 1e-9) return;
  const eligible = targets
    .filter(
      (target) =>
        Math.hypot(target.x - origin.x, target.y - origin.y) <= COURT_HEAL.range &&
        missingHealth(target, court) > 0,
    )
    .sort(
      (a, b) =>
        (a.id === court.bossId ? 0 : 1) - (b.id === court.bossId ? 0 : 1) ||
        a.hp / a.maxHp - b.hp / b.maxHp ||
        a.id - b.id,
    );
  const target = eligible[0];
  if (!target) return;
  court.charges--;
  court.cool = COURT_HEAL.interval;
  return { target, amount: Math.min(COURT_HEAL.amount, missingHealth(target, court)) };
}
