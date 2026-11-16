import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import type { DiscoveryAssets } from './discovery.ts';

/** Local, licensed images and fonts already used by the game, never a third-party CDN. */
export function writeDiscoveryAssets(outDir: string): DiscoveryAssets {
  mkdirSync(`${outDir}/assets`, { recursive: true });
  const emit = (name: string, extension: string, bytes: Buffer): string => {
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    const path = `/assets/${name}-${hash}.${extension}`;
    writeFileSync(outDir + path, bytes);
    return path;
  };
  const file = (name: string, path: string) =>
    emit(name, path.split('.').at(-1)!, readFileSync(path));
  const heading = file('site-heading', 'src/assets/fonts/fredoka-latin.woff2');
  const body = file('site-body', 'src/assets/fonts/nunitosans-latin.woff2');
  const css = readFileSync('deploy/discovery.css', 'utf8')
    .replaceAll('__HEADING_FONT__', heading)
    .replaceAll('__BODY_FONT__', body);
  const icon = file('site-icon', 'resources/android-icon/icon-512.png');
  return {
    css: emit('discovery', 'css', Buffer.from(css)),
    icon,
    hero: icon,
    characters: ['club', 'ninja', 'archer', 'dragon', 'triceratops', 'dino'].map((name) =>
      file(`site-${name}`, `src/assets/home/joueur-${name}.webp`),
    ),
  };
}
