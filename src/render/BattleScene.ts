import { addCanvasText as addCanvasCopy, setCanvasText as setCanvasCopy } from '../i18n/phaser.ts';
import { ThreatMarkers } from './threatMarkers.ts';
import { victoryCopy, defeatCopy } from './resultCopy.ts';
import { activateBoard } from '../ui/boardActions.ts';
import { drawFeastPlacement } from './feastPlacement.ts';
import { FlightSignals } from './flightSignals.ts';
import { MedicalSignals } from './medicalSignals.ts';
import { placementReadout } from './placementRange.ts';
import { drawHoneyZone } from './honeyZone.ts';
import { drawDefenseMarkers } from './defenseMarkers.ts';
import { defenseRole } from '../defenders.ts';
import { placementSuggestions } from '../placement.ts';
import { MissionAssets } from './missionAssets.ts';
import { Actors } from './actors.ts';
import { Presentation } from './presentation.ts';
import type { Notice } from './presentation.ts';
import { BattleFeedback } from './battleFeedback.ts';
import { LANE_NAMES } from '../ai.ts';
import Phaser from 'phaser';
import { LANES } from '../ai.ts';
import type { Effect } from '../game.ts';
import type { Session } from '../session.ts';
import { TerrainLayer } from './terrain.ts';
import { Strongholds } from './strongholds.ts';
import { bindInputBounds } from './inputBounds.ts';
import { BossSignals } from './bossSignals.ts';
import { visualSettings } from './visualSettings.ts';
import { DevPerformance } from './devPerformance.ts';
import { pauseForDialog } from '../ui/dialogs.ts';
import { performanceEnabled } from './performanceRecording.ts';
import { onSceneExit } from './sceneExit.ts';
export class BattleScene extends Phaser.Scene {
  private assets!: MissionAssets;
  private initialized = false;
  private presentation = new Presentation();
  private feedback!: BattleFeedback;
  private motionQuery = window.matchMedia('(prefers-reduced-motion:reduce)');
  private onPresentation: (notice: Notice | null) => void;
  private resultStats!: Phaser.GameObjects.Text;
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
  private seenEffects = new WeakSet<Effect>();
  private feastLabel!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Container;
  private session: Session;
  private onChange: () => void;
  private onFrame: (game: import('../game.ts').Game) => void;
  constructor(
    session: Session,
    onChange: () => void,
    onFrame: (game: import('../game.ts').Game) => void = () => {},
    onPresentation: (notice: Notice | null) => void = () => {},
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
  private createBattle() {
    this.initialized = true;
    onSceneExit(this.events, () => {
      this.initialized = false;
    });
    if (performanceEnabled(location.search, import.meta.env.DEV)) {
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
    const releaseInputBounds = bindInputBounds(this.game.canvas, () => this.scale.updateBounds());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, releaseInputBounds);
    this.events.once(Phaser.Scenes.Events.DESTROY, releaseInputBounds);
    this.terrain = new TerrainLayer(this);
    this.terrain.update(
      this.session.game.level,
      this.session.game.mission,
      this.session.game.initialSeed,
    );
    this.strongholds = new Strongholds(this);
    this.threatMarkers = new ThreatMarkers(this);
    this.actors = new Actors(this);
    this.bossSignals = new BossSignals(this);
    this.flightSignals = new FlightSignals(this);
    this.medicalSignals = new MedicalSignals(this);
    this.ink = this.add.graphics();
    this.honeyInk = this.add.graphics().setDepth(7.5);
    this.feedback = new BattleFeedback(this);
    this.feastLabel = addCanvasCopy(this.add, 420, 0, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffe5a1',
      backgroundColor: '#324832',
      padding: { x: 7, y: 4 },
    })
      .setOrigin(0.5)
      .setDepth(9.5)
      .setVisible(false);
    const shade = this.add.rectangle(550, 310, 1100, 620, 0x082a23, 0.82);
    const title = addCanvasCopy(this.add, 550, 267, '', {
      fontFamily: 'Georgia',
      fontSize: '54px',
      color: '#ffe4a4',
    }).setOrigin(0.5);
    const subtitle = addCanvasCopy(this.add, 550, 335, '', {
      fontFamily: 'Arial',
      fontSize: '21px',
      color: '#deebd0',
    }).setOrigin(0.5);
    this.resultStats = addCanvasCopy(this.add, 550, 393, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#d9e9c7',
    }).setOrigin(0.5);
    this.celebration = this.add.graphics();
    this.overlay = this.add
      .container(0, 0, [shade, this.celebration, title, subtitle, this.resultStats])
      .setDepth(100)
      .setVisible(false);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.session.selected && !this.session.selectedFeast) return;
      if (
        !activateBoard(this.session, { x: pointer.x, y: pointer.y }) &&
        !this.session.selectedFeast
      ) {
        this.session.game.message = this.session.game.paused
          ? 'Reprends la partie pour placer ton renfort.'
          : 'Choisis un espace libre dans le camp, loin des rochers et des alliés.';
      }
      this.onChange();
    });
    this.onChange();
    if (this.session.screen === 'home') this.scene.sleep();
  }
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
    this.presentation.update(this.session.game, delta);
    this.onPresentation(this.presentation.notice);
    this.onFrame(this.session.game);
    this.ink.clear();
    this.honeyInk.clear();
    if (this.session.selectedFeast) drawFeastPlacement(this.honeyInk, this.session.game);
    this.terrain.update(
      this.session.game.level,
      this.session.game.mission,
      this.session.game.initialSeed,
    );
    this.strongholds.draw(this.session.game, this.presentation, reduced);
    this.threatMarkers.draw(this.session.game);
    drawDefenseMarkers(this.ink, this.session.game);
    const feast = this.session.game.feast;
    this.feastLabel.setVisible(!!feast);
    if (feast) {
      const pot = drawHoneyZone(this.honeyInk, this.session.game, this.presentation.clock, reduced);
      setCanvasCopy(
        this.feastLabel.setPosition(pot.x, pot.y + 43),
        `${feast.flavor === 'sticky' ? 'COLLANT' : 'ATTIRANT'} · ${Math.ceil(feast.remaining)} s`,
      );
    }
    this.ink.setDepth(15);
    this.actors.draw(this.session.game, this.presentation, this.ink, reduced);
    this.bossSignals.draw(this.session.game, reduced);
    this.flightSignals.draw(this.session.game, reduced);
    this.medicalSignals.draw(this.session.game);
    for (const e of this.session.game.effects) {
      const g = this.ink,
        alpha = e.life / 0.3;
      if (e.kind === 'honey') {
        const fade = Math.max(0, e.life / 0.9);
        g.lineStyle(3, 0xf2ce78, fade * 0.65);
        g.lineBetween(e.x, e.y, e.tx, e.ty);
        for (let i = 0; i < 4; i++) {
          const progress = (i / 4 + (reduced ? 0 : this.presentation.clock * 0.7)) % 1;
          g.fillStyle(0xffde89, fade * 0.8);
          g.fillCircle(e.x + (e.tx - e.x) * progress, e.y + (e.ty - e.y) * progress, 3);
        }
        continue;
      } else if (e.kind === 'block') {
        g.lineStyle(3, 0xc5e5c3, alpha);
        g.strokeCircle(e.tx, e.ty - 25, 12 + (1 - alpha) * 11);
      } else if (e.kind === 'shell') {
        g.lineStyle(5, 0xf0c47b, alpha);
        g.lineBetween(e.x, e.y - 14, e.tx, e.ty - 7);
        g.lineStyle(4, 0xffe2a3, alpha);
        g.strokeCircle(e.tx, e.ty - 7, 12 + (1 - alpha) * 30);
        if (!this.seenEffects.has(e)) {
          this.seenEffects.add(e);
          if (!reduced) this.cameras.main.shake(80, 0.001);
        }
      } else if (e.kind === 'fire') {
        g.lineStyle(10, 0xe88a42, alpha * 0.7);
        g.lineBetween(e.x, e.y - 12, e.tx, e.ty - 7);
        g.lineStyle(4, 0xffe497, alpha);
        g.lineBetween(e.x, e.y - 12, e.tx, e.ty - 7);
        g.strokeCircle(e.tx, e.ty - 7, 25 * (1 - alpha) + 10);
      } else if (e.kind === 'poison') {
        g.lineStyle(3, 0xc0dc78, alpha);
        g.lineBetween(e.x, e.y - 12, e.tx, e.ty - 12);
        g.fillStyle(0xc0dc78, alpha);
        g.fillCircle(e.tx, e.ty - 12, 5);
      } else if (e.kind === 'arrow') {
        g.lineStyle(2, 0xf7df9c, alpha);
        g.lineBetween(e.x, e.y - 15, e.tx, e.ty - 7);
      } else if (e.kind === 'heal') {
        g.lineStyle(3, 0xceffa9, alpha);
        g.lineBetween(e.tx - 7, e.ty - 40, e.tx + 7, e.ty - 40);
        g.lineBetween(e.tx, e.ty - 47, e.tx, e.ty - 33);
      } else if (e.kind === 'gold') {
        g.fillStyle(0xffd66a, alpha);
        g.fillCircle(e.x, e.y - 20 - (1 - alpha) * 25, 5);
      } else {
        g.lineStyle(3, 0xffe2a1, alpha);
        g.strokeCircle(e.tx, e.ty - 4, 9 + (1 - alpha) * 13);
      }
    }
    this.feedback.draw(this.presentation, this.session.game, reduced);
    if (this.session.selected) {
      const pointer = this.input.activePointer;
      const onBoard = this.game.canvas.matches(':hover') || pointer.isDown;
      const range = placementReadout(
        this.session.game,
        this.session.selected,
        onBoard ? { x: pointer.x, y: pointer.y } : undefined,
      );
      if (range) {
        const color = !range.valid
          ? 0xd99574
          : range.healing
            ? 0x9bd1a0
            : range.category === 'Tir'
              ? 0x8bd9e9
              : 0xf0d18a;
        this.ink.fillStyle(color, 0.07);
        this.ink.fillCircle(range.x, range.y, range.radius);
        this.ink.lineStyle(2, color, 0.8);
        this.ink.strokeCircle(range.x, range.y, range.radius);
      }
      for (const p of placementSuggestions(this.session.game, this.session.selected)) {
        {
          this.ink.fillStyle(0xe6dbb8, 0.8);
          this.ink.fillEllipse(p.x, p.y + 5, 48, 30);
          this.ink.lineStyle(1, 0x657857, 0.4);
          this.ink.strokeEllipse(p.x, p.y + 5, 48, 30);
        }
        this.ink.fillStyle(0x8bd9e9, 0.15);
        this.ink.fillCircle(p.x, p.y, 21);
        this.ink.lineStyle(3, 0xb2eaf4, 0.85);
        this.ink.strokeCircle(p.x, p.y, 21);
        this.ink.lineBetween(p.x - 6, p.y, p.x + 6, p.y);
        this.ink.lineBetween(p.x, p.y - 6, p.x, p.y + 6);
      }
      const p = this.input.activePointer;
      if (
        (p.isDown || this.game.canvas.matches(':hover')) &&
        p.x >= 0 &&
        p.x <= 1100 &&
        p.y >= 0 &&
        p.y <= 620
      ) {
        this.ink.lineStyle(
          2,
          this.session.game.canRecruit(this.session.selected, p.x, p.y) ? 0xb2eaf4 : 0xe1a07d,
          0.9,
        );
        this.ink.strokeCircle(p.x, p.y, 23);
        const mobile = defenseRole(this.session.selected) === 'mobile';
        this.ink.lineStyle(1, 0xb2eaf4, 0.35);
        if (mobile) {
          this.ink.lineBetween(p.x, 180, p.x, 468);
          for (const y of LANES) this.ink.strokeCircle(p.x, y, 10);
        }
      }
    }
    const end = this.session.game.status === 'won' || this.session.game.status === 'lost';
    this.overlay.setVisible(end);
    if (end) {
      setCanvasCopy(
        this.overlay.list[2] as Phaser.GameObjects.Text,
        this.session.game.status === 'won'
          ? victoryCopy(this.session.game).title
          : defeatCopy(this.session.game).title,
      );
      setCanvasCopy(
        this.overlay.list[3] as Phaser.GameObjects.Text,
        this.session.game.status === 'won'
          ? victoryCopy(this.session.game).subtitle
          : defeatCopy(this.session.game).subtitle,
      );
    }
    this.resultStats.setVisible(end);
    if (end)
      setCanvasCopy(
        this.resultStats,
        `${this.session.game.kills} serpents repoussés · ${this.session.game.units.length} alliés survivants · camp ${Math.ceil(this.session.game.base)} %`,
      );
    this.celebration.clear();
    if (this.session.game.status === 'won') {
      for (let i = 0; i < 32; i++) {
        const x = (i * 173 + 42) % 1100,
          y = reduced ? 80 + ((i * 37) % 450) : (i * 71 + this.presentation.clock * 42) % 580;
        this.celebration.fillStyle(i % 2 ? 0xeacd79 : 0xb9d795, 0.7);
        this.celebration.fillRect(x, y, 5, 9);
      }
    }
    this.hudTime += delta;
    if (this.hudTime > 180) {
      this.onChange();
      this.hudTime = 0;
    }
    if (this.meter)
      this.meter.frame(
        performance.now(),
        performance.now() - started,
        this.session.game.status === 'fighting' &&
          !this.session.game.paused &&
          this.session.screen !== 'home',
      );
  }
}
