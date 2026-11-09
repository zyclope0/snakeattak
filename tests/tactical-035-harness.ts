import './result-0342-harness.ts';
import { createCoach } from '../src/ui/coaching.ts';
import { bindBattleNotices } from '../src/ui/battleNotices.ts';
import type { Session } from '../src/session.ts';
import type Phaser from 'phaser';
const fixture = (window as unknown as { resultFixture: { session: Session; phaser: Phaser.Game } })
  .resultFixture;
function bindNotices() {
  const scene = fixture.phaser.scene.getScene('Battle') as unknown as {
    onPresentation: ReturnType<typeof bindBattleNotices>;
  } | null;
  if (!scene) {
    requestAnimationFrame(bindNotices);
    return;
  }
  scene.onPresentation = bindBattleNotices(
    createCoach(fixture.session),
    () => !!fixture.session.selected || !!fixture.session.selectedFeast,
  );
  Object.assign(window, { tacticalNoticeBound: true });
}
bindNotices();
