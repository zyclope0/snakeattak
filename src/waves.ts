import type { EnemyKind } from './enemies.ts';
export const TOTAL_WAVES = 12;
export type ChapterIdentity = Readonly<{
  firstWave: number;
  lastWave: number;
  focus: string;
  tip: string;
}>;
const chapterIdentities: readonly ChapterIdentity[] = [
  {
    firstWave: 1,
    lastWave: 4,
    focus: 'Découvrir les trois voies',
    tip: 'Répartis tes gardiens, retiens les vifs en groupes et surveille les premières éclosions.',
  },
  {
    firstWave: 5,
    lastWave: 8,
    focus: 'Déjouer les escortes',
    tip: 'Les plaques et les parapluies protègent l’approche. Un mobile peut déloger les cracheurs derrière eux.',
  },
  {
    firstWave: 9,
    lastWave: 12,
    focus: 'Tenir le dernier rempart',
    tip: 'Ressorts en trios espacés, soins en soutien : garde tes alliés prêts pour les trois têtes.',
  },
].map((identity) => Object.freeze(identity));

/** One-based wave; camp zero and nonfinite inputs describe the first chapter. */
export function chapterIdentityForWave(wave: number): ChapterIdentity {
  const chapter = Number.isFinite(wave) ? Math.max(0, Math.min(2, Math.floor((wave - 1) / 4))) : 0;
  return chapterIdentities[chapter];
}
const chapters = [
  ['Premiers visiteurs', 'Quelques serpents. Prépare tes premières défenses.'],
  ['Par les trois ponts', 'Les arrivées alternent entre les trois voies. Répartis tes gardiens.'],
  [
    'La course des vifs',
    'Petits groupes de rapides, puis une respiration : garde des alliés mobiles.',
  ],
  [
    'La première couvée',
    'Deux éclosions décalées. Les sonnettes font hésiter les alliés proches : le bébé dragon souffle sur les groupes.',
  ],
  [
    'Les rouages du bosquet',
    'Le serpent à rouages porte une plaque : elle casse à mi-vie. Combine dégâts et soins.',
  ],
  [
    'Les trois fronts',
    'Un serpent volant arrive : archers, dragons et tanks peuvent le toucher. Les feuilles protègent des flèches en marche : place aussi des combattants au contact.',
  ],
  [
    'Attention aux cracheurs',
    'Un cracheur à distance suit un parapluie en marche. Les alliés mobiles peuvent le déloger.',
  ],
  [
    'La grande couvée',
    'Trois éclosions décalées sur trois voies. Le cobra royal montre sa collerette : 2 PV au tueur à sa mort.',
  ],
  [
    'La grande cavalcade',
    'Deux ressorts encadrent la première carapace. Les trios arrivent moins serrés : garde un renfort mobile pour leurs impulsions.',
  ],
  [
    'Les ponts s’animent',
    'Trois fronts. Le mamba noir retire 3 PV à celui qui le tue : garde des soins en soutien.',
  ],
  ['Avant le roi', 'Prépare tes alliés et répare ton cristal.'],
  [
    'Le roi à trois têtes',
    'Gardienne au contact, cracheuse à distance et tête mixte. Deux gardes et un soigneur escortent le roi ; la mêlée brise ses plaques. S’il atteint le cristal, la partie est perdue !',
  ],
];
export function waveBriefing(wave: number) {
  const [title, tip] = chapters[Math.max(0, Math.min(11, wave - 1))];
  return { title, tip };
}
export type WavePattern = 'steady' | 'pincer' | 'rush' | 'brood';
export function wavePattern(wave: number): WavePattern {
  return [2, 6, 10].includes(wave)
    ? 'pincer'
    : [3, 9].includes(wave)
      ? 'rush'
      : [4, 8].includes(wave)
        ? 'brood'
        : 'steady';
}
/** Seconds after spawn index; groups have the same approximate average cadence. */
export function spawnDelay(wave: number, index: number): number {
  if (wave === 9) return index % 3 === 2 ? 1.6 : 0.6;
  return wavePattern(wave) === 'rush' ? (index % 3 === 2 ? 2 : 0.4) : 0.95;
}
export function entryLane(wave: number, index: number, picked: number): number {
  return wavePattern(wave) === 'pincer' ? index % 3 : picked;
}
export function eggIncubation(wave: number, index: number, roll: number): number {
  return wavePattern(wave) === 'brood' ? 6 + index * 6 + roll * 3 : 7 + roll * 8;
}
export function variantFor(wave: number, index: number): EnemyKind {
  // Game passes the remaining count, so larger indices arrive first. Swapping
  // existing slots preserves specialist counts and each slot's x1.6 HP class.
  if (wave === 7) index = index === 8 ? 11 : index === 11 ? 8 : index;
  if (wave === 9) index = index === 11 ? 14 : index === 14 ? 11 : index;
  if (wave >= 10 && index % 17 === 5) return 'mamba';
  if (wave >= 8 && index % 13 === 7) return 'royal';
  if (wave >= 4 && index === 3) return 'rattlesnake';
  if (wave >= 6 && index % 5 === 2) return 'umbrella';
  if (wave >= 9 && index % 5 === 1) return 'spring';
  if (wave >= 5 && index % 6 === 0) return 'clockwork';
  if (wavePattern(wave) === 'rush' && index % 3 !== 0) return 'runner';
  if (wave >= 7 && index % 4 === 0) return 'spitter';
  if (wave >= 5 && index % 3 === 0) return 'armored';
  if (wave >= 3 && index % 2 === 0) return 'runner';
  return 'normal';
}
