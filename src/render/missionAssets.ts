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
function texturesForGame(game: Game): Set<string> {
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
  for (const key of fightingTextures(game)) textures.add(key);
  return textures;
}
/** Sheets of the fighters on the board and of the wave that is fighting or about to come. */
function fightingTextures(game: Game): Set<string> {
  const textures = new Set<string>();
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
  /** Attack sheets on their way, two at most: the most urgent ones are not slowed by the rest. */
  private posesArriving = new Set<string>();
  /** Per sheet: how many times it was asked, and not before when it may be asked again. */
  private posesAsked = new Map<string, { tries: number; retryAt: number }>();
  private closed = false;
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
      this.closed = true;
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
      // Only now: an optional pose never takes bandwidth from an image the mission waits for.
      this.poses(game, wanted);
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
  /**
   * Optional attack poses follow the sheets the mission requires. They never go through the
   * scene loader: a slow or stalled pose must not delay those. The fighters on the board and
   * the coming wave are served first, two files at a time, so the first blows have their
   * image even on a slow line; a file that failed is asked once more, later.
   */
  private poses(game: Game, keys: Set<string>) {
    if (this.posesArriving.size >= 2) return;
    const sheets = attackSheetsFor(keys, this.exists);
    if (!sheets.length) return;
    const now = performance.now();
    for (const sheet of attackSheetsFor(keys, this.exists, fightingTextures(game))) {
      if (this.posesArriving.size >= 2) return;
      const asked = this.posesAsked.get(sheet.key);
      if (this.posesArriving.has(sheet.key) || (asked && (asked.tries >= 2 || now < asked.retryAt)))
        continue;
      this.posesAsked.set(sheet.key, { tries: (asked?.tries ?? 0) + 1, retryAt: now + 10_000 });
      this.posesArriving.add(sheet.key);
      const image = new Image();
      const add = () => {
        this.posesArriving.delete(sheet.key);
        if (this.closed || this.scene.textures.exists(sheet.key)) return;
        this.scene.textures.addSpriteSheet(sheet.key, image, {
          frameWidth: sheet.frameWidth,
          frameHeight: sheet.frameHeight,
        });
      };
      // Decoded off the main thread where the browser can: no hitch in the middle of a wave.
      image.onload = () => {
        if (typeof image.decode === 'function') image.decode().then(add, add);
        else add();
      };
      image.onerror = () => this.posesArriving.delete(sheet.key);
      image.src = sheet.url;
    }
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
