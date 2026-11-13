import { capriceById } from './caprices.ts';
import { readMissionRun } from './missions.ts';
import type { Game } from './game.ts';
import { isRecord } from './plainData.ts';

export type CapriceAlbum = { id: string; name: string; completed: string[] };
export type CapriceAlbums = {
  version: 1;
  activeId: string;
  nextId: number;
  /** Owner of the retained expedition, independent of the visible classic game. */
  campProfileId: string | null;
  children: CapriceAlbum[];
};
const validName = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 24 &&
  value.trim().length > 0 &&
  !/[\u0000-\u001f\u007f-\u009f]/u.test(value);
const copy = (state: CapriceAlbums): CapriceAlbums => ({
  ...state,
  children: state.children.map((child) => ({ ...child, completed: [...child.completed] })),
});

export function createCapriceAlbums(): CapriceAlbums {
  return {
    version: 1,
    activeId: 'child-1',
    nextId: 2,
    campProfileId: null,
    children: [{ id: 'child-1', name: 'Mon carnet', completed: [] }],
  };
}

/** Reconstruct bounded plain data before it can enter an atomic family write. */
export function validateCapriceAlbums(value: unknown): CapriceAlbums | null {
  try {
    if (
      !isRecord(value) ||
      value.version !== 1 ||
      !Array.isArray(value.children) ||
      value.children.length < 1 ||
      value.children.length > 8 ||
      typeof value.nextId !== 'number' ||
      !Number.isSafeInteger(value.nextId) ||
      value.nextId < 2
    )
      return null;
    const children: CapriceAlbum[] = [];
    const ids = new Set<string>();
    for (const child of value.children) {
      if (
        !isRecord(child) ||
        typeof child.id !== 'string' ||
        !/^child-[1-9]\d{0,15}$/.test(child.id) ||
        !Number.isSafeInteger(Number(child.id.slice(6))) ||
        Number(child.id.slice(6)) >= value.nextId ||
        ids.has(child.id) ||
        !validName(child.name) ||
        !Array.isArray(child.completed) ||
        child.completed.length > 36
      )
        return null;
      const completed: string[] = [];
      for (const id of child.completed) {
        if (typeof id !== 'string' || !capriceById(id) || completed.includes(id)) return null;
        completed.push(id);
      }
      ids.add(child.id);
      children.push({ id: child.id, name: child.name, completed });
    }
    if (
      typeof value.activeId !== 'string' ||
      !ids.has(value.activeId) ||
      (value.campProfileId !== null &&
        (typeof value.campProfileId !== 'string' || !ids.has(value.campProfileId)))
    )
      return null;
    return {
      version: 1,
      activeId: value.activeId,
      nextId: value.nextId,
      campProfileId: value.campProfileId,
      children,
    };
  } catch {
    return null;
  }
}

/** Memory only; persistence and campaign stars stay in their existing controllers. */
export function createCapriceAlbumsController(initial?: CapriceAlbums) {
  let state = validateCapriceAlbums(initial) ?? createCapriceAlbums();
  const child = (id: string) => state.children.find((entry) => entry.id === id);
  return {
    get state(): CapriceAlbums {
      return copy(state);
    },
    add(name: string): string | null {
      if (!validName(name) || state.children.length >= 8 || state.nextId >= Number.MAX_SAFE_INTEGER)
        return null;
      const id = `child-${state.nextId++}`;
      state.children.push({ id, name, completed: [] });
      state.activeId = id;
      return id;
    },
    select(id: string): boolean {
      if (!child(id)) return false;
      state.activeId = id;
      return true;
    },
    rename(id: string, name: string): boolean {
      const album = child(id);
      if (!album || !validName(name)) return false;
      album.name = name;
      return true;
    },
    beginRun(profileId = state.activeId): boolean {
      if (!child(profileId)) return false;
      state.campProfileId = profileId;
      return true;
    },
    record(game: Game): boolean {
      const run = readMissionRun(game.mission);
      const owner = state.campProfileId && child(state.campProfileId);
      if (
        !owner ||
        !run?.caprice ||
        game.status !== 'won' ||
        game.wave !== game.totalWaves ||
        !(game.base > 0) ||
        game.enemies.length ||
        game.eggs.length ||
        owner.completed.includes(run.caprice)
      )
        return false;
      owner.completed.push(run.caprice);
      return true;
    },
    has(capriceId: string, profileId = state.activeId): boolean {
      return child(profileId)?.completed.includes(capriceId) ?? false;
    },
    replaceState(next: CapriceAlbums): boolean {
      const replacement = validateCapriceAlbums(next);
      if (!replacement) return false;
      state = replacement;
      return true;
    },
  };
}
