import { setText as setDisplayText } from '../i18n/dom.ts';
import { portraitStyle } from '../art.ts';
import { createChapterReportObserver, type ChapterReport } from '../chapterReport.ts';
import type { Session } from '../session.ts';
import { byId, make } from './dom.ts';
import * as TEXT from '../texts/fr/home.ts';
import { fill } from '../texts/fill.ts';

/** French plural mark; the sentences below keep their shape for the translator. */
const plural = (count: number) => (count > 1 ? 's' : '');

function reportTitle(report: ChapterReport) {
  return fill(
    TEXT.chapitreNAccompliNNN,
    report.chapter,
    report.terrainName,
    '★'.repeat(report.stars),
    '☆'.repeat(3 - report.stars),
  );
}

/**
 * When the report has no crystal minimum that accounts for the stars, the sentence says the
 * stars are kept and gives no number.
 */
function reportSummary(report: ChapterReport) {
  const minimum =
    report.crystalMinimum === null
      ? TEXT.minimumHistoriqueNonDisponible
      : fill(TEXT.minimumDuChapitreN100Pv, Math.floor(report.crystalMinimum));
  const score =
    report.crystalMinimum === null
      ? fill(TEXT.conserveeN, plural(report.stars))
      : TEXT.pourCePassage;
  return fill(
    TEXT.nEtoileNSur3NCristalNActuellementN,
    report.stars,
    plural(report.stars),
    score,
    minimum,
    Math.ceil(report.crystalCurrent),
    report.alliesPresent,
    plural(report.alliesPresent),
    plural(report.alliesPresent),
    report.killsSinceAdventureStart,
    plural(report.killsSinceAdventureStart),
    plural(report.killsSinceAdventureStart),
  );
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
