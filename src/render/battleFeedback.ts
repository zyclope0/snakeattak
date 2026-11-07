import Phaser from 'phaser';
import type { Game } from '../game.ts';
import type { Presentation } from './presentation.ts';
import { bossReadout } from './bossReadout.ts';
import { eggLabelPositions } from './encounterReadout.ts';

export class BattleFeedback {
  private graphics: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private encounterLabels: Phaser.GameObjects.Text[] = [];
  private title: Phaser.GameObjects.Text;
  private subtitle: Phaser.GameObjects.Text;
  private bossLabel: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(22);
    this.title = scene.add
      .text(550, 82, '', {
        fontFamily: 'Arial',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffe2a0',
      })
      .setOrigin(0.5)
      .setDepth(23);
    this.subtitle = scene.add
      .text(550, 109, '', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#d6e2c1',
        align: 'center',
        wordWrap: { width: 742 },
      })
      .setOrigin(0.5)
      .setDepth(23);
    this.bossLabel = scene.add
      .text(550, 13, '', { fontFamily: 'Arial', fontSize: '12px', color: '#ffe2a0' })
      .setOrigin(0.5)
      .setDepth(23);
    // Six imminent eggs, one confusion summary, courage and the existing boss target.
    for (let i = 0; i < 9; i++)
      this.encounterLabels.push(
        scene.add
          .text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: i < 6 || i === 8 ? '15px' : '17px',
            fontStyle: 'bold',
            color: '#ffe2a0',
            stroke: '#17382b',
            strokeThickness: 2,
          })
          .setOrigin(0.5)
          .setDepth(23)
          .setVisible(false),
      );
    for (let i = 0; i < 40; i++)
      this.labels.push(
        scene.add
          .text(0, 0, '', {
            fontFamily: 'Arial',
            fontSize: '17px',
            fontStyle: 'bold',
            stroke: '#233e2d',
            strokeThickness: 3,
          })
          .setOrigin(0.5)
          .setDepth(24)
          .setVisible(false),
      );
  }
  draw(p: Presentation, game: Game, reduced: boolean) {
    const g = this.graphics;
    g.clear();
    this.drawEncounter(p);
    for (const [i, label] of this.labels.entries()) {
      const f = p.floats[i];
      label.setVisible(!!f);
      if (!f) continue;
      const progress = f.age / f.duration;
      label
        .setText(f.text)
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
        g.fillCircle(b.x + Math.cos(angle) * spread, b.y + Math.sin(angle) * spread, 2 * fade + 1);
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
    const n = p.notice;
    this.title.setVisible(!!n);
    this.subtitle.setVisible(!!n);
    if (n) {
      const alpha = Math.min(1, n.remaining * 4);
      g.fillStyle(0x17382b, alpha * 0.93);
      g.fillRoundedRect(165, 60, 770, 69, 8);
      g.lineStyle(2, n.kind === 'boss' ? 0xe0a36e : 0xc3bb7c, alpha * 0.8);
      g.strokeRoundedRect(165, 60, 770, 69, 8);
      this.title
        .setText(n.title)
        .setAlpha(alpha)
        .setColor(n.kind === 'boss' ? '#ffc38c' : '#ffe2a0');
      this.subtitle.setText(n.subtitle).setAlpha(alpha);
    }
    const boss = game.enemies.find((e) => e.boss && e.hp > 0);
    this.bossLabel.setVisible(!!boss);
    if (boss) {
      g.fillStyle(0xf3ac79, 0.95);
      g.fillTriangle(boss.x - 6, boss.y + 39, boss.x + 6, boss.y + 39, boss.x, boss.y + 31);
      this.bossLabel.setText(
        `ROI À TROIS TÊTES · ${Math.ceil(boss.hp)} / ${Math.ceil(boss.maxHp)} PV${bossReadout(boss, game.tuning) ? ` · PHASE ${boss.bossState!.phase}/3` : ''}`,
      );
      g.fillStyle(0x183829);
      g.fillRoundedRect(410, 24, 280, 9, 4);
      g.fillStyle(0xe7ad6c);
      g.fillRoundedRect(412, 26, 276 * Math.max(0, boss.hp / boss.maxHp), 5, 2);
      g.lineStyle(2, 0xeac26c, 0.6);
      g.strokeEllipse(boss.x, boss.y + 24, 90 + (reduced ? 0 : Math.sin(p.clock * 3) * 6), 28);
    }
  }
  private drawEncounter(p: Presentation) {
    const g = this.graphics,
      r = p.encounter;
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
      // Fixed plaques remain legible without animation, including reduced motion.
      const px = Math.max(width / 2 + 4, Math.min(1096 - width / 2, x)),
        py = Math.max(145, Math.min(597, y));
      g.fillStyle(0x17382b, 0.96);
      g.fillRoundedRect(px - width / 2, py - 14, width, 28, 6);
      g.lineStyle(1.5, color, 0.95);
      g.strokeRoundedRect(px - width / 2, py - 14, width, 28, 6);
      this.encounterLabels[index]
        .setText(text)
        .setColor(textColor)
        .setPosition(px, py)
        .setVisible(true);
    };
    const eggLabels = eggLabelPositions(r.eggs);
    for (const [i, egg] of r.eggs.entries()) {
      const label = eggLabels[i];
      g.lineStyle(1.5, 0xe2c58a, 0.85);
      g.lineBetween(label.x, label.y + 14, egg.x, egg.y - 30);
      plaque(i, egg.label, label.x, label.y, 146, 0xe2c58a, '#ffe2a0');
      // A shell crack supplements the existing egg progress arc and wobble.
      g.lineStyle(3, 0xffe2a0, 1);
      g.lineBetween(egg.x - 5, egg.y - 26, egg.x + 3, egg.y - 18);
      g.lineBetween(egg.x + 3, egg.y - 18, egg.x - 3, egg.y - 10);
      g.lineBetween(egg.x - 3, egg.y - 10, egg.x + 4, egg.y - 3);
    }
    if (r.confusion)
      // Actors already draws a question mark on every affected ally.
      plaque(6, r.confusion.label, 278, 585, 246, 0xd8b8e9, '#f4dcff');
    if (r.encouragement) {
      plaque(7, r.encouragement.label, 842, 585, 420, 0xe2c58a, '#ffe2a0');
      g.fillStyle(0xe2c58a, 1);
      g.fillTriangle(642, 580, 650, 585, 642, 590);
      g.fillRoundedRect(660, 602, 376 * r.encouragement.ratio, 3, 1);
    }
    if (r.shot)
      // The only target shape remains in BossSignals, using the same readout.
      plaque(8, r.shot.label, r.shot.x, r.shot.y - r.shot.radius - 23, 168, 0xf3ac79, '#ffd58b');
  }
}
