import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CAPRICES, CREATOR_CHALLENGES } from '../src/caprices.ts';
import { createMissionRun, MISSIONS } from '../src/missions.ts';
import { createCapriceAlbumsController } from '../src/capriceAlbums.ts';
import { readFamilyBackup, writeFamilyBackup } from '../src/familyBackup.ts';
import { createMissionProgress } from '../src/missionProgress.ts';
import { createCareer } from '../src/progression.ts';
import { decodeDeparture, encodeDeparture } from '../src/departures.ts';
import { albumChoiceShown } from '../src/ui/capriceAlbums.ts';
import { friendsViewHasContent } from '../src/ui/capriceView.ts';
import { availableView, type PreparationView } from '../src/ui/missionPreparation.ts';
import { english } from '../src/i18n/english.ts';

const catalog = [...CAPRICES, ...CREATOR_CHALLENGES];

test('le choix du carnet ne se montre que si la famille en a déjà plusieurs', () => {
  assert.equal(albumChoiceShown(0), false);
  assert.equal(albumChoiceShown(1), false);
  for (let count = 2; count <= 8; count++) assert.equal(albumChoiceShown(count), true);
});

test('une sauvegarde à plusieurs carnets reste lisible et permet encore de changer de carnet', () => {
  const albums = createCapriceAlbumsController();
  albums.rename('child-1', 'Camille');
  albums.add('Lou');
  albums.select('child-1');
  const before = albums.state;
  const raw = writeFamilyBackup(null, createCareer().state, createMissionProgress(), before);
  assert.ok(raw, 'la sauvegarde familiale s’écrit');
  const read = readFamilyBackup(raw);
  assert.ok(read && 'albums' in read && read.albums, 'la sauvegarde familiale se relit');
  const restored = createCapriceAlbumsController();
  assert.equal(restored.replaceState(read.albums), true);
  assert.deepEqual(restored.state, before);
  assert.equal(albumChoiceShown(restored.state.children.length), true);
  assert.equal(restored.select('child-2'), true);
  assert.equal(restored.state.activeId, 'child-2');
  assert.deepEqual(
    restored.state.children.map((child) => child.name),
    ['Camille', 'Lou'],
  );
});

test('l’onglet Copains n’existe que s’il a quelque chose à proposer', () => {
  assert.equal(catalog.length, 36);
  for (const mission of MISSIONS) {
    const normal = createMissionRun(mission.id, 7);
    assert.equal(friendsViewHasContent(normal, 0), false, mission.id);
    assert.equal(friendsViewHasContent(normal, 1), false, mission.id);
    assert.equal(friendsViewHasContent(normal, 2), true, mission.id);
  }
  let limited = 0;
  for (const caprice of catalog) {
    const run = { ...createMissionRun(caprice.missionId, 7), caprice: caprice.id };
    const limits = !!caprice.rules.kinds;
    if (limits) limited++;
    assert.equal(friendsViewHasContent(run, 1), limits, caprice.id);
    assert.equal(friendsViewHasContent(run, 2), true, caprice.id);
  }
  assert.ok(limited > 0 && limited < catalog.length, 'les deux cas existent dans le catalogue');
});

test('une vue Copains vide rend la main au résumé, les autres vues ne bougent pas', () => {
  const views: PreparationView[] = ['summary', 'caprices', 'friends', 'scouting', 'options'];
  for (const view of views) {
    assert.equal(availableView(view, true), view);
    assert.equal(availableView(view, false), view === 'friends' ? 'summary' : view);
  }
});

test('le code de départ est masqué dans la préparation mais reste dans la page des parents', () => {
  const dialog = readFileSync('src/html/mission-dialog.html', 'utf8');
  const block = dialog.match(/<div class="departure-share"([^>]*)>([\s\S]*?)<\/div>\s*<button/);
  assert.ok(block, 'le bloc du code existe toujours');
  assert.match(block[1], /\bhidden\b/, 'le bloc est masqué');
  for (const id of [
    'mission-departure-code',
    'mission-departure-copy',
    'mission-departure-message',
  ])
    assert.ok(block[2].includes(`id="${id}"`), `${id} reste dans la page`);
  for (const id of ['mission-retry', 'mission-plan', 'mission-reroll'])
    assert.ok(!block[2].includes(`id="${id}"`) && dialog.includes(`id="${id}"`), `${id} visible`);
  const home = readFileSync('src/html/home.html', 'utf8');
  const form = home.match(/<form\b[^>]*id="departure-form"[^>]*>/);
  assert.ok(form, 'le formulaire « Retrouver un départ » existe');
  assert.doesNotMatch(form[0], /\bhidden\b/);
  assert.ok(home.includes('id="departure-input"'));
  // Un code reste produit pour chaque départ, et se relit à l'identique.
  const run = { ...createMissionRun('sonnette', 2026), caprice: 'sonnette-petit' };
  const decoded = decodeDeparture(encodeDeparture({ kind: 'mission', run }));
  assert.ok(decoded.ok && decoded.departure.kind === 'mission');
  assert.deepEqual(decoded.departure.run, run);
});

test('le carnet ne propose plus de créer ni de renommer, et ses nouveaux textes sont traduits', () => {
  const sources = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? sources(`${dir}/${entry.name}`)
        : /\.(?:ts|html|css)$/.test(entry.name)
          ? [`${dir}/${entry.name}`]
          : [],
    );
  for (const file of sources('src')) {
    const text = readFileSync(file, 'utf8');
    for (const gone of [
      'caprice-album-manage',
      'caprice-album-add',
      'caprice-album-rename',
      'caprice-album-name',
      'Gérer les carnets',
      'Ajouter un carnet',
      'Mission précédente',
      'Mission suivante →',
    ])
      assert.ok(!text.includes(gone), `${file} contient encore « ${gone} »`);
  }
  const album = readFileSync('src/ui/capriceAlbums.ts', 'utf8');
  for (const kept of ['caprice-album-profile', 'caprice-album-previous', 'caprice-album-next'])
    assert.ok(album.includes(kept), kept);
  assert.equal(
    english['Réussis un caprice pour gagner son autocollant.'],
    'Complete a caprice to earn its sticker.',
  );
  assert.equal(english['← Page précédente'], '← Previous page');
  assert.equal(english['Page suivante →'], 'Next page →');
  for (const french of [
    'Réussis un caprice pour gagner son autocollant.',
    '← Page précédente',
    'Page suivante →',
  ])
    assert.ok(album.includes(`'${french}'`), french);
});
