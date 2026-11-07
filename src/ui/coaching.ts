import { victoryCopy } from '../render/resultCopy.ts';
import { roleDescription } from '../defenders.ts';
import type { Session } from '../session.ts';
import { kinds } from '../data.ts';
import { chapterIdentityForWave } from '../waves.ts';
import { encounterReadout } from '../render/encounterReadout.ts';
import type { BattleGuide } from './battleNotices.ts';
import type { Effect } from '../game.ts';
/** Session-local observation; retain a real first hit between render frames. */
export function createCoach(session: Session) {
  let previous = session.game,
    wave = previous.wave,
    contactSeen = false,
    previousWaveEffects = new WeakSet<Effect>();
  return () => {
    const game = session.game;
    if (game !== previous || game.wave !== wave) {
      previous = game;
      wave = game.wave;
      contactSeen = false;
      previousWaveEffects = new WeakSet(game.effects);
    }
    if (game.status === 'fighting' && !contactSeen)
      contactSeen = game.effects.some(
        (effect) =>
          !previousWaveEffects.has(effect) &&
          ['hit', 'arrow', 'fire', 'shell'].includes(effect.kind) &&
          game.units.some((u) => u.hp > 0 && u.id === effect.sourceId),
      );
    return coachFor(session, contactSeen);
  };
}

export function coachFor(session: Session, contactSeen?: boolean): BattleGuide {
  const game = session.game;
  if (session.selected)
    return {
      title: `2 · Place ton ${kinds[session.selected].name.toLowerCase()}`,
      subtitle:
        'Touche une place libre dans ton camp, à droite. ' + roleDescription(session.selected),
    };
  if (game.status === 'won') return victoryCopy(game);
  if (game.status === 'lost')
    return {
      title: 'Une autre stratégie ?',
      subtitle: 'Consulte le statut de sauvegarde ou commence une nouvelle aventure.',
    };
  if (game.wave === 0 && !session.hasPlaced)
    return {
      title: '1 · Choisis ton premier renfort',
      subtitle: 'Pour commencer, essaie une massue ou un archer dans les unités disponibles.',
    };
  if (game.wave === 0)
    return {
      title: '3 · Ton renfort est prêt !',
      subtitle: 'Lance la vague. Tes soldats se déplaceront et combattront tout seuls.',
    };
  if (game.status === 'fighting') {
    const readout = encounterReadout(game);
    if (readout.shot)
      return {
        title: 'Le roi prépare son crachat',
        priority: 5,
        subtitle:
          'Le cercle au sol indique la zone qui sera touchée. Surveille tes alliés sur cette voie.',
      };
    if (readout.eggs.length)
      return {
        title: `Éclosion dans ${Math.ceil(Math.min(...readout.eggs.map((e) => e.remaining)))} s`,
        priority: 3,
        subtitle: 'Les œufs marqués vont libérer des serpents. Garde un renfort en réserve.',
      };
    if (readout.confusion)
      return {
        title: readout.confusion.label,
        priority: 2,
        subtitle:
          'La sonnette fait hésiter les alliés proches. Ils reprennent ensuite le combat sans tirer sur leurs amis.',
      };
    if (readout.encouragement)
      return {
        title: 'Courage ! Les attaques accélèrent',
        priority: 1,
        subtitle: `${Math.ceil(readout.encouragement.remaining)} s restantes. Le bouton revient à la prochaine vague.`,
      };
    if (
      !game.encouragementUsed &&
      (contactSeen ?? game.units.some((u) => u.hp > 0 && u.state === 'attack')) &&
      game.units.some((u) => u.hp > 0 && kinds[u.kind as keyof typeof kinds].damage > 0)
    )
      return {
        title: 'Tes alliés frappent : pense à Encourager',
        subtitle: 'Une fois par vague, leurs attaques accélèrent pendant 8 s. Choisis le moment !',
      };
  }
  if (game.status === 'fighting' && game.wave <= 3 && !game.feastUsed)
    return {
      title: 'Le piège gourmand',
      subtitle:
        'Choisis Attirer pour détourner les gourmands, ou Ralentir pour freiner ceux qui traversent la flaque. Puis choisis une voie.',
    };
  if (game.status === 'preparing') {
    if (game.mission) return { title: game.briefing.title, subtitle: game.briefing.tip };
    const identity = chapterIdentityForWave(game.wave + 1);
    return {
      title: identity.focus,
      subtitle: identity.tip,
    };
  }
  return {
    title: 'Observe les voies faibles',
    subtitle: 'Tes alliés agissent seuls. Tu peux aussi acheter des renforts pendant le combat.',
  };
}
