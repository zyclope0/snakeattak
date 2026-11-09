import { bindCapricePreparation, canLaunchCaprice } from './capriceView.ts';
import { capriceBudget, capriceRules, capriceById } from '../caprices.ts';
import type { Kind } from '../data.ts';
import type { AlbumsController } from './capriceAlbums.ts';
import {
  setText as setDisplayText,
  setTitle as setDisplayTitle,
  setAttribute as setDisplayAttribute,
  setMarkup as setDisplayMarkup,
} from '../i18n/dom.ts';
import { drawMissionPreview, showMissionScouting } from './missionPreview.ts';
import { defeatCopy } from '../render/resultCopy.ts';
import type { Session } from '../session.ts';
import { MISSIONS, createMissionRun, missionById, missionWave } from '../missions.ts';
import type { MissionRun } from '../missions.ts';
import type { createMissionProgressController } from '../missionProgress.ts';
import { kinds } from '../data.ts';
import { portraitStyle } from '../art.ts';
import { bindDepartureControls } from './departures.ts';
import { missionJourney } from './missionJourney.ts';
import { missionEmblem, missionStatusBadge } from './missionJourneyView.ts';
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
    launch: (run: MissionRun, kinds?: readonly Kind[], retry?: boolean) => void | boolean;
    resume: () => void;
    canResume: () => boolean;
    home: () => void;
    profileChanged?: () => void;
    launchClassic: (seed: number) => void;
  },
  albums?: AlbumsController,
) {
  const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const dialog = el<HTMLDialogElement>('mission-dialog');
  let draft: MissionRun | null = null;
  const allowed = (run: MissionRun) =>
    canLaunchCaprice(
      run,
      progress.unlocked(run.missionId),
      progress.state.bestStars[run.missionId] ?? 0,
    );
  const preparation = bindCapricePreparation(
    dialog,
    (id) => {
      if (draft) {
        const { caprice: _, ...normal } = draft;
        preview(id ? { ...normal, caprice: id } : normal, false);
      }
    },
    albums,
    actions.profileChanged,
    portraitStyle,
  );
  const departures = bindDepartureControls(session, {
    unlocked: allowed,
    previewMission: preview,
    launchClassic: actions.launchClassic,
  });
  const cards = MISSIONS.map((mission, index) => {
    const button = document.createElement('button');
    button.className = 'mission-card';
    button.dataset.missionCard = mission.id;
    const number = document.createElement('small');
    setDisplayText(
      number,
      `${String(index + 1).padStart(2, '0')} · ${mission.waves.length} vagues`,
    );
    const name = document.createElement('strong');
    setDisplayText(name, mission.name);
    const objective = document.createElement('span');
    setDisplayText(objective, mission.objective);
    const stars = document.createElement('span');
    stars.className = 'mission-stars';
    stars.setAttribute('role', 'img');
    const availability = document.createElement('small');
    button.append(
      missionEmblem(mission.id),
      missionStatusBadge(),
      number,
      name,
      objective,
      stars,
      availability,
    );
    button.onclick = () =>
      preview(createMissionRun(mission.id, freshSeed(), progress.lastRun(mission.id)));
    el('mission-cards').append(button);
    return { button, stars, availability, id: mission.id };
  });
  function preview(run: MissionRun, resetScroll = true) {
    if (!allowed(run)) return;
    const mission = missionById(run.missionId)!;
    draft = run;
    preparation.update(run, progress.state.bestStars[run.missionId] ?? 0);
    departures.preview(run);
    setDisplayText(el('mission-title'), mission.name);
    setDisplayText(el('mission-objective'), mission.objective);
    el('mission-replacement-note').hidden = !actions.canResume();
    setDisplayText(
      el('mission-budget'),
      `${capriceBudget(mission.budget, capriceRules(run))} pièces · ${mission.waves.length} vagues · nouveaux alliés`,
    );
    setDisplayText(el('mission-land'), ['Détours', 'Méandres', 'Carrefour'][run.layout]);
    setDisplayText(el('mission-assault'), assaults[run.assault]);
    setDisplayText(el('mission-nest'), nests[run.nest]);
    setDisplayText(
      el('mission-plan'),
      missionWave(run, 1).pattern.tip +
        (mission.waves.some((rank) => rank >= 6)
          ? ' Des volants arriveront dans cette mission : prévois des archers, un dragon ou un tank.'
          : ''),
    );
    el('mission-retry').hidden = !progress.lastRun(run.missionId);
    drawMissionPreview(el('mission-map') as unknown as SVGElement, run);
    showMissionScouting(run);
    const party = el('mission-party');
    party.replaceChildren();
    for (const kind of ['hero', 'club', 'club'] as const) {
      const portrait = document.createElement('span');
      portrait.className = 'portrait';
      portrait.style.cssText = portraitStyle(kind);
      setDisplayTitle(portrait, kinds[kind].name);
      party.append(portrait);
    }
    dialog.dataset.run = JSON.stringify(run);
    if (!dialog.open) dialog.showModal();
    if (resetScroll) {
      dialog.scrollTop = 0;
      dialog.querySelector('.mission-dialog-body')!.scrollTop = 0;
      el('mission-title').focus({ preventScroll: true });
    }
  }
  const nextMission = () =>
    MISSIONS.find((m) => progress.unlocked(m.id) && !progress.state.bestStars[m.id]) ??
    [...MISSIONS].reverse().find((m) => progress.unlocked(m.id))!;
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
    if (draft) {
      const next = createMissionRun(draft.missionId, freshSeed(), draft);
      preview(draft.caprice ? { ...next, caprice: draft.caprice } : next);
    }
  };
  el('mission-retry').onclick = () => {
    const previous = draft && progress.lastRun(draft.missionId);
    if (previous) preview(previous);
  };
  el('mission-launch').onclick = () => {
    if (!draft || !allowed(draft)) return;
    const run = draft;
    if (actions.launch(run, preparation.chosen()) !== false) dialog.close();
  };
  el('mission-continue').onclick = actions.resume;
  el('mission-back-map').onclick = () => {
    actions.home();
    el<HTMLDetailsElement>('mission-list').open = true;
    el('expedition-heading').scrollIntoView({ block: 'start' });
    el('expedition-heading').focus({ preventScroll: true });
  };
  el('mission-again').onclick = () => {
    if (session.game.mission)
      actions.launch(session.game.mission, session.game.capriceKindsChosen, true);
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
    const journey = missionJourney(progress.state.bestStars, progress.unlocked);
    const next = journey.find((step) => step.status === 'next');
    setDisplayText(
      el('home-next-mission'),
      next ? nextMission().name : `Rejouer : ${nextMission().name}`,
    );
    setDisplayText(el('home-play'), next ? 'Jouer' : 'Rejouer');
    const state = progress.state;
    let total = 0;
    for (const [index, card] of cards.entries()) {
      const step = journey[index];
      total += step.stars;
      setDisplayText(card.stars, '★'.repeat(step.stars) + '☆'.repeat(3 - step.stars));
      setDisplayAttribute(card.stars, 'aria-label', step.starLabel);
      card.button.disabled = step.disabled;
      card.button.dataset.journeyStatus = step.status;
      if (step.status === 'next') card.button.setAttribute('aria-current', 'step');
      else card.button.removeAttribute('aria-current');
      setDisplayText(card.availability, `${step.symbol} ${step.label}`);
    }
    setDisplayText(el('mission-total'), `${total} / 18 étoiles`);
    el('mission-continue').hidden = !actions.canResume();
    const g = session.game,
      run = g.mission;
    el('mission-battle-actions').hidden = !run;
    if (!run) return;
    const caprice = capriceById(run.caprice);
    setDisplayText(el('mission-battle-title'), 'Tes alliés');
    setDisplayText(el('mission-battle-config'), `${assaults[run.assault]} · ${nests[run.nest]}`);
    const end = g.status === 'won' || g.status === 'lost';
    el('mission-result').hidden = !end;
    setDisplayText(
      el('mission-result'),
      caprice
        ? g.status === 'won'
          ? 'Caprice réussi !'
          : ''
        : g.status === 'won'
          ? `Mission réussie ! ${run.missionId === MISSIONS.at(-1)!.id ? 'Les six missions sont terminées. Rejoue-les autrement !' : 'Prochaine mission disponible sur la carte.'}`
          : defeatCopy(g).subtitle,
    );
    if (caprice && g.status === 'lost') {
      const node = el('mission-result');
      // Clear the previous whole-node copy binding before adopting a protected leaf.
      setDisplayMarkup(node, '<span data-copy-raw lang="fr"></span>');
      const phrase = node.firstElementChild!;
      phrase.textContent = caprice.announce;
    }
    el('mission-again').hidden = !end;
    const index = MISSIONS.findIndex((m) => m.id === run.missionId);
    el('mission-next').hidden = g.status !== 'won' || !!caprice || index >= MISSIONS.length - 1;
  };
}
