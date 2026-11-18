import { BODY_FONT } from './fonts.ts';
import { addCanvasText as addCanvasCopy, setCanvasText as setCanvasCopy } from '../i18n/phaser.ts';
import Phaser from 'phaser';
import type { Game } from '../game.ts';
import type { Presentation } from './presentation.ts';
import { bossReadout } from './bossReadout.ts';
import { eggLabelPositions } from './encounterReadout.ts';
import * as TEXT from '../texts/fr/board.ts';
import { fill } from '../texts/fill.ts';
import * as DEPTH from './boardLayers.ts';
import * as BOARD_COLOR from './palette.ts';
import { cssColor } from './cssColor.ts';
import { BOARD_HEIGHT, BOARD_WIDTH, readableBoardSize } from './boardResolution.ts';

/** The sizes these texts were drawn for, on a board shown at its own size. */
const BOSS_TEXT = 12,
  PLAQUE_TEXT = 15,
  WIDE_PLAQUE_TEXT = 17,
  FLOAT_TEXT = 17;
/** The plaques that hold a whole sentence: confusion and courage. */
const wide = (index: number) => index === 6 || index === 7;
export class BattleFeedback {
  private scene: Phaser.Scene;
  /** The sizes the texts have now, to change them only when the screen does. */
  private sizes = '';
  private graphics: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private encounterLabels: Phaser.GameObjects.Text[] = [];
  private bossLabel: Phaser.GameObjects.Text;
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
    // Six imminent eggs, one confusion summary, courage and the existing boss target.
    for (let i = 0; i < 9; i++)
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
    for (let i = 0; i < 40; i++)
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
    for (const [i, label] of this.labels.entries()) {
      const f = p.floats[i];
      label.setVisible(!!f);
      if (!f) continue;
      const progress = f.age / f.duration;
      setCanvasCopy(label, f.text)
        .setColor(f.color)
        .setPosition(f.x, f.y - (reduced ? 0 : progress * 26))
        .setAlpha(Math.min(1, (1 - progress) * 3));
    }
    for (const b of p.bursts) {
      const fade = 1 - b.age / 0.6;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3,
          spread = reduced ? 8 : 8 + b.age * 40;
        g.fillStyle(b.color, fade * 0.8);
        g.fillCircle(
          b.x + Math.cos(angle) * spread,
          b.y + Math.sin(angle) * spread,
          3 * fade + 1.5,
        );
      }
    }
    for (const u of [...game.units, ...game.enemies]) {
      const r = p.reactions.get(u.id);
      if (!r) continue;
      if (r.heal > 0) {
        g.lineStyle(2, 0xc4f39e, r.heal * 0.8);
        g.strokeEllipse(u.x, u.y + 14, 40 + (1 - r.heal) * 15, 15);
      }
      if (r.hurt > 0.45) {
        g.lineStyle(2, 0xffdba0, r.hurt * 0.7);
        g.strokeCircle(u.x, u.y - 9, 17);
      }
    }
    // Transient event notices live in the HTML line below the lane corridors.
    const boss = game.enemies.find((e) => e.boss && e.hp > 0);
    this.bossLabel.setVisible(!!boss);
    if (boss) {
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
  }
  private drawEncounter(p: Presentation) {
    const g = this.graphics,
      r = p.encounter;
    // How much larger than drawn the short plaques are (eggs, the king's shot).
    const scale = readableBoardSize(this.scene, PLAQUE_TEXT) / PLAQUE_TEXT;
    for (const label of this.encounterLabels) label.setVisible(false);
    const plaque = (
      index: number,
      text: string,
      x: number,
      y: number,
      width: number,
      color: number,
      textColor: string,
    ) => {
      // Fixed plaques remain legible without animation, including reduced motion. They grow
      // with their text and stay on the board. A plaque that holds a whole sentence takes
      // the width its larger text needs, no more: twice as wide, it would cross the board.
      const label = setCanvasCopy(this.encounterLabels[index], text).setColor(textColor);
      const drawn = wide(index) ? WIDE_PLAQUE_TEXT : PLAQUE_TEXT;
      const grow = readableBoardSize(this.scene, drawn) / drawn;
      // Courage keeps room on its left for its arrow, which touched the first letter.
      const arrow = index === 7 && grow !== 1 ? 16 : 0;
      const w =
          grow === 1
            ? width
            : wide(index)
              ? Math.max(width, label.width + 28 + arrow)
              : width * grow,
        half = 14 * grow;
      const px = Math.max(w / 2 + 4, Math.min(BOARD_WIDTH - 4 - w / 2, x)),
        py = Math.max(145, Math.min(Math.min(597, BOARD_HEIGHT - 3 - half), y));
      g.fillStyle(0x17382b, 0.96);
      g.fillRoundedRect(px - w / 2, py - half, w, half * 2, 6);
      g.lineStyle(1.5, color, 0.95);
      g.strokeRoundedRect(px - w / 2, py - half, w, half * 2, 6);
      label.setPosition(px + arrow / 2, py).setVisible(true);
      return { left: px - w / 2, y: py, width: w, half };
    };
    const eggLabels = eggLabelPositions(r.eggs, scale);
    for (const [i, egg] of r.eggs.entries()) {
      const label = eggLabels[i];
      g.lineStyle(1.5, BOARD_COLOR.parchment, 0.85);
      g.lineBetween(label.x, label.y + 14 * scale, egg.x, egg.y - 30);
      plaque(i, egg.label, label.x, label.y, 146, BOARD_COLOR.parchment, '#ffe2a0');
      // A shell crack supplements the existing egg progress arc and wobble.
      g.lineStyle(3, 0xffe2a0, 1);
      g.lineBetween(egg.x - 5, egg.y - 26, egg.x + 3, egg.y - 18);
      g.lineBetween(egg.x + 3, egg.y - 18, egg.x - 3, egg.y - 10);
      g.lineBetween(egg.x - 3, egg.y - 10, egg.x + 4, egg.y - 3);
    }
    if (r.confusion)
      // Actors already draws a question mark on every affected ally.
      plaque(6, r.confusion.label, 278, 585, 246, 0xd8b8e9, cssColor(BOARD_COLOR.confusion));
    if (r.encouragement) {
      // The arrow and the gauge are drawn from the plaque, wherever it had to go.
      const at = plaque(7, r.encouragement.label, 842, 585, 420, BOARD_COLOR.parchment, '#ffe2a0');
      g.fillStyle(BOARD_COLOR.parchment, 1);
      g.fillTriangle(at.left + 10, at.y - 5, at.left + 18, at.y, at.left + 10, at.y + 5);
      g.fillRoundedRect(
        at.left + 28,
        at.y + at.half + 3,
        (at.width - 44) * r.encouragement.ratio,
        3,
        1,
      );
    }
    if (r.shot)
      // The only target shape remains in BossSignals, using the same readout.
      plaque(
        8,
        r.shot.label,
        r.shot.x,
        r.shot.y - r.shot.radius - 9 - 14 * scale,
        168,
        0xf3ac79,
        cssColor(BOARD_COLOR.kingWarning),
      );
  }
}
