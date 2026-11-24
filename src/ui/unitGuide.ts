import { setText as setDisplayText } from '../i18n/dom.ts';
import './unitGuide.css';
import { HERO_FORCE_FACTOR } from '../campaignRules.ts';
import { roleDescription } from '../defenders.ts';
import { kinds, unlockWave } from '../data.ts';
import type { Kind } from '../data.ts';
import type { Session } from '../session.ts';
import { specialAbility, healAmount, attackDamage } from '../unitRules.ts';
import { portraitStyle } from '../art.ts';
import { pauseForDialog } from './dialogs.ts';
import { balanceRecruitPrice, CURRENT_BALANCE_REVISION } from '../balanceRevision.ts';
import { addOption, byId, make } from './dom.ts';
import * as TEXT from '../texts/fr/guide.ts';
import { fill } from '../texts/fill.ts';

/** The card of one ally: its portrait, its power and a few facts read from the rules. */
export function bindUnitGuide(session: Session, onChange: () => void) {
  const dialog = byId<HTMLDialogElement>('unit-dialog');
  const select = byId<HTMLSelectElement>('guide-select');
  for (const [kind, unit] of Object.entries(kinds)) addOption(select, kind, unit.name);
  const modal = pauseForDialog(dialog, session, onChange);
  const show = () => {
    const kind = select.value as Kind;
    setDisplayText(byId('guide-name'), kinds[kind].name);
    byId('guide-portrait').style.cssText = portraitStyle(kind);
    setDisplayText(
      byId('guide-ability'),
      specialAbility(kind, session.game.tuning.splashSecondaryFactor),
    );
    byId('guide-stats').replaceChildren(
      ...guideFacts(kind, session).map(([label, value]) =>
        make('div', {}, make('small', { text: label }), make('strong', { text: value })),
      ),
    );
  };
  byId('unit-guide').onclick = () => {
    if (session.selected) select.value = session.selected;
    show();
    modal.open();
  };
  select.onchange = show;
  byId('close-unit-guide').onclick = modal.close;
}

/** Label and value of each line of the card, in the order they are shown. */
function guideFacts(kind: Kind, session: Session): [label: string, value: string][] {
  const unit = kinds[kind];
  return [
    [TEXT.camp, TEXT.nosAllies],
    [TEXT.defense, roleDescription(kind)],
    [TEXT.vie, fill(TEXT.nPv, unit.hp)],
    [TEXT.prix, priceFact(kind, session)],
    [TEXT.arrivee, fill(TEXT.vagueN, unlockWave[kind] ?? 1)],
    [TEXT.attaque, attackFact(kind, session)],
    [TEXT.portee, unit.range <= 60 ? TEXT.contact : unit.range < 190 ? TEXT.moyenne : TEXT.longue],
    [TEXT.mobilite, mobilityFact(unit.speed)],
  ];
}

function priceFact(kind: Kind, session: Session): string {
  if (kind === 'hero') return TEXT.presentAuDepart;
  // From the home screen no battle is open: show the price of a new adventure.
  const price =
    session.screen === 'home'
      ? balanceRecruitPrice(kind, CURRENT_BALANCE_REVISION)
      : session.game.recruitCost(kind);
  return price === 0 ? TEXT.gratuit : fill(TEXT.nPieces, price);
}

function attackFact(kind: Kind, session: Session): string {
  if (healAmount(kind)) return fill(TEXT.soigneNPv, healAmount(kind));
  const game = session.game;
  return fill(
    TEXT.nDegats,
    (
      attackDamage(kind, 0, game.tuning.mutantDamageFactor) *
      (kind === 'hero' && game.campaign.training === 'force' ? HERO_FORCE_FACTOR : 1)
    ).toLocaleString('fr-FR'),
  );
}

function mobilityFact(speed: number): string {
  if (speed === 0) return TEXT.fixe;
  if (speed >= 225) return TEXT.tresRapide;
  if (speed > 120) return TEXT.rapide;
  return speed < 65 ? TEXT.lente : TEXT.moyenne;
}
