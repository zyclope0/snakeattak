import lairUrl from '../../assets/home/voyage-antre.webp';
import refugeUrl from '../../assets/home/mission-refuge.webp';
import { LANES } from '../../ai.ts';
import { missionLevel } from '../../levels.ts';
import type { MissionRun } from '../../missions.ts';
import { drawGround, drawRoads, drawRocks } from '../missionPreview.ts';
import { SERPENT_ARROW_COLOR, svgNode } from '../svg.ts';

/**
 * The small map of a stop: the real paths of its terrain, as the preparation of a mission
 * draws them, a lair at the mouth of each lane and a red arrow where the first wave comes
 * out. Small pictures stand for the lairs and the refuge, so that a map of the voyage does
 * not ask for the large sheet of the strongholds. The stop says the same in words.
 */
export function stopMap(run: MissionRun, lanes: readonly number[]): SVGSVGElement {
  const svg = svgNode('svg', { viewBox: '0 70 1100 510', 'aria-hidden': 'true' });
  const level = missionLevel(run.layout);
  drawGround(svg, level);
  drawRoads(svg, level, lanes);
  drawRocks(svg, level);
  for (const [lane, y] of LANES.entries()) {
    const used = lanes.includes(lane);
    svg.append(
      svgNode('image', {
        href: lairUrl,
        x: 2,
        y: y - 96,
        width: 170,
        height: 160,
        opacity: used ? 1 : 0.4,
      }),
    );
    if (used)
      svg.append(
        svgNode('path', {
          d: `M168 ${y - 6}h52m-22-22 22 22-22 22`,
          stroke: SERPENT_ARROW_COLOR,
          'stroke-width': 15,
          fill: 'none',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        }),
      );
  }
  svg.append(svgNode('image', { href: refugeUrl, x: 900, y: 222, width: 200, height: 200 }));
  return svg;
}
