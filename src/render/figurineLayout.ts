/** Prepared at twice the size shown: the screen averages two pixels into one, crisp and smooth. */
const MARGIN = 2;
/** Prepared sizes go by steps: a size that moves by a hair does not prepare a new image. */
const GRAIN = 4;

/** Pixels to prepare for an image shown `size` board units wide, never more than its source. */
export function preparedPixels(size: number, pixelsPerUnit: number, source: number): number {
  return Math.min(source, Math.ceil((size * pixelsPerUnit * MARGIN) / GRAIN) * GRAIN);
}

/**
 * Where the figure lies inside its rim image, and how the rim is displayed to stay glued to
 * a figure whose origin is (`originX`, `originY`) of its own image. `reach` is the thickness
 * of the rim in prepared pixels.
 */
export function rimLayout(
  width: number,
  height: number,
  reach: number,
  originX: number,
  originY: number,
) {
  const pad = Math.ceil(reach) + 2,
    fullWidth = width + pad * 2,
    fullHeight = height + pad * 2;
  return {
    pad,
    fullWidth,
    fullHeight,
    scaleX: fullWidth / width,
    scaleY: fullHeight / height,
    originX: (pad + width * originX) / fullWidth,
    originY: (pad + height * originY) / fullHeight,
  };
}
