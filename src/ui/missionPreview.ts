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
import { byId } from './dom.ts';
import { svgNode } from './svg.ts';
import * as TEXT from '../texts/fr/missionScreens.ts';
import { fill } from '../texts/fill.ts';

type Level = ReturnType<typeof missionLevel>;
type Point = { x: number; y: number };
const ROAD_COLOUR = '#f2dfb2';
/** A lane the first wave does not use is drawn paler. */
const QUIET_ROAD_COLOUR = '#b2bdaa';

/** The level's terrain, dimmed under a green veil: the roads are drawn over it. */
export function drawGround(svg: SVGElement, level: Level) {
  const ground =
    GROUND_ART.find((g) => g.key === 'ground-' + (level.artId ?? level.id)) ?? GROUND_ART[0];
  svg.append(
    svgNode('image', {
      href: ground.url,
      x: 0,
      y: 0,
      width: 1100,
      height: 620,
      preserveAspectRatio: TEXT.xmidymidSlice,
      opacity: 0.55,
    }),
    svgNode('rect', { x: 0, y: 70, width: 1100, height: 510, fill: '#779585', opacity: 0.35 }),
  );
}

function road(points: readonly Point[], stroke: string, width: number) {
  return svgNode('polyline', {
    points: points.map((p) => `${p.x},${p.y}`).join(' '),
    fill: 'none',
    stroke,
    'stroke-width': width,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  });
}

/** The three lanes, then the junctions between them: the real paths of the level. */
export function drawRoads(svg: SVGElement, level: Level, lanes: readonly number[]) {
  for (const lane of [0, 1, 2]) {
    const active = lanes.includes(lane);
    const path = road(laneRoad(lane, level), active ? ROAD_COLOUR : QUIET_ROAD_COLOUR, 44);
    path.dataset.previewLane = String(lane);
    path.dataset.active = String(active);
    svg.append(path);
  }
  for (const x of routeJunctions(level)) svg.append(road(junctionRoad(x, level), ROAD_COLOUR, 30));
}

/** Each rock with its shadow on the ground. */
export function drawRocks(svg: SVGElement, level: Level) {
  for (const rock of level.rocks)
    svg.append(
      svgNode('ellipse', {
        cx: rock.x,
        cy: rock.y + rock.r * 0.7,
        rx: rock.r * 1.1,
        ry: rock.r * 0.5,
        fill: '#324f46',
        opacity: 0.3,
      }),
      svgNode('circle', {
        cx: rock.x,
        cy: rock.y,
        r: rock.r,
        fill: '#8e9f8c',
        stroke: '#647b66',
        'stroke-width': 3,
      }),
    );
}

/** One of the four 512 px frames of the strongholds sheet, cropped by its own viewport. */
function miniature(
  x: number,
  y: number,
  width: number,
  height: number,
  frame: number,
  flip = false,
) {
  const viewBox = `${(frame % 2) * 512} ${frame >= 2 ? 512 : 0} 512 512`;
  return svgNode(
    'svg',
    { x, y, width, height, viewBox },
    svgNode('image', {
      href: ART_SHEETS.find((s) => s.key === 'strongholds')!.url,
      width: 1024,
      height: 1024,
      ...(flip ? { transform: TEXT.translate5120Scale11 } : {}),
    }),
  );
}

/** A lair at the mouth of each lane, its name, and an arrow where the first wave comes out. */
function drawLairs(svg: SVGElement, lanes: readonly number[]) {
  for (let lane = 0; lane < 3; lane++) {
    const label = svgNode('text', {
      x: 185,
      y: LANES[lane] - 34,
      fill: '#173e37',
      'font-size': 24,
      'font-family': TEXT.arial,
      'font-weight': 'bold',
    });
    svg.append(miniature(8, LANES[lane] - 90, 150, 150, 1), label);
    setDisplayText(label, `${lane + 1} · ${LANE_NAMES[lane]}`);
    if (lanes.includes(lane))
      svg.append(
        svgNode('path', {
          d: `M160 ${LANES[lane] - 8}h28m-10-10 10 10-10 10`,
          stroke: '#a1452c',
          'stroke-width': 6,
          fill: 'none',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }),
      );
  }
}

/** The refuge on the right, mirrored to face the lairs, and its crystal. */
function drawRefuge(svg: SVGElement) {
  svg.append(
    miniature(910, 240, 180, 210, 0, true),
    svgNode('path', {
      d: 'm1000 298 13 18-13 19-13-19Z',
      fill: '#69def3',
      stroke: '#efffff',
      'stroke-width': 3,
    }),
  );
}

/** A readable map, sharing the real paths rather than painting roads into a background. */
export function drawMissionPreview(svg: SVGElement, run: MissionRun) {
  svg.replaceChildren();
  const level = missionLevel(run.layout);
  const lanes = activeEnemyLanes(run, 1);
  setDisplayAttribute(
    svg,
    'aria-label',
    fill(TEXT.troisVoiesVisiblesPremiereVagueN, lanes.map((l) => LANE_NAMES[l]).join(' et ')),
  );
  drawGround(svg, level);
  drawRoads(svg, level, lanes);
  drawRocks(svg, level);
  drawLairs(svg, lanes);
  drawRefuge(svg);
}

export function showMissionScouting(run: MissionRun, chosen: readonly Kind[] = []) {
  const scouting = missionScouting(run, chosen);
  const types = scouting.types;
  const others = types.length - 3;
  setDisplayText(byId('mission-plan'), scouting.plan);
  renderThreatCards(byId('mission-threats'), types.slice(0, 3));
  renderThreatCards(byId('mission-other-threats'), types.slice(3));
  // The first three kinds are always in view; the rest wait folded under their count.
  const more = byId<HTMLDetailsElement>('mission-more-threats');
  more.open = false;
  more.hidden = others <= 0;
  setDisplayText(
    byId('mission-more-title'),
    fill(TEXT.nAutresN, others, others === 1 ? 'serpent' : 'serpents'),
  );
  renderThreatAdvice(byId('mission-advice'), scouting.advice);
}
