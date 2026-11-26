import type Phaser from 'phaser';
import type { Game } from '../../game.ts';
import type { Session } from '../../session.ts';
import { HiddenBossGame } from '../../hiddenBoss.ts';
import { CURRENT_HIDDEN_BOSS_VERSION } from '../../hiddenBossTuning.ts';
import { HiddenBossLayer, loadClassicSnakeArt } from '../../render/hiddenBossLayer.ts';
import { visualSettings } from '../../render/visualSettings.ts';
import { onSceneExit } from '../../render/sceneExit.ts';
import { byId } from '../dom.ts';

/** What the page lends to the battle of Classic Snake. */
export type ClassicSnakePorts = {
  session: Session;
  /** The battle scene: the board Classic Snake is drawn on. */
  scene: Phaser.Scene;
  /** Puts a battle aside on the board; `again` makes the next one, for « Rejouer ». */
  play: (game: Game, again: () => Game) => void;
};

/** A battle by the numbers of the current version (1, « Moyen », chosen by the parent). */
const freshBattle = () =>
  new HiddenBossGame(crypto.getRandomValues(new Uint32Array(1))[0], CURRENT_HIDDEN_BOSS_VERSION);

let drawing = false;

/**
 * Le combat de Classic Snake (boss caché, lot 3) : ce paquet n'arrive qu'au premier toucher du
 * bouton de l'antre (`ui/classicSnakeDoor.ts`), avec les règles du combat, ses images et ses
 * mots. Il charge les trois images, branche leur dessin sur le plateau, et rend la fonction
 * qui lance un combat. Si une image n'arrive pas, la promesse est rejetée : le bouton le dit.
 */
export async function bindClassicSnake(ports: ClassicSnakePorts): Promise<() => void> {
  const { scene, session } = ports;
  await loadClassicSnakeArt(scene.textures);
  if (!drawing) {
    drawing = true;
    const motion = window.matchMedia('(prefers-reduced-motion:reduce)');
    const board = byId('game');
    let layer: HiddenBossLayer | null = null;
    onSceneExit(scene.events, () => (layer = null));
    // After each frame of the battle scene: the scene has drawn the rest of the board.
    scene.events.on('postupdate', () => {
      const game = session.game;
      if (!(game instanceof HiddenBossGame)) {
        layer?.hide();
        delete board.dataset.bossRings;
        return;
      }
      layer ??= new HiddenBossLayer(scene);
      layer.draw(game, scene.time.now / 1000, visualSettings.reduced(motion.matches));
      // The number on the plate, for the recipes, as the apple writes `data-apple`.
      const label = layer.label;
      if (label === null) delete board.dataset.bossRings;
      else board.dataset.bossRings = label;
    });
  }
  return () => ports.play(freshBattle(), freshBattle);
}
