import { DISPLAY_FONT } from './fonts.ts';
import { addCanvasText as addCanvasCopy, setCanvasText as setCanvasCopy } from '../i18n/phaser.ts';
import Phaser from 'phaser';
import { LANES } from '../ai.ts';
import type { Game } from '../game.ts';
import type { Presentation } from './presentation.ts';
import { stageTheme, STAGE_SIZES } from './stageLayout.ts';
/** Live stage props observe presentation signals; never create or redirect monsters. */
export class Strongholds {
  private dens: Phaser.GameObjects.Image[];
  private fort: Phaser.GameObjects.Image;
  private effects: Phaser.GameObjects.Graphics;
  private details: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private shownBase = -1;
  constructor(scene: Phaser.Scene) {
    this.effects = scene.add.graphics().setDepth(9);
    this.details = scene.add.graphics().setDepth(15.1);
    this.dens = LANES.map((y) =>
      scene.add
        .image(72, y + 23, 'strongholds', 1)
        .setOrigin(0.5, 0.82)
        .setDisplaySize(142, 138)
        .setDepth(9.4),
    );
    // The reference miniature's door is on the right: mirror it towards the attackers.
    this.fort = scene.add
      .image(1021, 354, 'strongholds', 0)
      .setOrigin(0.5, 0.82)
      .setDisplaySize(157, 178)
      .setFlipX(true)
      // Every legal defender stays visible, including placements beside the gate.
      .setDepth(9.6);
    this.label = addCanvasCopy(scene.add, 1016, 399, '', {
      fontFamily: DISPLAY_FONT,
      fontSize: '11px',
      color: '#f5edcd',
      backgroundColor: '#293f32',
      padding: { x: 7, y: 4 },
    })
      .setOrigin(0.5)
      .setDepth(15.2);
  }
  draw(game: Game, p: Presentation, reduced: boolean) {
    const g = this.effects,
      detail = this.details;
    g.clear();
    detail.clear();
    const theme = stageTheme(game.level);
    for (let lane = 0; lane < LANES.length; lane++) {
      const y = LANES[lane];
      const recent = p.arrivals.filter((a) => a.source === 'den' && a.lane === lane);
      const pulse = recent.reduce((v, a) => Math.max(v, 1 - a.age / 0.9), 0);
      const wake = game.status === 'fighting' && game.remaining > 0 ? 0.13 : 0;
      const den = STAGE_SIZES.dens[lane];
      this.dens[lane]
        .setFrame(theme.dens[lane])
        .setDisplaySize(den.width, den.height)
        .setRotation((lane - 1) * 0.025)
        .setTint(pulse > 0.1 ? 0xffe1ac : lane === 2 ? 0xe3edde : theme.tint)
        .setPosition(den.x, den.y + (reduced ? 0 : Math.sin(p.clock * 25) * pulse * 0.9));
      if (wake || pulse) {
        g.fillStyle(0xe8b76a, wake + pulse * 0.35);
        g.fillEllipse(103, y + 1, 30, 22);
        g.lineStyle(2, 0xf5ce8a, pulse * 0.8);
        g.strokeEllipse(111, y + 12, 27 + pulse * 19, 13 + pulse * 9);
      }
    }
    for (const a of p.arrivals) {
      const t = a.age / 0.9,
        distance = reduced ? 12 : 8 + t * 28;
      const color = a.source === 'egg' ? 0xe7d7af : game.level.id === 'grove' ? 0xc9a267 : 0xc3bc91;
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 + a.id;
        g.fillStyle(color, (1 - t) * 0.65);
        g.fillCircle(
          a.x + Math.cos(angle) * distance,
          a.y + 12 + Math.sin(angle) * distance * 0.35,
          2 + (1 - t) * 3,
        );
      }
      if (a.boss) {
        g.lineStyle(3, 0xe2b956, (1 - t) * 0.8);
        g.strokeEllipse(a.x, a.y + 8, 35 + t * 45, 18 + t * 20);
      }
    }
    const damaged = game.base <= 50;
    const fort = STAGE_SIZES.fort;
    this.details.setPosition(-33, 6);
    this.label.setPosition(988, 412);
    const shake = reduced ? 0 : Math.sin(p.clock * 45) * p.fortDamage * 2;
    this.fort
      .setPosition(fort.x + shake, fort.y)
      .setDisplaySize(fort.width, fort.height)
      .setTint(
        p.fortDamage > 0.1
          ? 0xffc6a0
          : p.fortRepair > 0.1
            ? 0xd5f5bf
            : damaged
              ? 0xd4c7ad
              : 0xffffff,
      );
    if (this.shownBase !== Math.ceil(game.base)) {
      this.shownBase = Math.ceil(game.base);
      setCanvasCopy(this.label, `REFUGE · ${this.shownBase} %`).setColor(
        game.base <= 25 ? '#ffd19c' : '#f5edcd',
      );
    }
    detail.fillStyle(0x263b2d, 0.95);
    detail.fillRoundedRect(960, 380, 112, 8, 4);
    detail.fillStyle(game.base <= 25 ? 0xd98c58 : game.base <= 50 ? 0xd7b365 : 0x9fc488);
    if (game.base > 0) detail.fillRoundedRect(963, 382, (106 * game.base) / 100, 4, 2);
    if (damaged) {
      detail.lineStyle(2, 0x625746, 0.8);
      detail.beginPath();
      detail.moveTo(985, 310);
      detail.lineTo(980, 318);
      detail.lineTo(988, 324);
      detail.lineTo(983, 335);
      detail.strokePath();
      if (game.base <= 25) {
        detail.beginPath();
        detail.moveTo(1056, 314);
        detail.lineTo(1049, 324);
        detail.lineTo(1056, 331);
        detail.lineTo(1050, 343);
        detail.strokePath();
      }
    }
    if (p.fortDamage > 0 || p.fortRepair > 0) {
      const repair = p.fortRepair > p.fortDamage,
        strength = Math.max(p.fortDamage, p.fortRepair);
      g.lineStyle(3, repair ? 0xc1e89e : 0xf2b578, strength * 0.85);
      const grow = reduced ? 0 : (1 - strength) * 30;
      g.strokeEllipse(1010, 345, 110 + grow, 44 + grow * 0.4);
      if (repair) {
        detail.lineStyle(3, 0xd4efad, strength);
        detail.lineBetween(1020, 254, 1032, 254);
        detail.lineBetween(1026, 248, 1026, 260);
      }
    }
  }
}
