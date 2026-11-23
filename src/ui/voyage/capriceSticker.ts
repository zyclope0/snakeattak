import type { CapriceDefinition } from '../../caprices.ts';
import { setAttribute } from '../../i18n/dom.ts';
import { stickerGraphic } from '../capriceIcons.ts';
import { make } from '../dom.ts';

/**
 * The sticker of the caprice that surprises a stop, shown in advance: a button that opens what
 * it means. `label` says it to a screen reader. The voyage's path and the expedition's road
 * draw it the same way.
 */
export function capriceSticker(
  caprice: CapriceDefinition,
  label: string,
  explain: (caprice: CapriceDefinition) => void,
) {
  const button = make('button', { className: 'stop-caprice' }, stickerGraphic(caprice));
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'dialog');
  setAttribute(button, 'aria-label', label);
  button.onclick = () => explain(caprice);
  return button;
}
