import { copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { webHeaders, legacyPolicy, assetCache, hostHeadersFile } from './deploy/policy.ts';

export default defineConfig(({ mode }) => {
  const portable = mode === 'portable';
  const outDir = portable ? 'dist-portable' : 'dist';
  const appVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
    .version as string;
  return {
    base: './',
    publicDir: false,
    plugins: [
      ...(portable ? [viteSingleFile()] : []),
      {
        name: 'distribution-documents',
        transformIndexHtml(html) {
          // Keep the editable HTML readable without shipping its indentation.
          return html.replaceAll('__APP_VERSION__', appVersion).replace(/^[ \t]+/gm, '');
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
          if (!portable) writeFileSync(`${outDir}/_headers`, hostHeadersFile());
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
            rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } },
          }),
    },
  };
});
