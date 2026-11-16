import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import {
  webHeaders,
  legacyPolicy,
  assetCache,
  hostHeadersFile,
  apacheConfig,
} from './deploy/policy.ts';
import { privacyPageHtml } from './deploy/privacyPage.ts';
import { PRIVACY_FOLDER } from './src/site.ts';
import { assembleHtml } from './deploy/assembleHtml.ts';
import { DISCOVERY_PAGES } from './deploy/discoveryCopy.ts';
import {
  augmentGamePage,
  discoveryPageHtml,
  discoveryRobots,
  discoverySitemap,
} from './deploy/discovery.ts';
import { writeDiscoveryAssets } from './deploy/discoveryAssets.ts';

export default defineConfig(({ mode }) => {
  const portable = mode === 'portable';
  const website = !portable && mode !== 'android';
  const outDir = portable ? 'dist-portable' : mode === 'android' ? 'dist-android' : 'dist';
  const appVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
    .version as string;
  return {
    base: './',
    publicDir: false,
    plugins: [
      ...(portable ? [viteSingleFile()] : []),
      {
        name: 'html-includes',
        // Before Vite reads the page, so included markup has its assets resolved as usual.
        transformIndexHtml: { order: 'pre', handler: (html) => assembleHtml(html) },
      },
      {
        name: 'distribution-documents',
        transformIndexHtml(html) {
          // Keep the editable HTML readable without shipping its indentation.
          const page = html.replaceAll('__APP_VERSION__', appVersion).replace(/^[ \t]+/gm, '');
          return website ? augmentGamePage(page) : page;
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            for (const [key, value] of Object.entries(webHeaders)) res.setHeader(key, value);
            const path = new URL(req.url ?? '/', 'http://localhost').pathname;
            if (path.startsWith('/assets/')) res.setHeader('Cache-Control', assetCache);
            if (path.endsWith('/prototype-v4.html'))
              res.setHeader('Content-Security-Policy', legacyPolicy);
            next();
          });
        },
        closeBundle() {
          copyFileSync('public/prototype-v4.html', `${outDir}/prototype-v4.html`);
          copyFileSync('public/assets/illustrated/PROVENANCE.md', `${outDir}/asset-provenance.md`);
          copyFileSync('public/FONT-LICENCES.txt', `${outDir}/FONT-LICENCES.txt`);
          if (portable) return;
          writeFileSync(`${outDir}/_headers`, hostHeadersFile());
          writeFileSync(`${outDir}/.htaccess`, apacheConfig());
          // The public privacy policy: a page of plain HTML beside the game, from the same
          // source as the window of the application.
          mkdirSync(`${outDir}/${PRIVACY_FOLDER}`, { recursive: true });
          writeFileSync(`${outDir}/${PRIVACY_FOLDER}/index.html`, privacyPageHtml());
          if (website) {
            const assets = writeDiscoveryAssets(outDir);
            for (const page of DISCOVERY_PAGES) {
              mkdirSync(`${outDir}${page.path}`, { recursive: true });
              writeFileSync(`${outDir}${page.path}index.html`, discoveryPageHtml(page, assets));
            }
            writeFileSync(`${outDir}/sitemap.xml`, discoverySitemap());
            writeFileSync(`${outDir}/robots.txt`, discoveryRobots());
          }
        },
      },
    ],
    build: {
      outDir,
      // Phaser is a large, stable engine: cache it independently of game code.
      chunkSizeWarningLimit: 1600,
      ...(portable
        ? {}
        : {
            assetsInlineLimit: 0,
            rollupOptions: {
              output: {
                manualChunks(id) {
                  if (id.includes('/node_modules/phaser/')) return 'phaser';
                  // The first script reads the language key before the rules are loaded: on
                  // its own, this module does not make that script wait for the rules.
                  if (id.endsWith('/src/storageKeys.ts')) return 'keys';
                  // Cache the browser-independent rules separately from the expanding UI.
                  if (
                    /\/src\/(?:engine\/)?[^/]+\.ts$/.test(id) &&
                    !/\/(?:main|bootstrap|art)\.ts$/.test(id)
                  )
                    return 'rules';
                },
              },
            },
          }),
    },
  };
});
