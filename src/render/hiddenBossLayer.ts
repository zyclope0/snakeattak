import Phaser from 'phaser';
import headUrl from '../assets/illustrated/classic-snake-tete.webp';
import ringUrl from '../assets/illustrated/classic-snake-anneau.webp';
import tailUrl from '../assets/illustrated/classic-snake-queue.webp';
import { addCanvasText, setCanvasText } from '../i18n/phaser.ts';
import type { HiddenBossGame } from '../hiddenBoss.ts';
import { ringsOf } from '../engine/bossChain.ts';
import type { Entity } from '../engine/state.ts';
import { readableBoardSize } from './boardResolution.ts';
import { standingDepth } from './boardDepth.ts';
import { Figurines } from './figurines.ts';
import type { PreparedFrame } from './figurines.ts';
import { DISPLAY_FONT } from './fonts.ts';
import { onSceneExit } from './sceneExit.ts';
import * as BOARD_COLOR from './palette.ts';
import * as DEPTH from './boardLayers.ts';

/**
 * Classic Snake sur le plateau (lot 3, 26 novembre 2026) : le dessin en pâte choisi par le
 * parent (`public/assets/illustrated/PROVENANCE-CLASSIC-SNAKE-2026-11-26.md`) — la tête, un
 * anneau pour chaque anneau du corps, et la queue à la place du dernier. Chaque morceau a le
 * liseré rouge-orangé des serpents et pâlit d'un éclair quand un coup le touche, comme les
 * serpents de `actors.ts`. Le nombre d'anneaux est écrit sur une plaque au-dessus de la tête.
 * Ce calque ne fait que lire la partie. Ses images ne sont chargées que pour ce combat
 * (`loadClassicSnakeArt`, au premier toucher du bouton de l'accueil).
 */

/** The three pictures, by the name of their texture. */
const ART = {
  'classic-snake-tete': headUrl,
  'classic-snake-anneau': ringUrl,
  'classic-snake-queue': tailUrl,
} as const;
type Piece = keyof typeof ART;
const HEAD: Piece = 'classic-snake-tete';
const RING: Piece = 'classic-snake-anneau';
const TAIL: Piece = 'classic-snake-queue';

/**
 * Puts the three pictures in the board's textures. Resolves once all three are there; rejects
 * when one does not arrive (no network, no cache), and the next call asks again.
 */
export async function loadClassicSnakeArt(textures: Phaser.Textures.TextureManager) {
  await Promise.all(
    (Object.entries(ART) as [Piece, string][]).map(async ([key, url]) => {
      if (textures.exists(key)) return;
      const picture = new Image();
      picture.src = url;
      await picture.decode();
      // Frame 0, as a sheet's first cell: the board's figurines are cut from numbered cells.
      if (!textures.exists(key))
        textures.addImage(key, picture)?.add(0, 0, 0, 0, picture.width, picture.height);
    }),
  );
}

/** Sizes on the board, in board units: the head is larger than any snake of a wave. */
const HEAD_SIZE = 78;
const RING_SIZE = 42;
const TAIL_SIZE = 46;
/** Where each picture stands on its point of the road: the bottom of its clay. */
const HEAD_ORIGIN_Y = 0.9;
const RING_ORIGIN_Y = 0.74;
const TAIL_ORIGIN_Y = 0.68;
/** The pictures stand a little below the line the rules walk on, as the snakes do. */
const GROUND_OFFSET = 12;
/** The head swells while it swallows, and lies smaller and tilted once curled up. */
const GULP_SWELL = 1.15;
const ASLEEP_SHRINK = 0.86;
const ASLEEP_TILT = -0.18;
/** Asleep, the tail lies against the back of the head, turned up. */
const CURL_REACH = 0.42;
const CURL_TILT = 0.35;
/** The rim of the snakes (`actors.ts`): one thickness around every piece. */
const RIM_WIDTH = 1.7;
const RIM_ALPHA = 0.94;
/** One pale flash per blow, 100 ms, never restarted within 0.3 s: no strobe (`actors.ts`). */
const FLASH = 0xfff4dc;
const FLASH_SECONDS = 0.1;
const FLASH_REST = 0.3;
/** A wounded ring darkens towards the colour of dry clay. */
const WOUNDED = 0xb98a5a;
/** Share of the way a drawn ring goes to its place at each frame: a broken ring is closed up. */
const CLOSE_UP = 0.3;
/** Order among pieces at the same height: the ones nearer the head lie over the ones behind. */
const PIECE_ORDER = 1e-6;
/** Size the ring count is written at, in board units, and its plate. */
const COUNT_TEXT = 17;
const COUNT_PLATE = '#4a2f1d';
const COUNT_COLOUR = '#ffe6bf';
const SHADOW = 0x263f34;

const blend = (from: number, to: number, share: number) => {
  const channel = (shift: number) =>
    Math.round(((from >> shift) & 255) * (1 - share) + ((to >> shift) & 255) * share);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
};

type Drawn = { x: number; y: number; hp: number; flashAt: number };

export class HiddenBossLayer {
  private figurines: Figurines;
  /** The Canvas renderer cannot tint an image: it shows a prepared pale silhouette instead. */
  private canvas: boolean;
  private shadows: Phaser.GameObjects.Graphics;
  /** Body and rim of each piece, by their place from the head: reused from frame to frame. */
  private bodies: Phaser.GameObjects.Image[] = [];
  private rims: Phaser.GameObjects.Image[] = [];
  private count: Phaser.GameObjects.Text;
  /** Where each ring was drawn, by id: the drawing follows the rules, a little behind. */
  private drawn = new Map<number, Drawn>();
  constructor(private scene: Phaser.Scene) {
    this.figurines = Figurines.of(scene);
    this.canvas = scene.game.renderer.type === Phaser.CANVAS;
    this.shadows = scene.add.graphics().setDepth(DEPTH.groundMarks);
    this.count = addCanvasText(scene.add, 0, 0, '', {
      fontFamily: DISPLAY_FONT,
      fontSize: `${COUNT_TEXT}px`,
      fontStyle: 'bold',
      color: COUNT_COLOUR,
      backgroundColor: COUNT_PLATE,
      padding: { x: 8, y: 3 },
    })
      .setOrigin(0.5)
      .setDepth(DEPTH.feedbackLabels)
      .setVisible(false);
    onSceneExit(scene.events, () => this.drawn.clear());
  }
  /** The number written above the head, as the board shows it; null while it shows none. */
  get label(): string | null {
    return this.count.visible ? this.count.text : null;
  }
  /** Nothing of Classic Snake on a board that plays another game. */
  hide() {
    if (!this.count.visible) return;
    this.shadows.clear();
    this.count.setVisible(false);
    this.show(0);
    this.drawn.clear();
  }
  draw(game: HiddenBossGame, clock: number, reduced: boolean) {
    const chain = game.hiddenBoss.chain;
    this.shadows.clear();
    if (!chain) return this.hide();
    const rings = ringsOf(game);
    const seen = new Set<number>();
    // Piece 0 is the head; then the rings, the last one drawn as the tail.
    for (let index = 0; index < rings.length; index++) {
      const ring = rings[index];
      seen.add(ring.id);
      const at = this.follow(ring, reduced, clock);
      const tail = index === rings.length - 1;
      const ahead = index ? rings[index - 1] : chain.head;
      const flash = !reduced && clock - at.flashAt < FLASH_SECONDS;
      this.piece(index + 1, tail ? TAIL : RING, {
        x: at.x,
        y: at.y + GROUND_OFFSET,
        size: tail ? TAIL_SIZE : RING_SIZE,
        originY: tail ? TAIL_ORIGIN_Y : RING_ORIGIN_Y,
        // The tail points away from the ring ahead of it.
        flip: tail && ahead.x < at.x,
        angle: 0,
        depth: standingDepth(at.y) - (index + 1) * PIECE_ORDER,
        flash,
        tint: blend(0xffffff, WOUNDED, 1 - Math.max(0, Math.min(1, ring.hp / ring.maxHp))),
      });
      this.shadow(at.x, at.y, tail ? TAIL_SIZE : RING_SIZE);
    }
    for (const id of this.drawn.keys()) if (!seen.has(id)) this.drawn.delete(id);
    this.drawHead(game, clock, reduced);
    // Asleep, only the head is left: its tail lies curled against it.
    if (chain.asleep) this.curledTail(chain.head);
    this.show(rings.length + 1 + (chain.asleep ? 1 : 0));
    const size = readableBoardSize(this.scene, COUNT_TEXT);
    if (this.count.style.fontSize !== `${size}px`) this.count.setFontSize(size);
    this.count.setVisible(true);
    setCanvasText(
      this.count.setPosition(chain.head.x, chain.head.y - HEAD_SIZE * 0.95),
      String(rings.length),
    );
  }
  /** Where a ring is drawn this frame, and the moment of the last blow it took. */
  private follow(ring: Entity, reduced: boolean, clock: number): Drawn {
    let at = this.drawn.get(ring.id);
    if (!at) this.drawn.set(ring.id, (at = { x: ring.x, y: ring.y, hp: ring.hp, flashAt: -1 }));
    const share = reduced ? 1 : CLOSE_UP;
    at.x += (ring.x - at.x) * share;
    at.y += (ring.y - at.y) * share;
    if (ring.hp < at.hp && clock - at.flashAt > FLASH_REST) at.flashAt = clock;
    at.hp = ring.hp;
    return at;
  }
  private drawHead(game: HiddenBossGame, clock: number, reduced: boolean) {
    const chain = game.hiddenBoss.chain!;
    const head = chain.head;
    let size = HEAD_SIZE;
    let x = head.x;
    let angle = 0;
    if (chain.asleep) {
      size *= ASLEEP_SHRINK;
      angle = ASLEEP_TILT;
    } else if (chain.gulp > 0) size *= GULP_SWELL;
    else if (head.state === 'attack' && !reduced) x += head.facing * 4 * Math.sin(clock * 12);
    this.piece(0, HEAD, {
      x,
      y: head.y + GROUND_OFFSET,
      size,
      originY: HEAD_ORIGIN_Y,
      flip: head.facing < 0,
      angle,
      depth: standingDepth(head.y),
      flash: false,
      tint: 0xffffff,
    });
    this.shadow(head.x, head.y, size);
  }
  private curledTail(head: Entity) {
    const behind = -head.facing || -1;
    this.piece(1, TAIL, {
      x: head.x + behind * HEAD_SIZE * CURL_REACH,
      y: head.y + GROUND_OFFSET,
      size: TAIL_SIZE,
      originY: TAIL_ORIGIN_Y,
      // Its tip away from the head, turned up a little: a snake rolled up to sleep.
      flip: behind > 0,
      angle: -behind * CURL_TILT,
      depth: standingDepth(head.y) - PIECE_ORDER,
      flash: false,
      tint: 0xffffff,
    });
  }
  private shadow(x: number, y: number, size: number) {
    this.shadows.fillStyle(SHADOW, 0.2);
    this.shadows.fillEllipse(x + 2, y + GROUND_OFFSET + 2, size * 0.8, size * 0.2);
  }
  /** One piece of clay, its rim behind it: `index` 0 is the head. */
  private piece(
    index: number,
    key: Piece,
    look: {
      x: number;
      y: number;
      size: number;
      originY: number;
      flip: boolean;
      angle: number;
      depth: number;
      flash: boolean;
      tint: number;
    },
  ) {
    const art = { texture: key, frame: 0 };
    const figurine = this.figurines.figurine(
      art,
      look.size,
      look.size,
      BOARD_COLOR.serpentRim,
      RIM_WIDTH,
      RIM_ALPHA,
      0.5,
      look.originY,
    );
    const rim = figurine.rim;
    this.image(this.rims, index, rim)
      .setOrigin(rim.originX, rim.originY)
      .setPosition(look.x, look.y)
      .setDisplaySize(look.size * rim.scaleX, look.size * rim.scaleY)
      .setRotation(look.angle)
      .setFlipX(look.flip)
      .setTintFill(BOARD_COLOR.serpentRim)
      .setDepth(look.depth - PIECE_ORDER / 2);
    const flashOnCanvas = look.flash && this.canvas;
    const body = this.image(
      this.bodies,
      index,
      flashOnCanvas ? this.figurines.fill(art, look.size, look.size, FLASH) : figurine.body,
    )
      .setOrigin(0.5, look.originY)
      .setPosition(look.x, look.y)
      .setDisplaySize(look.size, look.size)
      .setRotation(look.angle)
      .setFlipX(look.flip)
      .setDepth(look.depth);
    if (look.flash) body.setTintFill(FLASH);
    else body.setTint(look.tint);
  }
  /** The image at `index` of a pool, showing `frame`. */
  private image(pool: Phaser.GameObjects.Image[], index: number, frame: PreparedFrame) {
    const image = (pool[index] ??= this.scene.add.image(0, 0, frame.texture, frame.frame));
    if (image.texture.key !== frame.texture || image.frame.name !== frame.frame)
      image.setTexture(frame.texture, frame.frame);
    return image.setVisible(true);
  }
  /** The first `pieces` images of each pool are shown, the others hidden. */
  private show(pieces: number) {
    for (const pool of [this.bodies, this.rims])
      for (let i = pieces; i < pool.length; i++) pool[i].setVisible(false);
  }
}
