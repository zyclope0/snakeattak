import type { Notice } from '../render/presentation.ts';
export type BattleGuide = { title: string; subtitle: string; priority?: number };

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
) {
  const panel = document.getElementById('encounter')!;
  const announcement = document.getElementById('battle-announcement')!;
  let previous = '';
  let previousAnnouncement = '';
  return (notice: Notice | null) => {
    const { content, tone } = chooseBattleMessage(notice, getGuide(), forceGuide());
    // The former Phaser flash was independent of the separate placement coach.
    const title = notice?.title ?? '';
    if (title !== previousAnnouncement) {
      previousAnnouncement = title;
      announcement.textContent = title;
      announcement.hidden = !title;
    }
    const key = `${tone}:${content.title}:${content.subtitle}`;
    if (key === previous) return;
    previous = key;
    panel.dataset.tone = tone;
    document.getElementById('encounter-title')!.textContent = content.title;
    document.getElementById('encounter-tip')!.textContent = content.subtitle;
  };
}
