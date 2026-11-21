import { byId, make } from '../../dom.ts';
import * as TEXT from '../../../texts/fr/expedition.ts';

/**
 * The door of « La Grande Expédition », in the top row of the voyage's page: the long voyage
 * sits beside the short one. « Nouveau » until this player has opened a first expedition.
 */
export function expeditionDoor(open: () => void) {
  const tag = make('small', { className: 'voyage-new', text: TEXT.nouveau });
  const door = make(
    'button',
    { id: 'expedition-door', className: 'secondary' },
    make('span', { text: TEXT.laGrandeExpedition }),
    tag,
  );
  door.type = 'button';
  door.onclick = open;
  byId('mission-total').before(door);
  return { started: (started: boolean) => (tag.hidden = started) };
}
