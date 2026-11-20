import {
  setText as setDisplayText,
  setMarkup as setDisplayMarkup,
  setAttribute as setDisplayAttribute,
} from '../i18n/dom.ts';
import { bindTutorialLanes } from './tutorialLanes.ts';
import { medicalRules } from '../healing.ts';
import type { Game } from '../game.ts';
import { LANES, LANE_NAMES, laneDefense } from '../ai.ts';
import { TOTAL_WAVES } from '../data.ts';
import { bossReadout } from '../render/bossReadout.ts';
import { byId, dialogOpen, make, refreshText } from './dom.ts';
import { bankSummary, battleOver } from './battleState.ts';
import * as TEXT from '../texts/fr/battleScreens.ts';
import { endlessWave } from '../endless.ts';
import { fill } from '../texts/fill.ts';

type LaneRow = ReturnType<typeof laneRow>;

/** Stable DOM nodes: a simulation refresh updates values, not whole trees. */
export function bindHud() {
  const tutorial = bindTutorialLanes();
  const bank = make('small', { id: 'caprice-bank', className: 'caprice-bank' });
  byId('gold').parentElement!.append(bank);
  const lanes = LANES.map((_, lane) => laneRow(lane));
  const dots = Array.from({ length: TOTAL_WAVES }, waveDot);
  return (game: Game) => {
    tutorial(game);
    showGold(game, bank);
    showCrystal(game);
    showWave(game);
    showText('army-count', String(game.units.length));
    showText('phase', phaseLabel(game));
    showText('message', game.message);
    showLanes(game, lanes);
    showWaveDots(game, dots);
    showText(
      'egg-count',
      fill(TEXT.nOeufNNEclosions, game.eggs.length, game.eggs.length > 1 ? 's' : '', game.hatched),
    );
    showText('ai-mode', `IA : ${snakeCunning(game.difficultyWave)}`);
    showMedicalStock(game);
    byId('app').dataset.status = game.status;
    showKing(game);
    byId('pause-overlay').hidden = !game.paused || dialogOpen() || battleOver(game);
  };
}

const showText = (id: string, value: string) => refreshText(byId(id), value);

function laneRow(lane: number) {
  const row = make('span');
  setDisplayMarkup(row, `<b>${LANE_NAMES[lane]}</b><i aria-hidden="true"></i><small></small>`);
  byId('lane-status').append(row);
  return { meter: row.querySelector('i')!, count: row.querySelector('small')! };
}

function waveDot() {
  const dot = make('i');
  byId('wave-dots').append(dot);
  return dot;
}

function showGold(game: Game, bank: HTMLElement) {
  showText('gold', String(game.gold));
  bank.hidden = !game.caprice.reserve;
  if (game.caprice.reserve) setDisplayText(bank, bankSummary(game));
}

function showCrystal(game: Game) {
  showText('base', `${Math.ceil(game.base)} %`);
  const width = `${game.base}%`,
    meter = byId('base-meter');
  if (meter.style.width !== width) meter.style.width = width;
  meter.parentElement!.setAttribute('aria-valuenow', String(Math.ceil(game.base)));
}

function phaseLabel(game: Game): string {
  if (game.status === 'won') return TEXT.victoire;
  if (game.status === 'lost') return TEXT.campTombe;
  if (game.paused) return TEXT.enPause;
  return game.status === 'fighting' ? TEXT.batailleEnCours : TEXT.preparation;
}

/** How well each lane is defended, next to how many snakes walk on it. */
function showLanes(game: Game, rows: LaneRow[]) {
  const scores = laneDefense(game.units),
    max = Math.max(1, ...scores);
  const counts = [0, 0, 0];
  for (const e of game.enemies) if (e.hp > 0) counts[e.lane]++;
  for (const [i, row] of rows.entries()) {
    const strength = `${Math.round((scores[i] / max) * 100)}%`;
    if (row.meter.style.getPropertyValue('--strength') !== strength)
      row.meter.style.setProperty('--strength', strength);
    refreshText(row.count, `${counts[i]} ▲`);
    setDisplayAttribute(row.count, 'aria-label', fill(TEXT.nSerpents, counts[i]));
  }
}

/**
 * The wave: « 4 / 12 » in every game; in the endless adventure, the wave counted from the
 * very first one and the kings beaten, the dots still telling the place in the round.
 */
function showWave(game: Game) {
  const endless = !!game.endless;
  showText('wave', String(endless ? endlessWave(game.kings, game.wave) : game.wave));
  showText('wave-total', String(game.totalWaves));
  byId('wave-of').hidden = endless;
  byId('wave-kings').hidden = !endless;
  if (endless) showText('wave-kings', fill(TEXT.nRois, game.kings));
}

function showWaveDots(game: Game, dots: HTMLElement[]) {
  for (const [i, dot] of dots.entries()) {
    dot.hidden = i >= game.totalWaves;
    dot.classList.toggle('done', i < game.wave);
  }
}

const snakeCunning = (difficultyWave: number) =>
  difficultyWave >= 5 ? 'tacticienne' : difficultyWave >= 3 ? 'attentive' : 'exploratrice';

function showMedicalStock(game: Game) {
  const healers = game.units.filter((u) => medicalRules(u.kind) && u.medical);
  byId('medical-status').hidden = !healers.length;
  if (!healers.length) return;
  const away = healers.filter((u) => u.medical!.phase !== 'ready').length;
  showText(
    'medical-status',
    fill(
      TEXT.bandagesNEnReserve,
      healers.reduce((n, u) => n + u.medical!.bandages, 0),
    ) +
      (away
        ? ` · ${away} ${away === 1 ? TEXT.soignantRefaitSonStock : TEXT.soignantsRefontLeurStock}`
        : ''),
  );
}

function showKing(game: Game) {
  const king = game.enemies.find((e) => e.boss && e.hp > 0);
  const readout = king ? bossReadout(king, game.tuning) : null;
  byId('boss-status').hidden = !readout;
  if (!readout) return;
  showText(
    'boss-status',
    readout.label +
      (readout.heads
        ? ` · ${readout.heads.map((h) => h.label + (h.alive ? '' : ' KO')).join(' / ')}`
        : '') +
      (readout.shot ? TEXT.crachatAnnonceAuSol : ''),
  );
}
