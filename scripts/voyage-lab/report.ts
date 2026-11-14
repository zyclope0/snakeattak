// Comptes et affichage du laboratoire du voyage. Aucun calcul de jeu ici : seulement des
// moyennes sur les voyages déjà joués.
import type { VoyageTuning } from '../../src/voyageTuning.ts';
import type { StageResult } from './players.ts';

export type StageRow = StageResult & {
  mission: string;
  caprice: string | null;
  setup: string;
  card: string | null;
};
export type VoyageRow = {
  seed: number;
  code: string;
  profile: string;
  policy: string;
  stages: StageRow[];
  /** Étapes réussies avant la première défaite : 5 pour un voyage terminé. */
  won: number;
};
type Meta = {
  profiles: string[];
  policies: string[];
  seeds: number;
  table: string;
  tuning: VoyageTuning;
};
type StageStats = {
  played: number;
  winRate: number;
  /** Cristal à la fin et au plus bas, en moyenne sur les étapes gagnées. */
  base: number;
  minBase: number;
  /** Secondes de combat, en moyenne sur les étapes gagnées. */
  seconds: number;
};
type VoyageStats = {
  voyages: number;
  finishedRate: number;
  /** Part des voyages qui s'arrêtent à chaque étape. */
  fallRates: number[];
  meanWon: number;
  /** Minutes de combat d'un voyage terminé. */
  finishedMinutes: number;
  stages: StageStats[];
};
type CellStats = { stage: number; mission: string; caprice: string; rates: Record<string, string> };
type SeedStats = { seed: number; code: string; route: string; won: Record<string, number> };
export type Report = {
  meta: Meta;
  /** Par joueur, puis par façon de remplir le sac. */
  results: Record<string, Record<string, VoyageStats>>;
  /** Réussite de chaque mission et caprice à chaque étape, avec le premier sac de la liste. */
  cells: CellStats[];
  extremes: { easiest: SeedStats[]; hardest: SeedStats[]; neverByExpert: SeedStats[] };
};

const STAGES = 5;
const mean = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : NaN;
const rate = (list: unknown[], total: number) => (total ? list.length / total : NaN);

function stageStats(voyages: VoyageRow[], index: number): StageStats {
  const rows = voyages.map((voyage) => voyage.stages[index]);
  const wins = rows.filter((row) => row.status === 'won');
  return {
    played: rows.length,
    winRate: rate(wins, rows.length),
    base: mean(wins.map((row) => row.base)),
    minBase: mean(wins.map((row) => row.minBase)),
    seconds: mean(wins.map((row) => row.seconds)),
  };
}

function voyageStats(voyages: VoyageRow[]): VoyageStats {
  const finished = voyages.filter((voyage) => voyage.won === STAGES);
  const fightSeconds = (voyage: VoyageRow) =>
    voyage.stages.reduce((sum, stage) => sum + stage.seconds, 0);
  return {
    voyages: voyages.length,
    finishedRate: rate(finished, voyages.length),
    fallRates: Array.from({ length: STAGES }, (_, index) =>
      rate(
        voyages.filter((voyage) => voyage.won === index),
        voyages.length,
      ),
    ),
    meanWon: mean(voyages.map((voyage) => voyage.won)),
    finishedMinutes: mean(finished.map(fightSeconds)) / 60,
    stages: Array.from({ length: STAGES }, (_, index) => stageStats(voyages, index)),
  };
}

/** Une ligne par étape, mission et caprice rencontrés : « 12/14 » par joueur. */
function cellStats(voyages: VoyageRow[], profiles: string[]): CellStats[] {
  const cells = new Map<string, CellStats & { counts: Record<string, [number, number]> }>();
  for (const voyage of voyages)
    voyage.stages.forEach((row, stage) => {
      const caprice = row.caprice ?? '—';
      const key = `${stage}|${row.mission}|${caprice}`;
      const cell = cells.get(key) ?? {
        stage: stage + 1,
        mission: row.mission,
        caprice,
        rates: {},
        counts: {},
      };
      const count = (cell.counts[voyage.profile] ??= [0, 0]);
      count[0] += row.status === 'won' ? 1 : 0;
      count[1]++;
      cells.set(key, cell);
    });
  return [...cells.values()]
    .sort(
      (a, b) =>
        a.stage - b.stage ||
        a.mission.localeCompare(b.mission) ||
        a.caprice.localeCompare(b.caprice),
    )
    .map(({ counts, ...cell }) => ({
      ...cell,
      rates: Object.fromEntries(
        profiles.map((profile) => [profile, (counts[profile] ?? [0, 0]).join('/')]),
      ),
    }));
}

/** Les graines de la plus dure à la plus facile : étapes réussies, puis cristal restant. */
function rankSeeds(voyages: VoyageRow[], profiles: string[]) {
  const seeds = new Map<number, SeedStats & { score: number; crystal: number }>();
  for (const voyage of voyages) {
    const entry = seeds.get(voyage.seed) ?? {
      seed: voyage.seed,
      code: voyage.code,
      route: voyage.stages.map((row) => row.mission + (row.caprice ? '*' : '')).join(' > '),
      won: {},
      score: 0,
      crystal: 0,
    };
    entry.won[voyage.profile] = voyage.won;
    entry.score += voyage.won;
    entry.crystal += voyage.stages.slice(0, voyage.won).reduce((sum, row) => sum + row.minBase, 0);
    seeds.set(voyage.seed, entry);
  }
  const ranked = [...seeds.values()].sort(
    (a, b) => a.score - b.score || a.crystal - b.crystal || a.seed - b.seed,
  );
  const plain = ({ seed, code, route, won }: SeedStats): SeedStats => ({ seed, code, route, won });
  return {
    hardest: ranked.slice(0, 3).map(plain),
    easiest: ranked.slice(-3).reverse().map(plain),
    neverByExpert: profiles.includes('expert')
      ? ranked.filter((entry) => entry.won.expert < STAGES).map(plain)
      : [],
  };
}

export function summarize(voyages: VoyageRow[], meta: Meta): Report {
  const results: Report['results'] = {};
  for (const profile of meta.profiles) {
    results[profile] = {};
    for (const policy of meta.policies)
      results[profile][policy] = voyageStats(
        voyages.filter((voyage) => voyage.profile === profile && voyage.policy === policy),
      );
  }
  const reference = voyages.filter((voyage) => voyage.policy === meta.policies[0]);
  return {
    meta,
    results,
    cells: cellStats(reference, meta.profiles),
    extremes: rankSeeds(reference, meta.profiles),
  };
}

const percent = (value: number) =>
  Number.isNaN(value) ? '  — ' : `${String(Math.round(value * 100)).padStart(3)} %`;
const whole = (value: number) =>
  Number.isNaN(value) ? '  —' : String(Math.round(value)).padStart(3);

function printVoyages(report: Report) {
  console.log('\n1. Voyages terminés, et étape où le voyage s’arrête');
  console.log(
    'joueur   sac                    terminés   tombe à 1     2     3     4     5   étapes  minutes',
  );
  for (const [profile, byPolicy] of Object.entries(report.results))
    for (const [policy, stats] of Object.entries(byPolicy))
      console.log(
        `${profile.padEnd(8)} ${policy.padEnd(22)} ${percent(stats.finishedRate)}        ${stats.fallRates.map(percent).join(' ')}    ${stats.meanWon.toFixed(1)}    ${Number.isNaN(stats.finishedMinutes) ? '—' : stats.finishedMinutes.toFixed(1)}`,
      );
  console.log(
    '« étapes » : étapes réussies en moyenne. « minutes » : combats d’un voyage terminé, à vitesse normale, sans le temps de préparation.',
  );
}

function printStages(report: Report) {
  const policy = report.meta.policies[0];
  console.log(
    `\n2. Chaque étape, jouée par toutes les graines (sac : ${policy}) : réussite, cristal restant / au plus bas (étapes gagnées), secondes de combat`,
  );
  for (const [profile, byPolicy] of Object.entries(report.results))
    console.log(
      `${profile.padEnd(8)} ${byPolicy[policy].stages
        .map(
          (stage) =>
            `${percent(stage.winRate)} ${whole(stage.base)}/${whole(stage.minBase)} ${whole(stage.seconds)} s`,
        )
        .join('  |  ')}`,
    );
}

function printCells(report: Report) {
  console.log(
    `\n3. Réussite par étape, mission et caprice (sac : ${report.meta.policies[0]}) : gagnées/jouées`,
  );
  console.log(
    `étape mission      caprice                      ${report.meta.profiles.map((profile) => profile.padEnd(9)).join('')}`,
  );
  for (const cell of report.cells)
    console.log(
      `${String(cell.stage).padEnd(5)} ${cell.mission.padEnd(12)} ${cell.caprice.padEnd(28)} ${report.meta.profiles.map((profile) => cell.rates[profile].padEnd(9)).join('')}`,
    );
}

function printBags(report: Report) {
  console.log('\n4. Effet du sac : réussite de chaque étape selon ce que le sac contient');
  for (const [profile, byPolicy] of Object.entries(report.results))
    for (const [policy, stats] of Object.entries(byPolicy))
      console.log(
        `${profile.padEnd(8)} ${policy.padEnd(22)} ${stats.stages.map((stage) => percent(stage.winRate)).join(' ')}   voyage ${percent(stats.finishedRate)}`,
      );
}

function printExtremes(report: Report) {
  const line = (entry: SeedStats) =>
    `  ${entry.code}  ${entry.route}  ${Object.entries(entry.won)
      .map(([profile, won]) => `${profile} ${won}/5`)
      .join(', ')}`;
  console.log(`\n5. Graines extrêmes (sac : ${report.meta.policies[0]}) ; * = caprice`);
  console.log('Les plus dures :');
  report.extremes.hardest.forEach((entry) => console.log(line(entry)));
  console.log('Les plus faciles :');
  report.extremes.easiest.forEach((entry) => console.log(line(entry)));
  const never = report.extremes.neverByExpert;
  console.log(`Graines que l’expert ne termine pas : ${never.length} sur ${report.meta.seeds}`);
  never.slice(0, 12).forEach((entry) => console.log(line(entry)));
}

export function printReport(report: Report) {
  const { meta } = report;
  console.log(
    `Le voyage — table « ${meta.table} », ${meta.seeds} graines, joueurs : ${meta.profiles.join(', ')}`,
  );
  printVoyages(report);
  printStages(report);
  printCells(report);
  printBags(report);
  printExtremes(report);
}
