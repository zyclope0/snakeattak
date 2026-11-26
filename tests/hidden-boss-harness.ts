// Banc d'essai du boss caché (lot 2) : le vrai plateau (`BattleScene`) joue le combat du boss
// caché, dessiné par le calque provisoire (`src/render/hiddenBossLayer.ts`). Seule la recette
// `npm run test:hidden-boss` l'ouvre : aucun écran du jeu ne mène à ce combat.
import Phaser from 'phaser';
import { Session } from '../src/session.ts';
import { battleOver } from '../src/game.ts';
import type { Game } from '../src/game.ts';
import type { Kind } from '../src/data.ts';
import { HiddenBossGame } from '../src/hiddenBoss.ts';
import { ringsOf } from '../src/engine/bossChain.ts';
import { BattleScene } from '../src/render/BattleScene.ts';
import { HiddenBossLayer } from '../src/render/hiddenBossLayer.ts';
import { visualSettings } from '../src/render/visualSettings.ts';
import { bindControls } from '../src/ui/controls.ts';
import { bindBoardResize } from '../src/render/boardResize.ts';
import '../src/style.css';
import '../src/ui/mobileMenus.css';
// This fixture enters battle directly, without main.ts and its screen switch.
document.getElementById('app')!.hidden = false;

/** The camp the recipe buys: three shields in front, three archers behind, a club, a medic. */
const ARMY: readonly [Kind, number, number][] = [
  ['shield', 660, 180],
  ['shield', 660, 324],
  ['shield', 696, 444],
  ['archer', 900, 180],
  ['archer', 900, 324],
  ['archer', 900, 468],
  ['club', 708, 324],
  ['medic', 948, 324],
];
/** Steps of play the recipe runs at most before it gives up waiting. */
const STEP_LIMIT = 30 * 600;

const query = new URLSearchParams(location.search);
const seed = Number(query.get('seed') ?? 1);
const session = new Session(seed);
const game = new HiddenBossGame(seed);
session.useGame(game);
const refresh = bindControls(session);
refresh();
const motion = window.matchMedia('(prefers-reduced-motion:reduce)');
let layer: HiddenBossLayer | null = null;
let frames = 0;
const phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1100,
  height: 620,
  scene: [
    new BattleScene(session, refresh, (current: Game) => {
      const scene = phaser.scene.getScene('Battle');
      layer ??= new HiddenBossLayer(scene);
      layer.draw(
        current as HiddenBossGame,
        scene.time.now / 1000,
        visualSettings.reduced(motion.matches),
      );
      frames++;
    }),
  ],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
});
bindBoardResize(phaser, document.getElementById('game')!);

const state = () => {
  const chain = game.hiddenBoss.chain;
  return {
    status: game.status,
    time: game.time,
    gold: game.gold,
    units: game.units.length,
    rings: ringsOf(game).length,
    allies: chain?.allies ?? 0,
    broken: chain?.broken ?? 0,
    grown: chain?.grown ?? 0,
    gulp: chain?.gulp ?? 0,
    asleep: chain?.asleep ?? false,
    headX: chain?.head.x ?? null,
    message: game.message,
    /** What the board writes above the head: the number of rings. */
    label: layer?.label ?? null,
    frames,
  };
};
type Moment = 'enter' | 'swallow' | 'break' | 'end';
const reached: Record<Moment, (before: ReturnType<typeof state>) => boolean> = {
  enter: () => (game.hiddenBoss.chain?.head.x ?? 0) >= 380,
  swallow: (before) => (game.hiddenBoss.chain?.allies ?? 0) > before.allies,
  break: (before) => (game.hiddenBoss.chain?.broken ?? 0) > before.broken,
  end: () => battleOver(game),
};
Object.assign(window, {
  bossFixture: {
    session,
    phaser,
    state,
    /** Buys the camp of the recipe; how many allies were placed. */
    prepare: () => ARMY.filter(([kind, x, y]) => game.recruit(kind, x, y)).length,
    /**
     * Plays on, step after step, until `moment`; the state before and after, and the rings
     * the body had just before the step that made the moment.
     */
    runUntil(moment: Moment) {
      const before = state();
      let last = before.rings;
      for (let i = 0; i < STEP_LIMIT && !battleOver(game) && !reached[moment](before); i++) {
        last = ringsOf(game).length;
        game.step(1 / 30);
      }
      return { before, last, after: state() };
    },
  },
});
