import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.ts';
import { createMissionRun } from '../src/missions.ts';
import { CAPRICES, CREATOR_CHALLENGES } from '../src/caprices.ts';
import { capriceRows, canLaunchCaprice, friendChoices } from '../src/ui/capriceView.ts';
import { availableGold, canSpend } from '../src/ui/capriceBudget.ts';
import { shellGeometry } from '../src/render/capriceShell.ts';
import { dockKinds } from '../src/ui/dockModel.ts';
import { campToolModel } from '../src/ui/campToolModel.ts';
import { waveThreats, missionThreats } from '../src/ui/threatPreview.ts';
import { victoryCopy, defeatCopy } from '../src/render/resultCopy.ts';

test('two French challenge rows, exact names, stars and code launch gate', () => {
  const run = createMissionRun('refuge', 36);
  const rows = capriceRows(run, 1);
  assert.deepEqual(
    rows.map((r) => r.title),
    ['Caprices des serpents', 'Le défi du créateur'],
  );
  assert.deepEqual(
    rows[0].cards.map((c) => [c.open, c.stars]),
    [
      [true, 1],
      [false, 2],
      [false, 3],
    ],
  );
  assert.equal(rows[0].cards[0].definition.name, CAPRICES[0].name);
  assert.equal(canLaunchCaprice({ ...run, caprice: 'refuge-grand' }, true, 2), false);
  assert.equal(canLaunchCaprice({ ...run, caprice: 'refuge-grand' }, true, 3), true);
  assert.equal(canLaunchCaprice({ ...run, caprice: 'refuge-grand' }, false, 3), false);
});
test('friends allow empty and partial choices without changing initial clubs', () => {
  const run = { ...createMissionRun('sonnette', 36), caprice: 'sonnette-petit' };
  const g = new Game(36, undefined, run);
  const before = JSON.stringify(g);
  assert.ok(!friendChoices(run).includes('hero'));
  assert.ok(friendChoices(run).includes('club'));
  assert.equal(JSON.stringify(g), before);
  assert.equal(g.units.filter((u) => u.kind === 'club').length, 2);
  assert.ok(g.chooseCapriceKinds(['archer']));
  assert.ok(g.capriceAllows('ninja'));
  assert.ok(dockKinds(g, ['archer', 'ninja', 'dragon']).every((k) => g.capriceAllows(k)));
  const full = new Game(36, undefined, run);
  assert.ok(full.chooseCapriceKinds(['archer', 'ninja']));
  assert.ok(dockKinds(full, ['club', 'dragon']).every((k) => ['archer', 'ninja'].includes(k)));
});
test('bank readouts protect reserve at free, repair and training thresholds; no honey help', () => {
  const g = new Game(36, undefined, {
    ...createMissionRun('carrefour', 36),
    caprice: 'carrefour-createur-petit',
  });
  g.gold = 449;
  assert.equal(canSpend(g, 0), false);
  g.gold = 450;
  assert.equal(canSpend(g, 0), true);
  g.gold = 529;
  g.base = 50;
  assert.equal(campToolModel(g, 'repair').ready, false);
  g.gold = 530;
  assert.equal(campToolModel(g, 'repair').ready, true);
  assert.equal(availableGold(g), 80);
  assert.equal(campToolModel(g, 'hero').ready, false);
  g.gold = 540;
  assert.equal(campToolModel(g, 'hero').ready, true);
  const h = new Game(36, undefined, {
    ...createMissionRun('carrefour', 36),
    caprice: 'carrefour-petit',
  });
  h.status = 'fighting';
  assert.equal(campToolModel(h, 'honey').ready, false);
  assert.match(campToolModel(h, 'honey').status, /caprice/i);
  assert.doesNotMatch(campToolModel(h, 'honey').when, /pot gratuit/i);
  assert.match(campToolModel(g, 'repair').status, /banque|réserve/i);
});
test('caprice kings replace the last planned snake only on final wave without court or writes', () => {
  for (const caprice of CAPRICES.filter((c) => c.rules.king)) {
    const g = new Game(36, undefined, {
      ...createMissionRun(caprice.missionId, 36),
      caprice: caprice.id,
    });
    const before = JSON.stringify(g);
    assert.ok(!waveThreats(g, 1).entries.some((e) => e.kind === 'king'));
    const final = waveThreats(g, g.totalWaves);
    assert.equal(final.entries.find((e) => e.kind === 'king')?.count, 1);
    assert.ok(!final.entries.some((e) => e.kind === 'courtHealer'));
    assert.ok(missionThreats(g.mission!).includes('king'));
    assert.equal(JSON.stringify(g), before);
  }
});
test('shell geometry is larger and pure; result distinguishes caprice victory', () => {
  const g = new Game(36, undefined, {
    ...createMissionRun('refuge', 36),
    caprice: CREATOR_CHALLENGES[1].id,
  });
  const before = JSON.stringify(g);
  const ordinary = shellGeometry(80, false),
    shell = shellGeometry(80, true);
  assert.ok(shell.size > ordinary.size);
  assert.ok(shell.width > 0);
  assert.equal(JSON.stringify(g), before);
  assert.equal(victoryCopy(g).title, 'Caprice réussi !');
});

test('invalid launch choices and locked runs leave retained progress and owner untouched', async () => {
  const { prepareMissionLaunch } = await import('../src/ui/capriceLaunch.ts');
  const { createMissionProgressController } = await import('../src/missionProgress.ts');
  const { createCapriceAlbumsController } = await import('../src/capriceAlbums.ts');
  const progress = createMissionProgressController();
  const albums = createCapriceAlbumsController();
  albums.beginRun();
  const before = JSON.stringify([progress.state, albums.state]);
  assert.equal(
    prepareMissionLaunch(
      { ...createMissionRun('refuge', 36), caprice: 'refuge-grand' },
      [],
      progress,
    ),
    null,
  );
  assert.equal(prepareMissionLaunch(createMissionRun('refuge', 36), ['hero'], progress), null);
  assert.equal(JSON.stringify([progress.state, albums.state]), before);
});

test('all 36 identities and original announcements remain French in English copy', async () => {
  const { setLanguage } = await import('../src/i18n/language.ts');
  const { copy } = await import('../src/i18n/copy.ts');
  await setLanguage('en');
  for (const c of [...CAPRICES, ...CREATOR_CHALLENGES]) {
    assert.equal(copy(c.name), c.name);
    assert.equal(copy(c.announce), c.announce);
  }
  assert.equal(copy('Mission normale'), 'Normal mission');
  assert.equal(copy('Caprice réussi !'), 'Caprice completed!');
  assert.equal(
    defeatCopy(
      new Game(36, undefined, { ...createMissionRun('refuge', 36), caprice: 'refuge-petit' }),
    ).subtitle,
    CAPRICES[0].announce,
  );
  await setLanguage('fr');
});

test('pending friend advice follows engine availability for empty, partial, full and cleared choices', async () => {
  const { missionScouting } = await import('../src/ui/missionScouting.ts');
  const run = { ...createMissionRun('sonnette', 36), caprice: 'sonnette-petit' };
  const original = JSON.stringify(run);
  for (const chosen of [[], ['ninja'], ['ninja', 'medic'], ['ninja'], []] as const) {
    const game = new Game(run.seed, undefined, run);
    if (chosen.length) assert.equal(game.chooseCapriceKinds(chosen), true);
    const preview = missionScouting(run, chosen);
    assert.equal(game.capriceAllows(preview.advice.kind), true, JSON.stringify(chosen));
    assert.equal(preview.advice.kind, chosen.length === 2 ? 'ninja' : 'archer');
    assert.deepEqual(
      preview.flyingKinds,
      (['archer', 'dragon', 'tank'] as const).filter(
        (k) => game.isUnlocked(k) && game.capriceAllows(k),
      ),
    );
    if (chosen.length === 2) assert.doesNotMatch(preview.plan, /archer|dragon|tank/i);
    else assert.match(preview.plan, /Archer|archers/);
    assert.equal(game.units.filter((u) => u.kind === 'club').length, 2);
  }
  assert.equal(JSON.stringify(run), original);
  const normal = createMissionRun('sonnette', 36);
  assert.match(missionScouting(normal).plan, /prévois des archers, un dragon ou un tank/);
});
