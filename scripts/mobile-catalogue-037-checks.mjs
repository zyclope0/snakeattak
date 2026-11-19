import { chooseLanguage, showHomePage } from '../tests/browser-entry.mjs';
import { encodeDeparture } from '../src/departures.ts';
import { capricesForMission } from '../src/caprices.ts';
import {
  catalogueView,
  REMOVED_CATALOGUE_CONTROLS,
  revealControl,
} from '../tests/reveal-controls.mjs';
import { readFile, writeFile, rm } from 'node:fs/promises';

/** Controlled browser states use the real session and binders, outside production. */
export async function checkCatalogue({ browser, url, check, reachable, capture, portrait }) {
  const fixture = '.mobile-menus-037-fixture.html';
  await writeFile(
    fixture,
    (await readFile('index.html', 'utf8')).replace(
      '/src/main.ts',
      '/tests/caprices-036-harness.ts',
    ),
  );
  const p = await browser.newPage({ viewport: { width: 780, height: 360 }, hasTouch: true });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  try {
    await p.goto(`${url}/${fixture}?case=friends`);
    await p.waitForFunction(() => !!window.capricesFixture);
    for (const language of ['fr', 'en']) {
      await p.evaluate(() => window.capricesFixture.home());
      await chooseLanguage(p, language);
      await showHomePage(p, 'missions');
      await p.locator('[data-mission-card="sonnette"]').click();
      const retained = await p.evaluate(() => JSON.stringify(window.capricesFixture.session.game));
      const previewRun = JSON.parse(await p.locator('#mission-dialog').getAttribute('data-run'));
      check(
        (await p.locator('[data-preparation="friends"]').isHidden()) &&
          (await p.locator('.preparation-nav button:visible').count()) === 4,
        'normal preparation with one book shows no friends tab ' + language,
      );
      await p.locator('[data-preparation="options"]').click();
      // The code is still made for every departure; the preparation no longer shows it.
      check(
        (await p.locator('#mission-departure-code').inputValue()) ===
          encodeDeparture({ kind: 'mission', run: previewRun }),
        'preview keeps exact departure code ' + language,
      );
      check(
        (await p.locator('.departure-share:visible').count()) === 0 &&
          (await p.locator('#mission-departure-code').isHidden()) &&
          (await p.locator('#mission-departure-copy').isHidden()),
        'preparation hides the departure code ' + language,
      );
      check(
        (await p.locator('#mission-plan').isVisible()) &&
          (await p.locator('#mission-retry').isVisible()) &&
          (await p.locator('#mission-reroll').isVisible()),
        'options keep the plan, the last departure and another departure ' + language,
      );
      await p.locator('#mission-retry').click();
      const retryRun = JSON.parse(await p.locator('#mission-dialog').getAttribute('data-run'));
      const previous = await p.evaluate(() => window.capricesFixture.progress.lastRun('sonnette'));
      check(
        JSON.stringify(retryRun) === JSON.stringify(previous),
        'retry restores exact historical run ' + language,
      );
      await p.locator('[data-preparation="options"]').click();
      const retryCode = await p.locator('#mission-departure-code').inputValue();
      check(
        retryCode === encodeDeparture({ kind: 'mission', run: previous }),
        'historical code unchanged ' + language,
      );
      await p.locator('#mission-reroll').click();
      const rerolled = JSON.parse(await p.locator('#mission-dialog').getAttribute('data-run'));
      check(
        rerolled.balance === previous.balance &&
          rerolled.caprice === previous.caprice &&
          rerolled.rules === previous.rules,
        'reroll retains historical revision and caprice ' + language,
      );
      await p.locator('[data-preparation="caprices"]').click();
      await p.locator('[data-caprice="sonnette-petit"]').click();
      check(
        (await p.locator('#mission-dialog').getAttribute('data-preparation-view')) === 'caprices',
        'selection preserves active preparation view ' + language,
      );
      check(
        (await p.locator('[data-preparation="friends"]').isVisible()) &&
          (await p.locator('.preparation-nav button:visible').count()) === 5,
        'a caprice that limits ally kinds shows the friends tab ' + language,
      );
      await p.locator('[data-preparation="friends"]').click();
      check(
        (await p.locator('[data-preparation="friends"]').getAttribute('aria-pressed')) === 'true' &&
          (await p.locator('.preparation-nav [aria-pressed="true"]').count()) === 1,
        'friends tab is the one pressed ' + language,
      );
      for (const kind of ['ninja', 'medic'])
        await p.locator(`[data-caprice-friend="${kind}"]`).click();
      check(
        await p.locator('[data-caprice-friend="archer"]').isDisabled(),
        'two-kind restriction retained ' + language,
      );
      await p.locator('[data-preparation="summary"]').click();
      const expectedName = capricesForMission('sonnette', 'serpents')[0].name;
      check(
        (await p.locator('#mission-summary-caprice').textContent()) === expectedName,
        'summary protects exact French caprice ' + language,
      );
      check(
        (await p.locator('#mission-summary-caprice').getAttribute('lang')) === 'fr',
        'summary leaf declares French ' + language,
      );
      check(
        /Ninja/.test(await p.locator('#mission-summary-friends').innerText()),
        'summary reflects chosen friends ' + language,
      );
      check(await p.locator('#mission-land').isVisible(), 'summary reflects terrain ' + language);
      // The friends tab leaves while its own view is open: the summary takes over, focus too.
      await p.locator('[data-preparation="friends"]').click();
      await p.locator('[data-preparation="friends"]').focus();
      await p.locator('#mission-normal').evaluate((button) => button.click());
      check(
        (await p.locator('#mission-dialog').getAttribute('data-preparation-view')) === 'summary' &&
          (await p.locator('#mission-summary').isVisible()) &&
          (await p.locator('[data-preparation="summary"]').getAttribute('aria-pressed')) ===
            'true' &&
          (await p.locator('.preparation-nav [aria-pressed="true"]:visible').count()) === 1,
        'a friends view that empties falls back to the summary ' + language,
      );
      check(
        await p
          .locator('[data-preparation="summary"]')
          .evaluate((button) => button === document.activeElement),
        'focus follows to the summary tab ' + language,
      );
      check(
        (await p.locator('[data-preparation="friends"]').isHidden()) &&
          (await p.locator('#mission-friends').isHidden()) &&
          (await p.locator('#mission-summary-friends').isHidden()),
        'normal preparation hides the friends tab, its view and its summary line ' + language,
      );
      check(
        (await p.locator('[data-caprice-friend]:visible').count()) === 0,
        'normal preparation invents no army selection ' + language,
      );
      await p.locator('[data-preparation="options"]').click();
      await p.locator('#mission-retry').click();
      await p.locator('[data-preparation="options"]').click();
      check(
        (await p.locator('#mission-departure-code').inputValue()) === retryCode,
        'browsing keeps same retry code ' + language,
      );
      check(
        (await p.evaluate(() => JSON.stringify(window.capricesFixture.session.game))) === retained,
        'preparation never mutates retained game ' + language,
      );
      await p.locator('#mission-close').click();
    }
    await chooseLanguage(p, 'fr');
    await p.evaluate(() => {
      document.getElementById('home-screen').hidden = true;
      document.getElementById('app').hidden = false;
    });
    await p.evaluate(async () => {
      const { Game } = await import('/src/game.ts');
      const { session, refresh } = window.capricesFixture;
      const game = new Game(2026);
      game.wave = 9;
      game.gold = 10000;
      game.startWave();
      session.useGame(game);
      session.screen = 'battle';
      refresh();
    });
    async function fixedCatalogueCommands(safe = false) {
      const selectors = ['.army-title', '.shop-toolbar', '#shop-ready', '#shop-future'];
      const body = p.locator('.catalog-body');
      await body.evaluate((element) => {
        element.scrollTop = 0;
      });
      const initial = await Promise.all(
        selectors.map((selector) => p.locator('#reinforcements ' + selector).boundingBox()),
      );
      // Since the tabs share the title row (19 November 2026), twenty allies fit without a
      // scroll; the tools, once open, give the body its scroll range.
      for (const expanded of [false, true]) {
        if (expanded) {
          for (const id of ['catalog-tools', 'camp-tools'])
            if (!(await p.locator('#' + id).evaluate((element) => element.open)))
              await p.locator('#' + id + ' > summary').click();
          check(
            await p
              .locator('#camp-tools')
              .evaluate((element) => element.open && element.closest('#catalog-tools').open),
            'both catalogue tool disclosures are expanded',
          );
          check(
            await body.evaluate((element) => element.scrollHeight > element.clientHeight),
            'catalogue has a real body scroll range',
          );
        }
        await body.evaluate((element) => {
          element.scrollTop = element.scrollHeight;
        });
        for (const [index, selector] of selectors.entries()) {
          const box = await p.locator('#reinforcements ' + selector).boundingBox();
          const viewport = p.viewportSize();
          const before = initial[index];
          check(
            box &&
              ['x', 'y', 'width', 'height'].every(
                (key) => Math.abs(box[key] - before[key]) < 0.5,
              ) &&
              box.x >= 0 &&
              box.y >= (safe ? 24 : 0) &&
              box.x + box.width <= viewport.width - (safe ? 32 : 0) &&
              box.y + box.height <= viewport.height - (safe ? 16 : 0),
            `catalogue command fixed and visible after maximum scroll ${selector}, expanded=${expanded}, safe=${safe}`,
          );
        }
      }
      // The tabs are the only way through the catalogue: after the tools have been scrolled
      // to their end, a finger still meets them, and they still change the list.
      for (const id of ['shop-ready', 'shop-future'])
        check(
          await p.locator('#' + id).evaluate((tab) => {
            const r = tab.getBoundingClientRect();
            return tab.contains(
              document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2),
            );
          }),
          `fixed tab stays on top after expanded tools scroll ${id}, safe=${safe}`,
        );
      if (!(await p.locator('#shop-future').isDisabled())) {
        const readyKinds = (await catalogueView(p)).cards.map((card) => card.kind);
        await p.locator('#shop-future').click();
        let view = await catalogueView(p);
        check(
          view.tab.join() === 'shop-future' &&
            view.scrollTop === 0 &&
            view.cards.length === view.future &&
            view.cards.every((card) => card.state === 'locked' && !readyKinds.includes(card.kind)),
          'fixed future tab remains usable after expanded tools scroll',
        );
        await p.locator('#shop-ready').click();
        view = await catalogueView(p);
        check(
          view.tab.join() === 'shop-ready' &&
            view.cards.map((card) => card.kind).join() === readyKinds.join(),
          'fixed ready tab returns after expanded tools scroll',
        );
      }
      await capture(
        p,
        `after-fixed-catalogue-${p.viewportSize().width}-${safe ? 'safe' : 'plain'}`,
      );
      await p.locator('#catalog-tools').evaluate((element) => {
        element.open = false;
      });
      await p.locator('#camp-tools').evaluate((element) => {
        element.open = false;
      });
      await body.evaluate((element) => {
        element.scrollTop = 0;
      });
    }
    const paused = () => p.evaluate(() => window.capricesFixture.session.game.paused);
    const open = () =>
      p.locator('#reinforcements-toggle:visible, #dock-catalogue:visible').first().click();
    check(!(await paused()), 'combat runs before catalogue');
    await open();
    check(await paused(), 'catalogue acquires automatic pause');
    check((await p.locator('#catalog-budget').count()) === 1, 'catalogue exposes available budget');
    check(
      (await p.locator('#catalog-budget').textContent()) === '10000 pièces',
      'catalogue shows current spendable coins',
    );
    check(await p.locator('dialog#reinforcements').isVisible(), 'catalogue is native modal');
    check(
      await p.evaluate(() => {
        const { session } = window.capricesFixture;
        const before = JSON.stringify(session.game);
        session.advance(1000);
        return before === JSON.stringify(session.game);
      }),
      'catalogue freezes exact game state',
    );
    check(
      (await p.locator(REMOVED_CATALOGUE_CONTROLS).count()) === 0,
      'catalogue has no pager and no family list',
    );
    // A late camp on a phone held sideways: the twenty allies on one screen, nothing to
    // turn, nothing to scroll.
    const wholeLateCamp = async (where) => {
      const view = await catalogueView(p);
      const kinds = view.cards.map((card) => card.kind);
      check(
        kinds.length === 20 && new Set(kinds).size === 20 && view.ready === 20,
        'one screen lists all twenty allies exactly ' + where,
      );
      check(
        view.tab.join() === 'shop-ready' &&
          view.future === 0 &&
          (await p.locator('#shop-future').isDisabled()),
        'late camp has only available allies ' + where,
      );
      check(
        view.scrollTop === 0 && view.cards.every((card) => card.inBody),
        `twenty allies whole inside the catalogue body without scrolling ${where}: ` +
          JSON.stringify(view.cards.filter((card) => !card.inBody)),
      );
      check(
        view.cards.every((card) => card.height >= 48 && card.width >= 48),
        `every ally card is a 48 px target ${where}: ` +
          JSON.stringify(view.cards.filter((card) => card.height < 48 || card.width < 48)),
      );
      check(view.columns === 5, 'five columns of allies ' + where);
      check(
        (await p.locator('#shop .unit-card:visible small:visible').count()) === 0,
        'an available card keeps only its name and price ' + where,
      );
    };
    await wholeLateCamp('780x360');
    await p.evaluate(() => {
      const f = window.capricesFixture;
      f.session.game.wave = 0;
      f.refresh();
    });
    const early = await catalogueView(p);
    check(
      early.tab.join() === 'shop-ready' &&
        early.cards.length === early.ready &&
        early.ready < 20 &&
        early.ready + early.future === 20 &&
        early.cards.every((card) => card.state !== 'locked' && card.inBody),
      'list follows the unlocked set when it shrinks: ' + JSON.stringify(early),
    );
    // The other tab starts at its first ally, wherever the body was left.
    for (const id of ['catalog-tools', 'camp-tools'])
      await p.locator('#' + id).evaluate((element) => {
        element.open = true;
      });
    await p.locator('.catalog-body').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    check(
      (await catalogueView(p)).scrollTop > 0,
      'early catalogue body scrolled before tab change',
    );
    await p.locator('#shop-future').click();
    const later = await catalogueView(p);
    check(
      later.tab.join() === 'shop-future' && later.scrollTop === 0,
      'tab change returns to the first ally',
    );
    check(
      later.cards.length === later.future &&
        later.cards.every((card) => card.state === 'locked') &&
        new Set([...early.cards, ...later.cards].map((card) => card.kind)).size === 20,
      'future tab shows at once every ally still to come',
    );
    check(
      (await p.locator('#shop .unit-card:visible small:visible').count()) === later.future,
      'each future card says when it arrives',
    );
    for (const id of ['catalog-tools', 'camp-tools'])
      await p.locator('#' + id).evaluate((element) => {
        element.open = false;
      });
    await p.evaluate(() => {
      const f = window.capricesFixture;
      f.session.game.wave = 9;
      f.refresh();
    });
    // No ally is left to come: the catalogue falls back on the available ones.
    await wholeLateCamp('after unlock refresh');
    check(
      (await p.locator('#catalog-budget').textContent()) === '10000 pièces',
      'browsing both tabs preserves budget',
    );
    const before = await p.evaluate(() => {
      const g = window.capricesFixture.session.game;
      return { gold: g.gold, units: g.units.length };
    });
    await p.locator('#shop [data-kind="club"]').click();
    check(
      !(await p.locator('#reinforcements').isVisible()) && !(await paused()),
      'selection closes and restores running',
    );
    check(
      await p.evaluate((b) => {
        const g = window.capricesFixture.session.game;
        return g.gold === b.gold && g.units.length === b.units;
      }, before),
      'selection spends nothing',
    );
    check(
      (await p.locator('#catalog-budget').textContent()) === '10000 pièces',
      'selection preserves displayed budget',
    );
    check(
      await p.evaluate(() => window.capricesFixture.session.placeSelected(820, 200)),
      'normal placement still recruits',
    );
    check(
      await p.evaluate((b) => window.capricesFixture.session.game.gold < b.gold, before),
      'placement pays existing price',
    );
    await p.locator('#pause').click();
    await open();
    check(
      (await p.locator('#catalog-budget').textContent()) === '9945 pièces',
      'placement updates catalogue budget using existing club price',
    );
    await portrait(p, '#reinforcements', 'catalogue');
    check(await paused(), 'rotation retains manual and catalogue pauses');
    const manualGold = await p.evaluate(() => window.capricesFixture.session.game.gold);
    await p.locator('#shop [data-kind="club"]').click();
    check(
      (await paused()) &&
        (await p.evaluate(() => window.capricesFixture.session.selected === 'club')),
      'manual pause permits harmless catalogue selection',
    );
    check(
      (await p.evaluate(() => window.capricesFixture.session.game.gold)) === manualGold,
      'manual selection spends no gold',
    );
    await open();
    await p.keyboard.press('Escape');
    check(await paused(), 'manual pause survives Escape');
    await p.waitForTimeout(50);
    check(
      await p.evaluate(() =>
        ['reinforcements-toggle', 'dock-catalogue'].includes(document.activeElement.id),
      ),
      'catalogue Escape returns focus to its current trigger',
    );
    await p.locator('#pause').click();
    await open();
    await p.locator('#unit-guide').click();
    await portrait(p, '#unit-dialog', 'nested-guide');
    check(
      await p.locator('#reinforcements').evaluate((d) => d.open),
      'nested rotation retains catalogue',
    );
    check(
      await p.evaluate(
        () => document.querySelector('#orientation-notice').parentElement === document.body,
      ),
      'landscape restores original notice parent',
    );
    check(await paused(), 'nested rotation retains pause stack');
    await p.evaluate(() => document.querySelector('#reinforcements').close());
    check(await paused(), 'catalogue close retains nested guide pause');
    await p.locator('#close-unit-guide').click();
    check(!(await paused()), 'last dialog restores running');
    await open();
    await p.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await p.locator('#reinforcements-close').click();
    check(await paused(), 'background pause survives close');
    await p.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    check(await paused(), 'foreground preserves interrupted state');
    await p.locator('#pause').click();
    await open();
    await p.evaluate(() => {
      document.querySelector('#reinforcements').close();
      // Whichever catalogue button this screen shows: the dock on a phone, the bar elsewhere.
      [...document.querySelectorAll('#dock-catalogue, #reinforcements-toggle')]
        .find((button) => button.getClientRects().length)
        .click();
    });
    await p.waitForTimeout(50);
    check(await paused(), 'queued close after reopen retains new lease');
    for (const [width, height] of [
      [780, 360],
      [812, 375],
      [1280, 800],
      [568, 320],
    ]) {
      await p.setViewportSize({ width, height });
      if (!(await p.locator('#reinforcements').isVisible())) await open();
      for (const id of ['reinforcements-close', 'shop-ready', 'shop-future'])
        await reachable(p, '#' + id);
      if (width >= 780) await wholeLateCamp(`${width}x${height}`);
      else {
        // A very small phone: four columns, and the fifth row comes with the body's scroll.
        const small = await catalogueView(p);
        check(
          small.cards.length === 20 && small.ready === 20 && small.columns === 4,
          'twenty allies listed in four columns after resize',
        );
        check(
          small.cards.every((card) => card.height >= 48 && card.width >= 48),
          'small phone ally cards are 48 px targets',
        );
        check(
          small.cards.filter((card) => card.inBody).length >= 4 && small.scrollRange > 0,
          'small phone shows whole rows and scrolls to the others: ' + JSON.stringify(small),
        );
        check(
          await p
            .locator('#shop .unit-card:visible')
            .last()
            .evaluate((card) => {
              const body = card.closest('.catalog-body');
              body.scrollTop +=
                card.getBoundingClientRect().bottom - body.getBoundingClientRect().bottom;
              const r = card.getBoundingClientRect(),
                frame = body.getBoundingClientRect();
              const reached = r.top >= frame.top - 0.5 && r.bottom <= frame.bottom + 0.5;
              body.scrollTop = 0;
              return reached;
            }),
          'small phone body scroll reaches the last ally whole',
        );
      }
      check(
        await p.locator('#reinforcements').evaluate((d) => d.scrollHeight <= d.clientHeight + 1),
        'catalogue shell has no clipped root overflow',
      );
      if (width === 780 || width === 568) await fixedCatalogueCommands();
      check(
        await p
          .locator('#shop .unit-card:visible .price')
          .evaluateAll((ns) => ns.every((n) => n.getBoundingClientRect().height <= 28)),
        'prices stay compact coin badges',
      );
      check(
        await p.locator('#catalog-budget').evaluate((n) => {
          const b = n.getBoundingClientRect(),
            title = n.closest('.army-title').getBoundingClientRect();
          return (
            b.x >= title.x && b.right <= title.right && b.y >= title.y && b.bottom <= title.bottom
          );
        }),
        'budget fits header without clipping',
      );
      await capture(p, `after-catalogue-${width}x${height}`);
    }
    await p.locator('#reinforcements-close').click();
    await p.evaluate(() => {
      const { session, refresh } = window.capricesFixture;
      session.game.status = 'preparing';
      session.game.wave = 4;
      session.game.base = 50;
      session.game.gold = 500;
      refresh();
    });
    await open();
    await revealControl(p, '#repair');
    const purchases = await p.evaluate(() => window.capricesFixture.session.purchaseCount);
    check(
      await p.locator('#repair').isEnabled(),
      'eligible repair stays usable in paused catalogue',
    );
    await p.locator('#repair').click();
    check(
      await p.evaluate((n) => {
        const { session: s } = window.capricesFixture;
        return (
          !s.game.paused && s.game.gold === 420 && s.game.base === 75 && s.purchaseCount === n + 1
        );
      }, purchases),
      'repair closes then applies exact cost and effect once',
    );
    await open();
    await revealControl(p, '[data-training="force"]');
    check(await p.locator('[data-training="force"]').isEnabled(), 'eligible training stays usable');
    await p.locator('[data-training="force"]').click();
    check(
      await p.evaluate((n) => {
        const s = window.capricesFixture.session;
        return (
          !s.game.paused &&
          s.game.gold === 330 &&
          s.game.campaign.training === 'force' &&
          s.purchaseCount === n + 2
        );
      }, purchases),
      'training closes then charges ninety once',
    );
    await p.locator('#pause').click();
    await open();
    await revealControl(p, '#repair');
    const manual = await p.evaluate(() => JSON.stringify(window.capricesFixture.session.game));
    check(await p.locator('#repair').isDisabled(), 'manual pause blocks repair despite catalogue');
    check(await p.locator('[data-training="guard"]').isDisabled(), 'manual pause blocks training');
    await p.locator('#reinforcements-close').click();
    check(
      (await p.evaluate(() => JSON.stringify(window.capricesFixture.session.game))) === manual,
      'manual close retains exact game state',
    );
    await p.locator('#pause').click();
    await p.evaluate(() => {
      const f = window.capricesFixture;
      f.session.game.startWave();
      f.refresh();
    });
    await open();
    await revealControl(p, '#encourage');
    await p.locator('#encourage').click();
    check(
      await p.evaluate(() => {
        const g = window.capricesFixture.session.game;
        return !g.paused && g.encouragementUsed && g.encouragementRemaining === 8 && g.gold === 330;
      }),
      'encourage closes then applies once without spend',
    );
    await open();
    await revealControl(p, '[data-feast-flavor="sticky"]');
    await p.locator('[data-feast-flavor="sticky"]').click();
    check(
      !(await paused()) &&
        (await p.evaluate(
          () =>
            !window.capricesFixture.session.game.feastUsed &&
            window.capricesFixture.session.selectedFeast === 'sticky',
        )),
      'honey choice closes and spends no pot',
    );
    await open();
    await revealControl(p, '[data-feast-lane="0"]');
    await p.locator('[data-feast-lane="0"]').click();
    check(
      await p.evaluate(() => {
        const g = window.capricesFixture.session.game;
        return (
          !g.paused &&
          g.feastUsed &&
          g.feast.flavor === 'sticky' &&
          g.feast.lane === 0 &&
          g.gold === 330
        );
      }),
      'lane action closes then places exact honey normally',
    );
    await open();
    await revealControl(p, '#reset');
    await p.locator('#reset').click();
    check(
      !(await p.locator('#reinforcements').isVisible()) && (await paused()),
      'restart confirmation replaces catalogue pause',
    );
    await p.locator('#keep-playing').click();
    check(!(await paused()), 'cancel restart restores initial running state');
    await open();
    await revealControl(p, '#reset');
    await p.locator('#reset').click();
    await p.locator('#confirm-restart').click();
    check(
      !(await p.locator('#reinforcements').isVisible()) && !(await paused()),
      'confirmed restart leaves no stale catalogue or lease',
    );
    check(
      await p.evaluate(
        () =>
          window.capricesFixture.session.game.wave === 0 &&
          window.capricesFixture.session.game.gold === 300,
      ),
      'restart keeps existing new-game state',
    );
    await p.evaluate(() => {
      const f = window.capricesFixture;
      f.session.game.status = 'won';
      f.refresh();
    });
    await open();
    await p.locator('#reinforcements-close').click();
    await revealControl(p, '#end-restart');
    await p.locator('#end-restart').click();
    check(
      !(await p.locator('#reinforcements').isVisible()) && !(await paused()),
      'result restart closes catalogue before replacement',
    );
    await p.setViewportSize({ width: 568, height: 320 });
    await p.evaluate(() => {
      for (const [side, value] of Object.entries({ top: 24, right: 32, bottom: 16, left: 0 }))
        document.documentElement.style.setProperty(`--safe-area-inset-${side}`, `${value}px`);
    });
    await open();
    for (const id of ['reinforcements-close', 'unit-guide', 'shop-ready', 'shop-future']) {
      const box = await p.locator('#' + id).boundingBox();
      check(
        box.y >= 24 && box.x + box.width <= 536 && box.y + box.height <= 304,
        'catalogue command inside safe insets ' + id,
      );
    }
    const panelBox = await p.locator('#reinforcements').boundingBox();
    check(
      panelBox.x >= 0 &&
        panelBox.x + panelBox.width <= 536 &&
        panelBox.y >= 24 &&
        panelBox.y + panelBox.height <= 304,
      'full catalogue fits simulated safe areas',
    );
    await fixedCatalogueCommands(true);
    await capture(p, 'after-catalogue-safe-568x320');
    await p.goto(`${url}/${fixture}?case=bank`);
    await p.waitForFunction(() => !!window.capricesFixture);
    await open();
    check(
      (await p.locator('#catalog-budget').textContent()) === '450 à la banque · 50 disponibles',
      'reserve budget distinguishes protected and spendable coins',
    );
    await p.locator('#reinforcements-close').click();
    await p.locator('#pause').click();
    await chooseLanguage(p, 'en');
    await p.locator('#resume-game').click();
    await open();
    check(
      (await p.locator('#catalog-budget').textContent()) === '450 in the bank · 50 available',
      'reserve budget translated in English',
    );
    check(
      (await p.evaluate(() => window.capricesFixture.session.game.gold)) === 500,
      'reading budget never changes bank or gold',
    );
    check(errors.length === 0, JSON.stringify(errors));
  } finally {
    await p.close();
    await rm(fixture, { force: true });
  }
}
