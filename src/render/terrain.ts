import Phaser from 'phaser';
import type { Level } from '../levels.ts';
import type { MissionRun } from '../missions.ts';
import { refinedTerrain } from './refinedTerrain.ts';
import { onSceneExit } from './sceneExit.ts';
import { drawSaucer } from './saucer.ts';

/** One cached ground and bounded foreground; never changes navigation geometry. */
export class TerrainLayer {
  private objects: Phaser.GameObjects.Container;
  private cache: Phaser.GameObjects.RenderTexture;
  private levelId = '';
  private foreground: Phaser.GameObjects.Image[] = [];
  constructor(private scene: Phaser.Scene) {
    this.cache = scene.add.renderTexture(0, 0, 1100, 620).setOrigin(0).setDepth(0);
    this.objects = scene.add.container(0, 0).setDepth(0);
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
  update(level: Level, mission: MissionRun | null = null, initialSeed: number | null = 2026) {
    const seed = mission?.seed ?? initialSeed ?? 2026;
    const key = `${level.id}:${seed}`;
    if (this.levelId === key) return;
    this.levelId = key;
    for (const image of this.foreground) image.destroy();
    this.foreground = [];
    this.objects.removeAll(true);
    this.objects.setVisible(true);
    this.foreground = refinedTerrain(this.scene, this.objects, level, seed);
    drawSaucer(this.scene, this.objects, level, mission);
    this.cache.clear().draw(this.objects);
    this.objects.removeAll(true);
    this.objects.setVisible(false);
  }
}
