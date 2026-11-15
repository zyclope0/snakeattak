/**
 * The colours of the board that more than one drawing uses, so that both keep the same one
 * (`import * as BOARD_COLOR from './palette.ts'`). A colour that a single drawing uses stays
 * next to that drawing. Merging two near shades changes the picture: that is a decision of
 * the art direction, not a tidy-up.
 */
/** The ring of an egg's countdown, the plaques of the board, the dust of a blow. */
export const parchment = 0xe2c58a;
/** The question mark over a confused ally, and the words of its plaque. */
export const confusion = 0xf4dcff;
/** The king's aim on the ground, and the words that announce it. */
export const kingWarning = 0xffd58b;
/** Where an ally may stand: the placement guide and the marks of the defence. */
export const placement = 0xb2eaf4;
export const coin = 0xffd66a;
/** The thin rim of a serpent, shared by the shell it may carry. */
export const serpentRim = 0xd2552d;
