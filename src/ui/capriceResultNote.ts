import { capriceById } from '../caprices.ts';
import type { Game } from '../game.ts';
import { setText } from '../i18n/dom.ts';
import type { AlbumsController } from './capriceAlbums.ts';
import { frenchLeaf } from './capriceCopy.ts';
import { paintSticker, stickerGraphic } from './capriceIcons.ts';
import { make } from './dom.ts';

type Award = (game: Game) => boolean | undefined;

/**
 * The end of a caprice game, under the mission result: the sticker that was played for, what
 * became of it, and the button that opens the book.
 */
export function stickerResultNote(albums: AlbumsController, award: Award) {
  const button = make('button', { id: 'result-caprice-album', text: 'Voir mon carnet' });
  document.getElementById('mission-result')?.after(button);
  const graphic = stickerGraphic();
  const name = frenchLeaf('strong', '');
  const status = make('span');
  const note = make(
    'p',
    { id: 'caprice-sticker-result', className: 'caprice-result-note' },
    graphic,
    name,
    status,
  );
  button.before(note);
  /** The game's own verdict first, then what the book of this game already holds. */
  const verdict = (game: Game, bookId: string) => {
    if (game.status === 'lost') return 'Tu peux réessayer ce même caprice.';
    if (award(game) === true) return 'Autocollant gagné !';
    return albums.has(game.mission!.caprice!, bookId)
      ? 'Cet autocollant est déjà dans le carnet de cette partie.'
      : 'Ce caprice attend encore son autocollant.';
  };
  return {
    button,
    /** Shown only once a caprice game is won or lost. `bookId` is the book of that game. */
    show(game: Game, bookId: string) {
      const ended = !!game.mission?.caprice && ['won', 'lost'].includes(game.status);
      button.hidden = !ended;
      note.hidden = !ended;
      if (!ended) return;
      const caprice = capriceById(game.mission?.caprice)!;
      name.textContent = caprice.name;
      paintSticker(graphic, caprice);
      graphic.toggleAttribute('hidden', game.status !== 'won');
      setText(status, verdict(game, bookId));
    },
  };
}
