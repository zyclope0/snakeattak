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
import { byId } from './dom.ts';
/** Stable DOM nodes: a simulation refresh updates values, not whole trees. */
export function bindHud() {
  const tutorial = bindTutorialLanes();
  const bank = document.createElement('small');
  bank.id = 'caprice-bank';
  bank.className = 'caprice-bank';
  byId('gold').parentElement!.append(bank);
  const text = (id: string, value: string) => {
    const node = byId(id);
    if (node.textContent !== value) setDisplayText(node, value);
  };
  const lanes = LANES.map((_, i) => {
    const row = document.createElement('span');
    setDisplayMarkup(row, `<b>${LANE_NAMES[i]}</b><i aria-hidden="true"></i><small></small>`);
    byId('lane-status').append(row);
    return { meter: row.querySelector('i')!, count: row.querySelector('small')! };
  });
  const dots = Array.from({ length: TOTAL_WAVES }, () => {
    const dot = document.createElement('i');
    byId('wave-dots').append(dot);
    return dot;
  });
  return (game: Game) => {
    tutorial(game);
    text('gold', String(game.gold));
    bank.hidden = !game.caprice.reserve;
    if (game.caprice.reserve)
      setDisplayText(
        bank,
        `${game.caprice.reserve} à la banque · ${game.gold - game.caprice.reserve} disponibles`,
      );
    text('base', `${Math.ceil(game.base)} %`);
    const width = `${game.base}%`,
      meter = byId('base-meter');
    if (meter.style.width !== width) meter.style.width = width;
    meter.parentElement!.setAttribute('aria-valuenow', String(Math.ceil(game.base)));
    text('wave', String(game.wave));
    text('wave-total', String(game.totalWaves));
    text('army-count', String(game.units.length));
    text(
      'phase',
      game.status === 'won'
        ? 'VICTOIRE'
        : game.status === 'lost'
          ? 'CAMP TOMBÉ'
          : game.paused
            ? 'EN PAUSE'
            : game.status === 'fighting'
              ? 'BATAILLE EN COURS'
              : 'PRÉPARATION',
    );
    text('message', game.message);
    const scores = laneDefense(game.units),
      max = Math.max(1, ...scores);
    const counts = [0, 0, 0];
    for (const e of game.enemies) if (e.hp > 0) counts[e.lane]++;
    for (const [i, row] of lanes.entries()) {
      const strength = `${Math.round((scores[i] / max) * 100)}%`;
      if (row.meter.style.getPropertyValue('--strength') !== strength)
        row.meter.style.setProperty('--strength', strength);
      const count = `${counts[i]} ▲`;
      if (row.count.textContent !== count) setDisplayText(row.count, count);
      setDisplayAttribute(row.count, 'aria-label', `${counts[i]} serpents`);
    }
    for (const [i, dot] of dots.entries()) {
      dot.hidden = i >= game.totalWaves;
      dot.classList.toggle('done', i < game.wave);
    }
    text(
      'egg-count',
      `${game.eggs.length} œuf${game.eggs.length > 1 ? 's' : ''} · ${game.hatched} éclosions`,
    );
    text(
      'ai-mode',
      `IA : ${game.difficultyWave >= 5 ? 'tacticienne' : game.difficultyWave >= 3 ? 'attentive' : 'exploratrice'}`,
    );
    const medical = game.units.filter((u) => medicalRules(u.kind) && u.medical);
    byId('medical-status').hidden = !medical.length;
    if (medical.length) {
      const away = medical.filter((u) => u.medical!.phase !== 'ready').length;
      text(
        'medical-status',
        `Bandages : ${medical.reduce((n, u) => n + u.medical!.bandages, 0)} en réserve` +
          (away
            ? ` · ${away} ${away === 1 ? 'soignant refait son stock' : 'soignants refont leur stock'}`
            : ''),
      );
    }
    byId('app').dataset.status = game.status;
    const king = game.enemies.find((e) => e.boss && e.hp > 0);
    const kingReadout = king ? bossReadout(king, game.tuning) : null;
    byId('boss-status').hidden = !kingReadout;
    if (kingReadout)
      text(
        'boss-status',
        kingReadout.label +
          (kingReadout.heads
            ? ` · ${kingReadout.heads.map((h) => h.label + (h.alive ? '' : ' KO')).join(' / ')}`
            : '') +
          (kingReadout.shot ? ' · Crachat annoncé au sol' : ''),
      );
    byId('pause-overlay').hidden =
      !game.paused ||
      !!document.querySelector('dialog[open]') ||
      game.status === 'won' ||
      game.status === 'lost';
  };
}
