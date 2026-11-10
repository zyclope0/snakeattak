/** Local faces shared by every canvas label; CSS owns their bundled @font-face URLs. */
export const DISPLAY_FONT = 'Fredoka';
export const BODY_FONT = 'Nunito Sans';

/** Canvas text caches pixels, so load the faces before constructing Phaser text. */
export async function loadGameFonts(): Promise<void> {
  await Promise.all([
    document.fonts.load(`500 16px "${DISPLAY_FONT}"`),
    document.fonts.load(`600 16px "${DISPLAY_FONT}"`),
    document.fonts.load(`400 16px "${BODY_FONT}"`),
    document.fonts.load(`700 16px "${BODY_FONT}"`),
    document.fonts.load(`800 16px "${BODY_FONT}"`),
  ]);
}
