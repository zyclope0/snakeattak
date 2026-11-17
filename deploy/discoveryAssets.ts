import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { SHARE_PICTURE, type DiscoveryAssets } from './discovery.ts';

/**
 * The pictures of the website. The one a shared link shows is a real battle
 * (`SHARE_PICTURE`); the others are cut from the application icon by
 * `scripts/export-site-icons.py`: a few kilobytes for a browser tab, a phone's home screen
 * and the top of each page.
 */
const PICTURES = {
  share: SHARE_PICTURE.source,
  tab: 'resources/site/icon-48.png',
  touch: 'resources/site/touch-180.png',
  logo: 'resources/site/logo-96.png',
  hero: 'resources/site/hero-512.webp',
} as const;
const FAVICON = 'resources/site/favicon.ico';

const hashed = (name: string, extension: string, bytes: Buffer): string =>
  `/assets/${name}-${createHash('sha256').update(bytes).digest('hex').slice(0, 12)}.${extension}`;
const pictureName = (key: keyof typeof PICTURES) => `site-${key}`;
const picturePath = (key: keyof typeof PICTURES): string =>
  hashed(pictureName(key), PICTURES[key].split('.').at(-1)!, readFileSync(PICTURES[key]));

/** Where the game page finds the two pictures its head names, before anything is written. */
export const gamePagePictures = () => ({
  share: picturePath('share'),
  touch: picturePath('touch'),
});

/** Local, licensed images and fonts already used by the game, never a third-party CDN. */
export function writeDiscoveryAssets(outDir: string): DiscoveryAssets {
  mkdirSync(`${outDir}/assets`, { recursive: true });
  const emit = (name: string, extension: string, bytes: Buffer): string => {
    const path = hashed(name, extension, bytes);
    writeFileSync(outDir + path, bytes);
    return path;
  };
  const file = (name: string, path: string) =>
    emit(name, path.split('.').at(-1)!, readFileSync(path));
  const picture = (key: keyof typeof PICTURES) => file(pictureName(key), PICTURES[key]);
  const heading = file('site-heading', 'src/assets/fonts/fredoka-latin.woff2');
  const body = file('site-body', 'src/assets/fonts/nunitosans-latin.woff2');
  const css = readFileSync('deploy/discovery.css', 'utf8')
    .replaceAll('__HEADING_FONT__', heading)
    .replaceAll('__BODY_FONT__', body);
  // A page that names no icon (the policy, the prototype) makes the browser ask for this one.
  copyFileSync(FAVICON, `${outDir}/favicon.ico`);
  return {
    css: emit('discovery', 'css', Buffer.from(css)),
    share: picture('share'),
    tab: picture('tab'),
    touch: picture('touch'),
    logo: picture('logo'),
    hero: picture('hero'),
    characters: ['club', 'ninja', 'archer', 'dragon', 'triceratops', 'dino'].map((name) =>
      file(`site-${name}`, `src/assets/home/joueur-${name}.webp`),
    ),
  };
}
