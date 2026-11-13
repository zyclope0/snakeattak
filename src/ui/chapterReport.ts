import { setText as setDisplayText } from '../i18n/dom.ts';
import { portraitStyle } from '../art.ts';
import { createChapterReportObserver, type ChapterReport } from '../chapterReport.ts';
import type { Session } from '../session.ts';
import { byId, make } from './dom.ts';

/** French plural mark; the sentences below keep their shape for the translator. */
const plural = (count: number) => (count > 1 ? 's' : '');

function reportTitle(report: ChapterReport) {
  return `Chapitre ${report.chapter} accompli · ${report.terrainName} · ${'★'.repeat(report.stars)}${'☆'.repeat(3 - report.stars)}`;
}

/**
 * When the report has no crystal minimum that accounts for the stars, the sentence says the
 * stars are kept and gives no number.
 */
function reportSummary(report: ChapterReport) {
  const minimum =
    report.crystalMinimum === null
      ? 'minimum historique non disponible'
      : `minimum du chapitre ${Math.floor(report.crystalMinimum)}/100 PV`;
  const score =
    report.crystalMinimum === null ? `conservée${plural(report.stars)}` : 'pour ce passage';
  return `${report.stars} étoile${plural(report.stars)} sur 3 ${score}. Cristal : ${minimum} · actuellement ${Math.ceil(report.crystalCurrent)}/100 PV. ${report.alliesPresent} allié${plural(report.alliesPresent)} présent${plural(report.alliesPresent)}. ${report.killsSinceAdventureStart} serpent${plural(report.killsSinceAdventureStart)} vaincu${plural(report.killsSinceAdventureStart)} depuis le début de l’aventure.`;
}

/** One kind of ally still standing: its portrait and how many there are. */
function armyEntry(unit: ChapterReport['army'][number]) {
  const portrait = make('span', { className: 'chapter-report-portrait' });
  portrait.setAttribute('aria-hidden', 'true');
  portrait.style.cssText = portraitStyle(unit.kind);
  return make('li', {}, portrait, make('span', { text: `${unit.name} × ${unit.count}` }));
}

/**
 * DOM: details#chapter-report, summary#chapter-report-title,
 * p#chapter-report-summary, ul#chapter-report-army.
 * Keep it after the battle footer, outside the reward controls. No focus or scrolling.
 */
export function bindChapterReport(session: Session): () => void {
  const panel = byId<HTMLDetailsElement>('chapter-report');
  const title = byId('chapter-report-title');
  const summary = byId('chapter-report-summary');
  const army = byId('chapter-report-army');
  const observe = createChapterReportObserver();
  let observed = session.game;
  let displayedWave = 0;
  let rendered = '';
  return () => {
    const game = session.game;
    const { report, fresh } = observe(game);
    const nextWave = report?.wave ?? 0;
    // Another game or another chapter: the panel folds back and is written again.
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
    setDisplayText(title, reportTitle(report));
    setDisplayText(summary, reportSummary(report));
    army.replaceChildren(...report.army.map(armyEntry));
  };
}
