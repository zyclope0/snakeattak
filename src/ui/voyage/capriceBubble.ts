import type { CapriceDefinition } from '../../caprices.ts';
import { setText } from '../../i18n/dom.ts';
import { capriceExplanation, frenchLeaf } from '../capriceCopy.ts';
import { paintSticker, stickerGraphic } from '../capriceIcons.ts';
import { make } from '../dom.ts';
import { closeButton, voyageWindow } from './voyageWindow.ts';

/**
 * What a sticker of the path stands for: the caprice that will surprise that stage. Its
 * name and its announcement are the child's own words, in French in every language; the
 * sentence under them reads the rules the caprice really changes. Returns the function
 * that shows a caprice.
 */
export function capriceBubble(): (caprice: CapriceDefinition) => void {
  const { dialog, heading } = voyageWindow('voyage-caprice', 'Caprice surprise');
  const graphic = stickerGraphic();
  const name = frenchLeaf('strong', '');
  const announce = frenchLeaf('p', '');
  const rules = make('p', { id: 'voyage-caprice-rules' });
  dialog.setAttribute('aria-describedby', rules.id);
  heading.after(
    make('div', { className: 'caprice-announcement' }, graphic, make('div', {}, name, announce)),
    rules,
    closeButton(dialog, 'primary'),
  );
  return (caprice) => {
    paintSticker(graphic, caprice);
    name.textContent = caprice.name;
    announce.textContent = caprice.announce;
    setText(rules, capriceExplanation(caprice.rules));
    dialog.showModal();
  };
}
