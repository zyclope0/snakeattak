import { setAttribute as setDisplayAttribute, setText as setDisplayText } from '../i18n/dom.ts';
import type { MissionRun } from '../missions.ts';
import { missionLevel } from '../levels.ts';
import { activeEnemyLanes } from '../tutorial.ts';
import { LANE_NAMES, LANES } from '../ai.ts';
import { laneRoad, junctionRoad, routeJunctions } from '../routes.ts';
import { ART_SHEETS, GROUND_ART } from '../art.ts';
import type { Kind } from '../data.ts';
import { missionScouting } from './missionScouting.ts';
import { renderThreatCards, renderThreatAdvice } from './threatCards.ts';
/** A readable map, sharing the real paths rather than painting roads into a background. */
export function drawMissionPreview(svg: SVGElement, run: MissionRun) {
  const ns = 'http://www.w3.org/2000/svg';
  const shape = (tag: string, attrs: Record<string, string | number>, parent: Element = svg) => {
    const el = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    parent.append(el);
    return el;
  };
  svg.replaceChildren();
  const level = missionLevel(run.layout),
    lanes = activeEnemyLanes(run, 1);
  setDisplayAttribute(
    svg,
    'aria-label',
    `Trois voies visibles. Première vague : ${lanes.map((l) => LANE_NAMES[l]).join(' et ')}. Antres à gauche, cristal à droite.`,
  );
  const ground =
    GROUND_ART.find((g) => g.key === 'ground-' + (level.artId ?? level.id)) ?? GROUND_ART[0];
  shape('image', {
    href: ground.url,
    x: 0,
    y: 0,
    width: 1100,
    height: 620,
    preserveAspectRatio: 'xMidYMid slice',
    opacity: 0.55,
  });
  shape('rect', { x: 0, y: 70, width: 1100, height: 510, fill: '#779585', opacity: 0.35 });
  const roads = [
    ...[0, 1, 2].map((lane) => laneRoad(lane, level)),
    ...routeJunctions(level).map((x) => junctionRoad(x, level)),
  ];
  roads.forEach((points, i) => {
    const path = shape('polyline', {
      points: points.map((p) => `${p.x},${p.y}`).join(' '),
      fill: 'none',
      stroke: i < 3 && !lanes.includes(i) ? '#b2bdaa' : '#f2dfb2',
      'stroke-width': i < 3 ? 44 : 30,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });
    if (i < 3) {
      (path as SVGElement).dataset.previewLane = String(i);
      (path as SVGElement).dataset.active = String(lanes.includes(i));
    }
  });
  for (const rock of level.rocks) {
    shape('ellipse', {
      cx: rock.x,
      cy: rock.y + rock.r * 0.7,
      rx: rock.r * 1.1,
      ry: rock.r * 0.5,
      fill: '#324f46',
      opacity: 0.3,
    });
    shape('circle', {
      cx: rock.x,
      cy: rock.y,
      r: rock.r,
      fill: '#8e9f8c',
      stroke: '#647b66',
      'stroke-width': 3,
    });
  }
  const url = ART_SHEETS.find((s) => s.key === 'strongholds')!.url;
  const miniature = (x: number, y: number, w: number, h: number, frame: number, flip = false) => {
    const crop = shape('svg', {
      x,
      y,
      width: w,
      height: h,
      viewBox: `${(frame % 2) * 512} ${frame >= 2 ? 512 : 0} 512 512`,
    });
    shape(
      'image',
      {
        href: url,
        width: 1024,
        height: 1024,
        ...(flip ? { transform: 'translate(512 0) scale(-1 1)' } : {}),
      },
      crop,
    );
  };
  for (let lane = 0; lane < 3; lane++) {
    miniature(8, LANES[lane] - 90, 150, 150, 1);
    const text = shape('text', {
      x: 185,
      y: LANES[lane] - 34,
      fill: '#173e37',
      'font-size': 24,
      'font-family': 'Arial',
      'font-weight': 'bold',
    });
    setDisplayText(text, `${lane + 1} · ${LANE_NAMES[lane]}`);
    if (lanes.includes(lane))
      shape('path', {
        d: `M160 ${LANES[lane] - 8}h28m-10-10 10 10-10 10`,
        stroke: '#a1452c',
        'stroke-width': 6,
        fill: 'none',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      });
  }
  miniature(910, 240, 180, 210, 0, true);
  shape('path', {
    d: 'm1000 298 13 18-13 19-13-19Z',
    fill: '#69def3',
    stroke: '#efffff',
    'stroke-width': 3,
  });
}
export function showMissionScouting(run: MissionRun, chosen: readonly Kind[] = []) {
  const el = (id: string) => document.getElementById(id)!;
  const scouting = missionScouting(run, chosen),
    types = scouting.types;
  setDisplayText(el('mission-plan'), scouting.plan);
  renderThreatCards(el('mission-threats'), types.slice(0, 3));
  renderThreatCards(el('mission-other-threats'), types.slice(3));
  const more = el('mission-more-threats') as HTMLDetailsElement;
  more.open = false;
  more.hidden = types.length <= 3;
  setDisplayText(
    el('mission-more-title'),
    `${types.length - 3} autres ${types.length - 3 === 1 ? 'serpent' : 'serpents'}`,
  );
  renderThreatAdvice(el('mission-advice'), scouting.advice);
}
