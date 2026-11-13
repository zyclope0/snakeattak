import { setText as setDisplayText } from '../i18n/dom.ts';
import type { Notice } from '../render/presentation.ts';
import { byId } from './dom.ts';
import { dialogOpen } from './battleDom.ts';
export type BattleGuide = {
  title: string;
  subtitle: string;
  compact?: string;
  priority?: number;
};
/** Placement stays actionable; a short urgent fact can outrank a longer flash. */
export function chooseBattleMessage(notice: Notice | null, guide: BattleGuide, placing: boolean) {
  const visible = !placing && notice && (guide.priority ?? -1) <= notice.priority ? notice : null;
  return {
    content: visible ?? guide,
    tone: placing ? 'place' : (visible?.kind ?? ((guide.priority ?? 0) > 0 ? 'signal' : 'idle')),
  };
}
export function bindBattleNotices(
  getGuide: () => BattleGuide = () => ({
    title: 'Tes alliés, de grands courageux',
    subtitle: 'Les alliés agissent seuls. À toi de préparer leurs meilleures chances.',
  }),
  forceGuide = () => false,
  reminder?: {
    update: (deltaMs: number, ports: { visible: boolean; blocked: boolean }) => string | null;
  },
) {
  const panel = byId('encounter');
  const announcement = byId('battle-announcement');
  let previous = '';
  let previousAnnouncement = '';
  return (notice: Notice | null, deltaMs = 0) => {
    const guide = getGuide(),
      placing = forceGuide();
    const { content, tone } = chooseBattleMessage(notice, guide, placing);
    // The former Phaser flash was independent of the separate placement coach.
    // Keep short events visible during placement; restore the compact gesture
    // as soon as the event clears. Both share one non-interactive bottom line.
    const hint = reminder?.update(deltaMs, {
      visible: !document.hidden && !dialogOpen(),
      blocked: !!notice || placing || (guide.priority ?? 0) > 0,
    });
    const title = notice?.title ?? (placing ? (guide.compact ?? guide.title) : (hint ?? ''));
    announcement.classList.toggle('placement-instruction', placing && !notice);
    if (title !== previousAnnouncement) {
      previousAnnouncement = title;
      setDisplayText(announcement, title);
      announcement.hidden = !title;
    }
    const key = `${tone}:${content.title}:${content.subtitle}`;
    if (key === previous) return;
    previous = key;
    panel.dataset.tone = tone;
    setDisplayText(byId('encounter-title'), content.title);
    setDisplayText(byId('encounter-tip'), content.subtitle);
  };
}
