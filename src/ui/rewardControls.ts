import { setText as setDisplayText, setAttribute as setDisplayAttribute } from '../i18n/dom.ts';
import { REWARDS } from '../rewards.ts';
import type { Session } from '../session.ts';
import { portraitStyle, ART_SHEETS } from '../art.ts';
import { kinds } from '../data.ts';
/** Two decisions in the preparation flow; Game owns every effect and validation. */
export function bindRewardControls(session: Session, refresh: () => void) {
  const panel = document.getElementById('reward-panel')!;
  const title = document.getElementById('reward-title')!;
  const summary = document.getElementById('reward-summary')!;
  const ward = document.getElementById('crystal-ward')!;
  const skip = document.getElementById('skip-reward') as HTMLButtonElement;
  const cards = Array.from({ length: 3 }, () => {
    const button = document.createElement('button');
    button.className = 'reward-card';
    const icon = document.createElement('span'),
      name = document.createElement('strong'),
      detail = document.createElement('span'),
      action = document.createElement('small');
    icon.className = 'reward-portrait';
    icon.setAttribute('aria-hidden', 'true');
    detail.className = 'reward-detail';
    setDisplayText(action, 'Choisir ce bonus');
    button.append(icon, name, detail, action);
    document.getElementById('reward-cards')!.append(button);
    button.onclick = () => {
      const id = button.dataset.reward;
      if (!id || !session.game.chooseReward(id)) return;
      const kind = REWARDS[id as keyof typeof REWARDS].kind;
      if (kind) session.selectUnit(kind);
      refresh();
      if (kind && matchMedia('(max-width:800px)').matches)
        document.getElementById('game')!.scrollIntoView({ block: 'center' });
      document.getElementById(kind ? 'cancel' : 'start')!.focus({ preventScroll: true });
    };
    return { button, icon, name, detail };
  });
  skip.onclick = () => {
    if (session.game.skipReward()) {
      refresh();
      document.getElementById('start')!.focus();
    }
  };
  let observed = session.game,
    focused = '';
  return () => {
    const g = session.game;
    if (g !== observed) {
      observed = g;
      focused = '';
    }
    const offer = g.rewardOffer;
    panel.hidden = !offer.length || g.status !== 'preparing';
    setDisplayText(title, `Vague ${g.wave} repoussée ! Choisis ton bonus`);
    skip.disabled = g.paused;
    for (const [i, card] of cards.entries()) {
      const id = offer[i];
      if (!id) continue;
      card.button.disabled = g.paused;
      if (card.button.dataset.reward === id) continue;
      const reward = REWARDS[id];
      card.button.dataset.reward = id;
      setDisplayText(card.name, reward.title);
      setDisplayText(card.detail, reward.detail);
      setDisplayAttribute(card.button, 'aria-label', `${reward.title}. ${reward.detail}`);
      card.icon.className = 'reward-portrait';
      card.icon.style.cssText = '';
      setDisplayText(card.icon, '');
      if (reward.kind) card.icon.style.cssText = portraitStyle(reward.kind);
      else if (id === 'miel') {
        card.icon.style.backgroundImage = `url("${ART_SHEETS.find((s) => s.key === 'miels-parapluie')!.url}")`;
        card.icon.style.backgroundSize = '200% 200%';
        card.icon.style.backgroundPosition = '0% 100%';
      } else {
        card.icon.classList.add(id === 'pieces' ? 'reward-coins' : 'reward-crystal');
        setDisplayText(card.icon, id === 'pieces' ? '+100' : '◆');
      }
    }
    const gifts = g.rewards.choices.filter((c) => c.id !== 'skip');
    const unused = gifts.filter((c) => !c.used && c.id !== 'skip');
    const notes: string[] = [];
    if (g.feastDuration > 14) notes.push(`Miel : ${g.feastDuration} s`);
    if (g.rewards.ward > 0) notes.push(`Cristal : ${g.rewards.ward} points de protection`);
    for (const c of unused) {
      const kind = c.id !== 'skip' ? REWARDS[c.id].kind : null;
      if (kind) notes.push(`${kinds[kind].name} offert à placer`);
    }
    summary.hidden = !gifts.length;
    setDisplayText(
      summary,
      notes.length
        ? notes.join(' · ')
        : `${gifts.length} bonus choisi${gifts.length > 1 ? 's' : ''} pour cette aventure`,
    );
    ward.hidden = g.rewards.ward <= 0;
    setDisplayText(ward, `+${g.rewards.ward} protection`);
    const key = `${g.rewards.seed}:${g.rewards.pending}`;
    if (
      !panel.hidden &&
      !g.paused &&
      session.screen === 'battle' &&
      !document.querySelector('dialog[open]') &&
      focused !== key
    ) {
      focused = key;
      title.focus({ preventScroll: true });
      if (matchMedia('(max-width:800px)').matches) panel.scrollIntoView({ block: 'nearest' });
    }
  };
}
