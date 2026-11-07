import { kinds } from '../../src/data.ts';
import type { Kind } from '../../src/data.ts';
import { LANES, laneDefense } from '../../src/ai.ts';
import type { Game } from '../../src/game.ts';

export const PROFILES = [
  'mixed',
  'melee',
  'ranged',
  'heavy',
  'dinosaurs',
  'mutants',
  'casual',
  'clustered',
] as const;
export type Profile = (typeof PROFILES)[number];
export type Action = {
  kind: 'recruit' | 'repair' | 'honey';
  time: number;
  wave: number;
  phase: string;
  cost: number;
  goldBefore: number;
  goldAfter: number;
  unit?: Kind;
  x?: number;
  y?: number;
  lane?: number;
  flavor?: 'lure' | 'sticky';
};
export type Bot = {
  profile: Profile;
  random: () => number;
  cursor: number;
  honeyAt: number;
  interval: number;
  honeyMode: 'none' | 'alternating' | 'profile';
};
export function random(seed: number) {
  let state = seed >>> 0;
  return () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
}
export function makeBot(seed: number, profile: Profile, wave: number): Bot {
  if (!PROFILES.includes(profile)) throw new Error(`Unknown profile: ${profile}`);
  let hash = (seed ^ Math.imul(wave, 0x9e3779b9)) >>> 0;
  for (const char of profile) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  const rng = random(hash);
  let policyHash = seed >>> 0;
  for (const char of profile)
    policyHash = Math.imul(policyHash ^ char.charCodeAt(0), 16777619) >>> 0;
  const honeyMode =
    policyHash % 4 === 0 ? 'none' : policyHash % 4 === 1 ? 'alternating' : 'profile';
  return {
    profile,
    honeyMode,
    random: rng,
    cursor: 0,
    honeyAt: profile === 'casual' ? 12 + rng() * 12 : 7 + rng() * 2,
    interval: profile === 'casual' ? 18 : 6,
  };
}
const pools: Record<Exclude<Profile, 'casual'>, Kind[]> = {
  mixed: [
    'archer',
    'shield',
    'ninja',
    'dragon',
    'cavalry',
    'dino',
    'twohead',
    'tank',
    'knight',
    'raptor',
    'mutantStretch',
  ],
  melee: ['ninja', 'bat', 'shield', 'cavalry', 'twohead', 'knight', 'club'],
  ranged: ['archer', 'archer', 'dragon', 'tank', 'dragon'],
  heavy: ['shield', 'knight', 'twohead', 'tank', 'dino', 'stegosaurus'],
  dinosaurs: ['raptor', 'raptor', 'triceratops', 'dino', 'stegosaurus', 'trex'],
  mutants: ['mutantRock', 'mutantStretch', 'mutantRock', 'mutantStretch'],
  clustered: ['archer', 'dragon', 'tank', 'shield', 'dragon', 'archer'],
};
function place(game: Game, kind: Kind, bot: Bot): { x: number; y: number } | null {
  if (bot.profile === 'casual') {
    for (let i = 0; i < 48; i++) {
      const x = 612 + Math.floor(bot.random() * 16) * 24;
      const y = 132 + Math.floor(bot.random() * 17) * 24;
      if (game.recruit(kind, x, y)) return { x, y };
    }
    return null;
  }
  const scores = laneDefense(game.units);
  const lanes =
    bot.profile === 'clustered'
      ? [1, 0, 2]
      : [0, 1, 2].sort((a, b) => scores[a] - scores[b] || a - b);
  const rear = kinds[kind].range >= 100;
  const xs = rear
    ? [948, 900, 852, 804, 756, 708, 660, 612]
    : [660, 708, 756, 804, 852, 900, 948, 612];
  for (const lane of lanes)
    for (const offset of [0, -48, 48, -24, 24, -72, 72])
      for (const x of xs) {
        const y = LANES[lane] + offset;
        if (game.recruit(kind, x, y)) return { x, y };
      }
  return null;
}
export function purchase(game: Game, bot: Bot, wave: number): Action[] {
  const actions: Action[] = [];
  const add = (kind: Action['kind'], before: number, extra: Partial<Action> = {}) =>
    actions.push({
      kind,
      time: game.time,
      wave,
      phase: game.status,
      cost: before - game.gold,
      goldBefore: before,
      goldAfter: game.gold,
      ...extra,
    });
  if (game.base <= (bot.profile === 'casual' ? 45 : 65)) {
    const before = game.gold;
    if (game.repair()) add('repair', before);
  }
  const buy = (kind: Kind) => {
    if (!game.isUnlocked(kind) || game.gold < kinds[kind].cost) return false;
    const before = game.gold;
    const point = place(game, kind, bot);
    if (!point) return false;
    add('recruit', before, { unit: kind, ...point });
    return true;
  };
  const combat = game.status === 'fighting';
  const max =
    bot.profile === 'casual' ? (combat ? 1 : 1 + Math.floor(bot.random() * 3)) : combat ? 2 : 8;
  if (bot.profile !== 'casual') {
    const healers = game.units.filter((u) => u.kind === 'medic' || u.kind === 'nurse').length;
    const desired =
      bot.profile === 'melee'
        ? Math.min(3, 1 + Math.floor(wave / 4))
        : Math.min(2, 1 + Math.floor(wave / 5));
    if (healers < desired)
      buy(
        wave === 1 && ['dinosaurs', 'mutants', 'heavy'].includes(bot.profile) ? 'nurse' : 'medic',
      );
  }
  for (let i = 0; i < max; i++) {
    if (bot.profile === 'casual') {
      const options = (Object.keys(kinds) as Kind[]).filter(
        (k) => k !== 'hero' && game.isUnlocked(k) && game.gold >= kinds[k].cost,
      );
      if (!options.length || !buy(options[Math.floor(bot.random() * options.length)])) break;
      continue;
    }
    let pool = pools[bot.profile].filter((k) => game.isUnlocked(k));
    if (!pool.length) pool = ['club'];
    const wanted = pool[(wave - 1 + bot.cursor) % pool.length];
    // Keep the intended purchase until it is affordable, including between combat decisions.
    if (!buy(wanted)) break;
    bot.cursor++;
  }
  return actions;
}
export function honey(game: Game, bot: Bot, wave: number): Action[] {
  if (bot.honeyMode === 'none') return [];
  const scores = laneDefense(game.units);
  const profileFlavor =
    ['heavy', 'dinosaurs', 'mutants'].includes(bot.profile) ||
    (bot.profile === 'mixed' && wave % 2 === 0)
      ? 'sticky'
      : 'lure';
  const flavor =
    bot.honeyMode === 'alternating' ? (wave % 2 === 0 ? 'sticky' : 'lure') : profileFlavor;
  const lane =
    bot.profile === 'casual'
      ? Math.floor(bot.random() * 3)
      : scores.indexOf(flavor === 'sticky' ? Math.min(...scores) : Math.max(...scores));
  const before = game.gold;
  return game.offerFeast(lane, flavor)
    ? [
        {
          kind: 'honey',
          time: game.time,
          wave,
          phase: game.status,
          cost: before - game.gold,
          goldBefore: before,
          goldAfter: game.gold,
          lane,
          flavor,
        },
      ]
    : [];
}
