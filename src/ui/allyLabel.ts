import * as TEXT from '../texts/fr/recruiting.ts';
import { fill } from '../texts/fill.ts';

/**
 * An ally card read aloud: its name, then its price, « Massue, 80 pièces » or « Massue,
 * offert ». Each label is one text of the catalogue, filled: the English interface translates
 * it whole, never piece by piece.
 */
export const allyPriceLabel = (name: string, cost: number): string =>
  cost === 0 ? fill(TEXT.nOffert, name) : fill(TEXT.nNPieces, name, cost);

/** The same on a shortcut of the dock, which also says why a card cannot be taken. */
export function dockAllyLabel(name: string, cost: number, affordable: boolean, reserve: boolean) {
  const label = allyPriceLabel(name, cost);
  if (affordable) return label;
  return fill(reserve ? TEXT.nReserveBancaireProtegee : TEXT.nPasAssezDePieces, label);
}
