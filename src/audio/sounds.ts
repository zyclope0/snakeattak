import { setText as setDisplayText } from '../i18n/dom.ts';
import { byId } from '../ui/dom.ts';
import { audioFileUrls } from './audioFiles.ts';
import { createGameSounds } from './gameSounds.ts';
import { catalogueOf, createSamples } from './samples.ts';
import { createSignalPlayer, type SoundEngine } from './signalPlayer.ts';
import { BUTTON_PRESSED, SETTING_CHANGED } from './signals.ts';
import { soundSettings, type SoundSettings } from './soundSettings.ts';
import * as TEXT from '../texts/fr/sound.ts';

type Switches = { all: HTMLButtonElement; music: HTMLButtonElement; effects: HTMLButtonElement };
type Choice = Pick<SoundSettings, 'music' | 'effects'>;

/** The synthesizer and the files each have their own output level. */
const SYNTH_VOLUME = 0.17;
const FILES_VOLUME = 0.8;
/** What counts as a gesture for the browser. On touch it is the release, not the press. */
const GESTURES = ['pointerup', 'click', 'keydown'] as const;

const anySound = (choice: Choice) => choice.music || choice.effects;

/**
 * Sounds of the game: local files (`src/assets/audio`, licences in `docs/AUDIO-LICENCES.md`),
 * with the little synthesizer as a fallback while a file is not decoded.
 * Music and effects are set separately (`#settings-dialog`); the choice is remembered.
 * No network call outside the site, no game rule changed.
 *
 * This module ties the sound to the page (switches, gestures, home screen) and returns the
 * listener the board calls on every frame.
 */
export function bindSounds() {
  const switches: Switches = {
    all: byId<HTMLButtonElement>('sound-toggle'),
    music: byId<HTMLButtonElement>('setting-music'),
    effects: byId<HTMLButtonElement>('setting-effects'),
  };
  const homeScreen = byId('home-screen');
  const settings = soundSettings;
  const engine: SoundEngine = {};
  const play = createSignalPlayer(engine, settings);
  // The home screen has no game in progress: its music does not depend on the battle loop.
  const playMenuMusic = () => {
    if (settings.music && !homeScreen.hidden) engine.samples?.music('menu');
  };
  /** Brings the audio engine in line with the settings. To be called from a player's gesture. */
  async function apply() {
    try {
      if (anySound(settings)) {
        const context = engine.context ?? startEngine(engine);
        await context.resume();
        if (settings.music) playMenuMusic();
        else engine.samples?.music(null);
      } else {
        engine.samples?.music(null);
        await engine.context?.suspend();
      }
      showSwitches(switches, settings);
    } catch {
      settings.set({ music: false, effects: false });
      showSwitches(switches, settings, true);
    }
  }
  async function change(next: Partial<Choice>) {
    settings.set(next);
    await apply();
    if (settings.effects) play(SETTING_CHANGED);
  }
  switches.all.onclick = () => {
    const on = !anySound(settings);
    return change({ music: on, effects: on });
  };
  switches.music.onclick = () => change({ music: !settings.music });
  switches.effects.onclick = () => change({ effects: !settings.effects });
  // A remembered choice resumes at the first gesture: the browser refuses sound before. Nothing
  // is left to wake once the sound runs, or once the player has switched everything off.
  if (anySound(settings))
    retryOnEachGesture(apply, () => engine.context?.state === 'running' || !anySound(settings));
  new MutationObserver(playMenuMusic).observe(homeScreen, {
    attributes: true,
    attributeFilter: ['hidden'],
  });
  clickOnEveryButton(switches, settings, play);
  restInBackground(engine, settings);
  showSwitches(switches, settings);
  return createGameSounds({ engine, settings, play, atHome: () => !homeScreen.hidden });
}

/**
 * Builds the engine part by part and returns its context. If the browser refuses half-way,
 * what exists stays in the engine and the error goes to the caller.
 */
function startEngine(engine: SoundEngine) {
  const context = new AudioContext();
  engine.context = context;
  engine.synthOutput = context.createGain();
  engine.synthOutput.gain.value = SYNTH_VOLUME;
  engine.synthOutput.connect(context.destination);
  const filesOutput = context.createGain();
  filesOutput.gain.value = FILES_VOLUME;
  filesOutput.connect(context.destination);
  engine.samples = createSamples(context, filesOutput, catalogueOf(audioFileUrls));
  return context;
}

function showSwitches(switches: Switches, choice: Choice, unavailable = false) {
  const any = anySound(choice);
  showSwitch(switches.all, allSoundsLabel(any, unavailable), any && !unavailable);
  showSwitch(switches.music, choice.music ? TEXT.musiqueActivee : TEXT.musiqueCoupee, choice.music);
  showSwitch(
    switches.effects,
    choice.effects ? TEXT.bruitagesActives : TEXT.bruitagesCoupes,
    choice.effects,
  );
}

function allSoundsLabel(any: boolean, unavailable: boolean) {
  if (unavailable) return TEXT.sonsIndisponibles;
  return any ? TEXT.sonsActives : TEXT.sonsCoupes;
}

function showSwitch(button: HTMLButtonElement, label: string, on: boolean) {
  setDisplayText(button, label);
  button.setAttribute('aria-pressed', String(on));
}

/** Runs `attempt` at every gesture, on any part of the page, until `settled` says so. */
function retryOnEachGesture(attempt: () => Promise<void>, settled: () => boolean) {
  const onGesture = () => {
    void attempt().then(() => {
      if (!settled()) return;
      for (const gesture of GESTURES) removeEventListener(gesture, onGesture, true);
    });
  };
  for (const gesture of GESTURES) addEventListener(gesture, onGesture, true);
}

/** A small click on every button, only when effects are on. The sound switches have their own. */
function clickOnEveryButton(
  switches: Switches,
  settings: Choice,
  play: ReturnType<typeof createSignalPlayer>,
) {
  const ownSwitches: Element[] = Object.values(switches);
  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const pressed = target?.closest('button') ?? target?.closest('summary');
    if (settings.effects && pressed && !ownSwitches.includes(pressed)) play(BUTTON_PRESSED);
  };
  document.addEventListener('click', onClick, true);
}

/** In the background the sound goes quiet; on return it resumes by itself, settings untouched. */
function restInBackground(engine: SoundEngine, settings: Choice) {
  document.addEventListener('visibilitychange', () => {
    const { context } = engine;
    if (!context) return;
    engine.samples?.hold(document.hidden);
    if (document.hidden) void context.suspend().catch(() => {});
    else if (anySound(settings)) void context.resume().catch(() => {});
  });
}
