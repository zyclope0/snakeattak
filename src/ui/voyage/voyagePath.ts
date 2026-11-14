import kingUrl from '../../assets/home/menu-classique.webp';
import type { CapriceDefinition } from '../../caprices.ts';
import { setAttribute } from '../../i18n/dom.ts';
import { missionById } from '../../missions.ts';
import { activeEnemyLanes } from '../../tutorial.ts';
import { stageCaprice } from '../../voyage.ts';
import type { VoyageStage } from '../../voyage.ts';
import { voyagePlanOf } from '../../voyageState.ts';
import type { VoyageState } from '../../voyageState.ts';
import { frenchLeaf } from '../capriceCopy.ts';
import { stickerGraphic } from '../capriceIcons.ts';
import { decoration, make } from '../dom.ts';
import { lands } from '../missionDraft.ts';
import { svgNode } from '../svg.ts';
import { stopMap } from './stopMap.ts';
import {
  exitsLine,
  stopStates,
  stopWords,
  surpriseLabel,
  terrainLine,
  type StopState,
} from './voyageWords.ts';

type PathActions = {
  /** The button of the stop to play; a voyage that is over has none. */
  start?: { label: string; go: () => void };
  /** A sticker that is touched tells what its caprice does. */
  explain: (caprice: CapriceDefinition) => void;
};

/** How far each stop sits above or below the middle of the path, in units of the page. */
const SWING = [-2.2, 1.6, 2.2, -2.6, 1.8];
/** The same once the voyage is over: five stops of one size, up and down in turn. */
const EVEN_SWING = [1.4, -1.4, 1.4, -1.4, 1.6];
/** The stop to play is wider than the others: it carries its name and its button. */
const WIDE = 2.15;

/** A number, or a tick once the stage is won. */
function badge(index: number, stop: StopState) {
  const mark = decoration('span', 'stop-badge');
  if (stop === 'done')
    mark.append(
      svgNode(
        'svg',
        {
          viewBox: '0 0 32 32',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': 4.5,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        },
        svgNode('path', { d: 'm7 16 6 7L26 9' }),
      ),
    );
  else mark.textContent = String(index + 1);
  return mark;
}

/** One snake head for each lair the first wave comes out of. */
function exits(lairs: number) {
  const heads = make('span', { className: 'stop-exits' });
  heads.setAttribute('role', 'img');
  setAttribute(heads, 'aria-label', exitsLine(lairs));
  heads.append(...Array.from({ length: lairs }, () => make('i')));
  return heads;
}

/** The sticker of the caprice that surprises a stage: shown in advance, and a button. */
function sticker(caprice: CapriceDefinition, explain: PathActions['explain']) {
  const button = make('button', { className: 'stop-caprice' }, stickerGraphic(caprice));
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'dialog');
  setAttribute(button, 'aria-label', surpriseLabel(caprice.name));
  button.onclick = () => explain(caprice);
  return button;
}

function king() {
  const picture = make('img', { className: 'stop-king' });
  picture.src = kingUrl;
  setAttribute(picture, 'alt', 'Le roi à trois têtes');
  return picture;
}

/** What every stop tells: its number and state for a screen reader, its map, its lairs. */
function stopParts(stage: VoyageStage, index: number, stop: StopState) {
  const mission = missionById(stage.run.missionId)!.name;
  const lanes = activeEnemyLanes(stage.run, 1);
  const words = stopWords(index, mission, stop);
  const name = make('strong', { className: 'stop-name', text: mission });
  name.setAttribute('aria-hidden', 'true');
  return {
    spoken: [
      make('span', { className: 'sr-only', text: words.name }),
      make('span', { className: 'sr-only', text: words.state }),
    ],
    name,
    map: make('span', { className: 'stop-map' }, stopMap(stage.run, lanes)),
    exits: exits(lanes.length),
  };
}

/**
 * The stop to play, larger: its name, its terrain, its caprice in words, and its button. The
 * king and the sticker sit inside the card, beside the lairs and beside the button: nothing
 * of the largest stop hangs over its edge.
 */
function nextStopContent(
  stage: VoyageStage,
  index: number,
  start: PathActions['start'],
  surprise: HTMLElement | null,
) {
  const parts = stopParts(stage, index, 'next');
  const land = make('span', {
    className: 'stop-land',
    text: terrainLine(lands[stage.run.layout]),
  });
  const foes = make('div', { className: 'stop-foes' }, parts.exits);
  if (stage.king) foes.append(king());
  const facts = make('div', { className: 'stop-facts' }, land, foes);
  const content: Node[] = [
    ...parts.spoken,
    parts.name,
    make('div', { className: 'stop-top' }, parts.map, facts),
  ];
  const caprice = stageCaprice(stage);
  if (caprice)
    content.push(
      make(
        'p',
        { className: 'stop-surprise' },
        make('span', { text: 'Caprice surprise :' }),
        ' ',
        frenchLeaf('strong', caprice.name),
      ),
    );
  const row = make('div', { className: 'stop-start' });
  if (start) {
    const go = make('button', { id: 'voyage-go', className: 'primary', text: start.label });
    go.onclick = start.go;
    row.append(go);
  }
  if (surprise) row.append(surprise);
  content.push(row);
  return content;
}

/** A stop already played or still ahead: its map and its lairs; king and sticker on its edge. */
function stopContent(
  stage: VoyageStage,
  index: number,
  stop: StopState,
  surprise: HTMLElement | null,
) {
  const parts = stopParts(stage, index, stop);
  const content: Node[] = [...parts.spoken, parts.map, parts.name, parts.exits];
  if (surprise) content.push(surprise);
  if (stage.king) content.push(king());
  return content;
}

function pathStop(stage: VoyageStage, index: number, stop: StopState, actions: PathActions) {
  const item = make('li', { className: 'voyage-stop' }, badge(index, stop));
  item.dataset.state = stop;
  const caprice = stageCaprice(stage);
  const surprise = caprice && sticker(caprice, actions.explain);
  if (stop === 'next') {
    item.setAttribute('aria-current', 'step');
    item.append(...nextStopContent(stage, index, actions.start, surprise));
  } else item.append(...stopContent(stage, index, stop, surprise));
  return item;
}

/** The dashed trail behind the stops: one smooth line through the middle of each. */
function trail(widths: readonly number[], swings: readonly number[]) {
  const total = widths.reduce((sum, width) => sum + width, 0);
  let before = 0;
  const points = widths.map((width, index) => {
    const x = ((before + width / 2) / total) * 100;
    before += width;
    return { x: Math.round(x * 10) / 10, y: Math.round((50 + swings[index] * 4.6) * 10) / 10 };
  });
  let line = `M-1 ${points[0].y}L${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1];
    const to = points[index];
    const middle = (from.x + to.x) / 2;
    line += `C${middle} ${from.y},${middle} ${to.y},${to.x} ${to.y}`;
  }
  line += `L101 ${points.at(-1)!.y}`;
  return svgNode(
    'svg',
    {
      class: 'path-trail',
      viewBox: '0 0 100 100',
      preserveAspectRatio: 'none',
      'aria-hidden': 'true',
    },
    svgNode('path', { d: line }),
  );
}

/**
 * The path of a voyage: its stops in order, each with its terrain, its lairs, the caprice
 * that will surprise it and, at the last one, the king. The stop to play stands out.
 */
export function voyagePath(state: VoyageState, actions: PathActions): HTMLElement {
  const stops = stopStates(state);
  const travelling = stops.includes('next');
  const widths = stops.map((stop) => (stop === 'next' ? WIDE : 1));
  const swings = stops.map((stop, index) =>
    stop === 'next' ? 0 : (travelling ? SWING : EVEN_SWING)[index % SWING.length],
  );
  const list = make('ol', { className: 'voyage-stops' });
  list.style.setProperty('--columns', widths.map((width) => `${width}fr`).join(' '));
  for (const [index, stage] of voyagePlanOf(state).stages.entries()) {
    const stop = pathStop(stage, index, stops[index], actions);
    stop.style.setProperty('--swing', String(swings[index]));
    list.append(stop);
  }
  return make('div', { className: 'voyage-path' }, trail(widths, swings), list);
}
