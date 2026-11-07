import { kinds } from './data.ts';
import type { Kind } from './data.ts';

export type MedicalState = {
  bandages: number;
  phase: 'ready' | 'returning' | 'restocking';
  remaining: number;
};

export function medicalRules(kind: string) {
  if (kind !== 'medic' && kind !== 'nurse') return null;
  return {
    capacity: kind === 'medic' ? 6 : 4,
    interval: kinds[kind].rate,
    restockSeconds: 4,
  };
}

export function ensureMedical(entity: {
  kind: string;
  medical?: MedicalState;
}): MedicalState | null {
  const rules = medicalRules(entity.kind);
  if (!rules) return null;
  if (entity.medical !== undefined)
    return readMedical(entity.medical, entity.kind) ? entity.medical : null;
  entity.medical = { bandages: rules.capacity, phase: 'ready', remaining: 0 };
  return entity.medical;
}

export function consumeBandage(state: MedicalState): boolean {
  if (state.phase !== 'ready' || !Number.isInteger(state.bandages) || state.bandages <= 0)
    return false;
  state.bandages--;
  if (state.bandages === 0) state.phase = 'returning';
  return true;
}

export function tickMedical(
  state: MedicalState,
  dt: number,
  atBase: boolean,
  kind: Kind,
): MedicalState['phase'] {
  const rules = medicalRules(kind);
  if (!rules || !Number.isFinite(dt) || dt <= 0 || !atBase) return state.phase;
  if (state.phase === 'returning') {
    state.phase = 'restocking';
    state.remaining = rules.restockSeconds;
  } else if (state.phase === 'restocking') {
    state.remaining = Math.max(0, state.remaining - dt);
    // The simulation uses 1/30 s steps; absorb only floating point residue.
    if (state.remaining < 1e-9) {
      state.remaining = 0;
      state.bandages = rules.capacity;
      state.phase = 'ready';
    }
  }
  return state.phase;
}

export function readMedical(raw: unknown, kind: string): MedicalState | null {
  const rules = medicalRules(kind);
  if (!rules || !raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const { bandages, phase, remaining } = raw as Record<string, unknown>;
  if (
    typeof bandages !== 'number' ||
    !Number.isInteger(bandages) ||
    bandages < 0 ||
    bandages > rules.capacity ||
    typeof remaining !== 'number' ||
    !Number.isFinite(remaining)
  )
    return null;
  if (
    (phase === 'ready' && bandages > 0 && remaining === 0) ||
    (phase === 'returning' && bandages === 0 && remaining === 0) ||
    (phase === 'restocking' && bandages === 0 && remaining > 0 && remaining <= rules.restockSeconds)
  )
    return { bandages, phase, remaining };
  return null;
}
