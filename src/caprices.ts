import type { MissionId } from './missions.ts';

/**
 * Caprices des serpents : trois variantes de règles par mission, débloquées par les étoiles.
 * Catalogue validé par le fils le 9 novembre 2026 (voir docs/CAPRICES.md).
 * Chaque caprice change des nombres ou retire une aide. Les six règles du fils restent
 * vraies : soldats autonomes, achat avec les récompenses, œufs qui éclosent, roi à trois
 * têtes, serpents qui cherchent la voie la moins défendue, pas de résurrection.
 */
export type CapriceTier = 'petit' | 'moyen' | 'grand';
/** Deux rangées par mission : les caprices des serpents et le défi inventé par le fils. */
export type CapriceSet = 'serpents' | 'createur';
export const CAPRICE_SET_NAMES: Readonly<Record<CapriceSet, string>> = Object.freeze({
  serpents: 'Caprices des serpents',
  createur: 'Le défi du créateur',
});
export type CapriceRules = Readonly<{
  /** Facteur sur la bourse de départ de la mission. */
  budget: number;
  /** Facteur sur le délai entre deux serpents (moins de 1 : plus serrés). */
  cadence: number;
  /** Facteur sur la vitesse des serpents. */
  speed: number;
  /** Facteur sur les PV des serpents (œufs compris). */
  hp: number;
  /** Facteur sur les dégâts des morsures contre les alliés. */
  bite: number;
  /** Facteur sur le nombre de serpents par vague. */
  count: number;
  /** Œufs en plus par vague (au plus 3 œufs au total). */
  eggs: number;
  /** Facteur sur le temps d'éclosion des œufs. */
  hatch: number;
  /** Le pot de miel est vide : ni goûter, ni miel collant. */
  noHoney: boolean;
  /** Nombre maximal de sortes d'alliés recrutables (0 : pas de limite). */
  kinds: number;
  /** Ni infirmier ni médecin à recruter. */
  noHealers: boolean;
  /** Les serpents cherchent la voie la moins défendue avec la ruse de fin d'aventure. */
  smart: boolean;
  /** Le roi à trois têtes ferme la dernière vague. */
  king: boolean;
  /** Pièces qui doivent rester dans la banque : on ne peut pas les dépenser. */
  reserve: number;
  /** Un serpent sur N devient une carapace : lent, solide et blindé (0 : aucun). */
  shellEvery: number;
  /** Facteur de vitesse des carapaces. */
  shellSpeed: number;
  /** Facteur de PV des carapaces. */
  shellHp: number;
  /** Part des dégâts arrêtée par le blindage des carapaces. */
  shellArmor: number;
  /** Morsures des seules carapaces (absent : 1). */
  shellBite?: number;
}>;
export type CapriceDefinition = Readonly<{
  id: string;
  set: CapriceSet;
  missionId: MissionId;
  tier: CapriceTier;
  /** Nom choisi ou validé par le fils. */
  name: string;
  /** Annonce affichée avant la partie : six mots au plus. */
  announce: string;
  rules: CapriceRules;
}>;
export const NO_CAPRICE: CapriceRules = Object.freeze({
  budget: 1,
  cadence: 1,
  speed: 1,
  hp: 1,
  bite: 1,
  count: 1,
  eggs: 0,
  hatch: 1,
  noHoney: false,
  kinds: 0,
  noHealers: false,
  smart: false,
  king: false,
  reserve: 0,
  shellEvery: 0,
  shellSpeed: 1,
  shellHp: 1,
  shellArmor: 0,
});
export const CAPRICE_TIERS: readonly CapriceTier[] = Object.freeze(['petit', 'moyen', 'grand']);
/** Étoiles minimales sur la mission pour ouvrir chaque niveau de caprice. */
export const CAPRICE_UNLOCK_STARS: Readonly<Record<CapriceTier, number>> = Object.freeze({
  petit: 1,
  moyen: 2,
  grand: 3,
});

const catalog = new Map<string, CapriceDefinition>();
function validRules(rules: CapriceRules) {
  return (
    rules.budget > 0 &&
    rules.budget <= 1 &&
    rules.cadence > 0 &&
    rules.cadence <= 1 &&
    rules.speed >= 1 &&
    rules.speed <= 2 &&
    rules.hp > 0 &&
    rules.hp <= 2 &&
    (rules.shellBite === undefined || (rules.shellBite >= 1 && rules.shellBite <= 3)) &&
    rules.bite >= 1 &&
    rules.bite <= 3 &&
    rules.count >= 1 &&
    rules.count <= 2 &&
    Number.isInteger(rules.eggs) &&
    rules.eggs >= 0 &&
    rules.eggs <= 2 &&
    rules.hatch > 0 &&
    rules.hatch <= 1 &&
    Number.isInteger(rules.kinds) &&
    rules.kinds >= 0 &&
    rules.kinds <= 3 &&
    Number.isInteger(rules.reserve) &&
    rules.reserve >= 0 &&
    rules.reserve <= 5000 &&
    Number.isInteger(rules.shellEvery) &&
    rules.shellEvery >= 0 &&
    rules.shellEvery <= 6 &&
    rules.shellSpeed > 0 &&
    rules.shellSpeed <= 1 &&
    rules.shellHp >= 1 &&
    rules.shellHp <= 5 &&
    rules.shellArmor >= 0 &&
    rules.shellArmor <= 0.8
  );
}
/**
 * Ajoute un caprice au catalogue. Réservé au catalogue ci-dessous, aux tests et au
 * laboratoire d'équilibrage : un identifiant existant ne peut pas être remplacé.
 */
export function defineCaprice(
  definition: Omit<CapriceDefinition, 'rules'> & { rules: Partial<CapriceRules> },
): CapriceDefinition {
  const rules = Object.freeze({ ...NO_CAPRICE, ...definition.rules });
  if (!validRules(rules) || catalog.has(definition.id))
    throw new RangeError('Caprice invalide : ' + definition.id);
  const frozen = Object.freeze({ ...definition, rules });
  catalog.set(frozen.id, frozen);
  return frozen;
}

/** Les dix-huit caprices validés, dans l'ordre des missions puis des niveaux. */
export const CAPRICES: readonly CapriceDefinition[] = Object.freeze(
  (
    [
      ['refuge', 'petit', 'Serpents pressés', 'On arrive tous en même temps !', { cadence: 0.55 }],
      [
        'refuge',
        'moyen',
        'Méga serpent',
        'Deux fois plus de serpents costauds !',
        { count: 2, hp: 1.5 },
      ],
      [
        'refuge',
        'grand',
        'La tempête',
        'Plus nombreux, plus durs, plus mordants !',
        { bite: 2, hp: 1.75, count: 1.75 },
      ],
      ['trois-ponts', 'petit', 'Bourse trouée', 'On a grignoté tes pièces !', { budget: 0.5 }],
      [
        'trois-ponts',
        'moyen',
        'Blindcrocs',
        'Nos crocs piquent, nos écailles tiennent !',
        { bite: 3, hp: 2 },
      ],
      [
        'trois-ponts',
        'grand',
        'Grandes rafales de serpents',
        'Les rafales reviennent, encore plus fortes !',
        { bite: 2.5, hp: 1.75, count: 1.75 },
      ],
      ['course', 'petit', 'Rafales de serpents', 'Ça glisse, ça file !', { speed: 1.4, hp: 0.8 }],
      [
        'course',
        'moyen',
        'La petite tempête',
        'Les vifs se mettent en tempête !',
        { bite: 2.5, hp: 1.5, count: 1.5 },
      ],
      [
        'course',
        'grand',
        "Le roi s'invite",
        'Le roi veut voir la course !',
        { king: true, bite: 2, hp: 1.5, count: 1.25 },
      ],
      [
        'coquilles',
        'petit',
        "Pique-nique d'œufs",
        'On a pondu pour le goûter !',
        { eggs: 2, hatch: 0.6 },
      ],
      ['coquilles', 'moyen', 'Grosse fringale', 'Deux fois plus de serpents !', { count: 2 }],
      [
        'coquilles',
        'grand',
        'La tempête',
        'Plus nombreux, plus durs, plus mordants !',
        { bite: 1.5, hp: 1.5, count: 1.5 },
      ],
      [
        'sonnette',
        'petit',
        'Deux copains seulement',
        "Choisis deux sortes d'alliés !",
        { kinds: 2 },
      ],
      ['sonnette', 'moyen', 'Crocs pointus', 'Nos morsures font plus mal !', { bite: 1.5 }],
      ['sonnette', 'grand', 'Serpents costauds', 'On a mangé nos légumes !', { hp: 2 }],
      ['carrefour', 'petit', 'Plus de miel !', 'On a léché le pot !', { noHoney: true }],
      ['carrefour', 'moyen', 'Un seul copain', "Une seule sorte d'allié !", { kinds: 1 }],
      [
        'carrefour',
        'grand',
        'Le roi et sa grande fringale',
        'Le roi arrive avec ses invités !',
        { king: true, count: 1.5 },
      ],
    ] as const
  ).map(([missionId, tier, name, announce, rules]) =>
    defineCaprice({
      id: `${missionId}-${tier}`,
      set: 'serpents',
      missionId,
      tier,
      name,
      announce,
      rules,
    }),
  ),
);

/**
 * Le défi du créateur, inventé par le fils le 9 novembre 2026 : facile, la tirelire
 * (un tiers de la bourse de départ reste à la banque) ; moyen, les carapaces (un serpent
 * sur trois très lent, très solide et blindé) ; difficile, la grande charge (tous plus
 * rapides, plus solides et plus mordants). Valeurs mesurées mission par mission.
 */
const CREATOR: Readonly<
  Record<
    MissionId,
    Readonly<{
      reserve: number;
      shellHp: number;
      charge: Readonly<{ speed: number; hp: number; bite: number }>;
    }>
  >
> = Object.freeze({
  refuge: { reserve: 150, shellHp: 3, charge: { speed: 2, hp: 2, bite: 3 } },
  'trois-ponts': { reserve: 200, shellHp: 3, charge: { speed: 1.8, hp: 2, bite: 3 } },
  course: { reserve: 250, shellHp: 3, charge: { speed: 1.5, hp: 2, bite: 2.5 } },
  coquilles: { reserve: 300, shellHp: 3, charge: { speed: 1.4, hp: 1.75, bite: 2 } },
  sonnette: { reserve: 350, shellHp: 4, charge: { speed: 1.2, hp: 1.3, bite: 1.3 } },
  carrefour: { reserve: 450, shellHp: 4, charge: { speed: 1.15, hp: 1.25, bite: 1.25 } },
});
export const CREATOR_CHALLENGES: readonly CapriceDefinition[] = Object.freeze(
  (Object.keys(CREATOR) as MissionId[]).flatMap((missionId) => {
    const values = CREATOR[missionId];
    return [
      defineCaprice({
        id: `${missionId}-createur-petit`,
        set: 'createur',
        missionId,
        tier: 'petit',
        name: 'La tirelire',
        announce: 'Garde des pièces dans la banque !',
        rules: { reserve: values.reserve },
      }),
      defineCaprice({
        id: `${missionId}-createur-moyen`,
        set: 'createur',
        missionId,
        tier: 'moyen',
        name: 'Les carapaces',
        announce: 'Lents, mais durs comme des pierres !',
        rules: { shellEvery: 3, shellSpeed: 0.5, shellHp: values.shellHp, shellArmor: 0.5 },
      }),
      defineCaprice({
        id: `${missionId}-createur-grand`,
        set: 'createur',
        missionId,
        tier: 'grand',
        name: 'La grande charge',
        announce: 'On fonce, on mord, on tient !',
        rules: values.charge,
      }),
    ];
  }),
);

export function capriceById(id: unknown): CapriceDefinition | null {
  return typeof id === 'string' ? (catalog.get(id) ?? null) : null;
}
/** Les caprices d'une mission, rangée par rangée : serpents puis défi du créateur. */
export function capricesForMission(
  missionId: MissionId,
  set?: CapriceSet,
): readonly CapriceDefinition[] {
  return [...CAPRICES, ...CREATOR_CHALLENGES].filter(
    (caprice) => caprice.missionId === missionId && (!set || caprice.set === set),
  );
}
/** Un caprice est ouvert quand la mission a déjà été gagnée avec assez d'étoiles. */
export function capriceUnlocked(tier: CapriceTier, bestStars: number): boolean {
  return Number.isFinite(bestStars) && bestStars >= CAPRICE_UNLOCK_STARS[tier];
}
const revised = new Map<string, CapriceDefinition>();
const balancePatches: Readonly<Record<string, Partial<CapriceRules>>> = Object.freeze({
  'carrefour-grand': { count: 1.2 },
  'sonnette-grand': { hp: 1.75 },
  'refuge-createur-moyen': {
    shellEvery: 2,
    shellHp: 5,
    shellArmor: 0.7,
    shellSpeed: 0.6,
    shellBite: 1.5,
  },
  'trois-ponts-createur-moyen': { shellEvery: 2, shellHp: 5, shellArmor: 0.6 },
  'course-createur-moyen': { shellEvery: 2, shellHp: 5, shellArmor: 0.6 },
});
export function capriceDefinitionForRun(
  run: { caprice?: string; balance?: 2 } | null | undefined,
): CapriceDefinition | null {
  const definition = capriceById(run?.caprice);
  if (!definition || run?.balance !== 2 || !balancePatches[definition.id]) return definition;
  let resolved = revised.get(definition.id);
  if (!resolved) {
    resolved = Object.freeze({
      ...definition,
      rules: Object.freeze({ ...definition.rules, ...balancePatches[definition.id] }),
    });
    revised.set(definition.id, resolved);
  }
  return resolved;
}
export function capriceRules(
  run: { caprice?: string; balance?: 2 } | null | undefined,
): CapriceRules {
  return capriceDefinitionForRun(run)?.rules ?? NO_CAPRICE;
}
export function capriceBudget(budget: number, rules: CapriceRules): number {
  return rules.budget === 1 ? budget : Math.round((budget * rules.budget) / 5) * 5;
}
export function capriceCount(count: number, rules: CapriceRules): number {
  return rules.count === 1 ? count : Math.round(count * rules.count);
}
