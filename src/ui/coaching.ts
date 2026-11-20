import { victoryCopy, defeatCopy } from '../render/resultCopy.ts';
import { placementAdvice } from './placementAdvice.ts';
import type { Session } from '../session.ts';
import { kinds } from '../data.ts';
import { chapterIdentityForWave } from '../waves.ts';
import { encounterReadout } from '../render/encounterReadout.ts';
import type { BattleGuide } from './battleNotices.ts';
import type { Effect, Game } from '../game.ts';
import { campToolModel, hasFighters, heroTrainingState } from './campToolModel.ts';
import * as TEXT from '../texts/fr/advice.ts';
import { fill } from '../texts/fill.ts';
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
      title: TEXT.observeLesVoiesFaibles,
      subtitle: TEXT.tesAlliesAgissentSeulsTuPeuxAussi,
    }
  );
}

/** Something is in hand: say where to put it. */
function choiceGuide(session: Session): BattleGuide | null {
  if (session.selectedFeast)
    return {
      title: session.actionHint ?? TEXT.toucheUnChemin,
      subtitle: TEXT.choisisUneVoieAttaqueePourPoserTon,
    };
  if (session.selected)
    return {
      title: fill(TEXT.n2PlaceTonN, kinds[session.selected].name.toLowerCase()),
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
  // The camp after a king of the endless adventure is no first step.
  if (session.game.wave !== 0 || session.game.kings > 0) return null;
  if (!session.hasPlaced)
    return {
      title: TEXT.n1ChoisisTonPremierAllie,
      subtitle: TEXT.pourCommencerEssaieUneMassueOuUn,
    };
  return {
    title: TEXT.n3TonAllieEstPret,
    subtitle: TEXT.lanceLaVagueTesAlliesSeDeplaceront,
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
      title: TEXT.leRoiPrepareSonCrachat,
      priority: 5,
      subtitle: TEXT.leCercleAuSolIndiqueLaZoneQuiSera,
    };
  if (readout.eggs.length)
    return {
      title: fill(
        TEXT.eclosionDansNS,
        Math.ceil(Math.min(...readout.eggs.map((e) => e.remaining))),
      ),
      priority: 3,
      subtitle: TEXT.lesOeufsMarquesVontLibererDes,
    };
  if (readout.confusion)
    return {
      title: readout.confusion.label,
      priority: 2,
      subtitle: TEXT.laSonnetteFaitHesiterLesAllies,
    };
  if (readout.encouragement)
    return {
      title: TEXT.courageLesAttaquesAccelerent,
      priority: 1,
      subtitle: fill(
        TEXT.nSRestantesLeBoutonRevientALa,
        Math.ceil(readout.encouragement.remaining),
      ),
    };
  return null;
}

/** `contactSeen` comes from the coach's own observation; without it, read the units' state. */
function encourageGuide(game: Game, contactSeen?: boolean): BattleGuide | null {
  const striking = contactSeen ?? game.units.some((u) => u.hp > 0 && u.state === 'attack');
  if (game.encouragementUsed || !striking || !hasFighters(game)) return null;
  return {
    title: TEXT.tesAlliesFrappentPenseAEncourager,
    subtitle: TEXT.uneFoisParVagueLeursAttaques,
  };
}

/** The honey is explained during the first three waves, until it has been used. */
function honeyGuide(game: Game): BattleGuide | null {
  if (game.wave > 3 || game.feastUsed) return null;
  return {
    title: TEXT.lePiegeGourmand,
    subtitle: TEXT.choisisAttirerPourDetournerLes,
  };
}

function campGuide(game: Game): BattleGuide | null {
  if (game.status !== 'preparing') return null;
  if (campToolModel(game, 'repair').ready)
    return {
      title: TEXT.penseAReparerTonCristal,
      subtitle: TEXT.dansActionsDuCamp80PiecesPour,
    };
  if (heroTrainingState(game).ready)
    return {
      title: TEXT.tuPeuxEntrainerTonHeros,
      subtitle: TEXT.dansActionsDuCampChoisisFrappeOu,
    };
  if (game.mission) return { title: game.briefing.title, subtitle: game.briefing.tip };
  const identity = chapterIdentityForWave(game.wave + 1);
  return { title: identity.focus, subtitle: identity.tip };
}
