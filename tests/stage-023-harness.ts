import { bindBoardResize } from '../src/render/boardResize.ts';
// Browser-only fixture: never imported by production.
import Phaser from 'phaser';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { lanePoint } from '../src/routes.ts';
import { BattleScene } from '../src/render/BattleScene.ts';
import { bindControls } from '../src/ui/controls.ts';
import '../src/style.css';

const query = new URLSearchParams(location.search);
const layout = Number(query.get('layout') ?? 0) as 0 | 1 | 2;
const session = new Session(2026);
const run = { ...createMissionRun('trois-ponts', 2026), layout };
const game = query.has('classic') ? new Game(2026) : new Game(2026, undefined, run);
if (query.has('classic')) game.wave = Number(query.get('wave') ?? 0);
session.useGame(game);
game.gold = 10000;
for (const [kind, x, y] of [
  ['shield', 708, 180],
  ['archer', 864, 180],
  ['nurse', 912, 252],
  ['ninja', 756, 324],
  ['archer', 888, 324],
  ['dragon', 864, 468],
] as const)
  game.recruit(kind, x, y);
game.startWave();
game.step(1 / 30);
const template = game.enemies[0];
game.remaining = 0;
game.enemies = [0, 1, 2].flatMap((lane) =>
  [0, 1].map((i) => ({
    ...template,
    id: 4000 + lane * 2 + i,
    ...lanePoint(624 - i * 168, lane, game.level),
    lane,
    stage: 3,
    hp: 180,
    maxHp: 180,
    path: [],
    nav: 0,
    variant: lane === 1 ? ('spitter' as const) : ('normal' as const),
  })),
);
game.nextId = 5000;
session.advance = () => {};
const refresh = bindControls(session);
refresh();
const phaser = new Phaser.Game({
  type: query.has('canvas') ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  width: 1100,
  height: 620,
  scene: [new BattleScene(session, refresh)],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
});
bindBoardResize(phaser, document.getElementById('game')!);
Object.assign(window, {
  stageFixture: {
    session,
    phaser,
    refresh,
    setMode(mode: 'classic' | 'other' | 'bridges') {
      session.useGame(
        mode === 'classic'
          ? new Game(2026)
          : new Game(2026, undefined, {
              ...run,
              missionId: mode === 'other' ? 'refuge' : 'trois-ponts',
            }),
      );
      refresh();
    },
  },
});
