import {
  addCanvasText as addCanvasCopy,
  setCanvasText as setCanvasCopy,
  sharpenCanvasTexts,
} from '../i18n/phaser.ts';
import { ThreatMarkers } from './threatMarkers.ts';
import { victoryCopy, defeatCopy } from './resultCopy.ts';
import { activateBoard } from '../ui/boardActions.ts';
import { drawFeastPlacement } from './feastPlacement.ts';
import { FlightSignals } from './flightSignals.ts';
import { MedicalSignals } from './medicalSignals.ts';
import { drawPlacementGuide } from './placementGuide.ts';
import { drawHoneyZone } from './honeyZone.ts';
import { drawDefenseMarkers } from './defenseMarkers.ts';
import { MissionAssets } from './missionAssets.ts';
import { Actors } from './actors.ts';
import { Presentation } from './presentation.ts';
import type { Notice } from './presentation.ts';
import { BattleFeedback } from './battleFeedback.ts';
import Phaser from 'phaser';
import type { Game } from '../game.ts';
import type { Kind } from '../data.ts';
import type { Session } from '../session.ts';
import { TerrainLayer } from './terrain.ts';
import { Figurines } from './figurines.ts';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  boardPoint,
  boardScale,
  terrainScale,
} from './boardResolution.ts';
import { Strongholds } from './strongholds.ts';
import { bindInputBounds } from './inputBounds.ts';
import { BossSignals } from './bossSignals.ts';
import { visualSettings } from './visualSettings.ts';
import type { DevPerformance } from './devPerformance.ts';
import { pauseForDialog } from '../ui/dialogs.ts';
import { performanceEnabled } from './performanceRecording.ts';
import { onSceneExit } from './sceneExit.ts';
import { BODY_FONT } from './fonts.ts';
import { BattleJuice, drawCelebration } from './juice.ts';
import { EffectTrails } from './effectTrails.ts';
import * as TEXT from '../texts/fr/board.ts';
import { fill } from '../texts/fill.ts';
/** Milliseconds between two refreshes of the HTML dashboard. */
const HUD_PERIOD_MS = 180;
export class BattleScene extends Phaser.Scene {
  private assets!: MissionAssets;
  private initialized = false;
  private presentation = new Presentation();
  private feedback!: BattleFeedback;
  private juice!: BattleJuice;
  private resultSize = 0;
  /** Canvas width the camera, the labels and the terrain cache were last fitted to. */
  private fittedWidth = 0;
  private motionQuery = window.matchMedia('(prefers-reduced-motion:reduce)');
  private onPresentation: (notice: Notice | null, deltaMs: number) => void;
  private resultStats!: Phaser.GameObjects.Text;
  private resultSubtitle!: Phaser.GameObjects.Text;
  private celebration!: Phaser.GameObjects.Graphics;
  private ink!: Phaser.GameObjects.Graphics;
  private honeyInk!: Phaser.GameObjects.Graphics;
  private actors!: Actors;
  private terrain!: TerrainLayer;
  private threatMarkers!: ThreatMarkers;
  private strongholds!: Strongholds;
  private hudTime = 0;
  private meter?: DevPerformance;
  private bossSignals!: BossSignals;
  private flightSignals!: FlightSignals;
  private medicalSignals!: MedicalSignals;
  private effectTrails!: EffectTrails;
  private feastLabel!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Container;
  private session: Session;
  private onChange: () => void;
  private onFrame: (game: Game) => void;
  constructor(
    session: Session,
    onChange: () => void,
    onFrame: (game: Game) => void = () => {},
    onPresentation: (notice: Notice | null, deltaMs: number) => void = () => {},
  ) {
    super('Battle');
    this.session = session;
    this.onChange = onChange;
    this.onFrame = onFrame;
    this.onPresentation = onPresentation;
  }
  preload() {
    this.assets = new MissionAssets(this);
    if (this.session.screen !== 'home') this.assets.preload(this.session.game);
  }
  create() {
    if (this.session.screen === 'home') this.scene.sleep();
    else if (this.assets.ready(this.session.game)) this.createBattle();
  }
  /** Phaser shows objects of equal depth in the order they are created here. */
  private createBattle() {
    this.initialized = true;
    onSceneExit(this.events, () => {
      this.initialized = false;
    });
    if (performanceEnabled(location.search, import.meta.env.DEV)) void this.createMeter();
    const releaseInputBounds = bindInputBounds(this.game.canvas, () => this.scale.updateBounds());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, releaseInputBounds);
    this.events.once(Phaser.Scenes.Events.DESTROY, releaseInputBounds);
    this.terrain = new TerrainLayer(this);
    this.fittedWidth = 0;
    this.fitCanvas();
    this.drawTerrain();
    this.strongholds = new Strongholds(this);
    this.threatMarkers = new ThreatMarkers(this);
    this.actors = new Actors(this);
    this.bossSignals = new BossSignals(this);
    this.flightSignals = new FlightSignals(this);
    this.medicalSignals = new MedicalSignals(this);
    this.effectTrails = new EffectTrails(this);
    this.ink = this.add.graphics().setDepth(15);
    this.honeyInk = this.add.graphics().setDepth(7.5);
    this.feedback = new BattleFeedback(this);
    this.juice = new BattleJuice(this);
    this.feastLabel = addCanvasCopy(this.add, 420, 0, '', {
      fontFamily: BODY_FONT,
      fontSize: '13px',
      color: '#ffe5a1',
      backgroundColor: '#324832',
      padding: { x: 7, y: 4 },
    })
      .setOrigin(0.5)
      .setDepth(9.5)
      .setVisible(false);
    this.createResultOverlay();
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.pressBoard(pointer));
    this.onChange();
    if (this.session.screen === 'home') this.scene.sleep();
  }
  /**
   * The developer's frame meter: suspended while the scene sleeps, removed with it. Players
   * never see it, so it comes in a package of its own, asked for only with « ?perf=1 ».
   */
  private async createMeter() {
    const { DevPerformance } = await import('./devPerformance.ts');
    // The scene may have been left while the package was on its way.
    if (!this.initialized) return;
    this.meter = new DevPerformance(
      this.game.canvas.parentElement!,
      (dialog) => pauseForDialog(dialog, this.session, this.onChange),
      () => ({
        identity: this.session.game,
        mission: this.session.game.mission?.missionId ?? 'classic',
        wave: this.session.game.wave,
      }),
    );
    const suspendMeter = () => this.meter?.suspend();
    this.events.on(Phaser.Scenes.Events.SLEEP, suspendMeter);
    this.events.on(Phaser.Scenes.Events.WAKE, suspendMeter);
    onSceneExit(this.events, () => {
      this.events.off(Phaser.Scenes.Events.SLEEP, suspendMeter);
      this.events.off(Phaser.Scenes.Events.WAKE, suspendMeter);
      this.meter?.destroy();
    });
  }
  /**
   * The accessible HTML result owns the heading and actions. The canvas keeps
   * the atmosphere, outcome detail and survivors without repeating that title.
   */
  private createResultOverlay() {
    const shade = this.add.rectangle(550, 310, 1100, 620, 0x082a23, 0.82);
    const centredLine = (y: number, fontSize: string, color: string) =>
      addCanvasCopy(this.add, 550, y, '', {
        fontFamily: BODY_FONT,
        fontSize,
        color,
        align: 'center',
        wordWrap: { width: 1040 },
      }).setOrigin(0.5);
    this.resultSubtitle = centredLine(300, '21px', '#deebd0');
    this.resultStats = centredLine(358, '18px', '#d9e9c7');
    this.celebration = this.add.graphics();
    this.overlay = this.add
      .container(0, 0, [shade, this.celebration, this.resultSubtitle, this.resultStats])
      .setDepth(100)
      .setVisible(false);
  }
  /** A press on the board places what is selected, or says why it cannot. */
  private pressBoard(pointer: Phaser.Input.Pointer) {
    if (!this.session.selected && !this.session.selectedFeast) return;
    if (!activateBoard(this.session, boardPoint(this, pointer)) && !this.session.selectedFeast) {
      this.session.game.message = this.session.game.paused
        ? TEXT.reprendsLaPartiePourPlacerTon
        : TEXT.choisisUnEspaceLibreDansLeCampLoin;
    }
    this.onChange();
  }
  /**
   * The canvas can be larger than the board (see `boardResolution.ts`): the camera zooms so
   * that the world stays 1100 × 620, and cached pixels (labels, terrain) follow its size.
   */
  private fitCanvas() {
    if (this.fittedWidth === this.scale.width) return;
    this.fittedWidth = this.scale.width;
    const scale = boardScale(this);
    this.cameras.main
      .setSize(this.scale.width, this.scale.height)
      .setZoom(scale)
      .centerOn(BOARD_WIDTH / 2, BOARD_HEIGHT / 2);
    sharpenCanvasTexts(scale);
    Figurines.of(this).setScale(scale);
    // Scenery props are prepared images too.
    this.terrain.invalidate();
    this.resultSize = 0;
  }
  private drawTerrain() {
    const renderer = this.game.renderer;
    const webgl = renderer.type === Phaser.WEBGL;
    this.terrain.update(
      this.session.game.level,
      this.session.game.mission,
      this.session.game.initialSeed,
      terrainScale(
        boardScale(this),
        visualSettings.light,
        webgl,
        webgl ? (renderer as Phaser.Renderer.WebGL.WebGLRenderer).getMaxTextureSize() : Infinity,
      ),
    );
  }
  /** One frame: the rules advance, the presentation observes them, then every layer is drawn. */
  update(_time: number, delta: number) {
    if (!this.assets.ready(this.session.game)) return;
    if (!this.initialized) this.createBattle();
    const started = this.meter ? performance.now() : 0;
    const reduced = visualSettings.reduced(this.motionQuery.matches);
    this.session.advance(delta);
    // A wave ending can change the chapter and unlock another atlas in this frame.
    if (!this.assets.ready(this.session.game)) {
      this.onChange();
      return;
    }
    const game = this.session.game;
    this.presentation.update(game, delta);
    this.onPresentation(this.presentation.notice, delta);
    this.onFrame(game);
    this.ink.clear();
    this.honeyInk.clear();
    if (this.session.selectedFeast) drawFeastPlacement(this.honeyInk, game);
    this.fitCanvas();
    this.drawTerrain();
    this.strongholds.draw(game, this.presentation, reduced);
    this.threatMarkers.draw(game);
    drawDefenseMarkers(this.ink, game);
    this.drawFeast(game, reduced);
    this.actors.draw(game, this.presentation, this.ink, reduced);
    this.bossSignals.draw(game, reduced);
    this.flightSignals.draw(game, reduced);
    this.medicalSignals.draw(game);
    this.effectTrails.draw(this.ink, game.effects, this.presentation.clock, reduced);
    this.feedback.draw(this.presentation, game, reduced);
    this.juice.draw(this.presentation, reduced);
    if (this.session.selected) this.drawPlacement(game, this.session.selected);
    this.drawResult(game, reduced);
    this.refreshHud(delta);
    this.meter?.frame(
      performance.now(),
      performance.now() - started,
      this.session.game.status === 'fighting' &&
        !this.session.game.paused &&
        this.session.screen !== 'home',
    );
  }
  /** The honey on a lane: its zone on the ground and the label that counts its seconds. */
  private drawFeast(game: Game, reduced: boolean) {
    const feast = game.feast;
    this.feastLabel.setVisible(!!feast);
    if (!feast) return;
    const pot = drawHoneyZone(this.honeyInk, game, this.presentation.clock, reduced);
    setCanvasCopy(
      this.feastLabel.setPosition(pot.x, pot.y + 43),
      `${feast.flavor === 'sticky' ? TEXT.collant : TEXT.attirant} · ${Math.ceil(feast.remaining)} s`,
    );
  }
  private drawPlacement(game: Game, kind: Kind) {
    const pointer = this.input.activePointer;
    const onBoard = this.game.canvas.matches(':hover') || pointer.isDown;
    drawPlacementGuide(this.ink, game, kind, boardPoint(this, pointer), onBoard);
  }
  /** Victory or defeat: the shade, the two lines of the outcome and, after a win, the paper. */
  private drawResult(game: Game, reduced: boolean) {
    const end = game.status === 'won' || game.status === 'lost';
    this.overlay.setVisible(end);
    this.resultStats.setVisible(end);
    if (end) this.writeResult(game);
    this.celebration.clear();
    if (game.status === 'won')
      drawCelebration(
        this.celebration,
        this.presentation.victoryAge,
        this.presentation.clock,
        reduced,
      );
  }
  private writeResult(game: Game) {
    // The board is drawn at about half size on a phone: keep 13 CSS px at least.
    const size = Math.ceil(Math.max(18, (13.5 * this.scale.displayScale.x) / boardScale(this)));
    if (size !== this.resultSize) {
      this.resultSize = size;
      this.resultSubtitle.setFontSize(Math.max(21, size));
      this.resultStats.setFontSize(size);
    }
    setCanvasCopy(
      this.resultSubtitle,
      game.status === 'won' ? victoryCopy(game).subtitle : defeatCopy(game).subtitle,
    );
    setCanvasCopy(
      this.resultStats,
      fill(TEXT.nSerpentsRepoussesNAllies, game.kills, game.units.length, Math.ceil(game.base)),
    ).setY(300 + this.resultSubtitle.height / 2 + 16 + this.resultStats.height / 2);
  }
  /** The HTML dashboard is refreshed a few times a second, not at every frame. */
  private refreshHud(delta: number) {
    this.hudTime += delta;
    if (!(this.hudTime > HUD_PERIOD_MS)) return;
    this.onChange();
    this.hudTime = 0;
  }
}
