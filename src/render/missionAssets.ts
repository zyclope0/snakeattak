import { setText as setDisplayText } from '../i18n/dom.ts';
import type Phaser from 'phaser';
import type { Game } from '../game.ts';
import type { Kind } from '../data.ts';
import { kinds, waveStats } from '../data.ts';
import { variantFor } from '../waves.ts';
import { missionWave } from '../missions.ts';
import { ALLY_ART, ART_SHEETS, ENEMY_ART, GROUND_ART, SCENERY_ART, KING_ART } from '../art.ts';
import { stageTheme } from './stageLayout.ts';
import { onSceneExit } from './sceneExit.ts';
/** Select from the rules without advancing them or consuming their random stream. */
export function texturesForGame(game: Game): Set<string> {
  const textures = new Set([
    'allies-front',
    'strongholds',
    'props-three-bridges',
    'enemies-mechanical', // Eggs share this sheet.
    'enemies-organic', // Eggs hatch ordinary snakes.
    'miels-parapluie', // The two honey pots.
    stageTheme(game.level).ground,
  ]);
  const scenery = stageTheme(game.level).scenery;
  if (scenery) textures.add(scenery);
  for (const kind of Object.keys(kinds) as Kind[])
    if (game.isUnlocked(kind)) textures.add(ALLY_ART[kind].texture);
  for (const unit of game.units) textures.add(ALLY_ART[unit.kind as Kind].texture);
  for (const enemy of game.enemies)
    textures.add(enemy.boss ? KING_ART.texture : ENEMY_ART[enemy.variant].texture);
  const local = Math.max(
    1,
    Math.min(game.totalWaves, game.wave + (game.status === 'preparing' ? 1 : 0)),
  );
  const variants = game.mission
    ? missionWave(game.mission, local, game.tuning.tacticalRulesEnabled).composition
    : Array.from({ length: waveStats(game.difficultyWave).count }, (_, i) =>
        variantFor(game.difficultyWave, i + 1),
      );
  for (const variant of variants) textures.add(ENEMY_ART[variant].texture);
  if (!game.mission && game.difficultyWave === 12) textures.add(KING_ART.texture);
  return textures;
}
/** One Phaser loader, no speculative downloads, and a retryable HTML progress panel. */
export class MissionAssets {
  private failed = new Set<string>();
  private panel = document.getElementById('loading-overlay');
  private label = document.getElementById('loading-status');
  private retry = document.getElementById('loading-retry');
  private board = document.getElementById('game');
  private current?: Game;
  private loadStarted: number | null = null;
  constructor(private scene: Phaser.Scene) {
    const progress = (value: number) => {
      if (!this.failed.size) this.show(`Préparation du terrain… ${Math.round(value * 100)} %`);
    };
    const error = (file: Phaser.Loader.File) => {
      this.failed.add(file.key);
      this.show('Une image n’a pas pu arriver. Réessaie quand la connexion revient.', true);
    };
    scene.load.on('progress', progress);
    scene.load.on('loaderror', error);
    if (this.retry)
      this.retry.onclick = () => {
        this.failed.clear();
        if (this.current) this.ready(this.current);
      };
    onSceneExit(scene.events, () => {
      scene.load.off('progress', progress);
      scene.load.off('loaderror', error);
      if (this.retry) this.retry.onclick = null;
      this.hide();
    });
  }
  preload(game: Game) {
    this.current = game;
    this.queue(texturesForGame(game));
    this.show('Préparation du terrain…');
  }
  ready(game: Game): boolean {
    this.current = game;
    const missing = new Set(
      [...texturesForGame(game)].filter((key) => !this.scene.textures.exists(key)),
    );
    if (!missing.size) {
      this.hide();
      return true;
    }
    if ([...missing].some((key) => this.failed.has(key))) {
      this.show('Une image n’a pas pu arriver. Réessaie quand la connexion revient.', true);
      return false;
    }
    if (!this.scene.load.isLoading()) {
      this.failed.clear();
      this.queue(missing);
      this.show('Préparation du terrain…');
      this.scene.load.start();
    }
    return false;
  }
  private queue(keys: Set<string>) {
    for (const sheet of ART_SHEETS)
      if (keys.has(sheet.key) && !this.scene.textures.exists(sheet.key))
        this.scene.load.spritesheet(sheet.key, sheet.url, {
          frameWidth: sheet.frameWidth,
          frameHeight: sheet.frameHeight,
        });
    for (const ground of [...GROUND_ART, ...SCENERY_ART])
      if (keys.has(ground.key) && !this.scene.textures.exists(ground.key))
        this.scene.load.image(ground.key, ground.url);
  }
  private show(text: string, failed = false) {
    if (this.loadStarted === null) this.loadStarted = performance.now();
    if (this.panel) this.panel.hidden = false;
    if (this.label) setDisplayText(this.label, text);
    if (this.retry) this.retry.hidden = !failed;
    this.board?.setAttribute('aria-busy', 'true');
  }
  private hide() {
    if (this.loadStarted !== null && this.board) {
      this.board.dataset.loadDurationMs = String(performance.now() - this.loadStarted);
      this.loadStarted = null;
    }
    if (this.panel) this.panel.hidden = true;
    this.board?.setAttribute('aria-busy', 'false');
  }
}
