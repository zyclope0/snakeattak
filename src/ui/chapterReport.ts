import { portraitStyle } from '../art.ts';
import { createChapterReportObserver } from '../chapterReport.ts';
import type { Session } from '../session.ts';

/**
 * DOM: details#chapter-report, summary#chapter-report-title,
 * p#chapter-report-summary, ul#chapter-report-army.
 * Keep it after the battle footer, outside the reward controls. No focus or scrolling.
 */
export function bindChapterReport(session: Session): () => void {
  const panel = document.getElementById('chapter-report') as HTMLDetailsElement;
  const title = document.getElementById('chapter-report-title')!;
  const summary = document.getElementById('chapter-report-summary')!;
  const army = document.getElementById('chapter-report-army')!;
  const observe = createChapterReportObserver();
  let observed = session.game;
  let displayedWave = 0;
  let rendered = '';
  return () => {
    const game = session.game;
    const { report, fresh } = observe(game);
    const nextWave = report?.wave ?? 0;
    if (game !== observed || nextWave !== displayedWave) {
      observed = game;
      displayedWave = nextWave;
      panel.open = false;
      panel.dataset.fresh = 'false';
      rendered = '';
    }
    panel.hidden = report === null;
    if (!report) return;
    // Keep this marker through subsequent refreshes so the CSS animation can finish once.
    if (fresh) panel.dataset.fresh = 'true';
    const next = JSON.stringify(report);
    if (next === rendered) return;
    rendered = next;
    title.textContent = `Chapitre ${report.chapter} accompli · ${report.terrainName} · ${'★'.repeat(report.stars)}${'☆'.repeat(3 - report.stars)}`;
    const minimum =
      report.crystalMinimum === null
        ? 'minimum historique non disponible'
        : `minimum du chapitre ${Math.floor(report.crystalMinimum)}/100 PV`;
    const score =
      report.crystalMinimum === null
        ? `conservée${report.stars > 1 ? 's' : ''}`
        : 'pour ce passage';
    summary.textContent = `${report.stars} étoile${report.stars > 1 ? 's' : ''} sur 3 ${score}. Cristal : ${minimum} · actuellement ${Math.ceil(report.crystalCurrent)}/100 PV. ${report.alliesPresent} allié${report.alliesPresent > 1 ? 's' : ''} présent${report.alliesPresent > 1 ? 's' : ''}. ${report.killsSinceAdventureStart} serpent${report.killsSinceAdventureStart > 1 ? 's' : ''} vaincu${report.killsSinceAdventureStart > 1 ? 's' : ''} depuis le début de l’aventure.`;
    const entries = report.army.map((unit) => {
      const item = document.createElement('li');
      const portrait = document.createElement('span');
      const label = document.createElement('span');
      portrait.className = 'chapter-report-portrait';
      portrait.setAttribute('aria-hidden', 'true');
      portrait.style.cssText = portraitStyle(unit.kind);
      label.textContent = `${unit.name} × ${unit.count}`;
      item.append(portrait, label);
      return item;
    });
    army.replaceChildren(...entries);
  };
}
