/**
 * Addresses of the game's audio files (`src/assets/audio`, licences in `docs/AUDIO-LICENCES.md`).
 * Only addresses: nothing is downloaded before the sound is switched on. This is the one audio
 * module that needs the bundler, so the players in `samples.ts` can be tested without it.
 */
export const audioFileUrls = import.meta.glob<string>('../assets/audio/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
});
