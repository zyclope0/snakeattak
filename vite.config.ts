import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { execFileSync } from 'node:child_process';
import { buildTarget } from './deploy/buildTargets.ts';
import { makeBuildInfo, readAndroidRelease } from './deploy/buildInfo.ts';
import { viteSingleFile } from 'vite-plugin-singlefile';
import {
  webHeaders,
  legacyPolicy,
  PROTOTYPE_ROBOTS,
  adsGamePagePolicy,
  isGamePage,
  assetCache,
  hostHeadersFile,
  apacheConfig,
  NOT_FOUND_PAGE,
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
  notFoundPageHtml,
} from './deploy/discovery.ts';
import { gamePagePictures, writeDiscoveryAssets } from './deploy/discoveryAssets.ts';
import { adSenseAdsTxt } from './deploy/adsenseVerification.ts';
import { AD_SCRIPT_URL, WEB_AD_DELIVERY } from './src/ui/webAds/contract.ts';

/** The stand-in the recipe answers itself: no request ever leaves the machine. */
const AD_TEST_SCRIPT = './fake-ads.js';

export default defineConfig(({ mode }) => {
  const target = buildTarget(mode, WEB_AD_DELIVERY === 'enabled');
  const { portable, website, outDir } = target;
  const adTest = target.standInAdvertising;
  const webAds = adTest || target.googleAdvertising;
  const appVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
    .version as string;
  const androidRelease = readAndroidRelease(readFileSync('android/app/build.gradle', 'utf8'));
  let commit: string | null = null;
  let dirty = true;
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    dirty = !!execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    /* A source ZIP can build locally, but cannot be packaged as a clean release. */
  }
  const info = makeBuildInfo(target, appVersion, commit, dirty, androidRelease);
  return {
    base: './',
    publicDir: false,
    define: {
      __WEB_ADS__: JSON.stringify(webAds),
      __WEB_AD_SCRIPT__: JSON.stringify(adTest ? AD_TEST_SCRIPT : AD_SCRIPT_URL),
    },
    plugins: [
      ...(portable ? [viteSingleFile()] : []),
      {
        name: 'html-includes',
        // Before Vite reads the page, so included markup has its assets resolved as usual.
        transformIndexHtml: { order: 'pre', handler: (html) => assembleHtml(html) },
      },
      {
        name: 'distribution-documents',
        transformIndexHtml(html, context) {
          // Keep the editable HTML readable without shipping its indentation.
          // A line break before the end of a tag and the slash of an empty element are
          // formatting too: neither changes what the browser builds.
          const page = html
            .replaceAll('__APP_VERSION__', appVersion)
            .replace(/^[ \t]+/gm, '')
            .replace(/\n(\/?>)/g, '$1')
            .replace(/<(img|input|br|meta|link|hr)\b([^>]*?)\s*\/>/g, '<$1$2>');
          // The website dresses the page of the game, and only that one: the pages of the
          // recipes go through here too.
          return website && isGamePage(context.path)
            ? augmentGamePage(page, gamePagePictures())
            : page;
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            for (const [key, value] of Object.entries(webHeaders)) res.setHeader(key, value);
            const path = new URL(req.url ?? '/', 'http://localhost').pathname;
            if (webAds && isGamePage(path))
              res.setHeader('Content-Security-Policy', adsGamePagePolicy);
            if (path.startsWith('/assets/')) res.setHeader('Cache-Control', assetCache);
            if (path.endsWith('/prototype-v4.html')) {
              res.setHeader('Content-Security-Policy', legacyPolicy);
              res.setHeader('X-Robots-Tag', PROTOTYPE_ROBOTS);
            }
            next();
          });
        },
        closeBundle() {
          if (target.name !== 'android')
            copyFileSync('public/prototype-v4.html', `${outDir}/prototype-v4.html`);
          writeFileSync(`${outDir}/build-info.json`, JSON.stringify(info, null, 2) + '\n');
          copyFileSync('public/assets/illustrated/PROVENANCE.md', `${outDir}/asset-provenance.md`);
          copyFileSync('public/FONT-LICENCES.txt', `${outDir}/FONT-LICENCES.txt`);
          if (portable) return;
          if (target.name !== 'android') {
            writeFileSync(`${outDir}/_headers`, hostHeadersFile());
            writeFileSync(`${outDir}/.htaccess`, apacheConfig(webAds));
          }
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
            writeFileSync(`${outDir}/${NOT_FOUND_PAGE}`, notFoundPageHtml(assets));
            writeFileSync(`${outDir}/sitemap.xml`, discoverySitemap());
            writeFileSync(`${outDir}/robots.txt`, discoveryRobots());
            writeFileSync(`${outDir}/ads.txt`, adSenseAdsTxt());
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
