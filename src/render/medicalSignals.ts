import { BODY_FONT } from './fonts.ts';
import { addCanvasText as addCanvasCopy, setCanvasText as setCanvasCopy } from '../i18n/phaser.ts';
import Phaser from 'phaser';
import type { Game } from '../game.ts';
import { medicalReadout } from './medicalReadout.ts';
import { FramePool } from './framePool.ts';
import { onSceneExit } from './sceneExit.ts';
import * as TEXT from '../texts/fr/board.ts';
import * as DEPTH from './boardLayers.ts';
import { boardShownSmall, plainCaptionWhenSmall, readableBoardSize } from './boardResolution.ts';

/** Size the stock labels are drawn at, in board units. */
const STOCK_TEXT = 11;
const STOCK_PLATE = '#285e4a',
  STATION_PLATE = '#294b3b';
/** Where the station writes: under the crystal, or beside its cross on a small board. */
const STATION = { x: 988, y: 442 },
  STATION_SMALL = { x: 1004, y: 326 };
/** Stock labels read the simulation; rendering never advances a recharge. */
export class MedicalSignals {
  private labels: FramePool<number, Phaser.GameObjects.Text>;
  private station: Phaser.GameObjects.Graphics;
  private stationLabel: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.labels = new FramePool({
      maxIdle: 16,
      create: () =>
        addCanvasCopy(scene.add, 0, 0, '', {
          fontFamily: BODY_FONT,
          fontSize: `${STOCK_TEXT}px`,
          color: '#fff6dc',
          backgroundColor: STOCK_PLATE,
          padding: { x: 4, y: 2 },
        })
          .setOrigin(0.5, 0)
          .setDepth(DEPTH.signalLabels),
      activate: (label) => {
        label.addToDisplayList().setActive(true).setVisible(true);
      },
      deactivate: (label) => {
        label.setVisible(false).setActive(false).removeFromDisplayList();
      },
      destroy: (label) => label.destroy(),
    });
    onSceneExit(scene.events, () => this.labels.clear());
    this.station = scene.add.graphics().setDepth(DEPTH.medicalStation);
    this.stationLabel = addCanvasCopy(scene.add, STATION.x, STATION.y, TEXT.reserve, {
      fontFamily: BODY_FONT,
      fontSize: `${STOCK_TEXT}px`,
      color: '#f6f0d8',
      backgroundColor: STATION_PLATE,
      padding: { x: 4, y: 3 },
    })
      .setOrigin(0.5)
      .setDepth(DEPTH.signalLabels)
      .setVisible(false);
  }
  draw(game: Game) {
    this.labels.beginFrame();
    const readout = medicalReadout(game.units);
    // On a small board: the stock alone under a medic, the wait alone under the station.
    const small = boardShownSmall(this.scene),
      size = readableBoardSize(this.scene, STOCK_TEXT),
      font = `${size}px`;
    this.station.clear();
    for (const badge of readout.badges) {
      const label = this.labels.acquire(badge.id),
        text = small ? badge.short : badge.text;
      if (label.style.fontSize !== font) label.setFontSize(size);
      plainCaptionWhenSmall(label, small, STOCK_PLATE);
      if (label.text !== text) setCanvasCopy(label, text);
      label.setPosition(badge.x, badge.y);
    }
    this.labels.endFrame();
    const reserve = small ? readout.reserveShort : readout.reserveLabel;
    this.stationLabel.setVisible(readout.present > 0 && reserve !== '');
    if (this.stationLabel.style.fontSize !== font) this.stationLabel.setFontSize(size);
    plainCaptionWhenSmall(this.stationLabel, small, STATION_PLATE);
    // Under the crystal the wait would be written on the plate of the crystal, which is on
    // two lines on a small board: it goes beside the cross of the station.
    const at = small ? STATION_SMALL : STATION;
    this.stationLabel.setOrigin(small ? 0 : 0.5, 0.5).setPosition(at.x, at.y);
    if (this.stationLabel.text !== reserve) setCanvasCopy(this.stationLabel, reserve);
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
