// Controlled locale-only fixture. Its outcomes are not played matches.
// Language must be initialized before the legacy fixture creates any UI.
import type Phaser from 'phaser';
import { initializeLanguageControls } from '../src/i18n/controls.ts';
import { getLanguage, setLanguage } from '../src/i18n/language.ts';
import { untranslatedCopy } from '../src/i18n/copy.ts';
import { Game } from '../src/game.ts';
import type { Entity } from '../src/game.ts';
import type { Session } from '../src/session.ts';
import { kinds } from '../src/data.ts';
import { specialAbility } from '../src/unitRules.ts';
import { ensureBossState } from '../src/boss.ts';
import { bindChapterReport } from '../src/ui/chapterReport.ts';
import { MISSIONS } from '../src/missions.ts';
import { renderThreatCards } from '../src/ui/threatCards.ts';
import { THREAT_DETAILS } from '../src/ui/threatPreview.ts';
import type { ThreatKind } from '../src/ui/threatPreview.ts';
import { encodeCheckpoint } from '../src/checkpoints.ts';
import { departureForGame, encodeDeparture } from '../src/departures.ts';

await initializeLanguageControls();
const { progress } = await import('./result-0342-harness.ts');
// Controlled locale coverage needs every normal preview legally unlocked.
// Production launch guards remain active; no disabled-card bypass.
const allMissions = progress.state;
for (const mission of MISSIONS) allMissions.bestStars[mission.id] = 3;
if (!progress.replaceState(allMissions)) throw new Error('Invalid locale mission fixture');
const fixture = (
  window as unknown as {
    resultFixture: { session: Session; phaser: Phaser.Game; refresh: () => void };
  }
).resultFixture;
fixture.refresh();
const refreshReport = bindChapterReport(fixture.session);
refreshReport();
const scene = () =>
  fixture.phaser.scene.getScene('Battle') as Phaser.Scene & {
    initialized: boolean;
    update: (time: number, delta: number) => void;
  };
const canonicalCatalog = () =>
  Object.entries(kinds).map(([kind, data]) => ({
    kind,
    name: data.name,
    hp: data.hp,
    cost: data.cost,
    ability: specialAbility(
      kind as keyof typeof kinds,
      fixture.session.game.tuning.splashSecondaryFactor,
    ),
  }));
function snapshot() {
  const game = fixture.session.game,
    departure = departureForGame(game);
  return {
    game: JSON.stringify(game),
    session: JSON.stringify({
      screen: fixture.session.screen,
      selected: fixture.session.selected,
      selectedFeast: fixture.session.selectedFeast,
      speed: fixture.session.speed,
      hasPlaced: fixture.session.hasPlaced,
    }),
    rng: game.rng,
    time: game.time,
    checkpoint: encodeCheckpoint(game),
    departure: departure ? encodeDeparture(departure) : null,
    canonicalCatalog: JSON.stringify(canonicalCatalog()),
  };
}
function canvasLabels() {
  const labels: { text: string; visible: boolean; x: number; y: number }[] = [];
  function walk(objects: Phaser.GameObjects.GameObject[], parentVisible = true) {
    for (const object of objects) {
      const node = object as Phaser.GameObjects.Text & {
        list?: Phaser.GameObjects.GameObject[];
      };
      const visible = parentVisible && node.visible !== false;
      if (typeof node.text === 'string')
        labels.push({ text: node.text, visible, x: node.x, y: node.y });
      if (node.list) walk(node.list, visible);
    }
  }
  walk(scene().children.list);
  return labels;
}
function setMedicalBossState() {
  // Deliberate setup mutations happen before equality witnesses are recorded.
  const game = fixture.session.game,
    base = structuredClone(game.units[0]);
  game.status = 'fighting';
  game.wave = 1;
  game.paused = true;
  game.base = 83;
  const medic: Entity = {
    ...structuredClone(base),
    id: ++game.nextId,
    kind: 'medic',
    x: 985,
    y: 324,
    hp: kinds.medic.hp,
    maxHp: kinds.medic.hp,
    medical: { phase: 'restocking', bandages: 0, remaining: 2.4 },
  };
  const nurse: Entity = {
    ...structuredClone(base),
    id: ++game.nextId,
    kind: 'nurse',
    x: 905,
    y: 330,
    hp: kinds.nurse.hp,
    maxHp: kinds.nurse.hp,
    medical: { phase: 'ready', bandages: 2, remaining: 0 },
  };
  const boss: Entity = {
    ...structuredClone(base),
    id: ++game.nextId,
    kind: 'snake',
    x: 450,
    y: 324,
    hp: 1000,
    maxHp: 1000,
    boss: true,
  };
  const state = ensureBossState(boss, game.tuning)!;
  state.windup = 0.7;
  state.shotHead = 'ranged';
  state.targetX = 800;
  state.targetY = 324;
  game.units.push(medic, nurse);
  game.enemies = [boss];
  game.remaining = 0;
  game.eggs = [];
  fixture.refresh();
  scene().update(0, 0);
}
function seededCommandWitness() {
  const game = new Game(20261109),
    actions: boolean[] = [];
  for (const kind of ['archer', 'medic'] as const) {
    let recruited = false;
    for (const x of [660, 780, 900]) {
      for (const y of [180, 324, 468]) {
        if (!recruited && game.canRecruit(kind, x, y)) recruited = game.recruit(kind, x, y);
      }
    }
    actions.push(recruited);
  }
  const camp = encodeCheckpoint(game);
  const departure = encodeDeparture(departureForGame(game)!);
  actions.push(game.startWave());
  actions.push(game.offerFeast(game.enemyLanes[0], 'sticky'));
  for (let i = 0; i < 120; i++) game.step(1 / 30);
  return { actions, camp, departure, game: JSON.stringify(game), rng: game.rng };
}
function setRewardState() {
  const game = new Game(20261109);
  game.wave = 4;
  game.rewards.pending = 4;
  game.campaign.chapterStars[0] = 2;
  game.campaign.chapterMin[0] = 72;
  game.base = 83;
  game.kills = 17;
  fixture.session.useGame(game);
  fixture.refresh();
  refreshReport();
}
Object.assign(window, {
  localeFixture: {
    setLanguage,
    getLanguage,
    untranslatedCopy,
    snapshot,
    canonicalCatalog,
    canvasLabels,
    setMedicalBossState,
    setRewardState,
    seededCommandWitness,
    previewMission(id: string) {
      const button = document.querySelector<HTMLButtonElement>(`[data-mission-card="${id}"]`);
      if (!button?.onclick) throw new Error('Unknown fixture mission');
      if (button.disabled) throw new Error('Locale fixture mission must be unlocked');
      button.click();
    },
    missions: MISSIONS.map((mission) => ({ id: mission.id, waves: mission.waves.length })),
    showAllThreats() {
      const types = Object.keys(THREAT_DETAILS) as ThreatKind[];
      renderThreatCards(document.getElementById('mission-threats')!, types);
      return types;
    },
    freezeCanvas() {
      fixture.phaser.loop.sleep();
    },
    async renderForCapture() {
      // Cached .text and canonical-state assertions happen while fully asleep.
      // Paint the new textures afterwards; this fixture never advances Session.
      fixture.phaser.loop.wake();
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      fixture.phaser.loop.sleep();
    },
    refresh: fixture.refresh,
    get ready() {
      return !!scene()?.initialized;
    },
  },
});
