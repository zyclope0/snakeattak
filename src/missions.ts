import { waveStats } from './data.ts';
import { variantFor, waveBriefing } from './waves.ts';
import type { EnemyKind } from './enemies.ts';
import { flyingVariant } from './flying.ts';

export type MissionId =
  'refuge' | 'trois-ponts' | 'course' | 'coquilles' | 'sonnette' | 'carrefour';
export type MissionRun = Readonly<{
  missionId: MissionId;
  seed: number;
  layout: 0 | 1 | 2;
  assault: 'balanced' | 'rush' | 'escort';
  nest: 'spread' | 'clustered';
}>;
export type MissionDefinition = Readonly<{
  id: MissionId;
  name: string;
  objective: string;
  waves: readonly number[];
  budget: number;
  unlockRank: number;
}>;
export const MISSIONS: readonly MissionDefinition[] = Object.freeze(
  [
    {
      id: 'refuge',
      name: 'Le refuge',
      objective: 'Protégez le cristal pendant trois vagues.',
      waves: [1, 2, 3],
      budget: 450,
      unlockRank: 3,
    },
    {
      id: 'trois-ponts',
      name: 'Les trois ponts',
      objective: 'Gardez les trois passages ouverts à vos défenseurs.',
      waves: [2, 3, 4],
      budget: 550,
      unlockRank: 4,
    },
    {
      id: 'course',
      name: 'La course des vifs',
      objective: 'Interceptez les rapides avant le refuge.',
      waves: [3, 4, 5],
      budget: 700,
      unlockRank: 5,
    },
    {
      id: 'coquilles',
      name: 'Les premières coquilles',
      objective: 'Résistez aux éclosions et aux premières escortes.',
      waves: [4, 5, 6],
      budget: 850,
      unlockRank: 6,
    },
    {
      id: 'sonnette',
      name: 'Dragon et sonnette',
      objective: 'Surmontez les hésitations et protégez vos soutiens.',
      waves: [5, 6, 7],
      budget: 1050,
      unlockRank: 7,
    },
    {
      id: 'carrefour',
      name: 'Le carrefour des fougères',
      objective: 'Tenez quatre vagues aux deux jonctions.',
      waves: [5, 6, 7, 8],
      budget: 1300,
      unlockRank: 8,
    },
  ].map((d) => Object.freeze({ ...d, waves: Object.freeze(d.waves) })) as MissionDefinition[],
);

export function missionById(id: unknown): MissionDefinition | null {
  return MISSIONS.find((mission) => mission.id === id) ?? null;
}
const assaults = ['balanced', 'rush', 'escort'] as const;
const nests = ['spread', 'clustered'] as const;
/** Canonical copy: callers cannot mutate an active expedition through their input object. */
export function readMissionRun(raw: unknown): MissionRun | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const d = raw as Record<string, unknown>;
  if (
    !missionById(d.missionId) ||
    typeof d.seed !== 'number' ||
    !Number.isInteger(d.seed) ||
    d.seed < 0 ||
    d.seed > 0xffffffff ||
    (d.layout !== 0 && d.layout !== 1 && d.layout !== 2) ||
    !assaults.includes(d.assault as MissionRun['assault']) ||
    !nests.includes(d.nest as MissionRun['nest'])
  )
    return null;
  return Object.freeze({
    missionId: d.missionId as MissionId,
    seed: d.seed,
    layout: d.layout,
    assault: d.assault as MissionRun['assault'],
    nest: d.nest as MissionRun['nest'],
  });
}
export function createMissionRun(
  id: MissionId,
  seed: number,
  previous?: MissionRun | null,
): MissionRun {
  if (!missionById(id) || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw new RangeError('Expédition invalide');
  // Eighteen bounded configurations. Incrementing the slot does not change the retry seed.
  let slot = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  slot %= 18;
  const prior = readMissionRun(previous);
  const configAt = (index: number) => ({
    missionId: id,
    seed,
    layout: (index % 3) as 0 | 1 | 2,
    assault: assaults[Math.floor(index / 3) % 3],
    nest: nests[Math.floor(index / 9)],
  });
  let config = configAt(slot);
  // A visible new departure always changes the terrain. Retry and saved runs
  // are restored through readMissionRun, without passing through this draw.
  if (prior && config.layout === prior.layout) config = configAt((slot + 1) % 18);
  return Object.freeze(config);
}
export type MissionWave = Readonly<{
  rank: number;
  stats: Readonly<ReturnType<typeof waveStats>>;
  composition: readonly EnemyKind[];
  cadence: readonly number[];
  eggs: readonly Readonly<{ lane: 0 | 1 | 2; x: number; hatchIn: number; count: number }>[];
  pattern: Readonly<{ title: string; tip: string }>;
}>;
/** Local waves are one-based. No boss or species from a later rank can enter this plan. */
export function missionWave(
  run: MissionRun,
  local: number,
  tacticalRulesEnabled = true,
): MissionWave {
  const valid = readMissionRun(run);
  const definition = valid && missionById(valid.missionId);
  if (!definition || !Number.isInteger(local) || local < 1 || local > definition.waves.length)
    throw new RangeError('Vague de mission invalide');
  const rank = definition.waves[local - 1];
  const stats = Object.freeze(waveStats(rank));
  const composition = Array.from({ length: stats.count }, (_, index): EnemyKind => {
    const normal = variantFor(rank, stats.count - index);
    let base = normal;
    if (
      run.assault === 'rush' &&
      rank >= 3 &&
      index % 3 !== 2 &&
      (normal === 'normal' || normal === 'runner' || normal === 'armored')
    )
      base = 'runner';
    else if (run.assault === 'escort' && rank >= 5 && index % 4 === 0)
      base = rank >= 6 ? 'umbrella' : 'armored';
    else if (run.assault === 'escort' && rank >= 7 && index % 4 === 1) base = 'spitter';
    return tacticalRulesEnabled ? flyingVariant(base, rank, stats.count - index) : base;
  });
  const cadence =
    run.assault === 'rush' ? [0.4, 0.4, 2] : run.assault === 'escort' ? [0.65, 0.65, 1.55] : [0.95];
  const nestLane = ((run.seed + local) % 3) as 0 | 1 | 2;
  const incubationJitter = (index: number) =>
    (((Math.imul(
      (run.seed ^ Math.imul(local, 2654435761) ^ Math.imul(index + 1, 2246822519)) >>> 0,
      1664525,
    ) +
      1013904223) >>>
      0) /
      4294967296) *
    3;
  const eggs = Array.from({ length: rank >= 8 ? 3 : rank >= 4 ? 2 : 1 }, (_, index) =>
    Object.freeze({
      lane: (run.nest === 'clustered' ? nestLane : (nestLane + index) % 3) as 0 | 1 | 2,
      x: 252 + index * (run.nest === 'clustered' ? 24 : 48),
      hatchIn:
        (run.nest === 'clustered' ? 10 + index * 0.8 : 7 + index * 6) + incubationJitter(index),
      count: 2,
    }),
  );
  const assaultTip =
    run.assault === 'rush'
      ? 'Petits groupes rapides : gardez des renforts mobiles.'
      : run.assault === 'escort'
        ? 'Les escortes arrivent ensemble : combinez contact et soutien.'
        : 'Les arrivées sont régulières : répartissez les gardiens.';
  const pattern = Object.freeze({
    title: waveBriefing(rank).title,
    tip: `${assaultTip} ${run.nest === 'clustered' ? 'La couvée est concentrée sur une voie.' : 'Les éclosions sont réparties et décalées.'}${tacticalRulesEnabled && rank >= 6 ? ' Des serpents volants arrivent : archers, dragons et tanks peuvent les toucher.' : ''}`,
  });
  return Object.freeze({
    rank,
    stats,
    composition: Object.freeze(composition),
    cadence: Object.freeze(cadence),
    eggs: Object.freeze(eggs),
    pattern,
  });
}
