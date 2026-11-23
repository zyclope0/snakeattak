// Outils communs des recettes navigateur (lot 7 du nettoyage, 23 novembre 2026) : le
// navigateur aux options du projet, le serveur de prévisualisation de Vite, les trois tailles
// d'écran contrôlées et les clés de stockage du jeu. Une valeur qui a un sens a un nom et un
// seul lieu : une recette importe ces noms, elle ne retape pas les valeurs.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

// The addresses of a child's saves, by the names the game gives them.
export * from '../../src/storageKeys.ts';

/** The three screens a change is checked on (CLAUDE.md, « Interface »): two phones, a computer. */
export const PHONE = Object.freeze({ width: 780, height: 360 });
export const WIDE_PHONE = Object.freeze({ width: 812, height: 375 });
export const COMPUTER = Object.freeze({ width: 1280, height: 800 });
/** The three, smallest first. */
export const SCREENS = Object.freeze([PHONE, WIDE_PHONE, COMPUTER]);

/** Chromium as every recipe starts it: headless, without the sandbox a container lacks. */
export const launchChromium = (options = {}) =>
  chromium.launch({ headless: true, args: ['--no-sandbox'], ...options });

/** Colours a terminal may receive around the words of a program. */
const COLOURS = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');

/**
 * Serves the built site (`dist/`) with `vite preview` on a fixed `port`, and returns once this
 * very server listens there and answers. Another program may already hold the port (another
 * worktree's recipe): with `--strictPort` ours then stops at once, and the recipe fails loudly
 * with what it said, instead of testing a build that is not its own. `echo` shows what the
 * server prints. `stop()` ends the server.
 */
export async function startPreview({ port, echo = false, timeout = 15000 }) {
  const url = `http://127.0.0.1:${port}`;
  const server = spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const stop = () => server.kill();
  // Vite says where it listens once it does: said by this child, the line proves that the
  // server on the port is ours.
  const listening = `Local:   ${url}/`;
  let said = '';
  let ready = false;
  const ours = new Promise((resolve, reject) => {
    const read = (sink) => (chunk) => {
      if (echo) sink.write(chunk);
      if (ready) return;
      said += chunk.toString().replace(COLOURS, '');
      if (said.includes(listening)) resolve((ready = true));
    };
    server.stdout.on('data', read(process.stdout));
    server.stderr.on('data', read(process.stderr));
    server.once('error', reject);
    server.once('exit', (code, signal) =>
      reject(
        Error(
          `vite preview on port ${port} stopped before serving (${code ?? signal}), ` +
            `port taken or no site built (npm run build)? It said: ${said.trim() || 'nothing'}`,
        ),
      ),
    );
  });
  let timer;
  const late = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(Error(`vite preview on port ${port}: not listening after ${timeout} ms`)),
      timeout,
    );
  });
  try {
    await Promise.race([ours, late]);
    const answer = await fetch(url);
    if (!answer.ok) throw Error(`vite preview on port ${port} answers ${answer.status}`);
  } catch (error) {
    stop();
    throw error;
  } finally {
    clearTimeout(timer);
  }
  return { url, server, stop };
}

/**
 * Runs `test` on the game that `GAME_URL` names; without one, on a preview of the built site
 * on `port`, which `GAME_URL` then names. The server stops however the test ends.
 */
export async function withGameUrl(port, test) {
  let preview;
  try {
    if (!process.env.GAME_URL) {
      preview = await startPreview({ port, echo: true });
      process.env.GAME_URL = preview.url;
    }
    return await test();
  } finally {
    preview?.stop();
  }
}
