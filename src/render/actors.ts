import { shellGeometry, drawCapriceShell } from './capriceShell.ts';
import { Figurines } from './figurines.ts';
import { isFlying, flightLift } from '../flying.ts';
import Phaser from 'phaser';
import { blowFacing, characterMotion } from './characterMotion.ts';
import { poseArt } from './attackPose.ts';
import { feastPoint, stickySpeed } from '../tactics.ts';
import { actorSize, spriteFlip } from './actorLayout.ts';
import {
  ALLY_ART,
  ENEMY_ART,
  KING_ART,
  EGG_ART,
  HONEY_ART,
  HONEY_STICKY_ART,
  UMBRELLA_CLOSED_ART,
} from '../art.ts';
import type { Entity, Game } from '../game.ts';
import { enemySpeed } from '../enemies.ts';
import type { Kind } from '../data.ts';
import type { Presentation } from './presentation.ts';
import { visualPose } from './presentation.ts';
import { FramePool } from './framePool.ts';
import { onSceneExit } from './sceneExit.ts';
/** Warm paper white, softer than a pure white flash. */
const FLASH = 0xfff4dc;
/** Camp colours of the rim: red-orange for living threats, dark green for allies. */
const ENEMY_RIM = 0xd2552d,
  ALLY_RIM = 0x233d36;
/**
 * Thickness of the rim in board units, and its opacity. A threat must stand out at a glance;
 * an ally only needs a quiet line that lifts it off the ground.
 */
const ENEMY_RIM_WIDTH = 1.7,
  ENEMY_RIM_ALPHA = 0.94,
  ALLY_RIM_WIDTH = 1.1,
  ALLY_RIM_ALPHA = 0.82;
/** Where a figure stands in its frame: between its feet. */
const FOOT_X = 0.5,
  FOOT_Y = 0.82;
export class Actors {
  private figurines: Figurines;
  /** The Canvas renderer cannot tint an image: it shows a prepared pale silhouette instead. */
  private canvas: boolean;
  private pieces: FramePool<string, Phaser.GameObjects.Image>;
  private shells: FramePool<number, Phaser.GameObjects.Graphics>;
  private shadows: Phaser.GameObjects.Graphics;
  private loaded = (texture: string) => this.scene.textures.exists(texture);
  constructor(private scene: Phaser.Scene) {
    this.figurines = Figurines.of(scene);
    this.canvas = scene.game.renderer.type === Phaser.CANVAS;
    this.shells = new FramePool({
      maxIdle: 128,
      create: () => scene.add.graphics(),
      activate: (g) => {
        g.setVisible(true).setActive(true).addToDisplayList();
      },
      deactivate: (g) => {
        g.setVisible(false).setActive(false).removeFromDisplayList();
      },
      destroy: (g) => g.destroy(),
    });
    this.shadows = scene.add.graphics().setDepth(9.7);
    this.pieces = new FramePool({
      maxIdle: 384,
      create: () => scene.add.image(0, 0, 'allies-front', 0),
      activate: (image) => {
        // An egg or honey pot can reuse a former tilted/tinted silhouette.
        image
          .addToDisplayList()
          .setActive(true)
          .setVisible(true)
          .setAlpha(1)
          .setRotation(0)
          .setFlip(false, false)
          .clearTint()
          .setOrigin(0.5);
      },
      deactivate: (image) => {
        image.setVisible(false).setActive(false).removeFromDisplayList();
      },
      destroy: (image) => image.destroy(),
    });
    onSceneExit(scene.events, () => {
      this.pieces.clear();
      this.shells.clear();
    });
  }
  private piece(key: string, art: { texture: string; frame: number | string }) {
    const image = this.pieces.acquire(key);
    if (image.texture.key !== art.texture || String(image.frame.name) !== String(art.frame))
      image.setTexture(art.texture, art.frame);
    return image;
  }
  draw(game: Game, presentation: Presentation, ink: Phaser.GameObjects.Graphics, reduced: boolean) {
    this.pieces.beginFrame();
    this.shells.beginFrame();
    this.shadows.clear();
    for (const unit of [...game.units, ...game.enemies]) {
      const enemy = unit.kind === 'snake',
        idle = enemy
          ? unit.boss
            ? KING_ART
            : unit.variant === 'umbrella' && unit.state !== 'move'
              ? UMBRELLA_CLOSED_ART
              : ENEMY_ART[unit.variant]
          : ALLY_ART[unit.kind as Kind];
      if (!idle) continue;
      const u = visualPose(unit, presentation.clock, presentation.reactions, reduced);
      const size = shellGeometry(actorSize(unit.kind, unit.variant, unit.boss), !!unit.shell).size;
      const moving = unit.state === 'move' && !reduced;
      const action = presentation.actions.get(unit.id);
      // Body, rim and flash all use this one frame: the rim always has the shape of
      // the image it surrounds.
      const art = poseArt(idle, action, reduced, this.loaded);
      const figurine = this.figurines.figurine(
        art,
        size,
        size,
        enemy ? ENEMY_RIM : ALLY_RIM,
        enemy ? ENEMY_RIM_WIDTH : ALLY_RIM_WIDTH,
        enemy ? ENEMY_RIM_ALPHA : ALLY_RIM_ALPHA,
        FOOT_X,
        FOOT_Y,
      );
      const flying = isFlying(unit);
      const motion = characterMotion(
        unit,
        presentation.clock,
        action,
        reduced,
        presentation.gaits.get(unit.id),
        flying,
      );
      if (!flying) {
        // The shadow stays on the ground and shrinks a little under a hop.
        const air = 1 + Math.min(0, motion.dy) * 0.03;
        this.shadows.fillStyle(0x263f34, 0.18);
        this.shadows.fillEllipse(unit.x + 2, unit.y + 13, size * 0.58 * air, size * 0.17 * air);
        // The ground ring carries the camp colour too: the rim itself can stay thin.
        this.shadows.lineStyle(enemy ? 2 : 1.5, enemy ? 0xc9603c : 0xe5efdb, enemy ? 0.8 : 0.5);
        this.shadows.strokeEllipse(unit.x, unit.y + 12, size * 0.55, size * 0.17);
      }
      const hurt = presentation.reactions.get(unit.id)?.hurt ?? 0;
      // One pale flash per blow, 100 ms, never restarted within 0.3 s: no strobe.
      const flash = !reduced && (presentation.flashes.get(unit.id) ?? 1) < 0.1;
      const squash = reduced ? 0 : hurt * 0.14;
      const landed = enemy || reduced ? undefined : presentation.placed.get(unit.id);
      const pop =
        landed === undefined ? 1 : 0.55 + 0.45 * Phaser.Math.Easing.Back.Out(landed / 0.35);
      const spring =
        unit.variant === 'spring' && moving
          ? enemySpeed('spring', game.time) > 1
            ? -0.06
            : 0.06
          : 0;
      const arrival = enemy ? presentation.arrivals.find((a) => a.id === unit.id) : undefined;
      const emerge = arrival ? Math.min(1, arrival.age / 0.35) : 1;
      const entryScale = reduced ? 1 : 0.82 + emerge * 0.18;
      const width = size * (1 - spring) * entryScale * motion.sx * (1 + squash) * pop,
        height = size * (1 + spring) * entryScale * motion.sy * (1 - squash) * pop,
        x = u.x + motion.dx,
        y = u.y + 18 + motion.dy - (flying ? flightLift : 0),
        alpha = 0.25 + emerge * 0.75,
        depth = 10 + unit.y / 1000,
        // The image keeps the side of the blow until the swing is over.
        flip = spriteFlip(unit.kind, unit.variant, blowFacing(unit.facing, action));
      // One thin rim behind the body, with the body's own transform: no ghost, no
      // per-actor effect pass. Red-orange is reserved for living threats.
      const rim = figurine.rim;
      this.piece(`edge:${unit.id}`, rim)
        .setOrigin(rim.originX, rim.originY)
        .setPosition(x, y)
        .setDisplaySize(width * rim.scaleX, height * rim.scaleY)
        .setAlpha(alpha)
        .setRotation(motion.angle)
        .setFlipX(flip)
        // Already coloured on its surface; the tint keeps the camp colour readable on the object.
        .setTintFill(enemy ? ENEMY_RIM : ALLY_RIM)
        .setDepth(depth - 0.00002);
      const body = this.piece(
        `entity:${unit.id}`,
        flash && this.canvas ? this.figurines.fill(art, size, size, FLASH) : figurine.body,
      )
        .setOrigin(FOOT_X, FOOT_Y)
        .setPosition(x, y)
        .setDisplaySize(width, height)
        .setAlpha(alpha)
        .setRotation(motion.angle)
        .setFlipX(flip)
        .setDepth(depth);
      if (flash) body.setTintFill(FLASH);
      else
        body.setTint(
          hurt > 0.55
            ? 0xffdfbc
            : unit.variant === 'clockwork' && unit.hp <= unit.maxHp * 0.5
              ? 0xf3d6a0
              : enemy && stickySpeed(unit, game.feast, game.level) < 1
                ? 0xdcefc1
                : 0xffffff,
        );
      if (unit.shell) {
        const shell = this.shells.acquire(unit.id);
        shell
          .clear()
          .setPosition(x, y)
          .setRotation(motion.angle)
          .setScale(flip ? -1 : 1, 1)
          .setAlpha(alpha)
          .setDepth(depth + 0.00001);
        shell.save();
        shell.translateCanvas(0, -height * 0.38);
        drawCapriceShell(shell, width * 0.53, height * 0.37);
        shell.restore();
      }
      this.health(
        unit,
        ink,
        unit.boss ? 82 : unit.kind === 'tank' ? 50 : 38,
        unit.boss ? 103 : size * 0.7 + (isFlying(unit) ? flightLift : 0),
      );
      if (!enemy && unit.confusedFor > 0) this.confusion(unit, size, ink);
      if (action && unit.kind === 'dino') {
        const t = Math.min(1, action.age / 0.5);
        ink.lineStyle(2, 0xdadfa0, (1 - t) * 0.65);
        ink.strokeEllipse(
          unit.x,
          unit.y + 16,
          38 + (reduced ? 0 : t * 45),
          16 + (reduced ? 0 : t * 20),
        );
      }
      if (action?.kind === 'block' && unit.kind === 'shield') {
        ink.lineStyle(3, 0xb7e4ed, (1 - action.age / 0.55) * 0.9);
        ink.strokeEllipse(unit.x, unit.y - 15, 40, 56);
      }
      if (action && unit.kind === 'ninja' && action.age < 0.25) {
        ink.lineStyle(3, 0xd5c4e5, (1 - action.age / 0.25) * 0.7);
        ink.lineBetween(
          unit.x + unit.facing * 12,
          unit.y - 24,
          unit.x + unit.facing * 35,
          unit.y - 8,
        );
      }
      if (unit.variant === 'clockwork' && unit.hp <= unit.maxHp * 0.5) {
        ink.lineStyle(2, 0xe0ae57, 0.8);
        ink.strokeCircle(unit.x + 23, unit.y - 17, 6);
        ink.lineBetween(unit.x + 20, unit.y - 20, unit.x + 26, unit.y - 14);
      }
    }
    for (const egg of game.eggs) {
      const progress = 1 - egg.hatchIn / egg.duration,
        wobble = progress > 0.7 && !reduced ? Math.sin(game.time * 20) * 0.045 : 0;
      this.piece(`egg:${egg.id}`, this.figurines.image(EGG_ART, 54, 61))
        .setOrigin(0.5, 0.8)
        .setPosition(egg.x, egg.y + 14)
        .setDisplaySize(54, 61)
        .setRotation(wobble)
        .setDepth(8 + egg.y / 1000);
      ink.lineStyle(2, 0xe2c58a, 0.65);
      ink.beginPath();
      ink.arc(egg.x, egg.y + 5, 20, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ink.strokePath();
    }
    if (game.feast) {
      const pot = feastPoint(game.feast, game.level);
      this.piece(
        'honey',
        this.figurines.image(game.feast.flavor === 'sticky' ? HONEY_STICKY_ART : HONEY_ART, 55, 55),
      )
        .setOrigin(0.5, 0.8)
        .setPosition(pot.x, pot.y + 6)
        .setDisplaySize(55, 55)
        .setDepth(9);
    }
    this.pieces.endFrame();
    this.shells.endFrame();
  }
  private confusion(u: Entity, size: number, ink: Phaser.GameObjects.Graphics) {
    const x = u.x + 18,
      y = u.y - size * 0.68 - 10;
    ink.fillStyle(0x3c2c56, 0.96);
    ink.fillRoundedRect(x - 8, y - 10, 17, 22, 6);
    ink.lineStyle(1.5, 0xf4dcff, 1);
    ink.strokeRoundedRect(x - 8, y - 10, 17, 22, 6);
    ink.lineStyle(2, 0xf4dcff, 1);
    ink.beginPath();
    ink.arc(x, y - 3, 3.5, Math.PI, Math.PI * 2.65);
    ink.strokePath();
    ink.lineBetween(x - 1.5, y + 1, x - 1.5, y + 3);
    ink.fillStyle(0xf4dcff, 1);
    ink.fillCircle(x - 1.5, y + 7, 1.3);
  }
  private health(u: Entity, g: Phaser.GameObjects.Graphics, width: number, offset: number) {
    g.fillStyle(0x203a35, 0.96);
    if (u.kind === 'snake') {
      g.fillTriangle(u.x - 7, u.y + 24, u.x + 7, u.y + 24, u.x, u.y + 13);
      g.fillStyle(0xffb57d, 1);
      g.fillTriangle(u.x - 4, u.y + 22, u.x + 4, u.y + 22, u.x, u.y + 16);
    } else {
      g.fillPoints(
        [
          { x: u.x, y: u.y + 12 },
          { x: u.x + 7, y: u.y + 19 },
          { x: u.x, y: u.y + 26 },
          { x: u.x - 7, y: u.y + 19 },
        ],
        true,
      );
      g.fillStyle(0x91e1f2, 1);
      g.fillPoints(
        [
          { x: u.x, y: u.y + 14 },
          { x: u.x + 4, y: u.y + 19 },
          { x: u.x, y: u.y + 24 },
          { x: u.x - 4, y: u.y + 19 },
        ],
        true,
      );
    }
    if (!u.boss && u.hp >= u.maxHp) return;
    g.fillStyle(0x263d2e, 0.82);
    g.fillRoundedRect(u.x - width / 2 - 2, u.y - offset, width + 4, 7, 3);
    g.fillStyle(u.kind === 'snake' ? 0xe4a66b : 0xa7c878);
    g.fillRoundedRect(u.x - width / 2, u.y - offset + 2, width * Math.max(0, u.hp / u.maxHp), 3, 1);
  }
}
