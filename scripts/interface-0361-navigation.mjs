import { showHomePage } from '../tests/browser-entry.mjs';
import assert from 'node:assert/strict';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createCareer } from '../src/progression.ts';
import { createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { writeFamilyBackup } from '../src/familyBackup.ts';
import { MISSIONS } from '../src/missions.ts';

// Valid controlled progress, used by the real production bootstrap. No QA hook.
export async function navigationChecks({ browser, base, check, shot, errors }) {
  const progress = createMissionProgress();
  for (const mission of MISSIONS) progress.bestStars[mission.id] = 3;
  const albums = createCapriceAlbumsController();
  albums.rename('child-1', 'Mon été');
  const family = writeFamilyBackup(null, createCareer().state, progress, albums.state);
  for (const [width, height, safe = false] of [
    [1280, 800],
    [1366, 768],
    [780, 360],
    [812, 375],
    [568, 320],
    [568, 320, true],
  ]) {
    for (const language of ['fr', 'en']) {
      const tag = `${language}-${width}x${height}${safe ? '-safe' : ''}`;
      const page = await browser.newPage({
        viewport: { width, height },
        hasTouch: width < 1000,
        locale: language,
      });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript(
        ({ family, language }) => {
          localStorage.setItem('conquete-serpents:family:v1', family);
          localStorage.setItem('conquete-serpents:language:v1', language);
        },
        { family, language },
      );
      if (safe)
        await page.addInitScript(() =>
          addEventListener('DOMContentLoaded', () => {
            for (const [side, value] of Object.entries({ top: 12, right: 16, bottom: 8, left: 16 }))
              document.documentElement.style.setProperty('--safe-area-inset-' + side, value + 'px');
          }),
        );
      await page.goto(base);
      await page.locator('#home-screen').waitFor({ state: 'visible' });
      await shot(page, `navigation-home-${tag}`);
      await check(`home destinations and targets ${tag}`, async () => {
        for (const id of ['home-new', 'home-play', 'home-expeditions']) {
          const node = page.locator('#' + id);
          const box = await node.boundingBox();
          assert.ok(box?.height >= 48, `${id} 48px: ${JSON.stringify(box)}`);
        }
        assert.equal(
          await page.locator('#classic-options > summary').textContent(),
          language === 'fr' ? 'Choisir un chapitre' : 'Choose a chapter',
        );
        assert.equal(await page.locator('#home-expeditions').count(), 1);
        assert.match(
          await page.locator('#home-next-mission').textContent(),
          language === 'fr' ? /Rejouer la mission : / : /Replay mission: /,
        );
        assert.equal(await page.locator('.home-footer > span').count(), 1);
      });
      await showHomePage(page, 'home');
      await page.locator('#home-expeditions').click();
      await page.locator('[data-mission-card="refuge"]').click();
      await shot(page, `navigation-preparation-${tag}`);
      await check(`Caprices discoverable and real rows ${tag}`, async () => {
        assert.equal(await page.locator('#mission-caprices-entry').count(), 1, 'top entry exists');
        const entry = page.locator('#mission-caprices-entry');
        const box = await entry.boundingBox();
        const body = await page.locator('.mission-dialog-body').boundingBox();
        assert.ok(
          box.y >= body.y && box.y + box.height <= body.y + body.height,
          'entry fully inside initial body clip',
        );
        assert.ok(box.height >= 48);
        await entry.focus();
        await page.keyboard.press('Enter');
        assert.equal(
          await page.evaluate(() => document.activeElement.id),
          'mission-caprices-title',
        );
        const first = await page.locator('[data-caprice="refuge-petit"]').boundingBox();
        assert.ok(
          first.y >= body.y && first.y + first.height <= body.y + body.height,
          `real first card now visible: ${JSON.stringify({ first, body })}`,
        );
        assert.equal(
          await page
            .locator('#mission-caprices')
            .evaluate(
              (n) =>
                !!(
                  n.compareDocumentPosition(document.querySelector('#mission-parent-options')) &
                  Node.DOCUMENT_POSITION_FOLLOWING
                ),
            ),
          true,
        );
        await shot(page, `navigation-caprice-rows-${tag}`);
        for (const id of ['mission-launch', 'mission-reroll', 'mission-close']) {
          const rect = await page.locator('#' + id).boundingBox();
          assert.ok(rect.height >= 48 && rect.y + rect.height <= height, `${id} reachable`);
        }
      });
      await page.locator('[data-caprice="refuge-createur-petit"]').click();
      await check(`preparation paper select and French identity ${tag}`, async () => {
        const field = page.locator('#mission-caprice-profile');
        await field.scrollIntoViewIfNeeded();
        const style = await field.evaluate((n) => {
          const s = getComputedStyle(n);
          return {
            height: n.getBoundingClientRect().height,
            background: s.backgroundColor,
            radius: s.borderRadius,
            padding: s.paddingLeft,
            gap: getComputedStyle(n.parentElement).gap,
          };
        });
        assert.ok(style.height >= 48);
        assert.notEqual(style.radius, '0px');
        assert.notEqual(style.gap, 'normal');
        assert.equal(
          await page.locator('#caprice-announce').textContent(),
          'Garde des pièces dans la banque !',
        );
        await shot(page, `navigation-caprice-${tag}`);
        return style;
      });
      await page.locator('#mission-close').click();
      await page.locator('#home-caprice-album').click();
      await check(`notebook labeled editable paper fields ${tag}`, async () => {
        assert.equal(
          await page.locator('label[for="caprice-album-name"]').count(),
          1,
          'visible name label exists',
        );
        assert.equal(
          await page.locator('label[for="caprice-album-name"]').textContent(),
          language === 'fr' ? 'Nom du carnet' : 'Sticker book name',
        );
        for (const id of ['caprice-album-name', 'caprice-album-profile']) {
          const style = await page.locator('#' + id).evaluate((n) => ({
            height: n.getBoundingClientRect().height,
            radius: getComputedStyle(n).borderRadius,
          }));
          assert.ok(style.height >= 48);
          assert.notEqual(style.radius, '0px');
        }
        await page.locator('#caprice-album-name').fill('Étoile');
        await page.locator('#caprice-album-add').click();
        assert.equal(
          await page.locator('#caprice-album-profile option:checked').textContent(),
          'Étoile',
        );
        await page.locator('#caprice-album-name').fill('Étoile bleue');
        await page.locator('#caprice-album-rename').click();
        assert.equal(
          await page.locator('#caprice-album-profile option:checked').textContent(),
          'Étoile bleue',
        );
        const icons = await page.locator('.caprice-sticker svg').evaluateAll((nodes) =>
          nodes.map((n) => ({
            type: n.dataset.capriceIcon,
            hidden: n.getAttribute('aria-hidden'),
            shape: n.innerHTML,
          })),
        );
        assert.equal(icons.length, 36);
        assert.ok(new Set(icons.map((i) => i.type)).size >= 14, 'distinct actual catalog types');
        assert.equal(
          new Set(icons.map((i) => i.type)).size,
          new Set(icons.map((i) => i.shape)).size,
          'distinct motifs per type',
        );
        assert.ok(icons.every((i) => i.hidden === 'true'));
        await shot(page, `navigation-notebook-${tag}`);
        const expectedName = language === 'fr' ? 'Nom du carnet' : 'Sticker book name';
        const namedTextbox = page.getByRole('textbox', { name: expectedName, exact: true });
        assert.equal(
          await namedTextbox.count(),
          1,
          'textbox accessible name matches visible label',
        );
        assert.equal(await namedTextbox.getAttribute('id'), 'caprice-album-name');
      });
      await page.locator('#caprice-album-close').click();
      await check(`native family picker and atomic preview ${tag}`, async () => {
        await showHomePage(page, 'parents');
        await page.locator('#home-family').click();
        assert.equal(
          await page.locator('#family-choose-file').count(),
          1,
          'paper file button exists',
        );
        const before = await page.evaluate(() =>
          localStorage.getItem('conquete-serpents:family:v1'),
        );
        const canceled = page.waitForEvent('filechooser');
        await page.locator('#family-choose-file').click();
        await (await canceled).setFiles([]);
        assert.equal(await page.locator('#family-apply').isDisabled(), true);
        assert.equal(
          await page.evaluate(() => localStorage.getItem('conquete-serpents:family:v1')),
          before,
          'empty native selection preserves family',
        );
        const chooser = page.waitForEvent('filechooser');
        await page.locator('#family-choose-file').click();
        await (
          await chooser
        ).setFiles({
          name: 'invalid.json',
          mimeType: 'application/json',
          buffer: Buffer.from('{}'),
        });
        await page.waitForFunction(() =>
          document.querySelector('#family-status').textContent.toLowerCase().includes('inval'),
        );
        assert.equal(await page.locator('#family-apply').isDisabled(), true);
        assert.equal(
          await page.evaluate(() => localStorage.getItem('conquete-serpents:family:v1')),
          before,
        );
        const valid = page.waitForEvent('filechooser');
        await page.locator('#family-choose-file').click();
        await (
          await valid
        ).setFiles({
          name: 'family.json',
          mimeType: 'application/json',
          buffer: Buffer.from(family),
        });
        await page.locator('#family-preview').waitFor({ state: 'visible' });
        assert.equal(await page.locator('#family-file-name').textContent(), 'family.json');
        await page.locator('#family-close').click();
        assert.equal(
          await page.evaluate(() => localStorage.getItem('conquete-serpents:family:v1')),
          before,
          'cancel preview preserves family',
        );
        assert.equal(await page.evaluate(() => document.activeElement.id), 'home-family');
      });
      if (await page.locator('#family-dialog').evaluate((n) => n.open))
        await page.locator('#family-close').click();
      await check(`catalogue full filter and rotation ${tag}`, async () => {
        if (!(await page.locator('#mission-list').evaluate((n) => n.open)))
          await showHomePage(page, 'home');
        await page.locator('#home-expeditions').click();
        await page.locator('[data-mission-card="refuge"]').click();
        await page.locator('#mission-launch').click();
        await page.locator('#app').waitFor({ state: 'visible' });
        await page
          .locator(
            (await page.locator('#dock-catalogue').isVisible())
              ? '#dock-catalogue'
              : '#reinforcements-toggle',
          )
          .click();
        const geometry = await page.locator('#shop-family').evaluate((node) => {
          const style = getComputedStyle(node),
            rect = node.getBoundingClientRect();
          const canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');
          ctx.font = style.font;
          return {
            text: node.selectedOptions[0].textContent,
            width: rect.width,
            textWidth: ctx.measureText(node.selectedOptions[0].textContent).width,
            paddingLeft: parseFloat(style.paddingLeft),
            paddingRight: parseFloat(style.paddingRight),
            right: rect.right,
            height: rect.height,
          };
        });
        assert.equal(geometry.text, language === 'fr' ? 'Tous' : 'All');
        assert.ok(
          geometry.width >= geometry.textWidth + geometry.paddingLeft + geometry.paddingRight + 2,
          'complete option plus native arrow fits',
        );
        assert.ok(geometry.right <= width && geometry.height >= 48, 'filter inside viewport');
        await shot(page, `navigation-catalogue-${tag}`);
        if (width < 1000) {
          await page.setViewportSize({ width: 375, height: 812 });
          assert.equal(await page.locator('#orientation-notice').isVisible(), true);
          await page.setViewportSize({ width, height });
          assert.equal(await page.locator('#orientation-notice').isVisible(), false);
        }
        return geometry;
      });
      await page.close();
    }
  }
  await check('fresh first mission explains and preserves the locked caprice gates', async () => {
    const page = await browser.newPage({
      viewport: { width: 780, height: 360 },
      hasTouch: true,
      locale: 'fr-CH',
    });
    await page.goto(base);
    await showHomePage(page, 'missions');
    await page.locator('#home-play').click();
    const before = await page.locator('#mission-dialog').getAttribute('data-run');
    assert.match(await page.locator('#home-next-mission').textContent(), /Prochaine mission : /);
    assert.match(await page.locator('#mission-caprices-entry').textContent(), /gagne une étoile/);
    await page.locator('#mission-caprices-entry').click();
    assert.equal(await page.locator('[data-caprice]:disabled').count(), 6);
    assert.equal(await page.locator('#mission-dialog').getAttribute('data-run'), before);
    await shot(page, 'navigation-locked-fr-780x360');
    await page.close();
  });
  for (const [languages, stored, expected] of [
    [['fr-CH'], null, 'fr'],
    [['de-CH', 'fr-CH'], null, 'en'],
    [['it-CH', 'fr-CH'], null, 'en'],
    [[], null, 'en'],
    [['de-CH'], 'fr', 'fr'],
    [['fr-CH'], 'en', 'en'],
  ]) {
    await check(`cold primary language ${JSON.stringify({ languages, stored })}`, async () => {
      const page = await browser.newPage({ viewport: { width: 780, height: 360 } });
      await page.addInitScript(
        ({ languages, stored }) => {
          Object.defineProperty(navigator, 'languages', { get: () => languages });
          if (stored) localStorage.setItem('conquete-serpents:language:v1', stored);
        },
        { languages, stored },
      );
      await page.goto(base);
      await page.locator('#home-screen').waitFor({ state: 'visible' });
      assert.equal(
        await page.locator('.home-header [data-language-picker]').inputValue(),
        expected,
      );
      await page.close();
    });
  }
}
