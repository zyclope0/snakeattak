// Controlled presentation QA only. Native BattleScene frame timing and real controls.
import { initializeLanguageControls } from '../src/i18n/controls.ts';
import { Session } from '../src/session.ts';
import { bindControls } from '../src/ui/controls.ts';
import { createCareer } from '../src/progression.ts';
import { createCoach } from '../src/ui/coaching.ts';
import { bindBattleNotices } from '../src/ui/battleNotices.ts';
import { createRecruitmentReminder, createReminderMarkers } from '../src/ui/recruitmentReminder.ts';
import { BattleScene } from '../src/render/BattleScene.ts';
import { bindBoardResize } from '../src/render/boardResize.ts';
import Phaser from 'phaser';
import '../src/style.css';
await initializeLanguageControls();
const session = new Session(7000362);
session.game.gold = 800;
document.getElementById('app')!.hidden = false;
document.getElementById('home-screen')!.hidden = true;
const refresh = bindControls(session, () => {}, createCareer());
const coach = createCoach(session);
let danger = false;
const storage = new URLSearchParams(location.search).has('refused')
  ? {
      getItem: () => {
        throw Error('Controlled storage refusal');
      },
      setItem: () => {
        throw Error('Controlled storage refusal');
      },
    }
  : localStorage;
const notices = bindBattleNotices(
  () => (danger ? { title: 'Danger de contrôle', subtitle: 'Priorité', priority: 5 } : coach()),
  () => !!session.selected || !!session.selectedFeast,
  createRecruitmentReminder(session, createReminderMarkers(storage)),
);
const phaser = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: 1100,
  height: 620,
  scene: [new BattleScene(session, refresh, () => {}, notices)],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
});
bindBoardResize(phaser, document.getElementById('game')!);
Object.assign(window, {
  balanceFixture: {
    session,
    refresh,
    danger(value: boolean) {
      danger = value;
    },
  },
});
