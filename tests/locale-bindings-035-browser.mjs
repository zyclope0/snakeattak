import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
const base = 'http://127.0.0.1:4461';
let browser;
const server = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4461', '--strictPort'],
  // Nobody reads its output: a full pipe would stall the server.
  { stdio: 'ignore' },
);
try {
  for (let attempt = 0; ; attempt++) {
    try {
      if ((await fetch(base + '/tests/locale-bindings-035.html')).ok) break;
    } catch {}
    if (server.exitCode !== null || attempt > 100)
      throw Error('Isolated locale test server unavailable');
    await delay(100);
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(base + '/tests/locale-bindings-035.html');
  const results = await page.evaluate(async () => {
    const checks = [];
    const check = (name, condition) => {
      checks.push({ name, ok: !!condition });
    };
    const dom = await import('/src/i18n/dom.ts').catch(() => null);
    const canvas = await import('/src/i18n/phaser.ts').catch(() => null);
    check(
      'explicit DOM and canvas adapters exist',
      typeof dom?.setText === 'function' && typeof canvas?.setCanvasText === 'function',
    );
    if (!dom || !canvas) return checks;
    const { setLanguage } = await import('/src/i18n/language.ts');
    await setLanguage('fr');
    const root = document.querySelector('#fixture');
    dom.setMarkup(
      root,
      '<button id="action" title="Massue" aria-label="Choisis un allié."><strong>Massue</strong></button><input value="Massue" placeholder="Choisis un allié."><select><option value="club">Massue</option><option>Médecin</option></select><code>Massue</code><pre>Massue</pre><textarea>Massue</textarea><div data-copy-raw><span>Massue</span></div>',
    );
    const button = root.querySelector('button'),
      strong = root.querySelector('strong'),
      input = root.querySelector('input'),
      select = root.querySelector('select'),
      option = select.options[1];
    const raw = [...root.querySelectorAll('code,pre,textarea,[data-copy-raw]')].map(
      (node) => node.textContent,
    );
    let clicks = 0;
    button.addEventListener('click', () => clicks++);
    button.focus();
    const focused = document.activeElement;
    dom.setTitle(document, 'La Conquête des Serpents');
    await setLanguage('en');
    check(
      'markup translates leaf text and linguistic attributes',
      strong.textContent === 'Clubber' &&
        button.title === 'Clubber' &&
        button.getAttribute('aria-label') === 'Choose an ally.',
    );
    check(
      'language change retains node identities, focus and handlers',
      root.querySelector('strong') === strong && document.activeElement === focused,
    );
    button.click();
    check('click handler survives', clicks === 1);
    check(
      'options retain identity and semantic value',
      select.options[1] === option &&
        option.text === 'Medic' &&
        option.value === 'Médecin' &&
        select.options[0].value === 'club',
    );
    check(
      'user input stays raw while placeholder translates',
      input.value === 'Massue' && input.placeholder === 'Choose an ally.',
    );
    check(
      'code, pre, textarea and raw ancestors stay untouched',
      [...root.querySelectorAll('code,pre,textarea,[data-copy-raw]')].every(
        (node, i) => node.textContent === raw[i],
      ),
    );
    const area = root.querySelector('textarea'),
      rawArea = area.value;
    dom.setAttribute(area, 'aria-label', 'Rapport à copier');
    check(
      'raw report data stays untouched while its accessible label translates',
      area.value === rawArea && area.getAttribute('aria-label') === 'Report to copy',
    );
    check('document title changes', document.title === 'Snake Attack TD');
    dom.bindCopyTree(root);
    const text = document.createElement('p');
    root.append(text);
    dom.setText(text, 'Choisis un allié.');
    const leaf = text.firstChild;
    dom.setText(text, 'Choisis un allié.');
    check('same setText preserves its text node', text.firstChild === leaf);
    const created = dom.createTextNode('Massue');
    root.append(created);
    check('createTextNode projects immediately', created.data === 'Clubber');
    dom.setAttribute(button, 'aria-describedby', 'Massue');
    dom.setAttribute(button, 'data-code', 'Massue');
    dom.setAttribute(input, 'value', 'Massue');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dom.setAttribute(svg, 'viewBox', '0 0 1100 620');
    check(
      'technical SVG attribute names preserve case',
      svg.getAttribute('viewBox') === '0 0 1100 620' && !svg.hasAttribute('viewbox'),
    );
    check(
      'technical attributes and values are raw',
      button.getAttribute('aria-describedby') === 'Massue' &&
        button.dataset.code === 'Massue' &&
        input.value === 'Massue',
    );
    const replaced = document.createElement('div');
    root.append(replaced);
    dom.setText(replaced, 'Massue');
    dom.setMarkup(replaced, '<b>Médecin</b>');
    const bold = replaced.firstChild;
    const explicitRaw = root.querySelector('[data-copy-raw] span');
    dom.setText(explicitRaw, 'Massue');
    dom.setTitle(button, 'Massue');
    await setLanguage('fr');
    check(
      'French restores canonical source after append and repeated tree binding',
      text.textContent === 'Choisis un allié.' &&
        strong.textContent === 'Massue' &&
        created.data === 'Massue',
    );
    check(
      'markup retires a previous owner text binding',
      replaced.firstChild === bold && bold.textContent === 'Médecin',
    );
    check(
      'title and accessible attributes restore canonical source',
      document.title === 'La Conquête des Serpents' &&
        button.title === 'Massue' &&
        button.getAttribute('aria-label') === 'Choisis un allié.',
    );
    await setLanguage('en');
    check(
      'replaced markup remains live without losing its element',
      replaced.firstChild === bold && bold.textContent === 'Medic',
    );
    check('explicit writes under raw ancestors remain raw', explicitRaw.textContent === 'Massue');
    // Minimal event/text contract: production adapter must remain Phaser-runtime-free.
    class TextContract {
      text = '';
      calls = 0;
      listeners = new Map();
      once(event, fn) {
        this.listeners.set(event, fn);
        return this;
      }
      setText(value) {
        this.text = Array.isArray(value) ? value.join('\n') : value;
        this.calls++;
        return this;
      }
      destroy() {
        this.listeners.get('destroy')?.();
      }
    }
    const label = new TextContract();
    check(
      'canvas helper preserves chaining',
      canvas.setCanvasText(label, ['Massue', 'Médecin']) === label &&
        label.text === 'Clubber\nMedic',
    );
    const calls = label.calls;
    canvas.setCanvasText(label, ['Massue', 'Médecin']);
    check('same canvas text avoids a duplicate update', label.calls === calls);
    await setLanguage('fr');
    check('cached canvas labels refresh from canonical arrays', label.text === 'Massue\nMédecin');
    const factory = {
      text(x, y, source, style) {
        const item = new TextContract();
        item.coords = [x, y];
        item.style = style;
        item.setText(source);
        return item;
      },
    };
    const added = canvas.addCanvasText(factory, 12, 34, 'Massue', { fontSize: '10px' });
    check(
      'canvas factory preserves coordinates and styles',
      added.text === 'Massue' && added.coords.join() === '12,34' && added.style.fontSize === '10px',
    );
    label.destroy();
    const atDestroy = label.calls;
    await setLanguage('en');
    check(
      'destroyed canvas text is retired',
      label.calls === atDestroy && label.text === 'Massue\nMédecin' && added.text === 'Clubber',
    );
    added.destroy();
    return checks;
  });
  for (const result of results) assert.ok(result.ok, result.name);
  console.log(
    JSON.stringify(
      { checks: results.length, passed: results.map((result) => result.name) },
      null,
      2,
    ),
  );
} finally {
  // On the CI runner, closing the browser once hung until the job's 30-minute limit, after
  // every check had passed (19 November 2026): the server goes first, and the browser gets
  // ten seconds.
  server.kill();
  await Promise.race([browser?.close(), delay(10_000, null, { ref: false })]);
}
