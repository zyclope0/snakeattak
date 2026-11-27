import { BODY_FONT } from './fonts.ts';
import { addCanvasText as addCanvasCopy, setCanvasText as setCanvasCopy } from '../i18n/phaser.ts';
import Phaser from 'phaser';
import type { Entity, Game } from '../game.ts';
import { MAX_FLOATS } from './presentation.ts';
import type { Burst, Float, Presentation } from './presentation.ts';
import { bossReadout } from './bossReadout.ts';
import { EGG_PLAQUES, eggLabelPositions } from './encounterReadout.ts';
import * as TEXT from '../texts/fr/board.ts';
import { fill } from '../texts/fill.ts';
import * as DEPTH from './boardLayers.ts';
import * as BOARD_COLOR from './palette.ts';
import { cssColor } from './cssColor.ts';
import { BOARD_HEIGHT, BOARD_WIDTH, readableBoardSize } from './boardResolution.ts';
import { FramePool } from './framePool.ts';
import { copy } from '../i18n/copy.ts';

/** The sizes these texts were drawn for, on a board shown at its own size. */
const BOSS_TEXT = 12,
  PLAQUE_TEXT = 15,
  WIDE_PLAQUE_TEXT = 17,
  FLOAT_TEXT = 17;
/**
 * The plaques, by their place in the list: the imminent eggs first, then the confusion
 * summary, courage and the king's shot.
 */
const CONFUSION_PLAQUE = EGG_PLAQUES,
  COURAGE_PLAQUE = CONFUSION_PLAQUE + 1,
  SHOT_PLAQUE = COURAGE_PLAQUE + 1,
  PLAQUES = SHOT_PLAQUE + 1;
/** The plaques that hold a whole sentence. */
const wide = (index: number) => index === CONFUSION_PLAQUE || index === COURAGE_PLAQUE;
type Text = Phaser.GameObjects.Text;
type Graphics = Phaser.GameObjects.Graphics;
/** Where a plaque was drawn, for what hangs from it. */
type PlaqueBox = { left: number; y: number; width: number; half: number };
export class BattleFeedback {
  private scene: Phaser.Scene;
  /** The sizes the texts have now, to change them only when the screen does. */
  private sizes = '';
  private graphics: Graphics;
  /** Every label of a floating word, made once. */
  private labels: Text[] = [];
  /**
   * The label of each floating word, kept for the word's whole life: its text and its colour
   * are drawn once. When the labels followed the rank of the words, the fading of the oldest
   * word wrote every following label again.
   */
  private words: FramePool<Float, Text>;
  private encounterLabels: Text[] = [];
  private bossLabel: Text;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(DEPTH.feedback);
    this.bossLabel = addCanvasCopy(scene.add, 550, 13, '', {
      fontFamily: BODY_FONT,
      fontSize: `${BOSS_TEXT}px`,
      color: '#ffe2a0',
    })
      .setOrigin(0.5)
      .setDepth(DEPTH.feedbackLabels);
    for (let i = 0; i < PLAQUES; i++)
      this.encounterLabels.push(
        addCanvasCopy(scene.add, 0, 0, '', {
          fontFamily: BODY_FONT,
          fontSize: `${wide(i) ? WIDE_PLAQUE_TEXT : PLAQUE_TEXT}px`,
          fontStyle: 'bold',
          color: '#ffe2a0',
          stroke: '#17382b',
          strokeThickness: 2,
        })
          .setOrigin(0.5)
          .setDepth(DEPTH.feedbackLabels)
          .setVisible(false),
      );
    for (let i = 0; i < MAX_FLOATS; i++)
      this.labels.push(
        addCanvasCopy(scene.add, 0, 0, '', {
          fontFamily: BODY_FONT,
          fontSize: `${FLOAT_TEXT}px`,
          fontStyle: 'bold',
          stroke: '#233e2d',
          strokeThickness: 3,
        })
          .setOrigin(0.5)
          .setDepth(DEPTH.floatingWords)
          .setVisible(false),
      );
    // There are as many labels as words can live at once: a word always finds a free one.
    const free = [...this.labels];
    this.words = new FramePool<Float, Text>({
      maxIdle: MAX_FLOATS,
      create: () => free.pop()!,
      activate: () => {},
      deactivate: (label) => label.setVisible(false),
      destroy: (label) => label.destroy(),
    });
  }
  /**
   * The board is drawn at about half size on a phone: its texts grow so that they are read
   * at the same size everywhere. Each text has its own need: one may have to grow on a
   * screen where another is already large enough.
   */
  private fit() {
    const size = (drawn: number) => readableBoardSize(this.scene, drawn);
    const [boss, plaque, widePlaque, float] = [
      BOSS_TEXT,
      PLAQUE_TEXT,
      WIDE_PLAQUE_TEXT,
      FLOAT_TEXT,
    ].map(size);
    const sizes = `${boss} ${plaque} ${widePlaque} ${float}`;
    if (sizes === this.sizes) return;
    this.sizes = sizes;
    this.bossLabel.setFontSize(boss);
    for (const [i, label] of this.encounterLabels.entries())
      label.setFontSize(wide(i) ? widePlaque : plaque);
    for (const label of this.labels) label.setFontSize(float);
  }
  draw(p: Presentation, game: Game, reduced: boolean) {
    const g = this.graphics;
    g.clear();
    this.fit();
    this.drawEncounter(p);
    this.drawFloats(p.floats, reduced);
    drawBursts(g, p.bursts, reduced);
    // The allies, then the snakes.
    for (const u of game.units) drawReaction(g, p.reactions, u);
    for (const u of game.enemies) drawReaction(g, p.reactions, u);
    // Transient event notices live in the HTML line below the lane corridors.
    this.drawBoss(p, game, reduced);
  }
  /** The numbers and words that rise and fade; a later word is drawn over the older ones. */
  private drawFloats(floats: readonly Float[], reduced: boolean) {
    const words = this.words;
    // The labels of the words that faded are given back first, for the new words to take.
    words.beginFrame();
    for (const word of floats) if (words.get(word)) words.acquire(word);
    words.endFrame();
    for (const word of floats) {
      // A free label that already shows this word in this colour is taken first: a crowded
      // board repeats the same few numbers, and such a label needs no drawing again.
      const fresh = !words.get(word),
        label = words.acquire(
          word,
          (free) => free.text === copy(word.text) && free.style.color === word.color,
        );
      if (fresh) {
        // The engine draws a text again each time its colour is set, even to the same one.
        if (label.style.color !== word.color) label.setColor(word.color);
        setCanvasCopy(label, word.text).setToTop();
        // A new word goes over the words already shown, as it came after them. Moved to the
        // end of the whole list, the label goes back among the floating words when the list
        // is sorted again, still the last of them.
        this.scene.children.queueDepthSort();
      }
      const progress = word.age / word.duration;
      label
        .setVisible(true)
        .setPosition(word.x, word.y - (reduced ? 0 : progress * 26))
        .setAlpha(Math.min(1, (1 - progress) * 3));
    }
  }
  /** The king's name, his gauge at the top of the board, and the marks under him. */
  private drawBoss(p: Presentation, game: Game, reduced: boolean) {
    const g = this.graphics;
    const boss = game.enemies.find((e) => e.boss && e.hp > 0);
    this.bossLabel.setVisible(!!boss);
    if (!boss) return;
    // The name keeps its top edge; the gauge goes down by what the name grew.
    const grown = readableBoardSize(this.scene, BOSS_TEXT) - BOSS_TEXT;
    this.bossLabel.setY(13 + grown / 2);
    g.fillStyle(0xf3ac79, 0.95);
    g.fillTriangle(boss.x - 6, boss.y + 39, boss.x + 6, boss.y + 39, boss.x, boss.y + 31);
    setCanvasCopy(
      this.bossLabel,
      fill(
        TEXT.kingSnakeNNPvN,
        Math.ceil(boss.hp),
        Math.ceil(boss.maxHp),
        bossReadout(boss, game.tuning) ? fill(TEXT.phaseN3, boss.bossState!.phase) : '',
      ),
    );
    g.fillStyle(0x183829);
    g.fillRoundedRect(410, 24 + grown, 280, 9, 4);
    g.fillStyle(0xe7ad6c);
    g.fillRoundedRect(412, 26 + grown, 276 * Math.max(0, boss.hp / boss.maxHp), 5, 2);
    g.lineStyle(2, 0xeac26c, 0.6);
    g.strokeEllipse(boss.x, boss.y + 24, 90 + (reduced ? 0 : Math.sin(p.clock * 3) * 6), 28);
  }
  private drawEncounter(p: Presentation) {
    const r = p.encounter;
    // How much larger than drawn the short plaques are (eggs, the king's shot).
    const scale = readableBoardSize(this.scene, PLAQUE_TEXT) / PLAQUE_TEXT;
    for (const label of this.encounterLabels) label.setVisible(false);
    const g = this.graphics,
      eggLabels = eggLabelPositions(r.eggs, scale);
    for (const [i, egg] of r.eggs.entries()) {
      const label = eggLabels[i];
      g.lineStyle(1.5, BOARD_COLOR.parchment, 0.85);
      g.lineBetween(label.x, label.y + 14 * scale, egg.x, egg.y - 30);
      this.plaque(i, egg.label, label.x, label.y, 146, BOARD_COLOR.parchment, '#ffe2a0');
      drawCrack(g, egg);
    }
    if (r.confusion)
      // Actors already draws a question mark on every affected ally.
      this.plaque(
        CONFUSION_PLAQUE,
        r.confusion.label,
        // Larger, it is pushed against the left edge of the board, clear of the line where
        // the page announces events in the middle.
        scale === 1 ? 278 : 0,
        585,
        246,
        0xd8b8e9,
        cssColor(BOARD_COLOR.confusion),
      );
    if (r.encouragement)
      drawCourageMarks(
        g,
        this.plaque(
          COURAGE_PLAQUE,
          r.encouragement.label,
          842,
          585,
          420,
          BOARD_COLOR.parchment,
          '#ffe2a0',
        ),
        r.encouragement.ratio,
      );
    if (r.shot)
      // The only target shape remains in BossSignals, using the same readout.
      this.plaque(
        SHOT_PLAQUE,
        r.shot.label,
        r.shot.x,
        r.shot.y - r.shot.radius - 9 - 14 * scale,
        168,
        0xf3ac79,
        cssColor(BOARD_COLOR.kingWarning),
      );
  }
  /**
   * Fixed plaques remain legible without animation, including reduced motion. They grow
   * with their text and stay on the board. A plaque that holds a whole sentence takes the
   * width its larger text needs, no more: twice as wide, it would cross the board.
   */
  private plaque(
    index: number,
    text: string,
    x: number,
    y: number,
    width: number,
    color: number,
    textColor: string,
  ): PlaqueBox {
    const g = this.graphics;
    const label = setCanvasCopy(this.encounterLabels[index], text);
    if (label.style.color !== textColor) label.setColor(textColor);
    const drawn = wide(index) ? WIDE_PLAQUE_TEXT : PLAQUE_TEXT;
    const grow = readableBoardSize(this.scene, drawn) / drawn;
    // Courage keeps room on its left for its arrow, which touched the first letter.
    const arrow = index === COURAGE_PLAQUE && grow !== 1 ? 16 : 0;
    const w =
        grow === 1 ? width : wide(index) ? Math.max(width, label.width + 28 + arrow) : width * grow,
      half = 14 * grow;
    const px = Math.max(w / 2 + 4, Math.min(BOARD_WIDTH - 4 - w / 2, x)),
      py = Math.max(145, Math.min(Math.min(597, BOARD_HEIGHT - 3 - half), y));
    g.fillStyle(0x17382b, 0.96);
    g.fillRoundedRect(px - w / 2, py - half, w, half * 2, 6);
    g.lineStyle(1.5, color, 0.95);
    g.strokeRoundedRect(px - w / 2, py - half, w, half * 2, 6);
    label.setPosition(px + arrow / 2, py).setVisible(true);
    return { left: px - w / 2, y: py, width: w, half };
  }
}

/** Six sparks fly from a blow and fade. */
function drawBursts(g: Graphics, bursts: readonly Burst[], reduced: boolean) {
  for (const b of bursts) {
    const fade = 1 - b.age / 0.6;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3,
        spread = reduced ? 8 : 8 + b.age * 40;
      g.fillStyle(b.color, fade * 0.8);
      g.fillCircle(b.x + Math.cos(angle) * spread, b.y + Math.sin(angle) * spread, 3 * fade + 1.5);
    }
  }
}
/** A ring under a fighter that was healed, around one that was hurt. */
function drawReaction(g: Graphics, reactions: Presentation['reactions'], u: Entity) {
  const r = reactions.get(u.id);
  if (!r) return;
  if (r.heal > 0) {
    g.lineStyle(2, 0xc4f39e, r.heal * 0.8);
    g.strokeEllipse(u.x, u.y + 14, 40 + (1 - r.heal) * 15, 15);
  }
  if (r.hurt > 0.45) {
    g.lineStyle(2, 0xffdba0, r.hurt * 0.7);
    g.strokeCircle(u.x, u.y - 9, 17);
  }
}
/** A shell crack supplements the existing egg progress arc and wobble. */
function drawCrack(g: Graphics, egg: { x: number; y: number }) {
  g.lineStyle(3, 0xffe2a0, 1);
  g.lineBetween(egg.x - 5, egg.y - 26, egg.x + 3, egg.y - 18);
  g.lineBetween(egg.x + 3, egg.y - 18, egg.x - 3, egg.y - 10);
  g.lineBetween(egg.x - 3, egg.y - 10, egg.x + 4, egg.y - 3);
}
/** The arrow and the gauge of courage are drawn from its plaque, wherever it had to go. */
function drawCourageMarks(g: Graphics, at: PlaqueBox, ratio: number) {
  g.fillStyle(BOARD_COLOR.parchment, 1);
  g.fillTriangle(at.left + 10, at.y - 5, at.left + 18, at.y, at.left + 10, at.y + 5);
  g.fillRoundedRect(at.left + 28, at.y + at.half + 3, (at.width - 44) * ratio, 3, 1);
}
