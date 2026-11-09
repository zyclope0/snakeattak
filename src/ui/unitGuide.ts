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
export function bindUnitGuide(session: Session, onChange: () => void) {
  const dialog = document.getElementById('unit-dialog') as HTMLDialogElement;
  const select = document.getElementById('guide-select') as HTMLSelectElement;
  for (const [kind, d] of Object.entries(kinds)) {
    const option = document.createElement('option');
    option.value = kind;
    setDisplayText(option, d.name);
    select.append(option);
  }
  const modal = pauseForDialog(dialog, session, onChange);
  function show() {
    const kind = select.value as Kind,
      d = kinds[kind];
    setDisplayText(document.getElementById('guide-name')!, d.name);
    document.getElementById('guide-portrait')!.style.cssText = portraitStyle(kind);
    setDisplayText(
      document.getElementById('guide-ability')!,
      specialAbility(kind, session.game.tuning.splashSecondaryFactor),
    );
    const fields = [
      ['Camp', 'Nos alliés'],
      ['Défense', roleDescription(kind)],
      ['Vie', `${d.hp} PV`],
      ['Prix', kind === 'hero' ? 'Présent au départ' : `${d.cost} pièces`],
      ['Arrivée', `Vague ${unlockWave[kind] ?? 1}`],
      [
        'Attaque',
        healAmount(kind)
          ? `Soigne ${healAmount(kind)} PV`
          : `${(attackDamage(kind, 0, session.game.tuning.mutantDamageFactor) * (kind === 'hero' && session.game.campaign.training === 'force' ? HERO_FORCE_FACTOR : 1)).toLocaleString('fr-FR')} dégâts`,
      ],
      ['Portée', d.range <= 60 ? 'Contact' : d.range < 190 ? 'Moyenne' : 'Longue'],
      [
        'Mobilité',
        d.speed === 0
          ? 'Fixe'
          : d.speed >= 225
            ? 'Très rapide'
            : d.speed > 120
              ? 'Rapide'
              : d.speed < 65
                ? 'Lente'
                : 'Moyenne',
      ],
    ];
    const stats = document.getElementById('guide-stats')!;
    stats.replaceChildren();
    for (const [label, value] of fields) {
      const row = document.createElement('div');
      const title = document.createElement('small'),
        text = document.createElement('strong');
      setDisplayText(title, label);
      setDisplayText(text, value);
      row.append(title, text);
      stats.append(row);
    }
  }
  document.getElementById('unit-guide')!.onclick = () => {
    if (session.selected) select.value = session.selected;
    show();
    modal.open();
  };
  select.onchange = show;
  document.getElementById('close-unit-guide')!.onclick = modal.close;
}
