import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
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
        '4195',
        '--strictPort',
      ],
      { stdio: 'inherit' },
    );
    for (let i = 0; ; i++) {
      if (server.exitCode !== null) throw Error('Interface preview exited');
      try {
        if ((await fetch('http://127.0.0.1:4195')).ok) break;
      } catch {}
      if (i >= 100) throw Error('Interface preview timeout');
      await delay(100);
    }
    process.env.GAME_URL = 'http://127.0.0.1:4195';
  }
  await import('../tests/medical-persistence-022-browser.mjs');
} finally {
  server?.kill();
}
