import { DISPLAY_FONT } from './fonts.ts';
import { addCanvasText as addCanvasCopy, setCanvasText as setCanvasCopy } from '../i18n/phaser.ts';
import Phaser from 'phaser';
import { LANES } from '../ai.ts';
import type { Game } from '../game.ts';
import { ARRIVAL_SECONDS } from './presentation.ts';
import type { Arrival, Presentation } from './presentation.ts';
import { stageTheme, STAGE_SIZES } from './stageLayout.ts';
import { Figurines } from './figurines.ts';
/** Under these shares of its health, the refuge looks worn, then badly cracked. */
const WORN_BASE = 50,
  CRACKED_BASE = 25;
/** The two cracks of the wall, as x, y pairs. */
const LEFT_CRACK = [985, 310, 980, 318, 988, 324, 983, 335],
  RIGHT_CRACK = [1056, 314, 1049, 324, 1056, 331, 1050, 343];
/** How strongly a den still shows that a snake just came out of it, from 1 down to 0. */
function denPulse(arrivals: readonly Arrival[], lane: number): number {
  let pulse = 0;
  for (const a of arrivals)
    if (a.source === 'den' && a.lane === lane) pulse = Math.max(pulse, 1 - a.age / ARRIVAL_SECONDS);
  return pulse;
}
function strokeCrack(g: Phaser.GameObjects.Graphics, points: readonly number[]) {
  g.beginPath();
  g.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) g.lineTo(points[i], points[i + 1]);
  g.strokePath();
}
/** Live stage props observe presentation signals; never create or redirect monsters. */
export class Strongholds {
  private dens: Phaser.GameObjects.Image[];
  private fort: Phaser.GameObjects.Image;
  private effects: Phaser.GameObjects.Graphics;
  private details: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private shownBase = -1;
  private figurines: Figurines;
  constructor(scene: Phaser.Scene) {
    this.figurines = Figurines.of(scene);
    this.effects = scene.add.graphics().setDepth(9);
    // The gauge, cracks and cross are drawn around the first refuge, at (1021, 354): the layer
    // follows the refuge to where the stage layout puts it now.
    this.details = scene.add.graphics().setDepth(15.1).setPosition(-33, 6);
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
    this.label = addCanvasCopy(scene.add, 988, 412, '', {
      fontFamily: DISPLAY_FONT,
      fontSize: '11px',
      color: '#f5edcd',
      backgroundColor: '#293f32',
      padding: { x: 7, y: 4 },
    })
      .setOrigin(0.5)
      .setDepth(15.2);
  }
  /** The miniature prepared at the size of the screen, shown `width` × `height` board units. */
  private show(image: Phaser.GameObjects.Image, frame: number, width: number, height: number) {
    const art = this.figurines.image({ texture: 'strongholds', frame }, width, height);
    if (image.frame.name !== art.frame) image.setTexture(art.texture, art.frame);
    return image.setDisplaySize(width, height);
  }
  draw(game: Game, p: Presentation, reduced: boolean) {
    this.effects.clear();
    this.details.clear();
    this.drawDens(game, p, reduced);
    this.drawArrivals(game, p, reduced);
    this.drawFort(game, p, reduced);
    this.drawGauge(game);
    if (game.base <= WORN_BASE) this.drawCracks(game);
    this.drawFortEcho(p, reduced);
  }
  /** A den glows while its wave is coming, and shivers when a snake leaves it. */
  private drawDens(game: Game, p: Presentation, reduced: boolean) {
    const g = this.effects,
      theme = stageTheme(game.level),
      wake = game.status === 'fighting' && game.remaining > 0 ? 0.13 : 0;
    for (let lane = 0; lane < LANES.length; lane++) {
      const y = LANES[lane],
        pulse = denPulse(p.arrivals, lane),
        den = STAGE_SIZES.dens[lane];
      this.show(this.dens[lane], theme.dens[lane], den.width, den.height)
        .setRotation((lane - 1) * 0.025)
        .setTint(pulse > 0.1 ? 0xffe1ac : lane === 2 ? 0xe3edde : theme.tint)
        .setPosition(den.x, den.y + (reduced ? 0 : Math.sin(p.clock * 25) * pulse * 0.9));
      if (!wake && !pulse) continue;
      g.fillStyle(0xe8b76a, wake + pulse * 0.35);
      g.fillEllipse(103, y + 1, 30, 22);
      g.lineStyle(2, 0xf5ce8a, pulse * 0.8);
      g.strokeEllipse(111, y + 12, 27 + pulse * 19, 13 + pulse * 9);
    }
  }
  /** Earth or shell thrown around a snake that just appeared, and a golden ring for the king. */
  private drawArrivals(game: Game, p: Presentation, reduced: boolean) {
    const g = this.effects;
    for (const a of p.arrivals) {
      const t = a.age / ARRIVAL_SECONDS,
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
  }
  /** The refuge shakes and reddens when hit, turns green when repaired, greys when worn. */
  private drawFort(game: Game, p: Presentation, reduced: boolean) {
    const fort = STAGE_SIZES.fort;
    const shake = reduced ? 0 : Math.sin(p.clock * 45) * p.fortDamage * 2;
    this.show(this.fort, 0, fort.width, fort.height)
      .setPosition(fort.x + shake, fort.y)
      .setTint(
        p.fortDamage > 0.1
          ? 0xffc6a0
          : p.fortRepair > 0.1
            ? 0xd5f5bf
            : game.base <= WORN_BASE
              ? 0xd4c7ad
              : 0xffffff,
      );
    if (this.shownBase === Math.ceil(game.base)) return;
    this.shownBase = Math.ceil(game.base);
    setCanvasCopy(this.label, `REFUGE · ${this.shownBase} %`).setColor(
      game.base <= CRACKED_BASE ? '#ffd19c' : '#f5edcd',
    );
  }
  private drawGauge(game: Game) {
    const detail = this.details;
    detail.fillStyle(0x263b2d, 0.95);
    detail.fillRoundedRect(960, 380, 112, 8, 4);
    detail.fillStyle(
      game.base <= CRACKED_BASE ? 0xd98c58 : game.base <= WORN_BASE ? 0xd7b365 : 0x9fc488,
    );
    if (game.base > 0) detail.fillRoundedRect(963, 382, (106 * game.base) / 100, 4, 2);
  }
  private drawCracks(game: Game) {
    this.details.lineStyle(2, 0x625746, 0.8);
    strokeCrack(this.details, LEFT_CRACK);
    if (game.base <= CRACKED_BASE) strokeCrack(this.details, RIGHT_CRACK);
  }
  /** A ring spreads from the refuge after a blow or a repair; a repair adds a small cross. */
  private drawFortEcho(p: Presentation, reduced: boolean) {
    if (!(p.fortDamage > 0 || p.fortRepair > 0)) return;
    const repair = p.fortRepair > p.fortDamage,
      strength = Math.max(p.fortDamage, p.fortRepair);
    this.effects.lineStyle(3, repair ? 0xc1e89e : 0xf2b578, strength * 0.85);
    const grow = reduced ? 0 : (1 - strength) * 30;
    this.effects.strokeEllipse(1010, 345, 110 + grow, 44 + grow * 0.4);
    if (!repair) return;
    this.details.lineStyle(3, 0xd4efad, strength);
    this.details.lineBetween(1020, 254, 1032, 254);
    this.details.lineBetween(1026, 248, 1026, 260);
  }
}
