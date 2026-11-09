import type { CapriceRules } from '../caprices.ts';
/** Descriptions read actual flags; the child's names and announcements stay separate. */
export function capriceExplanation(r: CapriceRules) {
  const parts: string[] = [];
  if (r.budget !== 1) parts.push(`Bourse de départ × ${r.budget}`);
  if (r.reserve) parts.push(`${r.reserve} pièces restent à la banque`);
  if (r.kinds)
    parts.push(
      `Choisis de zéro à ${r.kinds} sortes. Sans choix, les premières recrutées sont retenues. Un choix partiel laisse les places restantes libres.`,
    );
  if (r.noHoney) parts.push('Pas de miel dans ce caprice');
  if (r.noHealers) parts.push('Pas de soignants à recruter');
  if (r.king) parts.push('Le roi ferme la dernière vague');
  if (r.shellEvery)
    parts.push(`Un serpent sur ${r.shellEvery} porte une coquille : plus lent, solide et blindé.`);
  if (r.cadence !== 1) parts.push(`Délai entre serpents × ${r.cadence}`);
  if (r.count !== 1) parts.push(`Serpents × ${r.count}`);
  if (r.hp !== 1) parts.push(`Vie des serpents × ${r.hp}`);
  if (r.speed !== 1) parts.push(`Vitesse des serpents × ${r.speed}`);
  if (r.bite !== 1) parts.push(`Morsures × ${r.bite}`);
  if (r.eggs) parts.push(`${r.eggs} œufs supplémentaires, au plus trois par vague`);
  if (r.hatch !== 1) parts.push(`Délai d’éclosion × ${r.hatch}`);
  return parts.join(' · ');
}
export function frenchLeaf(tag: string, text: string) {
  const node = document.createElement(tag);
  node.dataset.copyRaw = '';
  node.lang = 'fr';
  node.textContent = text;
  return node;
}
