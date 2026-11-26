/**
 * The modelling-clay honey button (`clairiere-bouton.webp`) on the end of a battle and on the
 * pause, only where its word has room (decision of the parent, 26 November 2026: « Pâte si
 * assez large »). Its painted rim takes the edge of the button: a word that touches it, or
 * that goes over two lines, is hard to read on the clay. Such a button keeps its flat honey.
 * The clay changes no size, so the measure cannot swing back and forth.
 */

/** The painted rim of the picture, measured on it: its flat clay starts 40 px in of 720. */
const CLAY_RIM = 40 / 720;
/** The outline of the letters on the clay (`text-shadow` in homeSkin.css), in em. */
const LETTER_OUTLINE_EM = 0.1;
/** Air between the word and the rim, in CSS pixels. */
const CLAY_AIR_PX = 4;

const watched = new WeakSet<HTMLElement>();

/** One line, inside the flat clay on both sides. */
function wordFits(button: HTMLElement): boolean {
  const box = button.getBoundingClientRect();
  if (!box.width) return false;
  const range = document.createRange();
  range.selectNodeContents(button);
  const lines = new Set(Array.from(range.getClientRects(), (rect) => Math.round(rect.top)));
  if (lines.size !== 1) return false;
  const word = range.getBoundingClientRect();
  const fontSize = parseFloat(getComputedStyle(button).fontSize) || 0;
  const room = CLAY_RIM * box.width + LETTER_OUTLINE_EM * fontSize + CLAY_AIR_PX;
  return word.left - box.left >= room && box.right - word.right >= room;
}

/** Marks `data-clay` on the button while its word has room; the style sheet does the rest. */
export function clayWhenRoom(button: HTMLElement) {
  if (watched.has(button)) return;
  watched.add(button);
  const check = () => button.toggleAttribute('data-clay', wordFits(button));
  new ResizeObserver(check).observe(button);
  // The same box can hold another word (a language, a mission that ends otherwise), or the
  // button can change its colour.
  new MutationObserver(check).observe(button, {
    childList: true,
    characterData: true,
    subtree: true,
    attributeFilter: ['class'],
  });
  void document.fonts?.ready.then(check);
  check();
}
