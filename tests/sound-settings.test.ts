import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoundSettings, SOUND_SETTINGS_KEY } from '../src/audio/soundSettings.ts';

const memory = (initial?: string) => {
  const data = new Map<string, string>(
    initial === undefined ? [] : [[SOUND_SETTINGS_KEY, initial]],
  );
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
};

test('sound is off until someone turns it on, and each choice is remembered', () => {
  const storage = memory();
  const settings = createSoundSettings(storage);
  assert.deepEqual([settings.music, settings.effects], [false, false]);
  settings.set({ music: true });
  assert.deepEqual([settings.music, settings.effects], [true, false]);
  assert.equal(storage.data.get(SOUND_SETTINGS_KEY), '10');
  const later = createSoundSettings(storage);
  assert.deepEqual([later.music, later.effects], [true, false]);
  later.set({ music: false, effects: true });
  assert.equal(storage.data.get(SOUND_SETTINGS_KEY), '01');
});

test('unreadable or blocked storage leaves sound off and still works in memory', () => {
  assert.deepEqual(
    [createSoundSettings(memory('oui')).music, createSoundSettings(memory('oui')).effects],
    [false, false],
  );
  const blocked = createSoundSettings({
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  });
  blocked.set({ effects: true });
  assert.deepEqual([blocked.music, blocked.effects], [false, true]);
});
