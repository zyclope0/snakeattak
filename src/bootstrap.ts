import { bindHomeNavigation } from './ui/homeNavigation.ts';
import { createCapriceAlbums, createCapriceAlbumsController } from './capriceAlbums.ts';
import { bindCapriceAlbums } from './ui/capriceAlbums.ts';
import { prepareMissionLaunch } from './ui/capriceLaunch.ts';
import type { Kind } from './data.ts';
import './ui/caprices.css';
import { setText as setDisplayText } from './i18n/dom.ts';
import { bindBoardResize } from './render/boardResize.ts';
import { BOARD_WIDTH, BOARD_HEIGHT, bindBoardResolution } from './render/boardResolution.ts';
import { visualSettings } from './render/visualSettings.ts';
import { Game } from './game.ts';
import { createMissionProgress, createMissionProgressController } from './missionProgress.ts';
import { createMissionDone } from './missionDone.ts';
import type { MissionRun } from './missions.ts';
import { bindExpeditions } from './ui/expeditions.ts';
import { createCampMemory } from './campMemory.ts';
import { createFamilyPersistence } from './familyPersistence.ts';
import { readFamilyBackup, writeFamilyBackup } from './familyBackup.ts';
import type { FamilyBackup } from './familyBackup.ts';
import { decodeCheckpoint } from './checkpoints.ts';
import { bindFamilyControls } from './ui/familyControls.ts';
import { bindChapterReport } from './ui/chapterReport.ts';
import { createCareer } from './progression.ts';
import { bindMenu } from './ui/menu.ts';
import { createCoach } from './ui/coaching.ts';
import { bindBattleNotices } from './ui/battleNotices.ts';
import { createRecruitmentReminder, createReminderMarkers } from './ui/recruitmentReminder.ts';
import { bindSounds } from './audio/sounds.ts';
import { bindSettingsDialog } from './ui/settingsDialog.ts';
import { bindHelpBubble } from './ui/helpBubble.ts';
import { loadPlayers, playerStorage } from './players.ts';
import { bindPlayers } from './ui/players.ts';
import { bindVoyageDoor } from './ui/voyageDoor.ts';
import { bindPrivacyDoor } from './ui/privacyDoor.ts';
import { createPersistence } from './checkpoints.ts';
import Phaser from 'phaser';
import { Session } from './session.ts';
import { BattleScene } from './render/BattleScene.ts';
import { bindControls } from './ui/controls.ts';
import './style.css';
import './ui/mobileMenus.css';
import './ui/homeScene.css';
import './ui/homePages.css';
import './ui/dialogPages.css';
import './ui/mainActions.css';
import { byId } from './ui/dom.ts';
import * as TEXT from './texts/fr/home.ts';
import { START_TEAM_SIZE } from './gameConstants.ts';

// The page is assembled here, top to bottom: what is stored, the game on screen, then every
// part of the interface in its binding order. The steps named below are function
// declarations, written after the list that calls them.

// --- What is stored. Every save goes through the active player's keys; player 1 keeps the
// historical ones.
const device = deviceStorage();
const players = loadPlayers(device);
const storage = device && playerStorage(device, players.activeId);
const persistence = createPersistence(storage);
const family = createFamilyPersistence(storage);
const familySaved = family.load();
const missions = createMissionProgressController(
  familySaved && 'missions' in familySaved ? familySaved.missions : undefined,
);
const albums = createCapriceAlbumsController(
  familySaved?.version === 4 || familySaved?.version === 5 ? familySaved.albums : undefined,
);
const stickerResults = new WeakMap<Game, boolean>();

// --- The game on screen, and where the classic adventure and the mission wait meanwhile.
const session = new Session();
session.screen = 'home';
const career = createCareer(storage, familySaved?.career);
const missionDone = createMissionDone(storage);
const saved = familySaved
  ? familySaved.camp === null
    ? null
    : decodeCheckpoint(familySaved.camp)
  : persistence.load();
if (saved) {
  session.game = saved;
  session.hasPlaced = saved.wave > 0 || saved.units.length > START_TEAM_SIZE;
}
openAlbumForCaprice(saved, missions.state.retryCamp);
const campMemory = createCampMemory(saved ?? undefined);
let hasCamp = !!saved;
let classicGame: Game | undefined = saved && !saved.mission ? saved : undefined;
let missionGame: Game | undefined = saved?.mission ? saved : undefined;

// --- The interface. A refresh may run before the later parts exist: they stay undefined
// until they are bound.
let albumUI: ReturnType<typeof bindCapriceAlbums> | undefined;
let expeditions: ReturnType<typeof bindExpeditions> | undefined;
let refreshPrimary: (() => void) | undefined;
let menu: ReturnType<typeof bindMenu> | undefined;
let phaser: Phaser.Game | undefined;
let report: (() => void) | undefined;
let voyage: ReturnType<typeof bindVoyageDoor> | undefined;
const navigation = bindHomeNavigation();
const refresh = bindControls(session, saveAndRedraw, career, { restart: restartGame });
// Render restored counters before waiting for image decoding.
report = bindChapterReport(session);
refresh();
// Avant les sons : ils donnent leur état aux interrupteurs de cette fenêtre.
bindSettingsDialog(() => refresh());
bindHelpBubble(() => refresh());
const soundFrame = bindSounds();
const coach = createCoach(session);
const battleNotices = bindBattleNotices(
  coach,
  () => !!session.selected || !!session.selectedFeast,
  createRecruitmentReminder(session, createReminderMarkers(storage)),
);
phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  // The board in world units; `bindBoardResolution` enlarges the canvas to the screen's pixels.
  width: BOARD_WIDTH,
  height: BOARD_HEIGHT,
  backgroundColor: '#6a8b59',
  scene: [new BattleScene(session, refresh, soundFrame, battleNotices)],
  render: { antialias: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
});
const invalidateBoard = bindBoardResize(phaser, byId('game'));
if (import.meta.env.MODE === 'ads-preview') {
  let destroyed = false;
  let release: (() => void) | undefined;
  phaser.events.once('destroy', () => {
    destroyed = true;
    release?.();
  });
  void import('./ui/webAds/preview.ts').then(({ bindWebAdPreview }) => {
    if (!destroyed) release = bindWebAdPreview({ onBoardMoved: invalidateBoard });
  });
}
// Advertising on the website: nothing of it is in the build while it is switched off.
if (__WEB_ADS__)
  void import('./ui/webAds/delivery.ts').then(({ bindWebAds }) =>
    bindWebAds({ onBoardMoved: invalidateBoard, scriptUrl: __WEB_AD_SCRIPT__ }),
  );
bindBoardResolution(phaser, () => visualSettings.light);
menu = bindMenu(session, career, {
  hasCamp: () => (session.game.mission ? !!missions.state.classicCamp : hasCamp),
  restore: restoreClassic,
  started: gameStarted,
  view: showScreen,
  navigate: (page) => navigation.show(page),
  refresh,
  progressStatus: () => family.status,
});
albumUI = bindCapriceAlbums(
  session,
  albums,
  refresh,
  () => family.status,
  (game) => stickerResults.get(game),
);
expeditions = bindExpeditions(
  session,
  missions,
  {
    launch: launchMission,
    profileChanged: refresh,
    launchClassic: (seed, revision) => menu!.startFromSeed(seed, revision),
    home: () => menu!.showHome(),
    showMissions: () => navigation.show('missions'),
    canResume: missionCanResume,
    resume: resumeMission,
  },
  albums,
);
refreshPrimary = refreshHomePrimary;
voyage = bindVoyageDoor({
  session,
  storage,
  play: playStage,
  home: () => menu!.showHome(),
  navigate: (page) => navigation.show(page),
});
bindPrivacyDoor();
bindFamilyControls({
  persistenceStatus: () => family.status,
  exportRaw: exportFamily,
  applyBackup: applyFamily,
  finished: () => {
    menu!.showHome();
    refresh();
  },
});
showScreen(true);
menu.refresh();
expeditions();
refreshPrimary();
bindPlayers({ device, players, save: refresh, silence: () => storage?.close() });

/** The device's storage; some private or file contexts block it. */
function deviceStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** A caprice under way needs its sticker book: one is opened when the save names none. */
function openAlbumForCaprice(game: Game | null | undefined, retryCamp?: string | null) {
  if (albums.state.campProfileId) return;
  if (game?.mission?.caprice || (retryCamp && decodeCheckpoint(retryCamp)?.mission?.caprice))
    albums.beginRun();
}
/** A caprice won earns its sticker once, however often the game is refreshed. */
function recordAlbum(game: Game) {
  if (game.mission?.caprice && game.status === 'won' && !stickerResults.has(game))
    stickerResults.set(game, albums.record(game));
}
/**
 * Brings the camp memory, the career, the missions and the stickers up to date with the
 * game on screen. `writeCamp` also writes the classic camp under its own key, at its usual
 * place between the memory and the career.
 */
function recordGame(writeCamp: boolean) {
  if (hasCamp) {
    campMemory.remember(session.game);
    if (writeCamp && !session.game.mission) persistence.sync(session.game);
  }
  if (!session.game.mission) career.sync(session.game);
  if (hasCamp) missions.sync(session.game);
  recordAlbum(session.game);
}
/** A game still being played goes on as it is; otherwise its stored camp is read again. */
function liveOrStored(game: Game | undefined, camp: string | null): Game | null {
  if (game && !['lost', 'won'].includes(game.status)) return game;
  return camp ? decodeCheckpoint(camp) : null;
}

/** After every command and every step that matters: save, then redraw what depends on it. */
function saveAndRedraw() {
  recordGame(true);
  family.sync(campMemory.raw(), career.state, missions.state, albums.state);
  markMissionDone();
  albumUI?.refresh();
  menu?.refresh();
  report?.();
  expeditions?.();
  refreshPrimary?.();
  setDisplayText(byId('save-status'), family.status);
  // Last: on a voyage stage, the voyage has the final word on what the board says.
  voyage?.refresh();
}
/** « Recommencer » : the same stage or the same mission again, or a new classic adventure. */
function restartGame() {
  const run = session.game.mission;
  if (session.game.stage) voyage?.restartStage();
  else if (run) launchMission(run, session.game.capriceKindsChosen, true);
  else session.restart();
}

/** The home or the board. The scene sleeps at home and wakes with fresh bounds. */
function showScreen(home: boolean) {
  byId('home-screen').hidden = !home;
  byId('app').hidden = home;
  // Both screens share a document: never inherit the map/menu scroll in battle.
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  requestAnimationFrame(() => {
    if (!phaser) return;
    if (home && phaser.scene.keys.Battle && phaser.scene.isActive('Battle'))
      phaser.scene.sleep('Battle');
    if (!home) {
      if (phaser.scene.keys.Battle && phaser.scene.isSleeping('Battle'))
        phaser.scene.wake('Battle');
      phaser.scale.getParentBounds();
      phaser.scale.refresh();
      phaser.scale.updateBounds();
    }
  });
}
function showBattle() {
  session.screen = 'battle';
  showScreen(false);
  refresh();
}

/** The classic adventure to go back to: from a mission, the one that was set aside. */
function restoreClassic(): Game | null {
  if (!session.game.mission) return campMemory.load() ?? persistence.load();
  // A voyage stage is not a mission to come back to: it starts again from the voyage.
  if (!session.game.stage) missionGame = session.game;
  const classic = liveOrStored(classicGame, missions.state.classicCamp);
  if (classic) campMemory.replace(missions.state.classicCamp);
  return classic;
}
/** The menu has just put a game on the board. */
function gameStarted() {
  hasCamp = true;
  missions.switchMode(session.game.mission ? 'missions' : 'classic');
  if (!session.game.mission) classicGame = session.game;
}

/** Before another game takes the board: the one on screen is recorded and kept for its mode. */
function setGameAside() {
  if (hasCamp) missions.sync(session.game);
  recordAlbum(session.game);
  if (!session.game.mission && hasCamp) classicGame = session.game;
}
/** Starts a mission; false when the departure is refused: the game on screen then stays. */
function launchMission(run: MissionRun, chosen: readonly Kind[] = [], retry = false) {
  const next = prepareMissionLaunch(run, chosen, missions);
  if (!next) return false;
  setGameAside();
  if (!missions.started(run)) return false;
  // A departure, even of the same mission and seed, is a mission under way: the same camps
  // come back, and one of them must not pass for the mission won.
  missionDone.clear();
  if (!retry) albums.beginRun();
  session.useGame(next);
  missionGame = next;
  campMemory.replace(null);
  hasCamp = true;
  showBattle();
  byId('start').focus({ preventScroll: true });
  return true;
}
/**
 * Puts a stage of the voyage on the board. Nothing of it is kept as a camp: the mission and
 * the classic adventure set aside stay as they are, and the voyage records the stage itself.
 */
function playStage(game: Game) {
  setGameAside();
  session.useGame(game);
  showBattle();
  byId('start').focus({ preventScroll: true });
}
function missionCanResume() {
  return !!missionGame || !!missions.state.retryCamp;
}
/**
 * A mission waits to be continued, unless the one on record has been won: just now, or before
 * the game was closed (its camp carries the mark of the mission won).
 */
function missionWaits() {
  return (
    missionCanResume() &&
    missionGame?.status !== 'won' &&
    !missionDone.finished(missions.state.retryCamp)
  );
}
/** A mission just won leaves its mark on the device, beside its last camp. */
function markMissionDone() {
  const game = session.game;
  if (!game.mission || game.stage || game.status !== 'won') return;
  const camp = missions.state.retryCamp;
  if (!missionDone.finished(camp)) missionDone.mark(camp);
}
/** Back to the mission under way, the classic adventure being set aside first. */
function resumeMission() {
  if (!session.game.mission && hasCamp) {
    missions.sync(session.game);
    classicGame = session.game;
  }
  const game = liveOrStored(missionGame, missions.state.retryCamp);
  if (!game) return;
  // Played again, the camp of a mission won waits again to be continued.
  missionDone.clear();
  session.useGame(game);
  missionGame = game;
  missions.switchMode('missions');
  hasCamp = true;
  campMemory.replace(missions.state.retryCamp);
  showBattle();
}

/**
 * The big button of the home: « Reprendre » what waits to be continued, else « Jouer » the
 * next mission or, once the six are won, « Jouer un caprice ». A mission just won is
 * finished: it leaves the button to what comes next and stays on the Missions page.
 */
function refreshHomePrimary() {
  const primary = byId('home-primary');
  const inMissions = missions.state.activeMode === 'missions';
  const resume = inMissions ? missionWaits() : !byId('home-continue').hidden;
  setDisplayText(primary, resume ? TEXT.reprendre : expeditions!.playLabel());
  if (resume)
    setDisplayText(
      byId('home-next-mission'),
      inMissions ? TEXT.reprendreMaMission : TEXT.reprendreMonAventureClassique,
    );
  primary.onclick = () => {
    if (!resume) expeditions!.playNow();
    else if (missions.state.activeMode === 'missions') expeditions!.resume();
    else menu!.resumeClassic();
  };
}

/** The family file of the adventure as it is now. */
function exportFamily() {
  recordGame(false);
  return writeFamilyBackup(campMemory.raw(), career.state, missions.state, albums.state);
}
/**
 * Replaces the adventure by a family file. The file is written first: when the browser
 * refuses it, nothing of the session has changed.
 */
function applyFamily(backup: FamilyBackup) {
  const canonical = readFamilyBackup(JSON.stringify(backup));
  if (!canonical) return { ok: false, message: TEXT.fichierInvalideRienNAEteModifie };
  const game = canonical.camp === null ? null : decodeCheckpoint(canonical.camp);
  if (!family.import(canonical))
    return {
      ok: false,
      message: TEXT.impossibleDeConserverCeFichierSur,
    };
  albums.replaceState(
    canonical.version === 4 || canonical.version === 5 ? canonical.albums : createCapriceAlbums(),
  );
  openAlbumForCaprice(game, 'missions' in canonical ? canonical.missions?.retryCamp : undefined);
  career.replaceState(canonical.career);
  missions.replaceState('missions' in canonical ? canonical.missions! : createMissionProgress());
  // The file brings its own camps: the mark of a mission won here says nothing about them.
  missionDone.clear();
  classicGame = game && !game.mission ? game : undefined;
  missionGame = game?.mission ? game : undefined;
  campMemory.replace(canonical.camp);
  if (game) session.useGame(game);
  else session.restart();
  hasCamp = game !== null;
  session.screen = 'home';
  return { ok: true, message: TEXT.aventureFamilialeRetrouvee };
}
