import { BODY_FONT } from './fonts.ts';
import { addCanvasText as addCanvasCopy, setCanvasText as setCanvasCopy } from '../i18n/phaser.ts';
import Phaser from 'phaser';
import type { Game } from '../game.ts';
import { bossReadout } from './bossReadout.ts';
import * as TEXT from '../texts/fr/board.ts';
import { fill } from '../texts/fill.ts';
/** Finite graphics layers; no images, per-actor shader or independent simulation. */
export class BossSignals {
  private ground: Phaser.GameObjects.Graphics;
  private protection: Phaser.GameObjects.Graphics;
  private headLabels: Phaser.GameObjects.Text[];
  private courtLabels: Phaser.GameObjects.Text[];
  constructor(scene: Phaser.Scene) {
    this.ground = scene.add.graphics().setDepth(9.7);
    this.protection = scene.add.graphics().setDepth(16);
    const labels = () =>
      Array.from({ length: 3 }, () =>
        addCanvasCopy(scene.add, 0, 0, '', {
          fontFamily: BODY_FONT,
          fontSize: '10px',
          color: '#fff4d1',
          stroke: '#172c2c',
          strokeThickness: 3,
        })
          .setOrigin(0.5, 1)
          .setDepth(17)
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
    let courtIndex = 0;
    for (const boss of game.enemies) {
      if (boss.hp > 0 && boss.court && courtIndex < this.courtLabels.length) {
        const healer = boss.court.role === 'healer';
        const color = healer ? 0xa5e6ab : 0xb5cadd;
        ink.lineStyle(2, color, 0.85);
        ink.strokeEllipse(boss.x, boss.y + 4, 34, 13);
        setCanvasCopy(
          this.courtLabels[courtIndex++],
          healer ? fill(TEXT.soigneurN, boss.court.charges) : TEXT.gardeDuRoi,
        )
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
            ink.lineStyle(2, 0xffd58b, 1);
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
        ground.lineStyle(3, 0xffd58b, reduced ? 0.85 : 0.7 + Math.sin(game.time * 4) * 0.12);
        ground.strokeCircle(x, y, radius);
        ground.lineStyle(4, 0xf17d4c, 0.95);
        ground.beginPath();
        ground.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        ground.strokePath();
        ground.lineStyle(2, 0xffd58b, 0.85);
        ground.lineBetween(x - 7, y, x + 7, y);
        ground.lineBetween(x, y - 7, x, y + 7);
        ground.lineStyle(1, 0xfbd08c, 0.3);
        ground.lineBetween(boss.x, boss.y - 35, x, y);
      }
    }
  }
}
