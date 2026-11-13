import { victoryCopy, defeatCopy } from '../render/resultCopy.ts';
import { placementAdvice } from './placementAdvice.ts';
import type { Session } from '../session.ts';
import { kinds } from '../data.ts';
import { chapterIdentityForWave } from '../waves.ts';
import { encounterReadout } from '../render/encounterReadout.ts';
import type { BattleGuide } from './battleNotices.ts';
import type { Effect, Game } from '../game.ts';
import { campToolModel, hasFighters, heroTrainingState } from './campToolModel.ts';
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

/** The first advice that applies, from the most pressing to the most general. */
export function coachFor(session: Session, contactSeen?: boolean): BattleGuide {
  const game = session.game;
  return (
    choiceGuide(session) ??
    outcomeGuide(game) ??
    firstStepsGuide(session) ??
    fightGuide(game, contactSeen) ??
    campGuide(game) ?? {
      title: 'Observe les voies faibles',
      subtitle: 'Tes alliés agissent seuls. Tu peux aussi acheter des alliés pendant le combat.',
    }
  );
}

/** Something is in hand: say where to put it. */
function choiceGuide(session: Session): BattleGuide | null {
  if (session.selectedFeast)
    return {
      title: session.actionHint ?? 'Touche un chemin',
      subtitle: 'Choisis une voie attaquée pour poser ton miel. Annuler garde ton pot.',
    };
  if (session.selected)
    return {
      title: `2 · Place ton ${kinds[session.selected].name.toLowerCase()}`,
      subtitle: placementAdvice(session.selected).hint,
      compact: placementAdvice(session.selected).compactHint,
    };
  return null;
}

function outcomeGuide(game: Game): BattleGuide | null {
  if (game.status === 'won') return victoryCopy(game);
  if (game.status === 'lost') return defeatCopy(game);
  return null;
}

/** Before the very first wave: choose, place, launch. */
function firstStepsGuide(session: Session): BattleGuide | null {
  if (session.game.wave !== 0) return null;
  if (!session.hasPlaced)
    return {
      title: '1 · Choisis ton premier allié',
      subtitle: 'Pour commencer, essaie une massue ou un archer dans les alliés disponibles.',
    };
  return {
    title: '3 · Ton allié est prêt !',
    subtitle: 'Lance la vague. Tes alliés se déplaceront et combattront tout seuls.',
  };
}

function fightGuide(game: Game, contactSeen?: boolean): BattleGuide | null {
  if (game.status !== 'fighting') return null;
  return signalGuide(game) ?? encourageGuide(game, contactSeen) ?? honeyGuide(game);
}

/** What the board is signalling right now; the priority lets it outrank a passing notice. */
function signalGuide(game: Game): BattleGuide | null {
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
      subtitle: 'Les œufs marqués vont libérer des serpents. Garde un allié en réserve.',
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
  return null;
}

/** `contactSeen` comes from the coach's own observation; without it, read the units' state. */
function encourageGuide(game: Game, contactSeen?: boolean): BattleGuide | null {
  const striking = contactSeen ?? game.units.some((u) => u.hp > 0 && u.state === 'attack');
  if (game.encouragementUsed || !striking || !hasFighters(game)) return null;
  return {
    title: 'Tes alliés frappent : pense à Encourager',
    subtitle: 'Une fois par vague, leurs attaques accélèrent pendant 8 s. Choisis le moment !',
  };
}

/** The honey is explained during the first three waves, until it has been used. */
function honeyGuide(game: Game): BattleGuide | null {
  if (game.wave > 3 || game.feastUsed) return null;
  return {
    title: 'Le piège gourmand',
    subtitle:
      'Choisis Attirer pour détourner les gourmands, ou Ralentir pour freiner ceux qui traversent la flaque. Puis choisis une voie.',
  };
}

function campGuide(game: Game): BattleGuide | null {
  if (game.status !== 'preparing') return null;
  if (campToolModel(game, 'repair').ready)
    return {
      title: 'Pense à réparer ton cristal',
      subtitle: 'Dans Actions du camp : 80 pièces pour regagner jusqu’à 25 points de vie.',
    };
  if (heroTrainingState(game).ready)
    return {
      title: 'Tu peux entraîner ton héros',
      subtitle: 'Dans Actions du camp : choisis Frappe ou Gardien pour 90 pièces.',
    };
  if (game.mission) return { title: game.briefing.title, subtitle: game.briefing.tip };
  const identity = chapterIdentityForWave(game.wave + 1);
  return { title: identity.focus, subtitle: identity.tip };
}
