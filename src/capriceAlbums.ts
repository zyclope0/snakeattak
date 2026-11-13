import { capriceById } from './caprices.ts';
import { readMissionRun } from './missions.ts';
import type { Game } from './game.ts';
import { hasControlCharacter, isArrayOfLength, isIntegerIn, isRecord } from './plainData.ts';

export type CapriceAlbum = { id: string; name: string; completed: string[] };
export type CapriceAlbums = {
  version: 1;
  activeId: string;
  nextId: number;
  /** Owner of the retained expedition, independent of the visible classic game. */
  campProfileId: string | null;
  children: CapriceAlbum[];
};
const MAX_CHILDREN = 8;
// The 36 challenges of the catalogue: an album cannot hold more stickers.
const MAX_COMPLETED = 36;
const validName = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 24 &&
  value.trim().length > 0 &&
  !hasControlCharacter(value);
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

/** `child-N`, where N is a number that `nextId` has already handed out. */
function isChildId(id: unknown, nextId: number): id is string {
  if (typeof id !== 'string' || !/^child-[1-9]\d{0,15}$/.test(id)) return false;
  const number = Number(id.slice(6));
  return Number.isSafeInteger(number) && number < nextId;
}

/** The challenges won by one child: known ones, each of them once. */
function readCompleted(saved: unknown): string[] | null {
  if (!isArrayOfLength(saved, 0, MAX_COMPLETED)) return null;
  const completed: string[] = [];
  for (const id of saved) {
    if (typeof id !== 'string' || !capriceById(id) || completed.includes(id)) return null;
    completed.push(id);
  }
  return completed;
}

/** One album; `taken` holds the identifiers already read: two children never share one. */
function readChild(
  saved: unknown,
  nextId: number,
  taken: ReadonlySet<string>,
): CapriceAlbum | null {
  if (
    !isRecord(saved) ||
    !isChildId(saved.id, nextId) ||
    taken.has(saved.id) ||
    !validName(saved.name)
  )
    return null;
  const completed = readCompleted(saved.completed);
  return completed && { id: saved.id, name: saved.name, completed };
}

function readAlbums(value: unknown): CapriceAlbums | null {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !isArrayOfLength(value.children, 1, MAX_CHILDREN) ||
    !isIntegerIn(value.nextId, 2, Number.MAX_SAFE_INTEGER)
  )
    return null;
  const children: CapriceAlbum[] = [];
  const ids = new Set<string>();
  for (const saved of value.children) {
    const child = readChild(saved, value.nextId, ids);
    if (!child) return null;
    ids.add(child.id);
    children.push(child);
  }
  const isChild = (id: unknown): id is string => typeof id === 'string' && ids.has(id);
  if (!isChild(value.activeId) || (value.campProfileId !== null && !isChild(value.campProfileId)))
    return null;
  return {
    version: 1,
    activeId: value.activeId,
    nextId: value.nextId,
    campProfileId: value.campProfileId,
    children,
  };
}

/** Reconstruct bounded plain data before it can enter an atomic family write. */
export function validateCapriceAlbums(value: unknown): CapriceAlbums | null {
  try {
    return readAlbums(value);
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
      if (
        !validName(name) ||
        state.children.length >= MAX_CHILDREN ||
        state.nextId >= Number.MAX_SAFE_INTEGER
      )
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
