import type Phaser from 'phaser';
import appleUrl from '../assets/illustrated/pomme.webp';
import { APPLE_RADIUS, APPLES_TO_UNLOCK, appleOf, appleSeed } from '../apples.ts';
import type { Apple } from '../apples.ts';
import type { Game } from '../game.ts';
import { boardScale } from './boardResolution.ts';
import * as DEPTH from './boardLayers.ts';
import type { BattleJuice } from './juice.ts';
import type { Presentation } from './presentation.ts';
import { onSceneExit } from './sceneExit.ts';
import { stageComposition } from './stageLayout.ts';
import * as TEXT from '../texts/fr/board.ts';
import { fill } from '../texts/fill.ts';

/** What the board asks of the player's book of apples, and the little sound of a find. */
export type AppleHooks = {
  /** True for an apple this player already found: it does not show again. */
  has: (id: string) => boolean;
  /** Keeps an apple; how many the player has now. */
  collect: (id: string) => { count: number };
  sound: () => void;
};
export const NO_APPLE_HOOKS: AppleHooks = {
  has: () => false,
  collect: () => ({ count: 0 }),
  sound() {},
};

const TEXTURE = 'pomme';
/** A tap this close to the apple, in CSS pixels, takes it: a 48 px target on every screen. */
const TOUCH_RADIUS_CSS = 24;
/** Fallback colours while the picture is not there: a plain clay apple. */
const FALLBACK = { skin: 0xc8452f, leaf: 0x6f9a48 };

/**
 * The apple of the hidden boss on the board (`src/apples.ts` decides which wave, where and
 * when). It only reads the game: the battle never knows it is there. The picture is fetched
 * apart from the battle's: an apple that does not arrive is drawn plain, and never holds
 * back a battle.
 */
export class AppleLayer {
  private image: Phaser.GameObjects.Image | null = null;
  private plain: Phaser.GameObjects.Graphics;
  /** The game and the wave the apple below belongs to. */
  private game: Game | null = null;
  private key = '';
  private apple: Apple | null = null;
  /** Game time when its wave was first seen fighting. */
  private startedAt = 0;
  private taken = false;
  private shown = false;
  constructor(
    private scene: Phaser.Scene,
    private hooks: AppleHooks,
  ) {
    this.plain = scene.add.graphics().setDepth(DEPTH.apple).setVisible(false);
    onSceneExit(scene.events, () => this.mark(null));
    if (scene.textures.exists(TEXTURE)) this.useTexture();
    else this.fetchTexture();
  }
  private fetchTexture() {
    let closed = false;
    onSceneExit(this.scene.events, () => (closed = true));
    const picture = new Image();
    picture.onload = () => {
      if (closed) return;
      if (!this.scene.textures.exists(TEXTURE)) this.scene.textures.addImage(TEXTURE, picture);
      this.useTexture();
    };
    picture.src = appleUrl;
  }
  private useTexture() {
    this.image = this.scene.add
      .image(0, 0, TEXTURE)
      .setDisplaySize(APPLE_RADIUS * 2, APPLE_RADIUS * 2)
      .setDepth(DEPTH.apple)
      .setVisible(false);
    this.plain.clear().setVisible(false);
    // An apple already drawn plain is drawn again with its picture.
    this.shown = false;
  }
  /** The apple of the wave being played, worked out once per wave. */
  private follow(game: Game) {
    const fighting = game.status === 'fighting';
    const key = fighting ? `${game.wave}:${game.kings}` : '';
    if (game === this.game && key === this.key) return;
    this.game = game;
    this.key = key;
    this.startedAt = game.time;
    this.taken = false;
    const props = fighting ? stageComposition(game.level, appleSeed(game)).decor : [];
    const apple = fighting ? appleOf(game, props) : null;
    this.apple = apple && !this.hooks.has(apple.id) ? apple : null;
  }
  /** The apple that shows now, if any. */
  private visible(game: Game): Apple | null {
    const apple = this.apple;
    if (!apple || this.taken || game.status !== 'fighting') return null;
    return game.time - this.startedAt >= apple.delay ? apple : null;
  }
  draw(game: Game) {
    this.follow(game);
    const apple = this.visible(game);
    const show = !!apple;
    if (show === this.shown) return;
    this.shown = show;
    if (this.image) this.image.setVisible(show);
    else this.drawPlain(apple);
    if (apple) this.image?.setPosition(apple.x, apple.y);
    this.mark(apple);
  }
  /** Where it stands, in board units, for the recipes: nothing is read back from here. */
  private mark(apple: Apple | null) {
    const board = this.scene.game.canvas?.parentElement;
    if (apple) board?.setAttribute('data-apple', `${Math.round(apple.x)} ${Math.round(apple.y)}`);
    else board?.removeAttribute('data-apple');
  }
  private drawPlain(apple: Apple | null) {
    const g = this.plain.clear().setVisible(!!apple);
    if (!apple) return;
    g.fillStyle(FALLBACK.skin).fillCircle(apple.x, apple.y + 2, APPLE_RADIUS * 0.75);
    g.fillStyle(FALLBACK.leaf).fillEllipse(apple.x + 5, apple.y - 15, 12, 6);
  }
  /**
   * A press at `point` (board units) takes the apple when it is near enough: true then, and
   * the press is spent, it places nothing.
   */
  press(
    game: Game,
    point: { x: number; y: number },
    presentation: Presentation,
    juice: BattleJuice,
  ) {
    this.follow(game);
    const apple = this.visible(game);
    if (!apple) return false;
    const reach = Math.max(
      APPLE_RADIUS + 4,
      (TOUCH_RADIUS_CSS * this.scene.scale.displayScale.x) / boardScale(this.scene),
    );
    if (Math.hypot(point.x - apple.x, point.y - apple.y) > reach) return false;
    this.taken = true;
    const { count } = this.hooks.collect(apple.id);
    presentation.appleFound(
      apple.x,
      apple.y,
      fill(TEXT.pommeNSurN, Math.min(count, APPLES_TO_UNLOCK), APPLES_TO_UNLOCK),
    );
    juice.pop(apple.x, apple.y);
    this.hooks.sound();
    this.draw(game);
    return true;
  }
}
