import { BODY_FONT } from './fonts.ts';
import { addCanvasText as addCanvasCopy, setCanvasText as setCanvasCopy } from '../i18n/phaser.ts';
import Phaser from 'phaser';
import type { Game } from '../game.ts';
import { medicalReadout } from './medicalReadout.ts';
import { FramePool } from './framePool.ts';
import { onSceneExit } from './sceneExit.ts';
import * as TEXT from '../texts/fr/board.ts';
/** Stock labels read the simulation; rendering never advances a recharge. */
export class MedicalSignals {
  private labels: FramePool<number, Phaser.GameObjects.Text>;
  private station: Phaser.GameObjects.Graphics;
  private stationLabel: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene) {
    this.labels = new FramePool({
      maxIdle: 16,
      create: () =>
        addCanvasCopy(scene.add, 0, 0, '', {
          fontFamily: BODY_FONT,
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
    this.stationLabel = addCanvasCopy(scene.add, 988, 442, TEXT.reserve, {
      fontFamily: BODY_FONT,
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
    const readout = medicalReadout(game.units);
    this.station.clear();
    for (const badge of readout.badges) {
      const label = this.labels.acquire(badge.id),
        text = badge.text;
      if (label.text !== text) setCanvasCopy(label, text);
      label.setPosition(badge.x, badge.y);
    }
    this.labels.endFrame();
    this.stationLabel.setVisible(readout.present > 0);
    if (this.stationLabel.text !== readout.reserveLabel)
      setCanvasCopy(this.stationLabel, readout.reserveLabel);
    if (readout.present) {
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
