import { BODY_FONT } from './fonts.ts';
import { addCanvasText as addCanvasCopy, setCanvasText as setCanvasCopy } from '../i18n/phaser.ts';
import Phaser from 'phaser';
import type { Game } from '../game.ts';
import { bossReadout } from './bossReadout.ts';
import * as TEXT from '../texts/fr/board.ts';
import { fill } from '../texts/fill.ts';
import * as DEPTH from './boardLayers.ts';
import * as BOARD_COLOR from './palette.ts';
import { boardShownSmall, readableBoardSize } from './boardResolution.ts';

/** Size the captions of the king and of his court are drawn at, in board units. */
const COURT_TEXT = 10;
/** The sign drawn over a guard or a healer of the king on a small board: its half width. */
const COURT_SIGN = 11;
/** How far under the snake's position its sign is centred: in the ring drawn at its feet. */
const COURT_SIGN_DROP = 6;
/** Finite graphics layers; no images, per-actor shader or independent simulation. */
export class BossSignals {
  private ground: Phaser.GameObjects.Graphics;
  private protection: Phaser.GameObjects.Graphics;
  private headLabels: Phaser.GameObjects.Text[];
  private courtLabels: Phaser.GameObjects.Text[];
  private scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.ground = scene.add.graphics().setDepth(DEPTH.groundMarks);
    this.protection = scene.add.graphics().setDepth(DEPTH.warnings);
    const labels = () =>
      Array.from({ length: 3 }, () =>
        addCanvasCopy(scene.add, 0, 0, '', {
          fontFamily: BODY_FONT,
          fontSize: `${COURT_TEXT}px`,
          color: '#fff4d1',
          stroke: '#172c2c',
          strokeThickness: 3,
        })
          .setOrigin(0.5, 1)
          .setDepth(DEPTH.signalLabels)
          .setVisible(false),
      );
    this.headLabels = labels();
    this.courtLabels = labels();
  }
  draw(game: Game, reduced: boolean) {
    const ground = this.ground,
      ink = this.protection;
    ground.clear();
    ink.clear();
    for (const label of [...this.headLabels, ...this.courtLabels]) label.setVisible(false);
    const small = boardShownSmall(this.scene),
      courtSize = readableBoardSize(this.scene, COURT_TEXT);
    let courtIndex = 0;
    for (const boss of game.enemies) {
      if (boss.hp > 0 && boss.court && courtIndex < this.courtLabels.length) {
        const healer = boss.court.role === 'healer';
        const color = healer ? 0xa5e6ab : 0xb5cadd;
        ink.lineStyle(2, color, 0.85);
        ink.strokeEllipse(boss.x, boss.y + 4, 34, 13);
        const label = this.courtLabels[courtIndex++];
        if (small) {
          // A sign instead of words read at 5 px: a shield for a guard, a cross and its
          // remaining cares for the healer. Each is drawn at the feet of its snake, in its
          // ring: above their heads, the signs of guards walking in a column piled up on
          // one another and on the heads of the king.
          const sign = boss.y + COURT_SIGN_DROP;
          if (healer) {
            drawCross(ink, boss.x - COURT_SIGN, sign, color);
            setCanvasCopy(label.setFontSize(courtSize), String(boss.court.charges))
              .setOrigin(0, 0.5)
              .setPosition(boss.x + 2, sign)
              .setVisible(true);
          } else drawShield(ink, boss.x, sign, color);
        } else
          setCanvasCopy(
            label.setFontSize(courtSize),
            healer ? fill(TEXT.soigneurN, boss.court.charges) : TEXT.gardeDuRoi,
          )
            .setOrigin(0.5, 1)
            .setPosition(boss.x, boss.y - 42)
            .setVisible(true);
      }
      const r = bossReadout(boss, game.tuning);
      if (!r) continue;
      if (r.heads) {
        r.heads.forEach((head, i) => {
          const x = boss.x - 72 + i * 72;
          const color = head.alive ? [0xbad0e6, 0xd7b3ef, 0xf0c982][i] : 0x6e7375;
          ink.fillStyle(0x172c2c, 0.95);
          ink.fillRoundedRect(x - 33, boss.y - 116, 66, 8, 2);
          ink.fillStyle(color, 1);
          ink.fillRoundedRect(x - 31, boss.y - 114, 62 * head.ratio, 4, 1);
          if (head.active) {
            ink.lineStyle(2, BOARD_COLOR.kingWarning, 1);
            ink.strokeRoundedRect(x - 34, boss.y - 117, 68, 10, 2);
          }
          setCanvasCopy(
            this.headLabels[i],
            `${head.label}${head.alive ? (head.active ? TEXT.tir : '') : ' KO'}`,
          )
            .setPosition(x, boss.y - 119)
            .setVisible(true);
        });
      }
      if (r.shieldRatio > 0) {
        ink.lineStyle(3, 0x94deec, 0.55);
        ink.strokeEllipse(boss.x, boss.y - 28, 140, 116);
        ink.fillStyle(0x183d49, 0.95);
        ink.fillRoundedRect(boss.x - 42, boss.y - 94, 84, 7, 3);
        ink.fillStyle(0xa3e4ef, 1);
        ink.fillRoundedRect(boss.x - 40, boss.y - 92, 80 * r.shieldRatio, 3, 1);
        for (let i = 0; i < 3; i++) {
          ink.fillStyle(i < r.phase ? 0xbce8ef : 0x496f72, 1);
          ink.fillCircle(boss.x - 10 + i * 10, boss.y - 82, 2);
        }
      }
      if (r.breakFlash > 0) {
        const d = reduced ? 0 : (1 - r.breakFlash) * 18;
        ink.lineStyle(3, 0xe8f9fa, r.breakFlash * 0.8);
        ink.strokeEllipse(boss.x, boss.y - 28, 140 + d, 116 + d);
      }
      if (r.shot) {
        const { x, y, radius, progress } = r.shot;
        ground.fillStyle(0xcf6545, 0.18);
        ground.fillCircle(x, y, radius);
        ground.lineStyle(
          3,
          BOARD_COLOR.kingWarning,
          reduced ? 0.85 : 0.7 + Math.sin(game.time * 4) * 0.12,
        );
        ground.strokeCircle(x, y, radius);
        ground.lineStyle(4, 0xf17d4c, 0.95);
        ground.beginPath();
        ground.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ground.strokePath();
        ground.lineStyle(2, BOARD_COLOR.kingWarning, 0.85);
        ground.lineBetween(x - 7, y, x + 7, y);
        ground.lineBetween(x, y - 7, x, y + 7);
        ground.lineStyle(1, 0xfbd08c, 0.3);
        ground.lineBetween(boss.x, boss.y - 35, x, y);
      }
    }
  }
}

/** A small shield, centred on (x, y): the guard of the king. */
function drawShield(ink: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
  const w = COURT_SIGN,
    h = COURT_SIGN * 1.2;
  ink.fillStyle(0x172c2c, 0.95);
  ink.fillPoints(shield(x, y, w + 3, h + 3), true);
  ink.fillStyle(color, 1);
  ink.fillPoints(shield(x, y, w, h), true);
}
const shield = (x: number, y: number, w: number, h: number) => [
  new Phaser.Math.Vector2(x - w, y - h),
  new Phaser.Math.Vector2(x + w, y - h),
  new Phaser.Math.Vector2(x + w, y),
  new Phaser.Math.Vector2(x, y + h),
  new Phaser.Math.Vector2(x - w, y),
];
/** A small cross, centred on (x, y): the healer of the king. */
function drawCross(ink: Phaser.GameObjects.Graphics, x: number, y: number, color: number) {
  const arm = COURT_SIGN,
    bar = COURT_SIGN * 0.42;
  ink.fillStyle(0x172c2c, 0.95);
  ink.fillRect(x - arm - 2, y - bar - 2, arm * 2 + 4, bar * 2 + 4);
  ink.fillRect(x - bar - 2, y - arm - 2, bar * 2 + 4, arm * 2 + 4);
  ink.fillStyle(color, 1);
  ink.fillRect(x - arm, y - bar, arm * 2, bar * 2);
  ink.fillRect(x - bar, y - arm, bar * 2, arm * 2);
}
