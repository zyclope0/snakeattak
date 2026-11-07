import { spawn } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
let server;
try {
  if (!process.env.GAME_URL) {
    server = spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        '4179',
        '--strictPort',
      ],
      { stdio: 'inherit' },
    );
    const deadline = Date.now() + 15000;
    while (true) {
      if (server.exitCode !== null) throw new Error('Preview server exited');
      try {
        const response = await fetch('http://127.0.0.1:4179');
        if (response.ok) break;
      } catch {}
      if (Date.now() > deadline) throw new Error('Preview server timeout');
      await setTimeout(100);
    }
    process.env.GAME_URL = 'http://127.0.0.1:4179';
  }
  await import('../tests/browser.mjs');
} finally {
  server?.kill();
}
