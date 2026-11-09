// Synthetic render benchmark only. Production never imports this fixture.
import Phaser from 'phaser';
import { Game } from '../src/game.ts';
import { Session } from '../src/session.ts';
import type { Entity } from '../src/game.ts';
import type { Kind } from '../src/data.ts';
import { kinds } from '../src/data.ts';
import { createMissionRun } from '../src/missions.ts';
import { BattleScene } from '../src/render/BattleScene.ts';
import { lanePoint } from '../src/routes.ts';
import '../src/style.css';
// This fixture enters battle directly, without main.ts and its screen switch.
document.getElementById('app')!.hidden = false;

const game = new Game(2026, undefined, createMissionRun('trois-ponts', 2026));
const session = new Session(2026);
session.useGame(game);
session.advance = () => {};
game.startWave();
game.step(1 / 30);
game.remaining = 0;
const ally = game.units[0],
  snake = game.enemies[0];
const counters = { imagesCreated: 0, imagesDestroyed: 0, textsCreated: 0, textsDestroyed: 0 };
let measuring = false,
  lastFrame = 0;
let generation = -1,
  renderedGeneration = -1;
const cpu: number[] = [],
  frame: number[] = [];
class MeasuredBattle extends BattleScene {
  override create() {
    const image = this.add.image.bind(this.add),
      text = this.add.text.bind(this.add);
    this.add.image = (...args: Parameters<typeof image>) => {
      if (measuring) counters.imagesCreated++;
      return image(...args);
    };
    this.add.text = (...args: Parameters<typeof text>) => {
      if (measuring) counters.textsCreated++;
      return text(...args);
    };
    super.create();
  }
  override update(t: number, delta: number) {
    const now = performance.now();
    super.update(t, delta);
    renderedGeneration = generation;
    if (measuring) {
      cpu.push(performance.now() - now);
      if (lastFrame) frame.push(now - lastFrame);
      lastFrame = now;
    }
  }
}
const destroyImage = Phaser.GameObjects.Image.prototype.destroy;
Phaser.GameObjects.Image.prototype.destroy = function (fromScene?: boolean) {
  if (measuring && this.scene) counters.imagesDestroyed++;
  destroyImage.call(this, fromScene);
};
const destroyText = Phaser.GameObjects.Text.prototype.destroy;
Phaser.GameObjects.Text.prototype.destroy = function (fromScene?: boolean) {
  if (measuring && this.scene) counters.textsDestroyed++;
  destroyText.call(this, fromScene);
};
function profile(busy: boolean) {
  const roster: Kind[] = ['club', 'shield', 'archer', 'ninja', 'dragon', 'medic', 'dino', 'hero'];
  game.units = Array.from({ length: busy ? 48 : 8 }, (_, i) => {
    const kind = roster[i % roster.length];
    const x = 624 + (i % 8) * 48,
      y = 132 + Math.floor(i / 8) * 72;
    return {
      ...ally,
      id: 100 + i,
      kind,
      x,
      y,
      homeX: x,
      homeY: y,
      hp: kinds[kind].hp,
      maxHp: kinds[kind].hp,
      path: [],
      state: 'idle',
      medical: kind === 'medic' ? { phase: 'ready', bandages: 6, remaining: 0 } : undefined,
    } as Entity;
  });
  game.enemies = Array.from({ length: busy ? 60 : 15 }, (_, i) => {
    const lane = i % 3;
    return {
      ...snake,
      id: 2000 + i,
      ...lanePoint(180 + Math.floor(i / 3) * 26, lane, game.level),
      lane,
      variant: i % 4 === 0 ? 'armored' : i % 4 === 1 ? 'spitter' : 'normal',
      path: [],
      state: 'move',
    };
  });
  game.eggs = [];
  game.effects = Array.from({ length: busy ? 40 : 6 }, (_, i) => ({
    kind: 'arrow',
    x: 820 + (i % 4) * 12,
    y: 180 + (i % 3) * 144,
    tx: 590 + (i % 5) * 9,
    ty: 180 + (i % 3) * 144,
    life: 0.2,
  }));
}
profile(false);
const query = new URLSearchParams(location.search);
const phaser = new Phaser.Game({
  type: query.has('canvas') ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  width: 1100,
  height: 620,
  scene: [new MeasuredBattle(session, () => {})],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
});
Object.assign(window, {
  renderProbe: {
    game,
    phaser,
    profile,
    get renderedGeneration() {
      return renderedGeneration;
    },
    stabilize() {
      const scene = phaser.scene.getScene('Battle') as unknown as {
        presentation: {
          floats: unknown[];
          bursts: unknown[];
          arrivals: unknown[];
          notice: unknown;
          reactions: Map<unknown, unknown>;
          actions: Map<unknown, unknown>;
        };
      };
      const p = scene.presentation;
      p.floats.length = 0;
      p.bursts.length = 0;
      p.arrivals.length = 0;
      p.notice = null;
      p.reactions.clear();
      p.actions.clear();
    },
    start() {
      Object.keys(counters).forEach((k) => {
        counters[k as keyof typeof counters] = 0;
      });
      cpu.length = frame.length = 0;
      lastFrame = 0;
      measuring = true;
    },
    stop() {
      measuring = false;
      return { ...counters, cpu: [...cpu], frame: [...frame] };
    },
    churn(round: number) {
      generation = round;
      game.enemies = game.enemies.map((e, i) => ({ ...e, id: 10000 + round * 100 + i, path: [] }));
      game.units = game.units.map((u, i) => ({ ...u, id: 20000 + round * 100 + i, path: [] }));
    },
  },
});
