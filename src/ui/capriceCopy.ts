import type { CapriceRules } from '../caprices.ts';
/** Descriptions read actual flags; the child's names and announcements stay separate. */
export function capriceExplanation(r: CapriceRules) {
  const parts: string[] = [];
  if (r.budget < 1) parts.push('tu commences avec moins de pièces');
  if (r.reserve) parts.push(`${r.reserve} pièces restent à la banque`);
  if (r.kinds)
    parts.push(
      r.kinds === 1
        ? 'tu peux recruter une seule sorte d’allié'
        : `tu peux recruter au plus ${r.kinds} sortes d’alliés`,
    );
  if (r.noHoney) parts.push('le pot de miel est vide');
  if (r.noHealers) parts.push('les soignants se reposent');
  if (r.king) parts.push('le roi arrive à la dernière vague');
  if (r.shellEvery)
    parts.push(
      'certains serpents portent une coquille qui les ralentit et les rend plus solides avec une armure contre les coups',
    );
  if (r.cadence < 1) parts.push('les serpents arrivent plus près les uns des autres');
  if (r.count > 1) parts.push('les serpents sont plus nombreux');
  if (r.hp > 1) parts.push('les serpents sont plus solides');
  if (r.hp < 1) parts.push('les serpents sont plus fragiles');
  if (r.speed > 1) parts.push('les serpents avancent plus vite');
  if (r.bite > 1) parts.push('les morsures font plus mal');
  if ((r.shellBite ?? 1) > 1) parts.push('les morsures des serpents à coquille font plus mal');
  if (r.eggs) parts.push('il y a plus d’œufs dans les vagues');
  if (r.hatch < 1) parts.push('les œufs éclosent plus vite');
  if (r.smart) parts.push('les serpents cherchent les chemins les moins gardés');
  const sentence = parts.join(', ');
  return sentence
    ? sentence[0].toLocaleUpperCase('fr') + sentence.slice(1) + '.'
    : 'Prépare tes alliés pour protéger le cristal.';
}
/**
 * An element for the child's own words (names and announcements of the caprices): written in
 * French in every language, and marked so that the translator leaves them alone.
 */
export function frenchLeaf(tag: string, text: string) {
  const node = document.createElement(tag);
  node.dataset.copyRaw = '';
  node.lang = 'fr';
  node.textContent = text;
  return node;
}
