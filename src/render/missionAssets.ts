import { setText as setDisplayText } from '../i18n/dom.ts';
import type Phaser from 'phaser';
import type { Game } from '../game.ts';
import type { Kind } from '../data.ts';
import { kinds, waveStats } from '../data.ts';
import { variantFor } from '../waves.ts';
import { missionWave } from '../missions.ts';
import {
  ALLY_ART,
  ART_SHEETS,
  ATTACK_SHEETS,
  ENEMY_ART,
  GROUND_ART,
  SCENERY_ART,
  KING_ART,
} from '../art.ts';
import { stageTheme } from './stageLayout.ts';
import { onSceneExit } from './sceneExit.ts';
import { attackSheetsFor } from './attackPose.ts';
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
const OPTIONAL = new Set(ATTACK_SHEETS.map((sheet) => sheet.key));
/** One Phaser loader, no speculative downloads, and a retryable HTML progress panel. */
export class MissionAssets {
  private failed = new Set<string>();
  private panel = document.getElementById('loading-overlay');
  private label = document.getElementById('loading-status');
  private retry = document.getElementById('loading-retry');
  private board = document.getElementById('game');
  private current?: Game;
  private loadStarted: number | null = null;
  /** False while only an optional attack sheet is still arriving: no panel for it. */
  private waiting = false;
  private posesAsked = new Set<string>();
  private exists = (key: string) => this.scene.textures.exists(key);
  constructor(private scene: Phaser.Scene) {
    const progress = (value: number) => {
      if (this.waiting && !this.failed.size)
        this.show(`Préparation du terrain… ${Math.round(value * 100)} %`);
    };
    const error = (file: Phaser.Loader.File) => {
      if (OPTIONAL.has(file.key)) return; // The fighter keeps its idle image.
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
    this.waiting = true;
    this.show('Préparation du terrain…');
  }
  ready(game: Game): boolean {
    this.current = game;
    const wanted = texturesForGame(game);
    const missing = new Set([...wanted].filter((key) => !this.scene.textures.exists(key)));
    if (!missing.size) {
      this.waiting = false;
      this.hide();
      this.poses(wanted);
      return true;
    }
    this.waiting = true;
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
  /** Optional attack poses follow their loaded base sheet in the background, once per scene. */
  private poses(keys: Set<string>) {
    if (this.posesAsked.size === OPTIONAL.size || this.scene.load.isLoading()) return;
    const sheets = attackSheetsFor(keys, this.exists).filter(
      (sheet) => !this.posesAsked.has(sheet.key),
    );
    if (!sheets.length) return;
    for (const sheet of sheets) {
      this.posesAsked.add(sheet.key);
      this.scene.load.spritesheet(sheet.key, sheet.url, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }
    this.scene.load.start();
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
