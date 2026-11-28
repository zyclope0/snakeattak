import type { Game } from '../game.ts';
import { kinds } from '../data.ts';
import type { Kind } from '../data.ts';
import { enemies } from '../enemies.ts';
import type { EnemyKind } from '../enemies.ts';
import { snakeEntries } from '../ui/snakeIndex/snakeEntries.ts';
import { abilityOf } from '../ui/threatPreview.ts';
import * as TEXT from '../texts/fr/board.ts';
import { fill } from '../texts/fill.ts';

/**
 * What the board says of someone new: a snake met for the first time, an ally the camp may
 * now recruit. Both exist in the rules already; nothing here changes a game.
 */
let debuts: Map<string, number> | undefined;
/** The wave of the great adventure where a snake is met for the first time. */
const debutWave = (variant: EnemyKind) =>
  (debuts ??= new Map(snakeEntries().map((entry) => [entry.kind, entry.firstWave]))).get(variant);

/**
 * The banner of a snake that enters the great adventure for the first time: its name on the
 * board, and what it does in the advice of the camp panel, as the index of the snakes says
 * them (the board writes the title of a banner only). Null for the ordinary snake, for a
 * snake already met in an earlier wave, and in a mission, whose waves follow another order.
 */
export function newSnakeBanner(game: Game, variant: EnemyKind) {
  if (game.mission || variant === 'normal' || debutWave(variant) !== game.snakeWave) return null;
  return {
    title: fill(TEXT.nouveauSerpentN, enemies[variant].name),
    subtitle: abilityOf(variant, game.balanceRevision),
  };
}

/** The allies the camp may recruit now, to compare before and after a wave. */
export const recruitableKinds = (game: Game): Kind[] =>
  (Object.keys(kinds) as Kind[]).filter((kind) => game.isUnlocked(kind));

/** One line for the allies that have just become recruitable; null when there is none. */
export function newAlliesLine(fresh: readonly Kind[]): string | null {
  const [first, second, third] = fresh.map((kind) => kinds[kind].name);
  if (third) return fill(TEXT.nouveauxAlliesNNEtN, first, second, third);
  if (second) return fill(TEXT.nouveauxAlliesNEtN, first, second);
  return first ? fill(TEXT.nouvelAllieN, first) : null;
}
