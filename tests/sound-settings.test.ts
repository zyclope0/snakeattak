import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoundSettings } from '../src/audio/soundSettings.ts';
import { SOUND_SETTINGS_KEY } from '../src/storageKeys.ts';

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

test('sound starts on, like mobile games, and each choice is remembered', () => {
  const storage = memory();
  const settings = createSoundSettings(storage);
  assert.deepEqual([settings.music, settings.effects], [true, true]);
  settings.set({ effects: false });
  assert.deepEqual([settings.music, settings.effects], [true, false]);
  assert.equal(storage.data.get(SOUND_SETTINGS_KEY), '10');
  const later = createSoundSettings(storage);
  assert.deepEqual([later.music, later.effects], [true, false]);
  later.set({ music: false, effects: true });
  assert.equal(storage.data.get(SOUND_SETTINGS_KEY), '01');
});

test('a saved silence is respected; unreadable or blocked storage keeps the starting choice', () => {
  const silent = createSoundSettings(memory('00'));
  assert.deepEqual([silent.music, silent.effects], [false, false]);
  assert.deepEqual(
    [createSoundSettings(memory('oui')).music, createSoundSettings(memory('oui')).effects],
    [true, true],
  );
  const blocked = createSoundSettings({
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  });
  blocked.set({ music: false });
  assert.deepEqual([blocked.music, blocked.effects], [false, true]);
});
