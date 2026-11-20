import { setText as setDisplayText, setAttribute as setDisplayAttribute } from '../i18n/dom.ts';
import { REWARDS, type RewardId } from '../rewards.ts';
import type { Game } from '../game.ts';
import type { Session } from '../session.ts';
import { portraitStyle } from '../art.ts';
import { kinds } from '../data.ts';
import { honeySheetUrl } from './feastControls.ts';
import { byId, decoration, dialogOpen, make, narrowScreen } from './dom.ts';
import { focusBoard } from './battleDom.ts';
import { revealBoard } from './battleDom.ts';
import * as TEXT from '../texts/fr/camp.ts';
import * as PAGE from '../texts/fr/page.ts';
import { BOON_PLACES, isLastingBoon, type LastingBoon } from '../boons.ts';
import { endlessWave } from '../endless.ts';
import { TOTAL_WAVES } from '../gameConstants.ts';
import { BOON_SIGNS, boonBadge, giftCopy } from './boonCopy.ts';
import { fill } from '../texts/fill.ts';

type RewardCard = ReturnType<typeof rewardCard>;

/** Two decisions in the preparation flow; Game owns every effect and validation. */
export function bindRewardControls(session: Session, refresh: () => void) {
  const panel = byId('reward-panel');
  const title = byId('reward-title');
  const lead = panel.querySelector('p')!;
  const skip = byId<HTMLButtonElement>('skip-reward');
  /**
   * In the endless adventure, a new lasting gift with the five places full asks which gift
   * gives its place: the cards then show the five gifts the child holds.
   */
  let replacing: LastingBoon | null = null;
  const choose = (id: string) => {
    const game = session.game;
    if (!replacing && needsPlace(game, id)) {
      replacing = id as LastingBoon;
      refresh();
      title.focus({ preventScroll: true });
      return;
    }
    const taken = replacing ? game.chooseReward(replacing, id) : game.chooseReward(id);
    replacing = null;
    if (!taken) return refresh();
    const kind = isRewardId(id) ? REWARDS[id].kind : null;
    if (kind) session.selectUnit(kind);
    refresh();
    if (kind) revealBoard();
    // A gift to place goes to the board, where it is placed: the « cancel » button is not
    // shown on a phone, and the focus was lost there.
    if (kind) focusBoard();
    else byId('start').focus({ preventScroll: true });
  };
  const cards = Array.from({ length: BOON_PLACES }, () => rewardCard(choose));
  skip.onclick = () => {
    if (replacing) {
      replacing = null;
      refresh();
      return title.focus({ preventScroll: true });
    }
    if (session.game.skipReward()) {
      refresh();
      byId('start').focus();
    }
  };
  let observed = session.game,
    focused = '';
  /** Each new offer takes the focus once, so that it is announced and reachable. */
  const announceOffer = (game: Game) => {
    const key = `${game.rewards.seed}:${game.kings}:${game.rewards.pending}`;
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
      replacing = null;
    }
    const offer: string[] = game.endless ? game.boonOffer : game.rewardOffer;
    if (!offer.length) replacing = null;
    panel.hidden = !offer.length || game.status !== 'preparing';
    // The gifts cover the board: a keyboard does not reach under them. The board stays
    // drawn; it only stops taking the focus where nothing would show it.
    byId('game').inert = !panel.hidden;
    const shown = replacing ? game.boons.map((b) => b.id) : offer;
    setDisplayText(title, panelTitle(game, replacing));
    setDisplayText(
      lead,
      replacing
        ? fill(TEXT.choisisLeCadeauARemplacerParN, giftCopy(game, replacing).title)
        : PAGE.unSeulCadeauAToiDeChoisirCeQui,
    );
    setDisplayText(skip, replacing ? TEXT.garderMesCadeaux : PAGE.continuerSansBonus);
    skip.disabled = game.paused;
    for (const [i, card] of cards.entries()) {
      card.button.hidden = !shown[i];
      if (shown[i]) showReward(card, game, shown[i], game.paused, !!replacing);
    }
    showChosenRewards(game);
    announceOffer(game);
  };
}

const isRewardId = (id: string): id is RewardId => Object.hasOwn(REWARDS, id);
/** A new lasting gift of the endless adventure, while the five places are taken. */
const needsPlace = (game: Game, id: string) =>
  !!game.endless && isLastingBoon(id) && !game.boonLevel(id) && game.boons.length >= BOON_PLACES;

function panelTitle(game: Game, replacing: LastingBoon | null): string {
  if (replacing) return fill(TEXT.tesNPlacesSontPrises, BOON_PLACES);
  if (game.endless && game.rewards.pending === TOTAL_WAVES)
    return TEXT.kingSnakeEstVaincuChoisisTonCadeau;
  const wave = game.endless ? endlessWave(game.kings, game.wave) : game.wave;
  return fill(TEXT.vagueNRepousseeChoisisTonBonus, wave);
}

function rewardCard(choose: (id: string) => void) {
  const icon = decoration('span', 'reward-portrait');
  const name = make('strong');
  const detail = make('span', { className: 'reward-detail' });
  const action = make('small', { text: TEXT.choisirCeBonus });
  const button = make('button', { className: 'reward-card' }, icon, name, detail, action);
  byId('reward-cards').append(button);
  button.onclick = () => {
    const id = button.dataset.reward;
    if (id) choose(id);
  };
  return { button, icon, name, detail, action };
}

/** A card is rewritten only when what it says changes: the same offer is refreshed often. */
function showReward(card: RewardCard, game: Game, id: string, paused: boolean, place: boolean) {
  card.button.disabled = paused;
  const copy = giftCopy(game, id);
  const level = isLastingBoon(id) ? game.boonLevel(id) : 0;
  // A gift held is shown as it stands when the child picks one to replace.
  const detail = place && isLastingBoon(id) ? boonBadge(id, level) : copy.detail;
  const action = place ? TEXT.remplacer : copy.action;
  const key = `${id}:${detail}:${action}`;
  if (card.button.dataset.shown === key) return;
  card.button.dataset.shown = key;
  card.button.dataset.reward = id;
  setDisplayText(card.name, copy.title);
  setDisplayText(card.detail, detail);
  setDisplayText(card.action, action);
  setDisplayAttribute(card.button, 'aria-label', `${copy.title}. ${detail}. ${action}`);
  paintRewardIcon(card.icon, id);
}

/** An ally's portrait, the honey pot, or a drawn sign for coins, crystal and lasting gifts. */
function paintRewardIcon(icon: HTMLElement, id: string) {
  const kind = isRewardId(id) ? REWARDS[id].kind : null;
  icon.className = 'reward-portrait';
  icon.style.cssText = '';
  setDisplayText(icon, '');
  if (isLastingBoon(id) && id !== 'miel') {
    icon.classList.add('reward-crystal', 'reward-boon');
    setDisplayText(icon, BOON_SIGNS[id]);
  } else if (kind) icon.style.cssText = portraitStyle(kind);
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
  summary.hidden = !gifts.length && !game.boons.length;
  const notes = rewardNotes(game);
  setDisplayText(
    summary,
    notes.length
      ? notes.join(' · ')
      : fill(TEXT.nBonusChoisiNPourCetteAventure, gifts.length, gifts.length > 1 ? 's' : ''),
  );
  ward.hidden = game.rewards.ward <= 0;
  setDisplayText(ward, fill(TEXT.nProtection, game.rewards.ward));
}

function rewardNotes(game: Game): string[] {
  // The lasting gifts of the endless adventure first, with their stars.
  const notes: string[] = game.boons.map((b) => boonBadge(b.id, b.level));
  if (game.feastDuration > 14) notes.push(fill(TEXT.mielNS, game.feastDuration));
  if (game.rewards.ward > 0) notes.push(fill(TEXT.cristalNPointsDeProtection, game.rewards.ward));
  for (const choice of game.rewards.choices) {
    const kind = choice.id !== 'skip' && !choice.used ? REWARDS[choice.id].kind : null;
    if (kind) notes.push(fill(TEXT.nOffertAPlacer, kinds[kind].name));
  }
  return notes;
}
