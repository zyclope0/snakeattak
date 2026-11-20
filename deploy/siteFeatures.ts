import { existsSync, readFileSync } from 'node:fs';
import { imageMetadata } from './imageMetadata.ts';

/**
 * Two public pages that wait for the parent (decisions of 20 November 2026). Each stays out
 * of the website, with every link and button that leads to it, until its values are filled
 * in here: an empty value never publishes half a page.
 *
 * The test of the Android application: a public Google Group anyone may join (« lien
 * public »), then the page where Google Play lets a member join the closed test (track
 * « Alpha », created by the parent on 20 November 2026). A button leads to the page from every page of
 * the website (« bouton partout »), never from the game or the application.
 */
export const ANDROID_TEST = {
  /** The Google Group of the testers, e.g. https://groups.google.com/g/<name>. */
  group: 'https://groups.google.com/g/snakeattack-testeurs',
  /** Google Play's own page to join the test, e.g. https://play.google.com/apps/testing/<id>. */
  optIn: 'https://play.google.com/apps/testing/com.conqueteserpents.famille',
};
/**
 * Google's rule for a new personal developer account before it may publish (read on
 * 19 November 2026, docs/TESTEURS-ET-JOUEURS.md): this many testers, opted in this many days
 * in a row.
 */
export const PLAY_TESTERS = 12;
export const PLAY_TEST_DAYS = 14;

/**
 * The story of the game: the child's drawing and his age, nothing else about him (« juste le
 * dessin et l'âge »). The drawing is a JPEG or PNG at `drawing`, provided by the parent.
 */
export const STORY = {
  /** The age of the child when he invented the game, in years (the parent, 20 November 2026). */
  age: 8 as number | null,
  drawing: 'resources/site/dessin-du-jeu.jpg',
};

export type AndroidTest = { group: string; optIn: string };
export type Story = { age: number; drawing: string; width: number; height: number };
export type SiteFeatures = { androidTest: AndroidTest | null; story: Story | null };

/** An HTTPS address on exactly this host, or null: a typo never reaches a page. */
function addressOn(value: string, host: string): string | null {
  if (!value.trim()) return null;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== host || url.username || url.password)
    throw new Error(`Expected an HTTPS address on ${host}: ${value}`);
  return url.href;
}

/** The pages the values above allow, checked. Arguments only for the tests. */
export function siteFeatures(
  test: { group: string; optIn: string } = ANDROID_TEST,
  story: { age: number | null; drawing: string } = STORY,
  read: (path: string) => Uint8Array | null = (path) =>
    existsSync(path) ? readFileSync(path) : null,
): SiteFeatures {
  const group = addressOn(test.group, 'groups.google.com');
  const optIn = addressOn(test.optIn, 'play.google.com');
  if (!group !== !optIn) throw new Error('The Android test needs both its group and its opt-in');
  let told: Story | null = null;
  if (story.age !== null) {
    if (!Number.isInteger(story.age) || story.age < 3 || story.age > 15)
      throw new Error(`Unexpected age for the child: ${story.age}`);
    const bytes = read(story.drawing);
    const size = bytes && imageMetadata(bytes);
    if (bytes && !size) throw new Error(`${story.drawing} is not a JPEG or PNG picture`);
    if (size)
      told = { age: story.age, drawing: story.drawing, width: size.width, height: size.height };
  }
  return { androidTest: group && optIn ? { group, optIn } : null, story: told };
}
