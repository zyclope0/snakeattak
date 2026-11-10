import { BODY_FONT } from './fonts.ts';
import { addCanvasText as addCanvasCopy, setCanvasText as setCanvasCopy } from '../i18n/phaser.ts';
import type Phaser from 'phaser';
import type { Game } from '../game.ts';
import { LANES } from '../ai.ts';
import { ENEMY_ART, KING_ART } from '../art.ts';
import { currentWaveThreats } from '../ui/threatPreview.ts';
/** Representative species at every open den. Never predicts an adaptive lane. */
export class ThreatMarkers {
  private cards: Phaser.GameObjects.Image[];
  private ink: Phaser.GameObjects.Graphics;
  private symbols: Phaser.GameObjects.Text[];
  private observed?: Game;
  private wave = -1;
  constructor(scene: Phaser.Scene) {
    this.ink = scene.add.graphics().setDepth(16);
    this.cards = Array.from({ length: 6 }, () =>
      scene.add
        .image(0, 0, 'enemies-organic', 0)
        .setName('threat-marker')
        .setDisplaySize(52, 52)
        .setDepth(16.1)
        .setVisible(false),
    );
    this.symbols = this.cards.map(() =>
      addCanvasCopy(scene.add, 0, 0, '', {
        fontFamily: BODY_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#fff4df',
        backgroundColor: '#984028',
        padding: { x: 3, y: 1 },
      })
        .setOrigin(0.5)
        .setDepth(16.2)
        .setVisible(false),
    );
  }
  draw(game: Game) {
    if (
      this.observed === game &&
      this.wave === game.wave &&
      this.ink.visible === (game.status === 'preparing')
    )
      return;
    this.observed = game;
    this.wave = game.wave;
    this.ink.clear().setVisible(game.status === 'preparing');
    this.cards.forEach((c) => c.setVisible(false));
    this.symbols.forEach((t) => t.setVisible(false));
    const preview = currentWaveThreats(game);
    if (!preview) return;
    for (const lane of preview.lanes) {
      const types = preview.entries.slice(0, 2),
        y = LANES[lane] - 67,
        x = types.length === 1 ? 90 : 65;
      this.ink.fillStyle(0xf8efdc, 0.98).lineStyle(2, 0xb65232, 1);
      this.ink.fillRoundedRect(x - 27, y - 28, types.length * 52 + 2, 56, 12);
      this.ink.strokeRoundedRect(x - 27, y - 28, types.length * 52 + 2, 56, 12);
      types.forEach(({ kind }, i) => {
        const art = kind === 'king' ? KING_ART : ENEMY_ART[kind],
          index = lane * 2 + i;
        this.cards[index]
          .setTexture(art.texture, art.frame)
          .setPosition(x + i * 52, y)
          .setDisplaySize(50, 50)
          .setVisible(true);
        const symbol =
          kind === 'flying'
            ? '↑'
            : kind === 'courtHealer'
              ? '+'
              : kind === 'spitter'
                ? '↗'
                : kind === 'rattlesnake'
                  ? '?'
                  : '';
        setCanvasCopy(this.symbols[index], symbol)
          .setPosition(x + i * 52 + 17, y + 19)
          .setVisible(!!symbol);
      });
    }
  }
}
