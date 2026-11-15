/** A board colour as the page writes it, for the text of a canvas label. */
export const cssColor = (color: number): string => '#' + color.toString(16).padStart(6, '0');
