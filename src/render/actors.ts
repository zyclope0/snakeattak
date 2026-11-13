import { shellGeometry, drawCapriceShell } from './capriceShell.ts';
import { Figurines } from './figurines.ts';
import type { PreparedFrame, Rim } from './figurines.ts';
import { isFlying, flightLift } from '../flying.ts';
import Phaser from 'phaser';
import { blowFacing, characterMotion } from './characterMotion.ts';
import type { CharacterAction } from './characterMotion.ts';
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
import type { Egg, Entity, Game } from '../game.ts';
import { enemySpeed } from '../enemies.ts';
import type { Kind } from '../data.ts';
import type { Arrival, Presentation } from './presentation.ts';
import { ACTION_SECONDS, PLACED_SECONDS, visualPose } from './presentation.ts';
import { FramePool } from './framePool.ts';
import { onSceneExit } from './sceneExit.ts';
import { standingDepth } from './boardDepth.ts';
type Graphics = Phaser.GameObjects.Graphics;
/** Warm paper white, softer than a pure white flash. */
const FLASH = 0xfff4dc;
/**
 * The colours of a camp: red-orange for living threats, dark green for allies. `rimWidth` is
 * the thickness of the rim in board units, `rimAlpha` its opacity: a threat must stand out at
 * a glance; an ally only needs a quiet line that lifts it off the ground. The ground ring
 * carries the camp colour too: the rim itself can stay thin.
 */
type Camp = {
  rim: number;
  rimWidth: number;
  rimAlpha: number;
  ring: number;
  ringWidth: number;
  ringAlpha: number;
};
const ENEMY_CAMP: Camp = {
    rim: 0xd2552d,
    rimWidth: 1.7,
    rimAlpha: 0.94,
    ring: 0xc9603c,
    ringWidth: 2,
    ringAlpha: 0.8,
  },
  ALLY_CAMP: Camp = {
    rim: 0x233d36,
    rimWidth: 1.1,
    rimAlpha: 0.82,
    ring: 0xe5efdb,
    ringWidth: 1.5,
    ringAlpha: 0.5,
  };
/** Where a figure stands in its frame: between its feet. */
const FOOT_X = 0.5,
  FOOT_Y = 0.82;
/** Visual seconds a snake takes to come out of its den or its egg. */
const EMERGE_SECONDS = 0.35;
/** Where and how large a figure is drawn in this frame. */
type Stance = {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  depth: number;
  angle: number;
  flip: boolean;
  flying: boolean;
  /** Height of its hop, negative upwards: the shadow shrinks under it. */
  hop: number;
  /** How fresh its last wound is, from 1 down to 0. */
  hurt: number;
};
/** The resting image of a fighter; an umbrella snake closes its umbrella when it stops. */
function idleArt(unit: Entity) {
  if (unit.kind !== 'snake') return ALLY_ART[unit.kind as Kind];
  if (unit.boss) return KING_ART;
  if (unit.variant === 'umbrella' && unit.state !== 'move') return UMBRELLA_CLOSED_ART;
  return ENEMY_ART[unit.variant];
}
/** A clockwork snake at half health or less has lost a gear. */
function isCracked(unit: Entity): boolean {
  return unit.variant === 'clockwork' && unit.hp <= unit.maxHp * 0.5;
}
/** A spring snake on the move is flattened or stretched by the beat of its speed. */
function springStretch(unit: Entity, time: number, reduced: boolean): number {
  if (unit.variant !== 'spring' || unit.state !== 'move' || reduced) return 0;
  return enemySpeed('spring', time) > 1 ? -0.06 : 0.06;
}
/** An ally placed `landed` seconds ago pops up to its size, a little beyond, and settles. */
function placedPop(landed: number | undefined): number {
  return landed === undefined
    ? 1
    : 0.55 + 0.45 * Phaser.Math.Easing.Back.Out(landed / PLACED_SECONDS);
}
/** From 0 to 1 while the snake `id` comes out of its den or its egg; 1 once it is out. */
function emergence(arrivals: readonly Arrival[], id: number): number {
  for (const arrival of arrivals)
    if (arrival.id === id) return Math.min(1, arrival.age / EMERGE_SECONDS);
  return 1;
}
/** A fresh wound, a lost gear and sticky honey each tint the body; white leaves it as drawn. */
function bodyTint(unit: Entity, game: Game, hurt: number): number {
  if (hurt > 0.55) return 0xffdfbc;
  if (isCracked(unit)) return 0xf3d6a0;
  if (unit.kind === 'snake' && stickySpeed(unit, game.feast, game.level) < 1) return 0xdcefc1;
  return 0xffffff;
}
/** A diamond of the given half-width, with its points at `top`, `middle` and `bottom`. */
function fillDiamond(
  g: Graphics,
  x: number,
  top: number,
  middle: number,
  bottom: number,
  half: number,
) {
  g.beginPath();
  g.moveTo(x, top);
  g.lineTo(x + half, middle);
  g.lineTo(x, bottom);
  g.lineTo(x - half, middle);
  g.lineTo(x, top);
  g.fillPath();
}
/** What a blow leaves in the air for an instant: a stomp, a raised shield, a slash. */
function drawBlowMark(unit: Entity, action: CharacterAction, ink: Graphics, reduced: boolean) {
  if (unit.kind === 'dino') {
    const t = Math.min(1, action.age / 0.5);
    ink.lineStyle(2, 0xdadfa0, (1 - t) * 0.65);
    ink.strokeEllipse(
      unit.x,
      unit.y + 16,
      38 + (reduced ? 0 : t * 45),
      16 + (reduced ? 0 : t * 20),
    );
  }
  if (action.kind === 'block' && unit.kind === 'shield') {
    ink.lineStyle(3, 0xb7e4ed, (1 - action.age / ACTION_SECONDS) * 0.9);
    ink.strokeEllipse(unit.x, unit.y - 15, 40, 56);
  }
  if (unit.kind === 'ninja' && action.age < 0.25) {
    ink.lineStyle(3, 0xd5c4e5, (1 - action.age / 0.25) * 0.7);
    ink.lineBetween(unit.x + unit.facing * 12, unit.y - 24, unit.x + unit.facing * 35, unit.y - 8);
  }
}
/** The gear a cracked clockwork snake has lost. */
function drawLostGear(unit: Entity, ink: Graphics) {
  ink.lineStyle(2, 0xe0ae57, 0.8);
  ink.strokeCircle(unit.x + 23, unit.y - 17, 6);
  ink.lineBetween(unit.x + 20, unit.y - 20, unit.x + 26, unit.y - 14);
}
export class Actors {
  private figurines: Figurines;
  /** The Canvas renderer cannot tint an image: it shows a prepared pale silhouette instead. */
  private canvas: boolean;
  private pieces: FramePool<string, Phaser.GameObjects.Image>;
  private shells: FramePool<number, Graphics>;
  private shadows: Graphics;
  private loaded = (texture: string) => this.scene.textures.exists(texture);
  /** One stance filled again for every fighter: nothing is allocated per figure. */
  private stance: Stance = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    alpha: 1,
    depth: 0,
    angle: 0,
    flip: false,
    flying: false,
    hop: 0,
    hurt: 0,
  };
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
  draw(game: Game, presentation: Presentation, ink: Graphics, reduced: boolean) {
    this.pieces.beginFrame();
    this.shells.beginFrame();
    this.shadows.clear();
    for (const unit of game.units) this.drawFighter(unit, game, presentation, ink, reduced);
    for (const unit of game.enemies) this.drawFighter(unit, game, presentation, ink, reduced);
    for (const egg of game.eggs) this.drawEgg(egg, game.time, ink, reduced);
    if (game.feast) this.drawHoneyPot(game, game.feast);
    this.pieces.endFrame();
    this.shells.endFrame();
  }
  private drawFighter(
    unit: Entity,
    game: Game,
    presentation: Presentation,
    ink: Graphics,
    reduced: boolean,
  ) {
    const idle = idleArt(unit);
    if (!idle) return;
    const enemy = unit.kind === 'snake',
      camp = enemy ? ENEMY_CAMP : ALLY_CAMP;
    const size = shellGeometry(actorSize(unit.kind, unit.variant, unit.boss), !!unit.shell).size;
    const action = presentation.actions.get(unit.id);
    // Body, rim and flash all use this one frame: the rim always has the shape of
    // the image it surrounds.
    const art = poseArt(idle, action, reduced, this.loaded);
    const figurine = this.figurines.figurine(
      art,
      size,
      size,
      camp.rim,
      camp.rimWidth,
      camp.rimAlpha,
      FOOT_X,
      FOOT_Y,
    );
    const stance = this.stanceOf(unit, size, action, game, presentation, reduced);
    if (!stance.flying) this.drawShadow(unit, camp, size, stance.hop);
    // One pale flash per blow, 100 ms, never restarted within 0.3 s: no strobe.
    const flash = !reduced && (presentation.flashes.get(unit.id) ?? 1) < 0.1;
    this.drawRim(unit.id, figurine.rim, camp.rim, stance);
    const body = this.drawBody(
      unit.id,
      flash && this.canvas ? this.figurines.fill(art, size, size, FLASH) : figurine.body,
      stance,
    );
    if (flash) body.setTintFill(FLASH);
    else body.setTint(bodyTint(unit, game, stance.hurt));
    if (unit.shell) this.drawShell(unit.id, stance);
    this.health(
      unit,
      ink,
      unit.boss ? 82 : unit.kind === 'tank' ? 50 : 38,
      unit.boss ? 103 : size * 0.7 + (stance.flying ? flightLift : 0),
    );
    if (!enemy && unit.confusedFor > 0) this.confusion(unit, size, ink);
    if (action) drawBlowMark(unit, action, ink, reduced);
    if (isCracked(unit)) drawLostGear(unit, ink);
  }
  /**
   * Where the figure of a fighter goes and how its clay is stretched: by its walk and its
   * blow, by a wound, by its entrance. Returns the stance shared by every fighter: read it
   * before the next call.
   */
  private stanceOf(
    unit: Entity,
    size: number,
    action: CharacterAction | undefined,
    game: Game,
    presentation: Presentation,
    reduced: boolean,
  ): Stance {
    const enemy = unit.kind === 'snake',
      flying = isFlying(unit),
      u = visualPose(unit, presentation.clock, presentation.reactions, reduced),
      motion = characterMotion(
        unit,
        presentation.clock,
        action,
        reduced,
        presentation.gaits.get(unit.id),
        flying,
      );
    const hurt = presentation.reactions.get(unit.id)?.hurt ?? 0,
      squash = reduced ? 0 : hurt * 0.14,
      pop = enemy || reduced ? 1 : placedPop(presentation.placed.get(unit.id)),
      spring = springStretch(unit, game.time, reduced),
      emerge = enemy ? emergence(presentation.arrivals, unit.id) : 1,
      entryScale = reduced ? 1 : 0.82 + emerge * 0.18;
    const stance = this.stance;
    stance.width = size * (1 - spring) * entryScale * motion.sx * (1 + squash) * pop;
    stance.height = size * (1 + spring) * entryScale * motion.sy * (1 - squash) * pop;
    stance.x = u.x + motion.dx;
    stance.y = u.y + 18 + motion.dy - (flying ? flightLift : 0);
    stance.alpha = 0.25 + emerge * 0.75;
    stance.depth = standingDepth(unit.y);
    stance.angle = motion.angle;
    // The image keeps the side of the blow until the swing is over.
    stance.flip = spriteFlip(unit.kind, unit.variant, blowFacing(unit.facing, action));
    stance.flying = flying;
    stance.hop = motion.dy;
    stance.hurt = hurt;
    return stance;
  }
  private drawShadow(unit: Entity, camp: Camp, size: number, hop: number) {
    // The shadow stays on the ground and shrinks a little under a hop.
    const air = 1 + Math.min(0, hop) * 0.03;
    this.shadows.fillStyle(0x263f34, 0.18);
    this.shadows.fillEllipse(unit.x + 2, unit.y + 13, size * 0.58 * air, size * 0.17 * air);
    this.shadows.lineStyle(camp.ringWidth, camp.ring, camp.ringAlpha);
    this.shadows.strokeEllipse(unit.x, unit.y + 12, size * 0.55, size * 0.17);
  }
  /**
   * One thin rim behind the body, with the body's own transform: no ghost, no per-actor
   * effect pass.
   */
  private drawRim(id: number, rim: Rim, color: number, stance: Stance) {
    this.piece(`edge:${id}`, rim)
      .setOrigin(rim.originX, rim.originY)
      .setPosition(stance.x, stance.y)
      .setDisplaySize(stance.width * rim.scaleX, stance.height * rim.scaleY)
      .setAlpha(stance.alpha)
      .setRotation(stance.angle)
      .setFlipX(stance.flip)
      // Already coloured on its surface; the tint keeps the camp colour readable on the object.
      .setTintFill(color)
      .setDepth(stance.depth - 0.00002);
  }
  private drawBody(id: number, art: PreparedFrame, stance: Stance) {
    return this.piece(`entity:${id}`, art)
      .setOrigin(FOOT_X, FOOT_Y)
      .setPosition(stance.x, stance.y)
      .setDisplaySize(stance.width, stance.height)
      .setAlpha(stance.alpha)
      .setRotation(stance.angle)
      .setFlipX(stance.flip)
      .setDepth(stance.depth);
  }
  /** The shell of a caprice sits on the back of its snake and follows its every move. */
  private drawShell(id: number, stance: Stance) {
    const shell = this.shells.acquire(id);
    shell
      .clear()
      .setPosition(stance.x, stance.y)
      .setRotation(stance.angle)
      .setScale(stance.flip ? -1 : 1, 1)
      .setAlpha(stance.alpha)
      .setDepth(stance.depth + 0.00001);
    shell.save();
    shell.translateCanvas(0, -stance.height * 0.38);
    drawCapriceShell(shell, stance.width * 0.53, stance.height * 0.37);
    shell.restore();
  }
  /** An egg, with the ring that closes as it gets ready to hatch; it wobbles near the end. */
  private drawEgg(egg: Egg, time: number, ink: Graphics, reduced: boolean) {
    const progress = 1 - egg.hatchIn / egg.duration,
      wobble = progress > 0.7 && !reduced ? Math.sin(time * 20) * 0.045 : 0;
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
  private drawHoneyPot(game: Game, feast: NonNullable<Game['feast']>) {
    const pot = feastPoint(feast, game.level);
    this.piece(
      'honey',
      this.figurines.image(feast.flavor === 'sticky' ? HONEY_STICKY_ART : HONEY_ART, 55, 55),
    )
      .setOrigin(0.5, 0.8)
      .setPosition(pot.x, pot.y + 6)
      .setDisplaySize(55, 55)
      .setDepth(9);
  }
  private confusion(u: Entity, size: number, ink: Graphics) {
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
  /** The camp mark under the feet, and the health bar once the fighter is wounded. */
  private health(u: Entity, g: Graphics, width: number, offset: number) {
    g.fillStyle(0x203a35, 0.96);
    if (u.kind === 'snake') {
      g.fillTriangle(u.x - 7, u.y + 24, u.x + 7, u.y + 24, u.x, u.y + 13);
      g.fillStyle(0xffb57d, 1);
      g.fillTriangle(u.x - 4, u.y + 22, u.x + 4, u.y + 22, u.x, u.y + 16);
    } else {
      fillDiamond(g, u.x, u.y + 12, u.y + 19, u.y + 26, 7);
      g.fillStyle(0x91e1f2, 1);
      fillDiamond(g, u.x, u.y + 14, u.y + 19, u.y + 24, 4);
    }
    if (!u.boss && u.hp >= u.maxHp) return;
    g.fillStyle(0x263d2e, 0.82);
    g.fillRoundedRect(u.x - width / 2 - 2, u.y - offset, width + 4, 7, 3);
    g.fillStyle(u.kind === 'snake' ? 0xe4a66b : 0xa7c878);
    g.fillRoundedRect(u.x - width / 2, u.y - offset + 2, width * Math.max(0, u.hp / u.maxHp), 3, 1);
  }
}
