import { bindHomeNavigation, type HomePage } from './homeNavigation.ts';
import {
  setText as setDisplayText,
  setTitle as setDisplayTitle,
  setAttribute as setDisplayAttribute,
} from '../i18n/dom.ts';
import type { Session } from '../session.ts';
import type { Game } from '../game.ts';
import { battleOver } from './battleState.ts';
import type { createCareer } from '../progression.ts';
import { ROSTER_NAMES } from '../roster.ts';
import { chapterIdentityForWave } from '../waves.ts';
import { START_GOLD, START_TEAM_SIZE, TOTAL_WAVES, WAVES_PER_CHAPTER } from '../gameConstants.ts';
import { endlessUnlocked, endlessWave } from '../endless.ts';
import type { EndlessRecords } from '../endlessRecords.ts';
import type { BalanceRevision } from '../balanceRevision.ts';
import { byId } from './dom.ts';
import { starRow } from './gameParts.ts';
import { bindPendingConfirm } from './pendingConfirm.ts';
import { lateDoor } from './lateDoor.ts';
import * as TEXT from '../texts/fr/home.ts';
import * as PAGE from '../texts/fr/page.ts';
import { fill } from '../texts/fill.ts';

type Career = ReturnType<typeof createCareer>;
type Actions = {
  hasCamp: () => boolean;
  restore: () => Game | null;
  started: () => void;
  view: (home: boolean) => void;
  refresh: () => void;
  progressStatus?: () => string;
  navigate?: (page: HomePage) => void;
  /** Whether the stored classic camp, waiting under a mission, is an endless adventure. */
  campIsEndless?: () => boolean;
  /** The best endless adventures of the active player, best first. */
  records?: () => EndlessRecords;
  /** Before going home: a battle aside gives the board back to the game it covered. */
  leave?: () => void;
};
const CHAPTERS = [0, 1, 2] as const;

/** An adventure that has begun is never replaced without asking. */
const begun = (session: Session) => {
  const g = session.game;
  return (
    g.wave > 0 || g.gold !== START_GOLD || g.units.length !== START_TEAM_SIZE || session.hasPlaced
  );
};

function continueLabel(g: Game, campIsEndless: boolean) {
  if (g.mission)
    return campIsEndless ? TEXT.reprendreMonAventureSansFin : TEXT.reprendreMonAventureClassique;
  if (g.status === 'lost') return TEXT.reessayerLaVague;
  // The endless adventure counts its waves from the very first one.
  const shown = (wave: number) => (g.endless ? endlessWave(g.kings, wave) : wave);
  if (g.status === 'fighting') return fill(TEXT.continuerLaBatailleVagueN, shown(g.wave));
  return fill(TEXT.continuerVagueN, shown(Math.min(TOTAL_WAVES, g.wave + 1)));
}
function chapterActionLabel(chapter: number, available: boolean) {
  if (chapter === 0) return TEXT.commencerIci;
  return available ? TEXT.rejouerDepuisMonCamp : TEXT.aDecouvrirDansLAventure;
}

/**
 * The three chapter cards of the classic adventure: focus, and where each starts. Their
 * pictures are small ones of their own, set by the page's style (ui/homeSkin.css): the
 * battle backgrounds are not fetched to draw a menu.
 */
function bindChapters(career: Career, startFrom: (game: Game) => void) {
  for (const i of CHAPTERS) {
    const button = byId<HTMLButtonElement>(`chapter-${i}`);
    setDisplayText(
      byId(`chapter-focus-${i}`),
      chapterIdentityForWave(i * WAVES_PER_CHAPTER + 1).focus,
    );
    button.onclick = () => {
      // The first chapter is the whole adventure: the very gesture of its own button.
      if (i === 0) return byId('home-new').click();
      const game = career.chapterGame(i);
      if (game) startFrom(game);
    };
  }
}
function refreshChapters(state: Career['state']) {
  for (const i of CHAPTERS) {
    const stars = state.bestStars[i];
    setDisplayText(byId(`chapter-stars-${i}`), starRow(stars));
    setDisplayAttribute(byId(`chapter-stars-${i}`), 'aria-label', fill(TEXT.nEtoilesSur3, stars));
    const available = i === 0 || state.chapterCamps[i - 1] !== null;
    byId<HTMLButtonElement>(`chapter-${i}`).disabled = !available;
    setDisplayText(byId(`chapter-action-${i}`), chapterActionLabel(i, available));
  }
}

/** The numbers of the home and the classic page: stars, save, « Continuer », chapters. */
function refreshMenu(session: Session, career: Career, actions: Actions) {
  const state = career.state,
    g = session.game;
  setDisplayText(
    byId('home-stars'),
    fill(
      TEXT.n9Etoiles,
      state.bestStars.reduce((a, b) => a + b, 0),
    ),
  );
  setDisplayText(byId('career-status'), actions.progressStatus?.() ?? career.status);
  byId<HTMLButtonElement>('home-continue').hidden =
    !actions.hasCamp() || (!g.mission && g.status === 'won');
  setDisplayText(byId('home-continue'), continueLabel(g, !!actions.campIsEndless?.()));
  byId<HTMLButtonElement>('home-army').disabled = g.status === 'fighting';
  setDisplayTitle(
    byId('home-army'),
    g.status === 'fighting'
      ? TEXT.lesFavorisSePreparentEntreLes
      : TEXT.preparerTroisGroupesDeHuitFavoris,
  );
  setDisplayText(byId('home-active-team'), fill(TEXT.favorisN, ROSTER_NAMES[state.activeRoster]));
  refreshChapters(state);
  refreshEndless(state.bestStars, actions.records?.() ?? []);
}

/**
 * The endless adventure opens once King Snake is beaten (decision of the parent, 20 November
 * 2026): the third chapter of the great adventure has a star. The active player's record
 * stands under its button; nobody else's.
 */
function refreshEndless(bestStars: readonly number[], records: EndlessRecords) {
  const open = endlessUnlocked(bestStars);
  const door = byId<HTMLButtonElement>('home-endless');
  door.disabled = !open;
  const best = records[0];
  setDisplayText(
    byId('endless-note'),
    !open
      ? PAGE.batsKingSnakePourOuvrirLAventureSansFin
      : best
        ? fill(TEXT.tonRecordVagueNNRois, best.wave, best.kings)
        : TEXT.pasEncoreDeRecord,
  );
}

/** The home screen and the classic adventure: where a game starts, resumes or is replaced. */
export function bindMenu(session: Session, career: Career, actions: Actions) {
  const navigate = actions.navigate ?? bindHomeNavigation().show;
  const enter = () => {
    session.screen = 'battle';
    actions.started();
    actions.view(false);
    actions.refresh();
    requestAnimationFrame(() => byId('start').focus({ preventScroll: true }));
  };
  const showHome = () => {
    actions.leave?.();
    session.selectUnit(null);
    session.screen = 'home';
    if (!session.game.mission) career.sync(session.game);
    actions.view(true);
    navigate('home');
    refresh();
    byId('home-primary')?.focus({ preventScroll: true });
  };
  const askToReplace = bindPendingConfirm<() => void>(
    byId<HTMLDialogElement>('journey-confirm'),
    byId('journey-cancel'),
    byId('journey-replace'),
    (action) => action(),
  );
  /** Starts another adventure, after a confirmation when one is under way. */
  const replace = (action: () => void) => {
    if (begun(session)) askToReplace(action);
    else action();
  };
  const resumeClassic = () => {
    if (session.game.mission || battleOver(session.game)) {
      const g = actions.restore();
      if (!g) return;
      session.useGame(g);
    }
    enter();
  };
  const refresh = () => refreshMenu(session, career, actions);

  byId('menu-home').onclick = showHome;
  document.querySelector<HTMLAnchorElement>('#app .brand')!.onclick = (e) => {
    e.preventDefault();
    showHome();
  };
  byId('home-new').onclick = () =>
    replace(() => {
      session.restart();
      enter();
    });
  byId('home-endless').onclick = () =>
    replace(() => {
      session.restartEndless();
      enter();
    });
  byId('home-continue').onclick = resumeClassic;
  bindChapters(career, (game) =>
    replace(() => {
      session.useGame(game);
      enter();
    }),
  );
  byId('home-help').onclick = () => byId('help').click();
  byId('home-guide').onclick = () => byId('unit-guide').click();
  // The « Favoris » page is bound by a file of its own, asked for now.
  lateDoor(byId('home-army'), () =>
    import('./rosterEditor.ts').then((module) =>
      module.bindRosterEditor(session, career, {
        open: () => navigate('favorites'),
        saved: () => {
          actions.refresh();
          showHome();
        },
        back: showHome,
      }),
    ),
  );
  refresh();
  return {
    refresh,
    showHome,
    resumeClassic,
    startFromSeed(seed: number, balanceRevision: BalanceRevision = 1) {
      replace(() => {
        session.restart(seed, balanceRevision);
        enter();
      });
    },
  };
}
