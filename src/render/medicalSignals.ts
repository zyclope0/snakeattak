import Phaser from 'phaser';
import type { Game } from '../game.ts';
import { medicalRules } from '../healing.ts';
import { FramePool } from './framePool.ts';
import { onSceneExit } from './sceneExit.ts';

/** Stock labels read the simulation; rendering never advances a recharge. */
export class MedicalSignals {
  private labels: FramePool<number, Phaser.GameObjects.Text>;
  private station: Phaser.GameObjects.Graphics;
  private stationLabel: Phaser.GameObjects.Text;
  constructor(private scene: Phaser.Scene) {
    this.labels = new FramePool({
      maxIdle: 16,
      create: () =>
        scene.add
          .text(0, 0, '', {
            fontFamily: 'sans-serif',
            fontSize: '11px',
            color: '#fff6dc',
            backgroundColor: '#285e4a',
            padding: { x: 4, y: 2 },
          })
          .setOrigin(0.5, 0)
          .setDepth(17),
      activate: (label) => {
        label.addToDisplayList().setActive(true).setVisible(true);
      },
      deactivate: (label) => {
        label.setVisible(false).setActive(false).removeFromDisplayList();
      },
      destroy: (label) => label.destroy(),
    });
    onSceneExit(scene.events, () => this.labels.clear());
    this.station = scene.add.graphics().setDepth(15.4);
    this.stationLabel = scene.add
      .text(1022, 442, 'Réserve', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#f6f0d8',
        backgroundColor: '#294b3b',
        padding: { x: 4, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(17)
      .setVisible(false);
  }
  draw(game: Game) {
    this.labels.beginFrame();
    let visible = 0;
    this.station.clear();
    for (const unit of game.units) {
      const rules = medicalRules(unit.kind),
        state = unit.medical;
      if (!rules || !state || unit.hp <= 0) continue;
      visible++;
      const label = this.labels.acquire(unit.id);
      const text =
        state.phase === 'returning'
          ? 'Retour au fort'
          : state.phase === 'restocking'
            ? `Bandages · ${Math.ceil(state.remaining)} s`
            : `Bandages ${state.bandages}/${rules.capacity}`;
      if (label.text !== text) label.setText(text);
      label.setPosition(unit.x, unit.y + 23);
    }
    this.labels.endFrame();
    this.stationLabel.setVisible(visible > 0);
    if (visible) {
      const g = this.station;
      g.fillStyle(0x2c604b, 0.95);
      g.fillRoundedRect(971, 315, 28, 21, 4);
      g.lineStyle(2, 0xe9e4cb, 1);
      g.strokeRoundedRect(971, 315, 28, 21, 4);
      g.fillStyle(0xfaf1d6, 1);
      g.fillRect(981, 319, 8, 13);
      g.fillRect(978, 323, 14, 5);
    }
  }
}
