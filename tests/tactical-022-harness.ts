// Local QA fixture only; no production route or debug global is distributed.
import Phaser from 'phaser';
import { Session } from '../src/session.ts';
import { BattleScene } from '../src/render/BattleScene.ts';
import { bindControls } from '../src/ui/controls.ts';
import { receiveBossDamage, bossHeadsHealth } from '../src/boss.ts';
import '../src/style.css';
import '../src/ui/mobileMenus.css';
// This fixture enters battle directly, without main.ts and its screen switch.
document.getElementById('app')!.hidden = false;
const session = new Session(2207),
  game = session.game;
const scenario = new URLSearchParams(location.search).get('case');
game.gold = 5000;
if (scenario === 'medical') {
  game.units = game.units.filter((u) => u.kind === 'hero');
  game.units[0].hp = 1;
  game.recruit('medic', 864, 360);
  game.recruit('nurse', 900, 468);
  game.units.find((u) => u.kind === 'medic')!.medical!.bandages = 1;
} else if (scenario === 'flying') {
  game.wave = 5;
  game.startWave();
  game.eggs = [];
  game.step(1 / 30);
  game.remaining = 0;
  const e = game.enemies[0];
  Object.assign(e, {
    variant: 'flying',
    x: 740,
    y: 324,
    stage: 4,
    hp: 500,
    maxHp: 500,
    cool: 99,
    path: [],
    nav: 0,
  });
  game.enemies = [e];
  game.units = [];
  game.recruit('archer', 924, 324);
  game.recruit('dragon', 924, 180);
  game.recruit('medic', 948, 420);
} else {
  game.wave = 11;
  game.startWave();
  game.eggs = [];
  game.remaining = 4;
  game.step(1 / 30);
  const king = game.enemies.find((e) => e.boss)!;
  Object.assign(king, { x: 732, y: 324, lane: 1, stage: 4, path: [], nav: 0 });
  const guards = game.enemies.filter((e) => e.court?.role === 'guard');
  guards.forEach((e, i) =>
    Object.assign(e, { x: 780, y: 260 + i * 128, lane: 1, path: [], nav: 0 }),
  );
  const healer = game.enemies.find((e) => e.court?.role === 'healer')!;
  Object.assign(healer, { x: 660, y: 324, lane: 1, path: [], nav: 0 });
  game.units = [];
  game.recruit('archer', 948, 324);
  game.recruit('shield', 864, 324);
  game.recruit('nurse', 924, 420);
  king.bossState!.heads!.ranged.cool = 0;
  king.bossState!.heads!.hybrid.cool = 5;
  game.step(1 / 30);
}
session.advance = () => {};
const refresh = bindControls(session);
refresh();
const phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1100,
  height: 620,
  scene: [new BattleScene(session, refresh)],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
});
(window as unknown as { tacticalFixture: unknown }).tacticalFixture = {
  game,
  session,
  phaser,
  step: (count: number) => {
    for (let i = 0; i < count; i++) game.step(1 / 30);
    refresh();
  },
  dropRanged: () => {
    const e = game.enemies.find((e) => e.boss)!;
    e.bossState!.shield = 0;
    receiveBossDamage(e.bossState!, e.bossState!.heads!.ranged.hp, true);
    e.hp = bossHeadsHealth(e.bossState!);
    refresh();
  },
};
