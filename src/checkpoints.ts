import { readRewards } from './rewards.ts';
import { freshCampaign, readCampaign, chapterIndex } from './campaignRules.ts';
import { Game } from './game.ts';
import { kinds, TOTAL_WAVES } from './data.ts';
import type { Kind } from './data.ts';
import { missionById, readMissionRun } from './missions.ts';
import { ensureMedical, medicalRules, readMedical } from './healing.ts';

const KEY = 'conquete-serpents:camp:v1';
const LIMIT = 100000;
// A 19px square cannot contain two homes 28px apart; the camp has at most 483 such cells.
const UNIT_LIMIT = 512;
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export function encodeCheckpoint(game: Game): string | null {
  if (
    game.status !== 'preparing' ||
    game.enemies.length ||
    game.eggs.length ||
    game.wave >= game.totalWaves
  )
    return null;
  const units = game.units.filter((u) => u.hp > 0);
  if (units.length > UNIT_LIMIT) return null;
  // Keep the frozen classic witness byte-compatible with the pre-tactical camp.
  if (game.mission?.rules === 2 && !game.tuning.tacticalRulesEnabled) return null;
  const version = game.mission?.caprice
    ? 8
    : game.mission?.rules === 2
      ? 7
      : game.tuning.tacticalRulesEnabled === false
        ? game.mission
          ? 5
          : 4
        : 6;
  const modern = version === 6 || version === 7 || version === 8;
  const savedUnits = [];
  for (const u of units) {
    const rules = medicalRules(u.kind);
    const medical = rules ? ensureMedical({ kind: u.kind, medical: u.medical }) : null;
    if (
      modern &&
      ((rules && (!medical || !Number.isFinite(u.cool))) || (!rules && u.medical !== undefined))
    )
      return null;
    savedUnits.push({
      id: u.id,
      kind: u.kind,
      x: u.x,
      y: u.y,
      hp: u.hp,
      homeX: u.homeX,
      homeY: u.homeY,
      ...(modern && medical && rules
        ? { medical, medicalCool: Math.max(0, Math.min(rules.interval, u.cool)) }
        : {}),
    });
  }
  const raw = JSON.stringify({
    version,
    ...(modern && game.initialSeed !== null ? { initialSeed: game.initialSeed } : {}),
    ...(game.mission
      ? { mission: game.mission, missionMinBase: Math.min(game.missionMinBase, game.base) }
      : {}),
    ...(version === 8 ? { capriceKindsChosen: game.capriceKindsChosen } : {}),
    campaign: game.campaign,
    rewards: {
      ...game.rewards,
      pending:
        !game.mission &&
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
    units: savedUnits,
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
      (d.version !== 1 &&
        d.version !== 2 &&
        d.version !== 3 &&
        d.version !== 4 &&
        d.version !== 5 &&
        d.version !== 6 &&
        d.version !== 7 &&
        d.version !== 8) ||
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
    const modern = d.version === 6 || d.version === 7 || d.version === 8;
    const hasMission = d.version === 5 || (modern && Object.hasOwn(d, 'mission'));
    const mission = hasMission ? readMissionRun(d.mission) : null;
    if (
      d.version === 8
        ? !mission?.caprice
        : d.version === 7
          ? mission?.rules !== 2
          : mission?.rules !== undefined
    )
      return null;
    if (
      hasMission &&
      (!mission ||
        d.wave >= missionById(mission.missionId)!.waves.length ||
        !number(d.missionMinBase, 1, d.base))
    )
      return null;
    const game = new Game(d.rng, undefined, mission ?? undefined),
      ids = new Set<number>();
    if (d.version === 8) {
      if (
        !Array.isArray(d.capriceKindsChosen) ||
        d.capriceKindsChosen.length > game.caprice.kinds ||
        d.capriceKindsChosen.some(
          (kind) => typeof kind !== 'string' || !Object.hasOwn(kinds, kind),
        ) ||
        (d.capriceKindsChosen.length && !game.chooseCapriceKinds(d.capriceKindsChosen as Kind[]))
      )
        return null;
    }
    if (
      modern &&
      Object.hasOwn(d, 'initialSeed') &&
      (!integer(d.initialSeed, 0, 0xffffffff) || (mission && d.initialSeed !== mission.seed))
    )
      return null;
    game.initialSeed =
      mission?.seed ??
      (modern && Object.hasOwn(d, 'initialSeed') ? (d.initialSeed as number) : null);
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
      const rules = medicalRules(kind);
      const medical = rules
        ? modern
          ? readMedical(u.medical, kind)
          : ensureMedical({ kind })
        : null;
      if (
        modern &&
        ((rules && (!medical || !number(u.medicalCool, 0, rules.interval))) ||
          (!rules && (Object.hasOwn(u, 'medical') || Object.hasOwn(u, 'medicalCool'))))
      )
        return null;
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
        cool: modern && rules ? (u.medicalCool as number) : 0,
        ...(medical ? { medical } : {}),
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
    if (d.version === 3 || d.version === 4 || d.version === 5 || modern) {
      const rewards = readRewards(d.rewards, mission ? 0 : d.wave);
      if (
        !rewards ||
        (mission && (rewards.pending !== null || rewards.choices.length || rewards.ward))
      )
        return null;
      Object.assign(game.rewards, rewards);
    } else if (d.wave === 4 || d.wave === 8) game.rewards.pending = d.wave;
    if (d.version === 4 || d.version === 5 || modern) {
      const campaign = readCampaign(d.campaign, mission ? 12 : d.wave);
      if (
        !campaign ||
        (mission &&
          (campaign.chapterStars.some((stars) => stars !== 0) ||
            campaign.chapterMin.some((hp) => hp !== 100) ||
            (campaign.training !== 'none' && missionById(mission!.missionId)!.unlockRank < 4)))
      )
        return null;
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
    if (mission) game.missionMinBase = d.missionMinBase as number;
    game.rng = d.rng;
    game.nextId = d.nextId;
    game.kills = d.kills;
    game.hatched = d.hatched;
    game.message = d.wave ? 'Camp retrouvé ! Prépare la prochaine vague.' : 'Ton camp est prêt.';
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
