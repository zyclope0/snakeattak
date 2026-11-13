import { setText as setDisplayText, setAttribute as setDisplayAttribute } from '../i18n/dom.ts';
import { REWARDS, type RewardId } from '../rewards.ts';
import type { Game } from '../game.ts';
import type { Session } from '../session.ts';
import { portraitStyle } from '../art.ts';
import { kinds } from '../data.ts';
import { honeySheetUrl } from './feastControls.ts';
import { byId, make, narrowScreen } from './dom.ts';
import { decoration, dialogOpen, revealBoard } from './battleDom.ts';

type RewardCard = ReturnType<typeof rewardCard>;

/** Two decisions in the preparation flow; Game owns every effect and validation. */
export function bindRewardControls(session: Session, refresh: () => void) {
  const panel = byId('reward-panel');
  const title = byId('reward-title');
  const skip = byId<HTMLButtonElement>('skip-reward');
  const cards = Array.from({ length: 3 }, () => rewardCard(session, refresh));
  skip.onclick = () => {
    if (session.game.skipReward()) {
      refresh();
      byId('start').focus();
    }
  };
  let observed = session.game,
    focused = '';
  /** Each new offer takes the focus once, so that it is announced and reachable. */
  const announceOffer = (game: Game) => {
    const key = `${game.rewards.seed}:${game.rewards.pending}`;
    const reachable = !panel.hidden && !game.paused && session.screen === 'battle' && !dialogOpen();
    if (!reachable || focused === key) return;
    focused = key;
    title.focus({ preventScroll: true });
    if (narrowScreen()) panel.scrollIntoView({ block: 'nearest' });
  };
  return () => {
    const game = session.game;
    if (game !== observed) {
      observed = game;
      focused = '';
    }
    const offer = game.rewardOffer;
    panel.hidden = !offer.length || game.status !== 'preparing';
    setDisplayText(title, `Vague ${game.wave} repoussée ! Choisis ton bonus`);
    skip.disabled = game.paused;
    for (const [i, card] of cards.entries()) if (offer[i]) showReward(card, offer[i], game.paused);
    showChosenRewards(game);
    announceOffer(game);
  };
}

function rewardCard(session: Session, refresh: () => void) {
  const icon = decoration('span', 'reward-portrait');
  const name = make('strong');
  const detail = make('span', { className: 'reward-detail' });
  const action = make('small', { text: 'Choisir ce bonus' });
  const button = make('button', { className: 'reward-card' }, icon, name, detail, action);
  byId('reward-cards').append(button);
  button.onclick = () => {
    const id = button.dataset.reward;
    if (!id || !session.game.chooseReward(id)) return;
    const kind = REWARDS[id as RewardId].kind;
    if (kind) session.selectUnit(kind);
    refresh();
    if (kind) revealBoard();
    byId(kind ? 'cancel' : 'start').focus({ preventScroll: true });
  };
  return { button, icon, name, detail };
}

/** A card is rewritten only when its bonus changes: the same offer is refreshed often. */
function showReward(card: RewardCard, id: RewardId, paused: boolean) {
  card.button.disabled = paused;
  if (card.button.dataset.reward === id) return;
  const reward = REWARDS[id];
  card.button.dataset.reward = id;
  setDisplayText(card.name, reward.title);
  setDisplayText(card.detail, reward.detail);
  setDisplayAttribute(card.button, 'aria-label', `${reward.title}. ${reward.detail}`);
  paintRewardIcon(card.icon, id);
}

/** An ally's portrait, the honey pot, or a drawn sign for coins and crystal. */
function paintRewardIcon(icon: HTMLElement, id: RewardId) {
  const kind = REWARDS[id].kind;
  icon.className = 'reward-portrait';
  icon.style.cssText = '';
  setDisplayText(icon, '');
  if (kind) icon.style.cssText = portraitStyle(kind);
  else if (id === 'miel') {
    icon.style.backgroundImage = `url("${honeySheetUrl()}")`;
    icon.style.backgroundSize = '200% 200%';
    icon.style.backgroundPosition = '0% 100%';
  } else {
    icon.classList.add(id === 'pieces' ? 'reward-coins' : 'reward-crystal');
    setDisplayText(icon, id === 'pieces' ? '+100' : '◆');
  }
}

/** Under the camp: what the bonuses already chosen still give. */
function showChosenRewards(game: Game) {
  const summary = byId('reward-summary');
  const ward = byId('crystal-ward');
  const gifts = game.rewards.choices.filter((c) => c.id !== 'skip');
  summary.hidden = !gifts.length;
  const notes = rewardNotes(game);
  setDisplayText(
    summary,
    notes.length
      ? notes.join(' · ')
      : `${gifts.length} bonus choisi${gifts.length > 1 ? 's' : ''} pour cette aventure`,
  );
  ward.hidden = game.rewards.ward <= 0;
  setDisplayText(ward, `+${game.rewards.ward} protection`);
}

function rewardNotes(game: Game): string[] {
  const notes: string[] = [];
  if (game.feastDuration > 14) notes.push(`Miel : ${game.feastDuration} s`);
  if (game.rewards.ward > 0) notes.push(`Cristal : ${game.rewards.ward} points de protection`);
  for (const choice of game.rewards.choices) {
    const kind = choice.id !== 'skip' && !choice.used ? REWARDS[choice.id].kind : null;
    if (kind) notes.push(`${kinds[kind].name} offert à placer`);
  }
  return notes;
}
