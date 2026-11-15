import type { CapriceRules } from '../caprices.ts';
import * as TEXT from '../texts/fr/capriceScreens.ts';
import { fill } from '../texts/fill.ts';
/** Descriptions read actual flags; the child's names and announcements stay separate. */
export function capriceExplanation(r: CapriceRules) {
  const parts: string[] = [];
  if (r.budget < 1) parts.push(TEXT.tuCommencesAvecMoinsDePieces);
  if (r.reserve) parts.push(fill(TEXT.nPiecesRestentALaBanque, r.reserve));
  if (r.kinds)
    parts.push(
      r.kinds === 1
        ? TEXT.tuPeuxRecruterUneSeuleSorteDAllie
        : fill(TEXT.tuPeuxRecruterAuPlusNSortesDAllies, r.kinds),
    );
  if (r.noHoney) parts.push(TEXT.lePotDeMielEstVide);
  if (r.noHealers) parts.push(TEXT.lesSoignantsSeReposent);
  if (r.king) parts.push(TEXT.leRoiArriveALaDerniereVague);
  if (r.shellEvery) parts.push(TEXT.certainsSerpentsPortentUneCoquille);
  if (r.cadence < 1) parts.push(TEXT.lesSerpentsArriventPlusPresLesUns);
  if (r.count > 1) parts.push(TEXT.lesSerpentsSontPlusNombreux);
  if (r.hp > 1) parts.push(TEXT.lesSerpentsSontPlusSolides);
  if (r.hp < 1) parts.push(TEXT.lesSerpentsSontPlusFragiles);
  if (r.speed > 1) parts.push(TEXT.lesSerpentsAvancentPlusVite);
  if (r.bite > 1) parts.push(TEXT.lesMorsuresFontPlusMal);
  if ((r.shellBite ?? 1) > 1) parts.push(TEXT.lesMorsuresDesSerpentsACoquille);
  if (r.eggs) parts.push(TEXT.ilYAPlusDOeufsDansLesVagues);
  if (r.hatch < 1) parts.push(TEXT.lesOeufsEclosentPlusVite);
  if (r.smart) parts.push(TEXT.lesSerpentsCherchentLesCheminsLes);
  const sentence = parts.join(', ');
  return sentence
    ? sentence[0].toLocaleUpperCase('fr') + sentence.slice(1) + '.'
    : TEXT.prepareTesAlliesPourProtegerLe;
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
