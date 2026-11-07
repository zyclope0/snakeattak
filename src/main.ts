import { bindBoardResize } from './render/boardResize.ts';
import { Game } from './game.ts';
import { createMissionProgress, createMissionProgressController } from './missionProgress.ts';
import type { MissionRun } from './missions.ts';
import { bindExpeditions } from './ui/expeditions.ts';
import { createCampMemory } from './campMemory.ts';
import { createFamilyPersistence } from './familyPersistence.ts';
import { readFamilyBackup, writeFamilyBackup } from './familyBackup.ts';
import { decodeCheckpoint } from './checkpoints.ts';
import { bindFamilyControls } from './ui/familyControls.ts';
import { bindChapterReport } from './ui/chapterReport.ts';
import { createCareer } from './progression.ts';
import { bindMenu } from './ui/menu.ts';
import { createCoach } from './ui/coaching.ts';
import { bindBattleNotices } from './ui/battleNotices.ts';
import { bindSounds } from './audio/sounds.ts';
import { createPersistence } from './checkpoints.ts';
import Phaser from 'phaser';
import { Session } from './session.ts';
import { BattleScene } from './render/BattleScene.ts';
import { bindControls } from './ui/controls.ts';
import './style.css';

let storage: Storage | undefined;
try {
  storage = window.localStorage;
} catch {
  /* Some private/file contexts block storage. */
}
const persistence = createPersistence(storage);
const family = createFamilyPersistence(storage);
const familySaved = family.load();
const missions = createMissionProgressController(
  familySaved && 'missions' in familySaved ? familySaved.missions : undefined,
);
const session = new Session();
session.screen = 'home';
const career = createCareer(storage, familySaved?.career);
const saved = familySaved
  ? familySaved.camp === null
    ? null
    : decodeCheckpoint(familySaved.camp)
  : persistence.load();
if (saved) {
  session.game = saved;
  session.hasPlaced = saved.wave > 0 || saved.units.length > 3;
}
const campMemory = createCampMemory(saved ?? undefined);
let hasCamp = !!saved;
let classicGame: Game | undefined = saved && !saved.mission ? saved : undefined;
let missionGame: Game | undefined = saved?.mission ? saved : undefined;
let expeditions: (() => void) | undefined;
let menu: ReturnType<typeof bindMenu> | undefined;
let phaser: Phaser.Game | undefined;
let report: (() => void) | undefined;
const refresh = bindControls(
  session,
  () => {
    if (hasCamp) {
      campMemory.remember(session.game);
      if (!session.game.mission) persistence.sync(session.game);
    }
    if (!session.game.mission) career.sync(session.game);
    if (hasCamp) missions.sync(session.game);
    family.sync(campMemory.raw(), career.state, missions.state);
    menu?.refresh();
    report?.();
    expeditions?.();
    document.getElementById('save-status')!.textContent = family.status;
  },
  career,
  {
    restart: () => {
      const run = session.game.mission;
      if (run) launchMission(run);
      else session.restart();
    },
  },
);
// Render restored counters before waiting for image decoding.
report = bindChapterReport(session);
refresh();
const soundFrame = bindSounds();
const coach = createCoach(session);
const battleNotices = bindBattleNotices(coach, () => !!session.selected);
phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1100,
  height: 620,
  backgroundColor: '#6a8b59',
  scene: [new BattleScene(session, refresh, soundFrame, battleNotices)],
  render: { antialias: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
});

bindBoardResize(phaser, document.getElementById('game')!);

const view = (home: boolean) => {
  document.getElementById('home-screen')!.hidden = !home;
  document.getElementById('app')!.hidden = home;
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
};
menu = bindMenu(session, career, {
  hasCamp: () => (session.game.mission ? !!missions.state.classicCamp : hasCamp),
  restore: () => {
    if (session.game.mission) {
      missionGame = session.game;
      const classic =
        classicGame && !['lost', 'won'].includes(classicGame.status)
          ? classicGame
          : missions.state.classicCamp
            ? decodeCheckpoint(missions.state.classicCamp!)
            : null;
      if (classic) campMemory.replace(missions.state.classicCamp);
      return classic;
    }
    return campMemory.load() ?? persistence.load();
  },
  started: () => {
    hasCamp = true;
    missions.switchMode(session.game.mission ? 'missions' : 'classic');
    if (!session.game.mission) classicGame = session.game;
  },
  view,
  refresh,
  progressStatus: () => family.status,
});
function launchMission(run: MissionRun) {
  if (hasCamp) missions.sync(session.game);
  if (!session.game.mission && hasCamp) classicGame = session.game;
  if (!missions.started(run)) return;
  const next = new Game(run.seed, undefined, run);
  session.useGame(next);
  missionGame = next;
  campMemory.replace(null);
  hasCamp = true;
  session.screen = 'battle';
  view(false);
  refresh();
  document.getElementById('start')!.focus({ preventScroll: true });
}
expeditions = bindExpeditions(session, missions, {
  launch: launchMission,
  launchClassic: (seed) => menu!.startFromSeed(seed),
  home: () => menu!.showHome(),
  canResume: () => !!missionGame || !!missions.state.retryCamp,
  resume: () => {
    if (!session.game.mission && hasCamp) {
      missions.sync(session.game);
      classicGame = session.game;
    }
    const game =
      missionGame && !['lost', 'won'].includes(missionGame.status)
        ? missionGame
        : missions.state.retryCamp
          ? decodeCheckpoint(missions.state.retryCamp)
          : null;
    if (!game) return;
    session.useGame(game);
    missionGame = game;
    missions.switchMode('missions');
    hasCamp = true;
    campMemory.replace(missions.state.retryCamp);
    session.screen = 'battle';
    view(false);
    refresh();
  },
});
bindFamilyControls({
  persistenceStatus: () => family.status,
  exportRaw: () => {
    if (hasCamp) campMemory.remember(session.game);
    if (!session.game.mission) career.sync(session.game);
    if (hasCamp) missions.sync(session.game);
    return writeFamilyBackup(campMemory.raw(), career.state, missions.state);
  },
  applyBackup: (backup) => {
    const canonical = readFamilyBackup(JSON.stringify(backup));
    if (!canonical) return { ok: false, message: 'Fichier invalide : rien n’a été modifié.' };
    const game = canonical.camp === null ? null : decodeCheckpoint(canonical.camp);
    if (!family.import(canonical))
      return {
        ok: false,
        message:
          'Impossible de conserver ce fichier sur ce navigateur. Ton aventure actuelle reste intacte.',
      };
    career.replaceState(canonical.career);
    missions.replaceState('missions' in canonical ? canonical.missions! : createMissionProgress());
    classicGame = game && !game.mission ? game : undefined;
    missionGame = game?.mission ? game : undefined;
    campMemory.replace(canonical.camp);
    if (game) session.useGame(game);
    else session.restart();
    hasCamp = game !== null;
    session.screen = 'home';
    return { ok: true, message: 'Aventure familiale retrouvée.' };
  },
  finished: () => {
    menu!.showHome();
    refresh();
  },
});
view(true);
menu.refresh();
expeditions();
