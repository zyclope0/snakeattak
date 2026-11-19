import { lanePoint } from '../src/routes.ts';
import { kinds } from '../src/data.ts';
import type { Kind } from '../src/data.ts';
import { createCoach } from '../src/ui/coaching.ts';
import { createPersistence } from '../src/checkpoints.ts';
// Local browser fixture only. Never referenced by the production entry point.
import Phaser from 'phaser';
import { Session } from '../src/session.ts';
import { Game } from '../src/game.ts';
import { addEffect } from '../src/engine/state.ts';
import { BattleScene } from '../src/render/BattleScene.ts';
import { bindControls } from '../src/ui/controls.ts';
import { bindBattleNotices } from '../src/ui/battleNotices.ts';
import '../src/style.css';
import '../src/ui/mobileMenus.css';
// This fixture enters battle directly, without main.ts and its screen switch.
document.getElementById('app')!.hidden = false;
const session = new Session(2026),
  game = session.game;
const coach = createCoach(session);
const scenario = new URLSearchParams(location.search).get('scenario');
if (scenario === 'royal-guard') {
  game.wave = 11;
  game.gold = 5000;
  game.units = [];
  for (const [kind, x, y] of [
    ['archer', 900, 324],
    ['shield', 852, 324],
    ['medic', 948, 420],
    ['ninja', 900, 468],
    ['dino', 924, 180],
  ] as const)
    game.recruit(kind, x, y);
  game.startWave();
  game.remaining = 1;
  game.eggs = [];
  game.step(1 / 30);
  const king = game.enemies[0];
  Object.assign(king, { x: 732, y: 324, lane: 1, stage: 4, path: [], nav: 0 });
  king.bossState!.shotCooldown = 0;
  for (let i = 0; i < 9; i++) game.step(1 / 30);
  session.advance = () => {};
} else if (scenario === 'bestiaire') {
  game.wave = 11;
  game.gold = 5000;
  game.units = [];
  for (const [kind, x, y] of [
    ['raptor', 804, 180],
    ['triceratops', 876, 180],
    ['stegosaurus', 828, 324],
    ['trex', 924, 324],
    ['mutantRock', 804, 420],
    ['mutantStretch', 900, 468],
  ] as const)
    game.recruit(kind, x, y);
  game.startWave();
  game.step(1 / 30);
  const template = game.enemies[0];
  game.remaining = 0;
  game.eggs = [];
  game.enemies = [
    {
      ...template,
      id: 2301,
      x: 760,
      y: 180,
      variant: 'rattlesnake' as const,
      hp: 900,
      maxHp: 900,
      stage: 4,
    },
    {
      ...template,
      id: 2302,
      x: 756,
      y: 324,
      variant: 'royal' as const,
      hp: 900,
      maxHp: 900,
      stage: 4,
    },
    {
      ...template,
      id: 2303,
      x: 720,
      y: 468,
      variant: 'mamba' as const,
      hp: 900,
      maxHp: 900,
      stage: 4,
    },
    {
      ...template,
      id: 2304,
      x: 300,
      y: 324,
      variant: 'normal' as const,
      boss: true,
      hp: 900,
      maxHp: 900,
      stage: 0,
    },
  ].map((e) => ({ ...e, path: [], nav: 0 }));
  game.nextId = 2310;
  for (let i = 0; i < 6; i++) game.step(1 / 30);
  session.advance = () => {};
} else if (scenario === 'tactics') {
  game.wave = 5;
  game.gold = 5000;
  game.units = [];
  for (const [kind, x, y] of [
    ['ninja', 816, 276],
    ['shield', 876, 324],
    ['archer', 924, 324],
    ['dragon', 900, 180],
    ['dino', 900, 468],
    ['medic', 948, 420],
    ['club', 828, 468],
  ] as const)
    game.recruit(kind, x, y);
  game.startWave();
  game.step(1 / 30);
  game.remaining = 0;
  game.eggs = [];
  const template = game.enemies[0];
  game.enemies = [
    {
      ...template,
      id: 2001,
      ...lanePoint(764, 0, game.level),
      lane: 0,
      stage: 4,
      variant: 'umbrella' as const,
      state: 'move' as const,
      hp: 800,
      maxHp: 800,
      path: [],
      nav: 0,
    },
    {
      ...template,
      id: 2002,
      ...lanePoint(692, 1, game.level),
      lane: 1,
      stage: 4,
      variant: 'umbrella' as const,
      state: 'move' as const,
      hp: 800,
      maxHp: 800,
      path: [],
      nav: 0,
    },
    {
      ...template,
      id: 2003,
      x: 804,
      y: 324,
      lane: 1,
      stage: 4,
      variant: 'spitter' as const,
      state: 'move' as const,
      hp: 800,
      maxHp: 800,
      path: [],
      nav: 0,
    },
    {
      ...template,
      id: 2004,
      ...lanePoint(876, 2, game.level, 11),
      lane: 2,
      stage: 5,
      variant: 'umbrella' as const,
      state: 'move' as const,
      hp: 800,
      maxHp: 800,
      path: [],
      nav: 0,
    },
  ];
  game.nextId = 2010;
  game.offerFeast(1, 'sticky');
  for (let i = 0; i < 6; i++) game.step(1 / 30);
  session.advance = () => {};
} else if (scenario === 'refuge' || scenario === 'spawn') {
  game.wave = scenario === 'refuge' ? 8 : 4;
  game.base = scenario === 'refuge' ? 28 : 100;
  game.normalizeCamp();
  session.advance = () => {};
} else if (scenario === 'spinosaure') {
  // The spinosaurus of the seventh revision: one in the river beside the middle bridge, one
  // on the bank sweeping its sail. The engine is frozen on that moment.
  session.useGame(new Game(2026, undefined, undefined, 7));
  const seventh = session.game;
  seventh.wave = 11;
  seventh.gold = 5000;
  seventh.units = [];
  seventh.recruit('spinosaurus', 660, 228);
  seventh.recruit('spinosaurus', 900, 420);
  seventh.startWave();
  seventh.step(1 / 30);
  const template = seventh.enemies[0];
  seventh.remaining = 0;
  seventh.eggs = [];
  seventh.enemies = [
    { ...template, id: 8001, variant: 'normal', x: 520, y: 335, lane: 1, path: [], nav: 9 },
    { ...template, id: 8002, variant: 'normal', x: 700, y: 232, lane: 0, path: [], nav: 9 },
    { ...template, id: 8003, variant: 'fang', x: 640, y: 196, lane: 0, path: [], nav: 9 },
  ];
  const [bank, swimmer] = seventh.units;
  Object.assign(swimmer, { x: 528, y: 376, facing: -1 });
  swimmer.swim = { wait: 0, prey: 8001, back: false };
  addEffect(seventh, swimmer, swimmer, 'splash');
  addEffect(seventh, bank, seventh.enemies[1], 'sail');
  session.advance = () => {};
} else if (scenario === 'allies') {
  game.wave = 11;
  game.gold = 20000;
  const hero = game.units.find((u) => u.kind === 'hero')!;
  Object.assign(hero, { x: 660, y: 156, homeX: 660, homeY: 156 });
  game.units = [hero];
  for (const kind of Object.keys(kinds) as Kind[]) {
    if (kind === 'hero') continue;
    let bought = false;
    for (const y of [132, 216, 300, 384, 468, 528]) {
      for (const x of [624, 708, 792, 876, 960])
        if (game.recruit(kind, x, y)) {
          bought = true;
          break;
        }
      if (bought) break;
    }
  }
  session.advance = () => {};
} else if (scenario === 'grove' || scenario === 'ruins') {
  game.wave = scenario === 'grove' ? 4 : 8;
  game.gold = 3000;
  game.normalizeCamp();
  for (const y of [180, 324, 468]) game.recruit('archer', 948, y);
  game.recruit('ninja', 876, 276);
  game.recruit('medic', 900, 324);
  game.startWave();
  game.step(1 / 30);
  game.remaining = 0;
  game.eggs = [];
  const template = game.enemies[0];
  game.enemies = [180, 324, 468].flatMap((y, lane) =>
    [0, 1].map((i) => ({
      ...template,
      id: 1400 + lane * 2 + i,
      x: 684 - i * 48,
      y,
      lane,
      stage: 3,
      hp: 800,
      maxHp: 800,
      path: [],
      nav: 0,
      variant: scenario === 'grove' ? ('clockwork' as const) : ('spring' as const),
    })),
  );
  session.advance = () => {};
} else if (scenario === 'formation') {
  game.gold = 3000;
  for (const y of [180, 324, 468]) game.recruit('archer', 948, y);
  game.recruit('ninja', 876, 276);
  game.recruit('medic', 900, 324);
  game.wave = 5;
  game.startWave();
  game.step(1 / 30);
  game.remaining = 0;
  game.eggs = [];
  const template = game.enemies[0];
  game.enemies = [180, 324, 468].flatMap((y, lane) =>
    [0, 1, 2].map((i) => ({
      ...template,
      id: 1000 + lane * 3 + i,
      x: 684 - i * 24,
      y,
      lane,
      stage: 3,
      hp: 800,
      maxHp: 800,
      path: [],
      nav: 0,
      variant: lane === 1 ? ('spitter' as const) : ('normal' as const),
    })),
  );
  session.advance = () => {}; // Fixture clock only; the production clock is unchanged.
  (
    window as unknown as { battleFixture: { step: (n: number) => void; game: typeof game } }
  ).battleFixture = {
    game,
    step(n) {
      for (let i = 0; i < n; i++) game.step(1 / 30);
    },
  };
} else if (scenario === 'boss') {
  game.wave = 11;
  game.startWave();
  game.step(0.05);
  game.remaining = 0;
  game.eggs = [];
  const king = game.enemies[0];
  king.boss = true;
  king.variant = 'normal';
  king.x = 350;
  king.y = 324;
  king.stage = 0;
  king.lane = 1;
  king.hp = 900;
  king.maxHp = 900;
} else if (scenario === 'honey') {
  game.startWave();
  game.step(0.05);
  game.remaining = 0;
  game.eggs = [];
  const e = game.enemies[0];
  e.x = 372;
  e.y = 180;
  e.stage = 0;
  e.lane = 0;
  e.hp = 1000;
  e.maxHp = 1000;
  game.offerFeast(2);
  game.rng = 0;
} else if (scenario === 'placement') {
  session.selected = 'archer';
} else if (scenario === 'storage-failed') {
  game.startWave();
  game.remaining = 0;
  game.enemies = [];
  game.eggs = [];
} else if (scenario === 'won') {
  game.wave = 12;
  game.status = 'won';
  game.message = 'Victoire ! King Snake est vaincu !';
  game.kills = 99;
  game.base = 76;
}
game.normalizeCamp();
const persistence = createPersistence(
  scenario === 'storage-failed'
    ? {
        getItem: () => {
          throw Error('blocked');
        },
        setItem: () => {
          throw Error('quota');
        },
      }
    : undefined,
);
persistence.load();
const refresh = bindControls(session, () => {
  persistence.sync(session.game);
  document.getElementById('save-status')!.textContent = persistence.status;
});
refresh();
const scene = new BattleScene(
  session,
  refresh,
  () => {},
  bindBattleNotices(coach, () => !!session.selected),
);
if (scenario === 'tactics') {
  // The engine is already frozen. Keep its real effects visible while the
  // browser opens disclosures; do not let machine speed expire the pose.
  const update = scene.update.bind(scene);
  scene.update = (time) => update(time, 0);
}
const phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1100,
  height: 620,
  scene: [scene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
});

if (
  scenario === 'refuge' ||
  scenario === 'spawn' ||
  scenario === 'tactics' ||
  scenario === 'bestiaire' ||
  scenario === 'spinosaure' ||
  scenario === 'royal-guard'
)
  (
    window as unknown as { strongholdFixture: { session: Session; phaser: Phaser.Game } }
  ).strongholdFixture = { session, phaser };
