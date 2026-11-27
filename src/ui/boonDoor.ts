import type { Session } from '../session.ts';
import type { BattleScene } from '../render/BattleScene.ts';

/**
 * L'étagère des cadeaux de l'aventure sans fin (lot B, 27 novembre 2026). Only this door is in
 * the main package: the shelf, its sheet, the recap and the signs on the board come in a
 * package of their own (`boons/boonShelf.ts`), asked for the first time an endless game is
 * drawn. Until it is there, or if it never comes (a site that lost its network), the game
 * plays as before, without them. Answers what redraws them, from the session.
 */
export function bindBoonDoor(session: Session, scene: BattleScene, refresh: () => void) {
  let shelf: (() => void) | undefined;
  let asked = false;
  return () => {
    if (shelf) return shelf();
    if (asked || !session.game.endless) return;
    asked = true;
    import('./boons/boonShelf.ts').then(
      (module) => {
        shelf = module.bindBoonShelf(session, scene, refresh);
        refresh();
      },
      // A browser keeps a module that failed once: the next page asks again.
      () => undefined,
    );
  };
}
