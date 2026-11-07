import { kinds } from './data.ts';
import type { Kind } from './data.ts';
import { DEFAULT_BALANCE } from './balanceTuning.ts';
export function healAmount(kind: Kind) {
  return kind === 'medic' ? 24 : kind === 'nurse' ? 14 : 0;
}
export function incomingDamage(kind: Kind, damage: number) {
  return (
    damage *
    (kind === 'shield'
      ? 0.6
      : kind === 'stegosaurus'
        ? 0.75
        : kind === 'knight' || kind === 'mutantRock'
          ? 0.8
          : kind === 'tank'
            ? 0.85
            : 1)
  );
}
export function attackDamage(kind: Kind, charge: number) {
  return (
    kinds[kind].damage *
    ((kind === 'cavalry' || kind === 'triceratops') && charge >= 0.95 ? 1.8 : 1)
  );
}
export function specialAbility(
  kind: Kind,
  secondaryFactor = DEFAULT_BALANCE.splashSecondaryFactor,
) {
  if (kind === 'shield')
    return 'Bouclier : réduit ses dégâts reçus de 40 %. Protège un voisin proche de 60 % d’un tir de cracheur, puis recharge 3 secondes.';
  if (kind === 'ninja')
    return 'Éclair : notre allié le plus rapide. Chasse les cracheurs exposés à proximité, avec le cristal en priorité.';
  if (kind === 'knight') return 'Armure : réduit de 20 % les dégâts reçus.';
  if (kind === 'nurse' || kind === 'medic')
    return `Soigne ${healAmount(kind)} PV par intervention. Aucune résurrection.`;
  if (kind === 'cavalry' || kind === 'triceratops')
    return 'Charge : après environ 1,4 seconde de course, le premier coup inflige 80 % de dégâts supplémentaires.';
  if (kind === 'stegosaurus')
    return 'Plaques : réduit de 25 % les dégâts reçus. Garde son secteur.';
  if (kind === 'mutantRock')
    return 'Peau de pierre : réduit de 20 % les dégâts reçus. Garde son secteur.';
  if (kind === 'mutantStretch')
    return 'Bras élastiques : frappe à 90 pas de portée. Son allonge protège son secteur sans projectile.';
  if (kind === 'twohead') return 'Deux têtes : frappe jusqu’à deux serpents voisins.';
  const splash =
    secondaryFactor < 1
      ? ` La cible reçoit tous les dégâts, ses voisins ${Math.round(secondaryFactor * 100)} %.`
      : '';
  if (kind === 'tank')
    return 'Obus de zone et blindage : réduit de 15 % les dégâts reçus.' + splash;
  if (kind === 'dragon')
    return 'Souffle : touche les serpents regroupés autour de la cible.' + splash;
  return kinds[kind].description;
}
