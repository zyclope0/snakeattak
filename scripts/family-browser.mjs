import { createServer } from 'node:https';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { webHeaders, assetCache } from '../deploy/policy.ts';

// QA only: a short-lived local TLS origin, never the production hosting server.
const temporary = await mkdtemp(join(tmpdir(), 'serpents-family-https-'));
let server;
try {
  const key = join(temporary, 'key.pem'),
    cert = join(temporary, 'cert.pem');
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      key,
      '-out',
      cert,
      '-subj',
      '/CN=localhost',
      '-days',
      '1',
      '-addext',
      'subjectAltName=DNS:localhost,IP:127.0.0.1',
    ],
    { stdio: 'ignore' },
  );
  const root = resolve('dist');
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/plain; charset=utf-8',
  };
  server = createServer(
    { key: await readFile(key), cert: await readFile(cert) },
    async (req, res) => {
      try {
        const path = decodeURIComponent(new URL(req.url, 'https://localhost').pathname);
        const file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
        if (!file.startsWith(root + '/')) {
          res.writeHead(403);
          res.end();
          return;
        }
        const bytes = await readFile(file);
        res.writeHead(200, {
          ...webHeaders,
          'Content-Type': types[extname(file)] ?? 'application/octet-stream',
          ...(path.startsWith('/assets/') ? { 'Cache-Control': assetCache } : {}),
        });
        res.end(bytes);
      } catch {
        res.writeHead(404);
        res.end();
      }
    },
  );
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  process.env.FAMILY_WEB_URL = `https://127.0.0.1:${server.address().port}`;
  console.log('Local family TLS fixture ready. Test certificate trusted only by this QA browser.');
  await import('../tests/family-020-browser.mjs');
} finally {
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  await rm(temporary, { recursive: true, force: true });
}
