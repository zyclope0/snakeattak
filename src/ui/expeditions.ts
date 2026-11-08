import { childCopy } from './childCopy.ts';
import type { Session } from '../session.ts';
import { MISSIONS, createMissionRun, missionById, missionWave } from '../missions.ts';
import type { MissionRun } from '../missions.ts';
import type { createMissionProgressController } from '../missionProgress.ts';
import { missionLevel } from '../levels.ts';
import { laneRoad, junctionRoad, routeJunctions } from '../routes.ts';
import { kinds } from '../data.ts';
import { portraitStyle } from '../art.ts';
import { bindDepartureControls } from './departures.ts';

type Progress = ReturnType<typeof createMissionProgressController>;
const freshSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];
const assaults = {
  balanced: 'Arrivées régulières',
  rush: 'Petits groupes rapides',
  escort: 'Avancées groupées',
};
const nests = { spread: 'Éclosions décalées', clustered: 'Couvée groupée' };

/** Mission selection is separate from combat controls and never writes simulation rules. */
export function bindExpeditions(
  session: Session,
  progress: Progress,
  actions: {
    launch: (run: MissionRun) => void;
    resume: () => void;
    canResume: () => boolean;
    home: () => void;
    launchClassic: (seed: number) => void;
  },
) {
  const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const dialog = el<HTMLDialogElement>('mission-dialog');
  let draft: MissionRun | null = null;
  const departures = bindDepartureControls(session, {
    unlocked: (run) => progress.unlocked(run.missionId),
    previewMission: preview,
    launchClassic: actions.launchClassic,
  });
  const cards = MISSIONS.map((mission, index) => {
    const button = document.createElement('button');
    button.className = 'mission-card';
    button.dataset.missionCard = mission.id;
    const number = document.createElement('small');
    number.textContent = `${String(index + 1).padStart(2, '0')} · ${mission.waves.length} vagues`;
    const name = document.createElement('strong');
    name.textContent = mission.name;
    const objective = document.createElement('span');
    objective.textContent = childCopy(mission.objective);
    const stars = document.createElement('span');
    stars.className = 'mission-stars';
    const availability = document.createElement('small');
    button.append(number, name, objective, stars, availability);
    button.onclick = () =>
      preview(createMissionRun(mission.id, freshSeed(), progress.lastRun(mission.id)));
    el('mission-cards').append(button);
    return { button, stars, availability, id: mission.id };
  });
  function drawPreview(run: MissionRun) {
    const svg = el('mission-map');
    svg.replaceChildren();
    const level = missionLevel(run.layout);
    const ns = 'http://www.w3.org/2000/svg';
    for (const points of [
      ...[0, 1, 2].map((lane) => laneRoad(lane, level)),
      ...routeJunctions(level).map((x) => junctionRoad(x, level)),
    ]) {
      const path = document.createElementNS(ns, 'polyline');
      path.setAttribute('points', points.map((p) => `${p.x},${p.y}`).join(' '));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#d6c796');
      path.setAttribute('stroke-width', '24');
      svg.append(path);
    }
    for (const rock of level.rocks) {
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', String(rock.x));
      circle.setAttribute('cy', String(rock.y));
      circle.setAttribute('r', String(rock.r));
      circle.setAttribute('fill', '#586957');
      svg.append(circle);
    }
  }
  function preview(run: MissionRun) {
    const mission = missionById(run.missionId)!;
    draft = run;
    departures.preview(run);
    el('mission-title').textContent = mission.name;
    el('mission-objective').textContent = childCopy(mission.objective);
    el('mission-replacement-note').hidden = !actions.canResume();
    el('mission-budget').textContent =
      `${mission.budget} pièces · ${mission.waves.length} vagues · nouveaux alliés`;
    el('mission-land').textContent = ['Détours', 'Méandres', 'Carrefour'][run.layout];
    el('mission-assault').textContent = assaults[run.assault];
    el('mission-nest').textContent = nests[run.nest];
    el('mission-plan').textContent =
      childCopy(missionWave(run, 1).pattern.tip) +
      (mission.waves.some((rank) => rank >= 6)
        ? ' Des volants arriveront dans cette mission : prévois des archers, un dragon ou un tank.'
        : '');
    el('mission-retry').hidden = !progress.lastRun(run.missionId);
    drawPreview(run);
    const party = el('mission-party');
    party.replaceChildren();
    for (const kind of ['hero', 'club', 'club'] as const) {
      const portrait = document.createElement('span');
      portrait.className = 'portrait';
      portrait.style.cssText = portraitStyle(kind);
      portrait.title = kinds[kind].name;
      party.append(portrait);
    }
    dialog.dataset.run = JSON.stringify(run);
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    dialog.querySelector('.mission-dialog-body')!.scrollTop = 0;
    el('mission-title').focus({ preventScroll: true });
  }
  const nextMission = () =>
    MISSIONS.find((m) => progress.unlocked(m.id) && !progress.state.bestStars[m.id]) ??
    MISSIONS.at(-1)!;
  el('home-play').onclick = () => {
    const next = nextMission();
    preview(createMissionRun(next.id, freshSeed(), progress.lastRun(next.id)));
  };
  el('home-expeditions').onclick = () => {
    el<HTMLDetailsElement>('mission-list').open = true;
    el('expedition-heading').scrollIntoView({ block: 'start' });
    el('expedition-heading').focus({ preventScroll: true });
  };
  el('mission-close').onclick = () => dialog.close();
  el('mission-reroll').onclick = () => {
    if (draft) preview(createMissionRun(draft.missionId, freshSeed(), draft));
  };
  el('mission-retry').onclick = () => {
    const previous = draft && progress.lastRun(draft.missionId);
    if (previous) preview(previous);
  };
  el('mission-launch').onclick = () => {
    if (!draft || !progress.unlocked(draft.missionId)) return;
    const run = draft;
    dialog.close();
    actions.launch(run);
  };
  el('mission-continue').onclick = actions.resume;
  el('mission-back-map').onclick = () => {
    actions.home();
    el<HTMLDetailsElement>('mission-list').open = true;
    el('expedition-heading').scrollIntoView({ block: 'start' });
    el('expedition-heading').focus({ preventScroll: true });
  };
  el('mission-again').onclick = () => {
    if (session.game.mission) actions.launch(session.game.mission);
  };
  el('mission-next').onclick = () => {
    const index = MISSIONS.findIndex((m) => m.id === session.game.mission?.missionId);
    const next = MISSIONS[index + 1];
    if (!next || !progress.unlocked(next.id)) return;
    actions.home();
    preview(createMissionRun(next.id, freshSeed(), progress.lastRun(next.id)));
  };
  return () => {
    departures.refresh();
    el('home-next-mission').textContent = nextMission().name;
    const state = progress.state;
    let total = 0;
    for (const card of cards) {
      const n = state.bestStars[card.id];
      total += n;
      card.stars.textContent = '★'.repeat(n) + '☆'.repeat(3 - n);
      const available = progress.unlocked(card.id);
      card.button.disabled = !available;
      card.availability.textContent = !available
        ? 'Termine la mission précédente'
        : n
          ? 'Rejouer autrement'
          : 'Préparer mes alliés';
    }
    el('mission-total').textContent = `${total} / 18 étoiles`;
    el('mission-continue').hidden = !actions.canResume();
    const g = session.game,
      run = g.mission;
    el('mission-battle-actions').hidden = !run;
    if (!run) return;
    const definition = missionById(run.missionId)!;
    el('mission-battle-title').textContent = 'Tes alliés';
    el('mission-battle-config').textContent = `${assaults[run.assault]} · ${nests[run.nest]}`;
    const end = g.status === 'won' || g.status === 'lost';
    el('mission-result').hidden = !end;
    el('mission-result').textContent =
      g.status === 'won'
        ? `${'★'.repeat(g.missionStars)} · Mission réussie ! ${run.missionId === MISSIONS.at(-1)!.id ? 'Les six missions sont terminées. Rejoue-les autrement !' : 'Prochaine mission disponible sur la carte.'}`
        : 'Le camp est tombé. Réessaie ce même départ ou prépare une autre expédition.';
    el('mission-again').hidden = !end;
    const index = MISSIONS.findIndex((m) => m.id === run.missionId);
    el('mission-next').hidden = g.status !== 'won' || index >= MISSIONS.length - 1;
  };
}
