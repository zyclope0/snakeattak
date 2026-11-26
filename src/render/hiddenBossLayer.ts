import type Phaser from 'phaser';
import { addCanvasText, setCanvasText } from '../i18n/phaser.ts';
import { ENEMY_ART } from '../art.ts';
import type { HiddenBossGame } from '../hiddenBoss.ts';
import { ringsOf } from '../engine/bossChain.ts';
import { spriteFlip } from './actorLayout.ts';
import { readableBoardSize } from './boardResolution.ts';
import { standingDepth } from './boardDepth.ts';
import { DISPLAY_FONT } from './fonts.ts';
import { onSceneExit } from './sceneExit.ts';
import * as DEPTH from './boardLayers.ts';

/**
 * DESSIN PROVISOIRE du boss caché (lot 2, 26 novembre 2026), fait avec ce qui existe déjà :
 * la tête est l'image du serpent ordinaire, agrandie ; les anneaux sont des ronds couleur
 * pâte dessinés par Phaser ; le nombre d'anneaux est écrit au-dessus de la tête. Le vrai
 * dessin en pâte (tête, anneau, queue) est le lot 3 et une dépense que le parent décide.
 * Ce calque ne fait que lire la partie ; aucun écran du jeu ne l'ouvre encore.
 */

/** Size of the head's picture, in board units: a little larger than any snake of a wave. */
const HEAD_SIZE = 96;
/** The head swells while it swallows, and lies smaller once curled up. */
const GULP_SWELL = 1.18;
const ASLEEP_SHRINK = 0.82;
/** Radius of a ring, and of the curled body drawn around the sleeping head. */
const RING_RADIUS = 13;
const CURL_RADIUS = 34;
/** Clay: two tones along the body, a dark rim, a lit edge, and the colour of a cracked ring. */
const CLAY = [0xc98a4b, 0xb47538] as const;
const CLAY_RIM = 0x5b3a24;
const CLAY_LIGHT = 0xecc08a;
const CLAY_CRACKED = 0x7a4f31;
const SHADOW = 0x29331f;
/** Share of the way a drawn ring goes to its place at each frame: a broken ring is closed up. */
const CLOSE_UP = 0.3;
/** Size the ring count is written at, in board units, and its plate. */
const COUNT_TEXT = 17;
const COUNT_PLATE = '#4a2f1d';
const COUNT_COLOUR = '#ffe6bf';

const blend = (from: number, to: number, share: number) => {
  const channel = (shift: number) =>
    Math.round(((from >> shift) & 255) * (1 - share) + ((to >> shift) & 255) * share);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
};

export class HiddenBossLayer {
  private body: Phaser.GameObjects.Graphics;
  private head: Phaser.GameObjects.Image;
  private count: Phaser.GameObjects.Text;
  /** Where each ring was drawn, by id: the drawing follows the rules, a little behind. */
  private drawn = new Map<number, { x: number; y: number }>();
  constructor(private scene: Phaser.Scene) {
    this.body = scene.add.graphics().setDepth(DEPTH.standing);
    const art = ENEMY_ART.normal;
    this.head = scene.add
      .image(0, 0, art.texture, art.frame)
      .setOrigin(0.5, 0.82)
      .setVisible(false);
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
  draw(game: HiddenBossGame, clock: number, reduced: boolean) {
    const chain = game.hiddenBoss.chain;
    this.body.clear();
    this.head.setVisible(!!chain);
    this.count.setVisible(!!chain);
    if (!chain) return;
    const rings = ringsOf(game);
    const seen = new Set<number>();
    // From the tail to the head: the rings nearer the head lie over the ones behind.
    for (let index = rings.length - 1; index >= 0; index--) {
      const ring = rings[index];
      seen.add(ring.id);
      const at = this.drawn.get(ring.id) ?? { x: ring.x, y: ring.y };
      const share = reduced ? 1 : CLOSE_UP;
      at.x += (ring.x - at.x) * share;
      at.y += (ring.y - at.y) * share;
      this.drawn.set(ring.id, at);
      this.drawRing(at.x, at.y, index, ring.hp / ring.maxHp);
    }
    for (const id of this.drawn.keys()) if (!seen.has(id)) this.drawn.delete(id);
    this.drawHead(game, clock, reduced);
    const size = readableBoardSize(this.scene, COUNT_TEXT);
    if (this.count.style.fontSize !== `${size}px`) this.count.setFontSize(size);
    setCanvasText(
      this.count.setPosition(chain.head.x, chain.head.y - HEAD_SIZE * 0.95),
      String(rings.length),
    );
  }
  private drawRing(x: number, y: number, index: number, life: number) {
    const g = this.body;
    const wound = 1 - Math.max(0, Math.min(1, life));
    g.fillStyle(SHADOW, 0.25);
    g.fillEllipse(x, y + RING_RADIUS * 0.75, RING_RADIUS * 2.1, RING_RADIUS * 0.8);
    g.fillStyle(blend(CLAY[index % 2], CLAY_CRACKED, wound * 0.7), 1);
    g.fillCircle(x, y, RING_RADIUS);
    g.lineStyle(2, CLAY_RIM, 0.95);
    g.strokeCircle(x, y, RING_RADIUS);
    g.fillStyle(CLAY_LIGHT, 0.55);
    g.fillCircle(x - RING_RADIUS * 0.35, y - RING_RADIUS * 0.4, RING_RADIUS * 0.32);
    // A ring that lost half its life shows a crack.
    if (wound >= 0.5) {
      g.lineStyle(2, CLAY_RIM, 0.9);
      g.lineBetween(x - 2, y - RING_RADIUS + 2, x + 3, y - 2);
      g.lineBetween(x + 3, y - 2, x - 1, y + RING_RADIUS * 0.6);
    }
  }
  private drawHead(game: HiddenBossGame, clock: number, reduced: boolean) {
    const chain = game.hiddenBoss.chain!;
    const head = chain.head;
    let size = HEAD_SIZE;
    let x = head.x;
    if (chain.asleep) {
      size *= ASLEEP_SHRINK;
      // Curled up: the last of its clay wound around the head.
      this.body.lineStyle(7, CLAY[0], 1);
      this.body.strokeCircle(head.x, head.y - 10, CURL_RADIUS);
      this.body.lineStyle(2, CLAY_RIM, 0.9);
      this.body.strokeCircle(head.x, head.y - 10, CURL_RADIUS + 4);
    } else if (chain.gulp > 0) size *= GULP_SWELL;
    else if (head.state === 'attack' && !reduced) x += head.facing * 4 * Math.sin(clock * 12);
    this.head
      .setPosition(x, head.y)
      .setDisplaySize(size, size)
      .setFlipX(spriteFlip('snake', 'normal', head.facing))
      .setDepth(standingDepth(head.y));
  }
}
