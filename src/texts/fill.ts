/**
 * Puts values into a text of the catalogue: `{0}`, `{1}`… are replaced by the values, in the
 * order they are given. `fill('Étape {0} sur {1}', 2, 5)` gives « Étape 2 sur 5 ».
 *
 * The texts live in `src/texts/`, never in the code that shows them: a text is changed, or
 * translated, in one place.
 */
export const fill = (text: string, ...values: readonly unknown[]): string =>
  text.replace(/\{(\d+)\}/g, (_, index: string) => String(values[Number(index)]));
