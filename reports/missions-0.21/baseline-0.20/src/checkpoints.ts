import { readRewards } from './rewards.ts';
import { freshCampaign, readCampaign, chapterIndex } from './campaignRules.ts';
import { Game } from './game.ts';
import { kinds, TOTAL_WAVES } from './data.ts';
import type { Kind } from './data.ts';

const KEY = 'conquete-serpents:camp:v1';
const LIMIT = 100000;
// A 19px square cannot contain two homes 28px apart; the camp has at most 483 such cells.
const UNIT_LIMIT = 512;
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export function encodeCheckpoint(game: Game): string | null {
  if (game.status !== 'preparing' || game.enemies.length || game.eggs.length) return null;
  const units = game.units.filter((u) => u.hp > 0);
  if (units.length > UNIT_LIMIT) return null;
  const raw = JSON.stringify({
    version: 4,
    campaign: game.campaign,
    rewards: {
      ...game.rewards,
      pending:
        (game.wave === 4 || game.wave === 8) &&
        !game.rewards.choices.some((c) => c.milestone === game.wave)
          ? game.wave
          : game.rewards.pending,
    },
    wave: game.wave,
    gold: game.gold,
    base: game.base,
    rng: game.rng,
    nextId: game.nextId,
    kills: game.kills,
    hatched: game.hatched,
    units: units.map((u) => ({
      id: u.id,
      kind: u.kind,
      x: u.x,
      y: u.y,
      hp: u.hp,
      homeX: u.homeX,
      homeY: u.homeY,
    })),
  });
  return raw.length <= LIMIT ? raw : null;
}
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const number = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const integer = (v: unknown, min: number, max: number): v is number =>
  number(v, min, max) && Number.isInteger(v);
export function decodeCheckpoint(raw: string): Game | null {
  if (typeof raw !== 'string' || raw.length > LIMIT) return null;
  try {
    const d: unknown = JSON.parse(raw);
    if (
      !object(d) ||
      (d.version !== 1 && d.version !== 2 && d.version !== 3 && d.version !== 4) ||
      !integer(d.wave, 0, TOTAL_WAVES - 1) ||
      !integer(d.gold, 0, 10000000) ||
      !number(d.base, 1, 100) ||
      !integer(d.rng, 0, 4294967295) ||
      !integer(d.nextId, 0, 10000000) ||
      !integer(d.kills, 0, 1000000) ||
      !integer(d.hatched, 0, 1000000) ||
      !Array.isArray(d.units) ||
      d.units.length > UNIT_LIMIT
    )
      return null;
    const game = new Game(d.rng),
      ids = new Set<number>();
    game.units = [];
    let heroes = 0;
    for (const u of d.units) {
      if (
        !object(u) ||
        typeof u.kind !== 'string' ||
        !Object.hasOwn(kinds, u.kind) ||
        !integer(u.id, 1, d.nextId) ||
        ids.has(u.id) ||
        !number(u.x, 580, 1080) ||
        !number(u.y, 96, 552) ||
        !number(u.homeY, 96, 552) ||
        (d.version !== 1 && !number(u.homeX, 580, 1080))
      )
        return null;
      const kind = u.kind as Kind,
        max = kinds[kind].hp;
      if (!number(u.hp, 0, max) || u.hp <= 0) return null;
      if (kind === 'hero' && ++heroes > 1) return null;
      ids.add(u.id);
      const home = { x: d.version === 1 ? u.x : (u.homeX as number), y: u.homeY };
      game.units.push({
        id: u.id,
        kind,
        x: u.x,
        y: u.y,
        hp: u.hp,
        maxHp: max,
        homeX: home.x,
        homeY: home.y,
        variant: 'normal',
        broodCool: 10,
        charge: 0,
        guardCool: 0,
        rattleCool: 0,
        confusedFor: 0,
        confusionImmunity: 0,
        cool: 0,
        path: [],
        nav: 0,
        boss: false,
        state: 'idle',
        facing: -1,
        lane: 0,
        stage: 0,
        turnY: null,
        targetId: null,
      });
    }
    if (d.version === 3 || d.version === 4) {
      const rewards = readRewards(d.rewards, d.wave);
      if (!rewards) return null;
      Object.assign(game.rewards, rewards);
    } else if (d.wave === 4 || d.wave === 8) game.rewards.pending = d.wave;
    if (d.version === 4) {
      const campaign = readCampaign(d.campaign, d.wave);
      if (!campaign) return null;
      Object.assign(game.campaign, campaign);
    } else {
      const campaign = freshCampaign();
      for (let i = 0; i < Math.floor(d.wave / 4); i++) campaign.chapterStars[i] = 1;
      campaign.chapterMin[chapterIndex(d.wave + 1)] = d.base;
      Object.assign(game.campaign, campaign);
    }
    game.wave = d.wave;
    game.normalizeCamp();
    game.gold = d.gold;
    game.base = d.base;
    game.rng = d.rng;
    game.nextId = d.nextId;
    game.kills = d.kills;
    game.hatched = d.hatched;
    game.message = d.wave ? 'Camp retrouvé ! Préparez la prochaine vague.' : 'Votre camp est prêt.';
    return game;
  } catch {
    return null;
  }
}
/** Storage failures are local UX failures, never simulation failures. No network involved. */
export function createPersistence(storage?: StoragePort) {
  let disabled = false;
  let last = '',
    status = storage ? 'Sauvegarde locale entre les vagues' : 'Sauvegarde locale indisponible';
  return {
    get status() {
      return status;
    },
    load(): Game | null {
      if (!storage) return null;
      try {
        const raw = storage.getItem(KEY);
        if (!raw) return null;
        const game = decodeCheckpoint(raw);
        if (game) {
          last = raw;
          status = 'Camp sauvegardé sur cet appareil';
        } else status = 'Ancienne sauvegarde incompatible : nouvelle aventure';
        return game;
      } catch {
        disabled = true;
        status = 'Sauvegarde locale indisponible';
        return null;
      }
    },
    sync(game: Game) {
      if (!storage || disabled) return;
      const raw = encodeCheckpoint(game);
      if (!raw || raw === last) return;
      try {
        storage.setItem(KEY, raw);
        last = raw;
        status = 'Camp sauvegardé sur cet appareil';
      } catch {
        disabled = true;
        status = 'Sauvegarde locale indisponible';
      }
    },
  };
}
