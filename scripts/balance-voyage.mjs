// Laboratoire du voyage : joue des voyages entiers sur le vrai moteur (30 Hz, sans navigateur)
// avec les joueurs automatiques des autres laboratoires, pour jauger la difficulté du mode.
//
// Usage : npm run balance:voyage            (ou node scripts/balance-voyage.mjs)
//   SEEDS=100        voyages par joueur et par façon de remplir le sac
//   FIRST=0          rang de la première graine (pour mesurer d'autres graines)
//   PROFILES=expert,moyen,apprenti,petit   joueurs : expert, moyen, apprenti, petit, massues, gros
//   POLICIES=raisonnable,hasard,aucun,...  sacs : voir scripts/voyage-lab/travel.ts ; le
//                    premier de la liste sert aux tableaux par étape et aux graines extrêmes
//   TABLE=2          réglages : une version du voyage (par défaut celle du jeu), brut
//                    (missions et caprices tels quels),
//                    ou le chemin d'un fichier JSON au format de src/voyageTuning.ts
//   JOBS=4           processus en parallèle (défaut : tous les cœurs)
//   OUT=artifacts/voyage/rapport.json      rapport complet (jamais dans Git)
//
// Environ 0,7 s de calcul par voyage : 100 graines, 4 joueurs et 9 sacs prennent 10 minutes
// sur 4 cœurs. Pour un essai rapide : SEEDS=20 POLICIES=raisonnable npm run balance:voyage
import { fork } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURRENT_VOYAGE_VERSION, VOYAGE_TUNINGS, freezeTuning } from '../src/voyageTuning.ts';
import { PROFILES } from './voyage-lab/players.ts';
import { printReport, summarize } from './voyage-lab/report.ts';
import { RAW_TUNING } from './voyage-lab/tables.ts';
import { POLICIES, playVoyage, seedAt } from './voyage-lab/travel.ts';

const env = process.env;
const SEEDS = Number(env.SEEDS ?? 100);
const FIRST = Number(env.FIRST ?? 0);
const profiles = (env.PROFILES ?? 'expert,moyen,apprenti,petit').split(',');
const policies = (env.POLICIES ?? POLICIES.join()).split(',');
const TABLE = env.TABLE ?? String(CURRENT_VOYAGE_VERSION);
const JOBS = Math.max(1, Number(env.JOBS ?? availableParallelism()));
const OUT = env.OUT ?? 'artifacts/voyage/rapport.json';

for (const profile of profiles)
  if (!PROFILES.includes(profile)) throw new RangeError(`Joueur inconnu : ${profile}`);
for (const policy of policies)
  if (!POLICIES.includes(policy)) throw new RangeError(`Sac inconnu : ${policy}`);

async function loadTable() {
  if (TABLE === 'brut') return RAW_TUNING;
  if (Object.hasOwn(VOYAGE_TUNINGS, TABLE)) return VOYAGE_TUNINGS[TABLE];
  return freezeTuning(JSON.parse(await readFile(TABLE, 'utf8')));
}
const tuning = await loadTable();
// Les codes du rapport sont ceux de la version mesurée ; une autre table s'écrit comme le jeu.
const version = Object.hasOwn(VOYAGE_TUNINGS, TABLE) ? Number(TABLE) : CURRENT_VOYAGE_VERSION;

const jobs = [];
for (let index = 0; index < SEEDS; index++)
  for (const profile of profiles)
    for (const policy of policies) jobs.push({ seed: seedAt(FIRST + index), profile, policy });

if (env.VOYAGE_SHARD !== undefined) {
  // Un processus de calcul : sa part des voyages, puis le résultat au processus principal.
  const shard = Number(env.VOYAGE_SHARD);
  const mine = jobs.filter((_, index) => index % JOBS === shard);
  process.send(
    mine.map((job) => playVoyage(job.seed, job.profile, job.policy, tuning, version)),
    () => process.exit(0),
  );
} else {
  const started = performance.now();
  const voyages = (await Promise.all(Array.from({ length: JOBS }, (_, shard) => runShard(shard))))
    .flat()
    .sort((a, b) => a.seed - b.seed);
  const seconds = (performance.now() - started) / 1000;
  const report = summarize(voyages, { profiles, policies, seeds: SEEDS, table: TABLE, tuning });
  printReport(report);
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify({ ...report, seconds, voyages }));
  console.log(
    `\n${voyages.length} voyages (${voyages.length * 5} étapes) en ${seconds.toFixed(0)} s. Rapport : ${OUT}`,
  );
}

/** Lance un processus de calcul et attend sa part des voyages. */
function runShard(shard) {
  return new Promise((resolve, reject) => {
    const child = fork(fileURLToPath(import.meta.url), [], {
      env: { ...env, JOBS: String(JOBS), VOYAGE_SHARD: String(shard) },
    });
    let results = null;
    child.on('message', (message) => (results = message));
    child.on('error', reject);
    child.on('exit', (code) =>
      results ? resolve(results) : reject(new Error(`Processus ${shard} arrêté (code ${code})`)),
    );
  });
}
