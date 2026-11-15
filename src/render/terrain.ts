import Phaser from 'phaser';
import type { Level } from '../levels.ts';
import type { MissionRun } from '../missions.ts';
import { refinedTerrain } from './refinedTerrain.ts';
import { onSceneExit } from './sceneExit.ts';
import { drawSaucer } from './saucer.ts';
import { BOARD_WIDTH, BOARD_HEIGHT } from './boardResolution.ts';
import { DEFAULT_SEED } from '../gameConstants.ts';
import * as DEPTH from './boardLayers.ts';

/** One cached ground and bounded foreground; never changes navigation geometry. */
export class TerrainLayer {
  private objects: Phaser.GameObjects.Container;
  private cache!: Phaser.GameObjects.RenderTexture;
  private levelId = '';
  private scale = 0;
  private foreground: Phaser.GameObjects.Image[] = [];
  constructor(private scene: Phaser.Scene) {
    this.objects = scene.add.container(0, 0).setDepth(DEPTH.terrain);
    const renderer = scene.game.renderer;
    const invalidate = () => {
      this.levelId = '';
    };
    renderer.on(Phaser.Renderer.Events.RESTORE_WEBGL, invalidate);
    onSceneExit(scene.events, () => {
      renderer.off(Phaser.Renderer.Events.RESTORE_WEBGL, invalidate);
      for (const image of this.foreground) image.destroy();
      this.foreground = [];
    });
  }
  /** Prepared images were dropped (the canvas changed size): draw the terrain again. */
  invalidate() {
    this.levelId = '';
  }
  /** `scale` is the size of the cache in pixels per board unit; the layer still covers 1100 × 620. */
  update(
    level: Level,
    mission: MissionRun | null = null,
    initialSeed: number | null = DEFAULT_SEED,
    scale = 1,
  ) {
    const seed = mission?.seed ?? initialSeed ?? DEFAULT_SEED;
    const key = `${level.id}:${seed}:${scale}`;
    if (this.levelId === key) return;
    this.levelId = key;
    if (this.scale !== scale) {
      this.scale = scale;
      this.cache?.destroy();
      this.cache = this.scene.add
        .renderTexture(0, 0, Math.ceil(BOARD_WIDTH * scale), Math.ceil(BOARD_HEIGHT * scale))
        .setOrigin(0)
        .setScale(1 / scale)
        .setDepth(DEPTH.terrain);
    }
    for (const image of this.foreground) image.destroy();
    this.foreground = [];
    this.objects.removeAll(true);
    this.objects.setVisible(true).setScale(scale);
    this.foreground = refinedTerrain(this.scene, this.objects, level, seed, scale);
    drawSaucer(this.scene, this.objects, level, mission);
    this.cache.clear().draw(this.objects);
    this.objects.removeAll(true);
    this.objects.setVisible(false);
  }
}
