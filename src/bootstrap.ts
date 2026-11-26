// The order of these imports is the order in which their modules run and their styles
// cascade: move one only on purpose.
import { bindHomeNavigation } from './ui/homeNavigation.ts';
import { createCapriceAlbumsController } from './capriceAlbums.ts';
import { bindCapriceAlbums } from './ui/capriceAlbums.ts';
import './ui/caprices.css';
import { setText as setDisplayText } from './i18n/dom.ts';
import { createPhaser } from './boot/phaser.ts';
import { createMissionProgressController } from './missionProgress.ts';
import { createStickers } from './boot/stickers.ts';
import { createGames } from './boot/games.ts';
import { createMissionDone } from './missionDone.ts';
import { bindExpeditions } from './ui/expeditions.ts';
import { createCampMemory } from './campMemory.ts';
import { createFamilyPersistence } from './familyPersistence.ts';
import { hasAlbums } from './familyBackup.ts';
import { bindFamilyFile } from './boot/familyFile.ts';
import { createPersistence, decodeCheckpoint } from './checkpoints.ts';
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
import { Session } from './session.ts';
import { BattleScene } from './render/BattleScene.ts';
import { bindControls } from './ui/controls.ts';
import './style.css';
import './ui/mobileMenus.css';
import './ui/homeScene.css';
import './ui/homePages.css';
import './ui/dialogPages.css';
import './ui/mainActions.css';
import './ui/homeClearing.css';
import './ui/homeSkin.css';
import './ui/windowSkin.css';
import './ui/campSkin.css';
import { byId } from './ui/dom.ts';
import { createRecordBook } from './endlessRecords.ts';
import { createAppleBook } from './appleBook.ts';
import { createSaving } from './boot/saving.ts';
import { createWatchKeeping } from './boot/watchKeeping.ts';
import { createScreens } from './boot/screens.ts';
import { bindHomePrimary } from './boot/homePrimary.ts';

// The page is assembled here, top to bottom: what is stored, the game on screen, then every
// part of the interface in its binding order. Each part lives in its own module; the few
// steps named below are function declarations, written after the list that calls them.

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
  familySaved && hasAlbums(familySaved) ? familySaved.albums : undefined,
);
const records = createRecordBook(storage);
const apples = createAppleBook(storage);

// --- The game on screen, and where the classic adventure and the mission wait meanwhile.
const session = new Session();
session.screen = 'home';
const career = createCareer(storage, familySaved?.career);
const missionDone = createMissionDone(storage);
// A family file is the whole adventure, its camp included, even when one of its camps did
// not read and was left out: the camp kept under its own key could be another adventure's.
const saved = familySaved
  ? familySaved.camp === null
    ? null
    : decodeCheckpoint(familySaved.camp)
  : persistence.load();
if (saved) session.useGame(saved);
const stickers = createStickers(albums);
stickers.openForCaprice(saved, missions.state.retryCamp);
const campMemory = createCampMemory(saved ?? undefined);

// --- The parts of the interface bound later. A refresh may run before they exist: they stay
// undefined until they are bound.
let albumUI: ReturnType<typeof bindCapriceAlbums> | undefined;
let expeditions: ReturnType<typeof bindExpeditions> | undefined;
let refreshPrimary: (() => void) | undefined;
let menu: ReturnType<typeof bindMenu> | undefined;
let report: (() => void) | undefined;
let voyage: ReturnType<typeof bindVoyageDoor> | undefined;

// --- What is told and written after a step, which screen is shown, which game is on the board.
const watchKeeping = createWatchKeeping(session, family, records, apples);
const screens = createScreens(watchKeeping);
const adventure = {
  session,
  storage,
  persistence,
  family,
  records,
  apples,
  career,
  missions,
  albums,
  missionDone,
  campMemory,
  stickers,
};
const games = createGames(adventure, saved, showBattle, () => voyage);
const saving = createSaving(adventure, games);

// --- The interface, in its binding order.
const navigation = bindHomeNavigation();
const refresh = bindControls(session, saveAndRedraw, career, { restart: games.restartGame });
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
screens.attach(
  createPhaser(
    new BattleScene(session, refresh, soundFrame, battleNotices, {
      has: apples.has,
      collect: apples.add,
      sound: soundFrame.apple,
    }),
  ),
);
menu = bindMenu(session, career, {
  hasCamp: () => (session.game.mission ? !!missions.state.classicCamp : games.hasCamp),
  restore: games.restoreClassic,
  started: games.gameStarted,
  view: screens.show,
  navigate: (page) => navigation.show(page),
  refresh,
  progressStatus: () => family.status,
  campIsEndless: games.campIsEndless,
  records: records.read,
});
albumUI = bindCapriceAlbums(session, albums, refresh, () => family.status, stickers.result);
expeditions = bindExpeditions(
  session,
  missions,
  {
    launch: games.launchMission,
    profileChanged: refresh,
    launchClassic: (seed, revision) => menu!.startFromSeed(seed, revision),
    home: () => menu!.showHome(),
    showMissions: () => navigation.show('missions'),
    canResume: games.missionCanResume,
    resume: games.resumeMission,
  },
  albums,
);
refreshPrimary = bindHomePrimary(session, missions, games.missionWaits, expeditions, menu);
voyage = bindVoyageDoor({
  session,
  storage,
  play: games.playStage,
  home: () => menu!.showHome(),
  navigate: (page) => navigation.show(page),
});
bindPrivacyDoor();
bindFamilyFile(adventure, games, saving.recordGame, { home: () => menu!.showHome(), refresh });
screens.show(true);
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

/** After every command and every step that matters: save, then redraw what depends on it. */
function saveAndRedraw() {
  saving.save();
  albumUI?.refresh();
  menu?.refresh();
  report?.();
  expeditions?.();
  refreshPrimary?.();
  setDisplayText(byId('save-status'), family.status);
  // Last: on a voyage stage, the voyage has the final word on what the board says.
  voyage?.refresh();
  watchKeeping();
}

/** The board, with the game just put on it. */
function showBattle() {
  session.screen = 'battle';
  screens.show(false);
  refresh();
}
