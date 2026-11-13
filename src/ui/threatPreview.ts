import { capriceRules } from '../caprices.ts';
import type { Game } from '../game.ts';
import type { Kind } from '../data.ts';
import { waveStats } from '../data.ts';
import type { EnemyKind } from '../enemies.ts';
import { enemies } from '../enemies.ts';
import { deathRetaliation } from '../enemyAbilities.ts';
import { BOSS_COURT } from '../bossCourt.ts';
import { variantFor, TOTAL_WAVES } from '../waves.ts';
import { flyingVariant } from '../flying.ts';
import { activeEnemyLanes } from '../tutorial.ts';
import { missionById, missionWave } from '../missions.ts';
import type { MissionRun } from '../missions.ts';

export type ThreatKind = EnemyKind | 'king';
export type PreviewSource = Pick<Game, 'mission' | 'tuning' | 'totalWaves'>;
export type WaveThreats = {
  local: number;
  lanes: readonly number[];
  entries: { kind: ThreatKind; count: number }[];
  eggs: number;
};
type ThreatDetail = { name: string; ability: string; symbol: string; priority: number };
const retaliation = (variant: 'royal' | 'mamba') =>
  `${deathRetaliation({ variant, boss: false })} PV au tueur à sa mort`;
export const THREAT_DETAILS: Record<ThreatKind, ThreatDetail> = {
  normal: {
    name: enemies.normal.name,
    ability: 'Avance vers ton cristal',
    symbol: 'path',
    priority: 0,
  },
  runner: { name: enemies.runner.name, ability: 'Court très vite', symbol: 'fast', priority: 20 },
  armored: {
    name: enemies.armored.name,
    ability: 'Sa carapace réduit les dégâts',
    symbol: 'shield',
    priority: 25,
  },
  clockwork: {
    name: enemies.clockwork.name,
    ability: 'Sa plaque casse à mi-vie',
    symbol: 'gear',
    priority: 35,
  },
  spring: {
    name: enemies.spring.name,
    ability: 'Bondit par à-coups',
    symbol: 'fast',
    priority: 40,
  },
  umbrella: {
    name: enemies.umbrella.name,
    ability: 'Sa feuille réduit les flèches de face en marche',
    symbol: 'shield',
    priority: 45,
  },
  rattlesnake: {
    name: enemies.rattlesnake.name,
    ability: 'Fait hésiter les alliés proches',
    symbol: 'confusion',
    priority: 60,
  },
  spitter: {
    name: enemies.spitter.name,
    ability: 'Crache à distance : un coup par tir',
    symbol: 'shot',
    priority: 65,
  },
  royal: { name: enemies.royal.name, ability: retaliation('royal'), symbol: 'burst', priority: 70 },
  mamba: { name: enemies.mamba.name, ability: retaliation('mamba'), symbol: 'burst', priority: 75 },
  flying: {
    name: enemies.flying.name,
    ability: 'Seuls archers, dragons et tanks le touchent',
    symbol: 'wing',
    priority: 80,
  },
  courtHealer: {
    name: enemies.courtHealer.name,
    ability: 'Soigne le roi et ses gardes',
    symbol: 'heal',
    priority: 85,
  },
  king: {
    name: 'Roi à trois têtes',
    ability: 'Contact, crachat à distance et tête mixte',
    symbol: 'crown',
    priority: 100,
  },
};
function orderedThreats(types: Iterable<ThreatKind>): ThreatKind[] {
  return [...new Set(types)].sort(
    (a, b) => THREAT_DETAILS[b].priority - THREAT_DETAILS[a].priority,
  );
}
/** A mission wave as planned; a caprice with the king gives him the last place of the last wave. */
function missionWaveKinds(
  game: PreviewSource,
  local: number,
  composition: readonly EnemyKind[],
): ThreatKind[] {
  const crowned = capriceRules(game.mission).king && local === game.totalWaves;
  return composition.map((kind, index) =>
    crowned && index === composition.length - 1 ? 'king' : kind,
  );
}
/**
 * A wave of the classic adventure, place by place, counted down as `variantFor` expects.
 * The king closes the last wave; with the tactical rules his court comes with him and they
 * take the last four places together.
 */
function classicWaveKinds(game: PreviewSource, local: number): ThreatKind[] {
  const tactical = game.tuning.tacticalRulesEnabled;
  const kinds: ThreatKind[] = [];
  for (let remaining = waveStats(local).count; remaining > 0; remaining--) {
    const court = tactical && local === TOTAL_WAVES && remaining <= 4;
    const royal = local === TOTAL_WAVES && (remaining === 1 || court);
    if (!royal) {
      const base = variantFor(local, remaining);
      kinds.push(tactical ? flyingVariant(base, local, remaining) : base);
      continue;
    }
    kinds.push('king');
    if (!court) continue;
    for (const member of BOSS_COURT) kinds.push(member.variant);
    break;
  }
  return kinds;
}
/** Species projection only. No lane draw, arrival timer or RNG is predicted. */
export function waveThreats(game: PreviewSource, local: number): WaveThreats {
  if (!Number.isInteger(local) || local < 1 || local > game.totalWaves)
    throw new RangeError('Vague de prévision invalide');
  const plan = game.mission
    ? missionWave(game.mission, local, game.tuning.tacticalRulesEnabled)
    : null;
  const kinds = plan
    ? missionWaveKinds(game, local, plan.composition)
    : classicWaveKinds(game, local);
  const counts = new Map<ThreatKind, number>();
  for (const kind of kinds) counts.set(kind, (counts.get(kind) ?? 0) + 1);
  return {
    local,
    lanes: activeEnemyLanes(game.mission, local),
    entries: orderedThreats(counts.keys()).map((kind) => ({ kind, count: counts.get(kind)! })),
    eggs: plan?.eggs.length ?? Math.min(3, 1 + Math.floor(local / 4)),
  };
}
export function currentWaveThreats(game: Game): WaveThreats | null {
  return game.status === 'preparing' && game.wave < game.totalWaves
    ? waveThreats(game, game.wave + 1)
    : null;
}
export function missionThreats(run: MissionRun): ThreatKind[] {
  const definition = missionById(run.missionId)!;
  return orderedThreats(
    definition.waves.flatMap((_, i) =>
      waveThreats(
        {
          mission: run,
          tuning: { tacticalRulesEnabled: true } as Game['tuning'],
          totalWaves: definition.waves.length,
        },
        i + 1,
      ).entries.map((e) => e.kind),
    ),
  );
}
/** Advice is a suggestion, not an order or an automatic purchase. */
export function threatAdvice(
  types: readonly ThreatKind[],
  available: (kind: Kind) => boolean,
): { kind: Kind; text: string } {
  if (types.includes('flying') && available('archer'))
    return { kind: 'archer', text: 'Pense aux archers pour toucher les volants.' };
  if (types.includes('spitter') && available('ninja'))
    return { kind: 'ninja', text: 'Un ninja rapide peut rejoindre les cracheurs.' };
  if (types.includes('rattlesnake') && available('dragon'))
    return { kind: 'dragon', text: 'Le bébé dragon souffle sur les groupes de serpents.' };
  if (types.includes('runner') && available('shield'))
    return { kind: 'shield', text: 'Un bouclier aide à retenir les vifs.' };
  return { kind: 'club', text: 'Garde des massues près des passages attaqués.' };
}
