import { kinds } from './data.ts';
import type { Kind } from './data.ts';
import { DEFAULT_BALANCE } from './balanceTuning.ts';
import { medicalRules } from './healing.ts';
import * as TEXT from './texts/fr/allies.ts';
import { fill } from './texts/fill.ts';
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
export function attackDamage(kind: Kind, charge: number, mutantDamageFactor = 1) {
  return (
    kinds[kind].damage *
    (kind === 'mutantRock' || kind === 'mutantStretch' ? mutantDamageFactor : 1) *
    ((kind === 'cavalry' || kind === 'triceratops') && charge >= 0.95 ? 1.8 : 1)
  );
}
export function specialAbility(
  kind: Kind,
  secondaryFactor = DEFAULT_BALANCE.splashSecondaryFactor,
) {
  if (kind === 'shield') return TEXT.bouclierReduitSesDegatsRecusDe40;
  if (kind === 'ninja') return TEXT.eclairNotreAllieLePlusRapideChasse;
  if (kind === 'knight') return TEXT.armureReduitDe20LesDegatsRecus;
  if (kind === 'nurse' || kind === 'medic') {
    const rules = medicalRules(kind)!;
    const interval = String(rules.interval).replace('.', ',');
    return fill(
      TEXT.soigneNPvParInterventionToutesLesN,
      healAmount(kind),
      interval,
      rules.capacity,
      rules.restockSeconds,
    );
  }
  if (kind === 'cavalry' || kind === 'triceratops') return TEXT.chargeApresEnviron14SecondeDe;
  if (kind === 'stegosaurus') return TEXT.plaquesReduitDe25LesDegatsRecus;
  if (kind === 'mutantRock') return TEXT.peauDePierreReduitDe20LesDegats;
  if (kind === 'mutantStretch') return TEXT.brasElastiquesFrappeA90PasDePortee;
  if (kind === 'twohead') return TEXT.deuxTetesFrappeJusquADeuxSerpents;
  const splash =
    secondaryFactor < 1
      ? fill(TEXT.laCibleRecoitTousLesDegatsSes, Math.round(secondaryFactor * 100))
      : '';
  if (kind === 'tank') return TEXT.obusDeZoneEtBlindageReduitDe15Les + splash;
  if (kind === 'dragon') return TEXT.souffleToucheLesSerpentsRegroupes + splash;
  return kinds[kind].description;
}
