import type Phaser from 'phaser';
import type { Game } from '../game.ts';
import type { Kind } from '../data.ts';
import type { Point } from '../navigation.ts';
import { LANES } from '../ai.ts';
import { defenseRole } from '../defenders.ts';
import { placementSuggestions } from '../placement.ts';
import { placementReadout } from './placementRange.ts';
import { BOARD_WIDTH, BOARD_HEIGHT } from './boardResolution.ts';
import * as TEXT from '../texts/fr/board.ts';
import * as BOARD_COLOR from './palette.ts';

type Graphics = Phaser.GameObjects.Graphics;
type Range = NonNullable<ReturnType<typeof placementReadout>>;

/** The reach of the reinforcement, in the colour of what it does there. */
function drawRange(ink: Graphics, range: Range) {
  const color = !range.valid
    ? 0xd99574
    : range.healing
      ? 0x9bd1a0
      : range.category === TEXT.tir2
        ? 0x8bd9e9
        : 0xf0d18a;
  ink.fillStyle(color, 0.07);
  ink.fillCircle(range.x, range.y, range.radius);
  ink.lineStyle(2, color, 0.8);
  ink.strokeCircle(range.x, range.y, range.radius);
}
/** A free spot offered to the player: a pale patch of ground and a target. */
function drawSuggestion(ink: Graphics, spot: Point) {
  ink.fillStyle(0xe6dbb8, 0.8);
  ink.fillEllipse(spot.x, spot.y + 5, 48, 30);
  ink.lineStyle(1, 0x657857, 0.4);
  ink.strokeEllipse(spot.x, spot.y + 5, 48, 30);
  ink.fillStyle(0x8bd9e9, 0.15);
  ink.fillCircle(spot.x, spot.y, 21);
  ink.lineStyle(3, BOARD_COLOR.placement, 0.85);
  ink.strokeCircle(spot.x, spot.y, 21);
  ink.lineBetween(spot.x - 6, spot.y, spot.x + 6, spot.y);
  ink.lineBetween(spot.x, spot.y - 6, spot.x, spot.y + 6);
}
/** The ring under the pointer says whether the spot is free; a mobile ally shows its three lanes. */
function drawPointer(ink: Graphics, game: Game, kind: Kind, pointer: Point) {
  ink.lineStyle(
    2,
    game.canRecruit(kind, pointer.x, pointer.y) ? BOARD_COLOR.placement : 0xe1a07d,
    0.9,
  );
  ink.strokeCircle(pointer.x, pointer.y, 23);
  ink.lineStyle(1, BOARD_COLOR.placement, 0.35);
  if (defenseRole(kind) !== 'mobile') return;
  ink.lineBetween(pointer.x, LANES[0], pointer.x, LANES[LANES.length - 1]);
  for (const y of LANES) ink.strokeCircle(pointer.x, y, 10);
}

/**
 * What the board shows while a reinforcement is selected: its reach, the free spots and the
 * pointer. `onBoard` tells whether the pointer is over the board at all. Display only: the
 * rules decide where a placement is legal.
 */
export function drawPlacementGuide(
  ink: Graphics,
  game: Game,
  kind: Kind,
  pointer: Point,
  onBoard: boolean,
) {
  const range = placementReadout(game, kind, onBoard ? pointer : undefined);
  if (range) drawRange(ink, range);
  for (const spot of placementSuggestions(game, kind)) drawSuggestion(ink, spot);
  const inside =
    pointer.x >= 0 && pointer.x <= BOARD_WIDTH && pointer.y >= 0 && pointer.y <= BOARD_HEIGHT;
  if (onBoard && inside) drawPointer(ink, game, kind, pointer);
}
