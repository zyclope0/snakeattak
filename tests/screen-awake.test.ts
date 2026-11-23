import test from 'node:test';
import assert from 'node:assert/strict';
import {
  holdsScreen,
  screenKeeper,
  type ScreenScene,
  type ScreenSentinel,
} from '../src/ui/screenAwake.ts';

const playing: ScreenScene = { visible: true, board: true, status: 'fighting', paused: false };
/** Lets the promises of the keeper and of the fake lock settle. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

test('the screen stays on only while a battle plays on a visible board', () => {
  assert.equal(holdsScreen(playing), true);
  for (const status of ['preparing', 'won', 'lost', undefined])
    assert.equal(holdsScreen({ ...playing, status }), false, String(status));
  assert.equal(holdsScreen({ ...playing, visible: false }), false, 'page hidden');
  assert.equal(holdsScreen({ ...playing, board: false }), false, 'home');
  assert.equal(holdsScreen({ ...playing, paused: true }), false, 'pause or window');
});

/** A screen wake lock that answers when the test says so, and counts what it was asked. */
function fakeLock() {
  const answers: { grant: () => Sentinel; refuse: () => void }[] = [];
  const given: Sentinel[] = [];
  type Sentinel = ScreenSentinel & { released: boolean; takeBack: () => void };
  const sentinel = (): Sentinel => {
    const listeners: (() => void)[] = [];
    const made: Sentinel = {
      released: false,
      release: async () => made.takeBack(),
      addEventListener: (_type, listener) => void listeners.push(listener),
      takeBack: () => {
        if (made.released) return;
        made.released = true;
        for (const listener of listeners) listener();
      },
    };
    return made;
  };
  return {
    answers,
    given,
    lock: {
      request: (type: 'screen') => {
        assert.equal(type, 'screen');
        return new Promise<ScreenSentinel>((resolve, reject) =>
          answers.push({
            grant: () => {
              const made = sentinel();
              given.push(made);
              resolve(made);
              return made;
            },
            refuse: () => reject(new DOMException('No', 'NotAllowedError')),
          }),
        );
      },
    },
  };
}

test('one question at a time, however often the board writes its status', async () => {
  const scene = { ...playing };
  const fake = fakeLock();
  const keeper = screenKeeper(() => scene, fake.lock);
  for (let i = 0; i < 5; i++) keeper.sync();
  await settle();
  assert.equal(fake.answers.length, 1);
  const granted = fake.answers[0].grant();
  await settle();
  for (let i = 0; i < 5; i++) keeper.sync();
  await settle();
  assert.equal(fake.answers.length, 1);
  assert.equal(granted.released, false);
  // A pause gives the screen back; the battle that goes on asks for it again.
  scene.paused = true;
  keeper.sync();
  assert.equal(granted.released, true);
  scene.paused = false;
  keeper.sync();
  await settle();
  assert.equal(fake.answers.length, 2);
});

test('nothing is asked outside a battle, and the end of the battle gives the screen back', async () => {
  const scene: ScreenScene = { ...playing, status: 'preparing' };
  const fake = fakeLock();
  const keeper = screenKeeper(() => scene, fake.lock);
  keeper.sync();
  await settle();
  assert.equal(fake.answers.length, 0);
  scene.status = 'fighting';
  keeper.sync();
  await settle();
  const granted = fake.answers[0].grant();
  await settle();
  scene.status = 'won';
  keeper.sync();
  assert.equal(granted.released, true);
});

test('a lock granted after the battle stopped is given back at once', async () => {
  const scene = { ...playing };
  const fake = fakeLock();
  const keeper = screenKeeper(() => scene, fake.lock);
  keeper.sync();
  await settle();
  scene.board = false;
  keeper.sync();
  const late = fake.answers[0].grant();
  await settle();
  assert.equal(late.released, true);
});

test('a refusal is not asked again in a loop, only once the battle has changed', async () => {
  const scene = { ...playing };
  const fake = fakeLock();
  const keeper = screenKeeper(() => scene, fake.lock);
  keeper.sync();
  await settle();
  fake.answers[0].refuse();
  await settle();
  for (let i = 0; i < 5; i++) keeper.sync();
  await settle();
  assert.equal(fake.answers.length, 1);
  scene.status = 'preparing';
  keeper.sync();
  scene.status = 'fighting';
  keeper.sync();
  await settle();
  assert.equal(fake.answers.length, 2);
});

test('a lock Android takes back is asked for again when the page comes back', async () => {
  const scene = { ...playing };
  const fake = fakeLock();
  const keeper = screenKeeper(() => scene, fake.lock);
  keeper.sync();
  await settle();
  fake.answers[0].grant().takeBack();
  keeper.sync();
  await settle();
  assert.equal(fake.answers.length, 1, 'not asked again while nothing changed');
  scene.visible = false;
  keeper.sync();
  scene.visible = true;
  keeper.sync();
  await settle();
  assert.equal(fake.answers.length, 2);
});

test('a WebView that throws instead of answering is a refusal, and stopping gives the screen back', async () => {
  const scene = { ...playing };
  let asked = 0;
  const throwing = screenKeeper(() => scene, {
    request: () => {
      asked++;
      throw new TypeError('wakeLock');
    },
  });
  throwing.sync();
  await settle();
  throwing.sync();
  await settle();
  assert.equal(asked, 1);
  const fake = fakeLock();
  const keeper = screenKeeper(() => scene, fake.lock);
  keeper.sync();
  await settle();
  const granted = fake.answers[0].grant();
  await settle();
  keeper.stop();
  assert.equal(granted.released, true);
  keeper.sync();
  await settle();
  assert.equal(fake.answers.length, 1);
});
