import type Phaser from 'phaser';
import type { Game } from '../game.ts';
import type { Effect } from '../engine/state.ts';
import type { BoardLayer } from './BattleScene.ts';
import { REFUGE_GROUND } from './stageLayout.ts';
import * as DEPTH from './boardLayers.ts';

/**
 * The gifts of the endless adventure, seen where they act (lot B, 27 November 2026). Rendering
 * only: it reads the level of each gift (`game.boonLevel`) and what the rules left on the board.
 *
 * - « La forge »: sparks fly from every blow of an ally, more of them a level.
 * - « L'armure »: a ring at the feet of every ally, thicker a level. One drawing for all of
 *   them, with few points to each ring: nothing noticeable to draw.
 * - « Le cristal solide »: a glow on the ground of the refuge. Its « +5 » after a wave is the
 *   one every repair already writes (`presentation.ts`).
 *
 * « Effets légers » and the system's reduced motion keep the sparks where they are born.
 */
/**
 * The colours of the gifts' discs on the page (`styles/20-boons.css`), a shade deeper to stand
 * out on the pale roads: gold, and sky.
 */
const FORGE = 0xffc44d,
  ARMOUR = 0x4f9ea7,
  SOLID = 0x5fb8be;
const SPARK_SECONDS = 0.45,
  MAX_SPARKS = 32;
/** A spark: how far its rays reach, its two strokes (edge, then gold) and its bright tip. */
const SPARK = {
  reach: 20,
  strokes: [
    [5, 0x8a4a12],
    [2.5, FORGE],
  ],
  tip: 2.6,
} as const;
/** Blows of an ally: what « la forge » makes stronger. */
const BLOWS = new Set<Effect['kind']>(['hit', 'arrow', 'fire', 'shell']);
/** The ring at the feet of an ally, a little wider than the ring of a healed one. */
const RING = { below: 15, width: 52, height: 19, points: 12 };
/** The glow on the ground at the foot of the refuge, under its walls. */
const GLOW = { below: 30, width: 214, height: 82 };

type Spark = { x: number; y: number; age: number };

export function boonLayer(scene: Phaser.Scene): BoardLayer {
  const ground = scene.add.graphics().setDepth(DEPTH.groundMarks);
  const glow = scene.add.graphics().setDepth(DEPTH.strongholdEffects);
  const flashes = scene.add.graphics().setDepth(DEPTH.sparks);
  let sparks: Spark[] = [];
  let seen = new WeakSet<Effect>();
  let clock = 0;
  let watched: Game | null = null;
  /** New blows of the allies, since the last frame, become sparks at what they struck. */
  const strike = (game: Game) => {
    let allies: Set<number> | undefined;
    for (const effect of game.effects) {
      if (seen.has(effect)) continue;
      seen.add(effect);
      if (!BLOWS.has(effect.kind) || effect.sourceId === undefined) continue;
      allies ??= new Set(game.units.map((u) => u.id));
      if (allies.has(effect.sourceId)) sparks.push({ x: effect.tx, y: effect.ty - 10, age: 0 });
    }
    if (sparks.length > MAX_SPARKS) sparks = sparks.slice(-MAX_SPARKS);
  };
  return {
    draw(game, p, reduced) {
      ground.clear();
      glow.clear();
      flashes.clear();
      if (game !== watched) {
        watched = game;
        sparks = [];
        seen = new WeakSet();
      }
      // The presentation's clock stops in a pause and starts again with another game.
      const dt = Math.max(0, p.clock - clock);
      clock = p.clock;
      if (!game.endless) return;
      const armour = game.boonLevel('armure');
      if (armour) {
        ground.lineStyle(1.5 + armour, ARMOUR, 0.85);
        for (const u of game.units)
          if (u.hp > 0)
            ground.strokeEllipse(u.x, u.y + RING.below, RING.width, RING.height, RING.points);
      }
      const solid = game.boonLevel('solide');
      if (solid) {
        const y = REFUGE_GROUND.y + GLOW.below;
        glow.fillStyle(SOLID, 0.28);
        glow.fillEllipse(REFUGE_GROUND.x, y, GLOW.width, GLOW.height);
        glow.lineStyle(1.5 + solid, SOLID, 0.85);
        glow.strokeEllipse(REFUGE_GROUND.x, y, GLOW.width, GLOW.height);
      }
      const forge = game.boonLevel('forge');
      if (forge) strike(game);
      sparks = sparks.filter((s) => (s.age += dt) < SPARK_SECONDS);
      const rays = 2 + forge;
      for (const s of sparks) {
        const t = s.age / SPARK_SECONDS;
        const reach = reduced ? SPARK.reach : SPARK.reach * (0.5 + t);
        // Bright to the end, then gone: a spark of the anvil, not a smoke.
        const alpha = 1 - t * t;
        for (let i = 0; i < rays; i++) {
          // A fan of sparks thrown upwards, as from an anvil.
          const angle = -Math.PI / 2 + (i - (rays - 1) / 2) * 0.62;
          const dx = Math.cos(angle),
            dy = Math.sin(angle);
          // A dark edge under the gold, to be seen on the pale roads.
          for (const [width, colour] of SPARK.strokes) {
            flashes.lineStyle(width, colour, alpha);
            flashes.lineBetween(
              s.x + dx * reach * 0.35,
              s.y + dy * reach * 0.35,
              s.x + dx * reach,
              s.y + dy * reach,
            );
          }
          flashes.fillStyle(FORGE, alpha);
          flashes.fillCircle(s.x + dx * reach, s.y + dy * reach, SPARK.tip);
        }
      }
    },
  };
}
