import type { EnemyKind } from './enemies.ts';
export const TOTAL_WAVES = 12;
const chapters = [
  ['Premiers visiteurs', 'Quelques serpents. Préparez vos premières défenses.'],
  [
    'Par les trois ponts',
    'Les arrivées alternent entre les trois voies. Répartissez vos gardiens.',
  ],
  [
    'La course des vifs',
    'Petits groupes de rapides, puis une respiration : gardez des renforts mobiles.',
  ],
  [
    'La première couvée',
    'Deux éclosions décalées. Les sonnettes font hésiter les alliés proches : le bébé dragon souffle sur les groupes.',
  ],
  [
    'Les rouages du bosquet',
    'Le serpent à rouages porte une plaque : elle casse à mi-vie. Combinez dégâts et soins.',
  ],
  [
    'Les trois fronts',
    'Les feuilles protègent des flèches en marche. Placez des combattants au contact.',
  ],
  [
    'Attention aux cracheurs',
    'Les cracheurs visent vos tireurs à distance. Les renforts mobiles peuvent les déloger.',
  ],
  [
    'La grande couvée',
    'Trois éclosions décalées sur trois voies. Le cobra royal montre sa collerette : 2 PV au tueur à sa mort.',
  ],
  [
    'La grande cavalcade',
    'Des serpents à ressort avancent par impulsions. Gardez un renfort mobile pour fermer les brèches.',
  ],
  [
    'Les ponts s’animent',
    'Trois fronts. Le mamba noir retire 3 PV à celui qui le tue : gardez des soins en soutien.',
  ],
  ['Avant le roi', 'Préparez votre armée et réparez votre cristal.'],
  [
    'Le roi à trois têtes',
    'Trois têtes : protection, crachat annoncé et œufs. La mêlée brise ses plaques. S’il atteint le cristal, la partie est perdue !',
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
  return wavePattern(wave) === 'rush' ? (index % 3 === 2 ? 2 : 0.4) : 0.95;
}
export function entryLane(wave: number, index: number, picked: number): number {
  return wavePattern(wave) === 'pincer' ? index % 3 : picked;
}
export function eggIncubation(wave: number, index: number, roll: number): number {
  return wavePattern(wave) === 'brood' ? 6 + index * 6 + roll * 3 : 7 + roll * 8;
}
export function variantFor(wave: number, index: number): EnemyKind {
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
