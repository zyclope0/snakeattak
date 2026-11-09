import { setText as setDisplayText } from '../i18n/dom.ts';
import type { Game } from '../game.ts';
import type { Effect } from '../game.ts';
/** Small local synthesizer. No audio files, network calls or changes to game rules. */
export function bindSounds() {
  const button = document.getElementById('sound-toggle') as HTMLButtonElement;
  let context: AudioContext | undefined,
    master: GainNode | undefined,
    enabled = false,
    voices = 0,
    lastAt = -1;
  let observed: Game | undefined,
    wave = 0,
    hatched = 0,
    status: Game['status'] = 'preparing',
    feast: Game['feast'] = null;
  let heard = new WeakSet<Effect>();
  let kingSeen = false;
  function label() {
    setDisplayText(button, enabled ? '♪ Sons activés' : '♪ Sons coupés');
    button.setAttribute('aria-pressed', String(enabled));
  }
  function tone(
    from: number,
    to: number,
    duration: number,
    type: OscillatorType = 'sine',
    delay = 0,
  ) {
    if (!context || !master || !enabled || context.state !== 'running' || voices >= 6) return;
    const start = context.currentTime + delay,
      osc = context.createOscillator(),
      gain = context.createGain();
    voices++;
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.16, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
    osc.onended = () => {
      voices--;
      osc.disconnect();
      gain.disconnect();
    };
  }
  button.onclick = async () => {
    try {
      if (enabled) {
        enabled = false;
        await context?.suspend();
      } else {
        if (!context) {
          context = new AudioContext();
          master = context.createGain();
          master.gain.value = 0.17;
          master.connect(context.destination);
        }
        await context.resume();
        enabled = true;
        tone(520, 720, 0.12);
      }
      label();
    } catch {
      enabled = false;
      setDisplayText(button, 'Sons indisponibles');
      button.setAttribute('aria-pressed', 'false');
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && enabled) {
      enabled = false;
      void context?.suspend().catch(() => {});
      label();
    }
  });
  label();
  return (game: Game) => {
    if (observed !== game) {
      observed = game;
      wave = game.wave;
      hatched = game.hatched;
      status = game.status;
      feast = game.feast;
      heard = new WeakSet();
      kingSeen = false;
    }
    const king = game.enemies.some((e) => e.boss && e.hp > 0);
    if (enabled && !game.paused) {
      if (game.status === 'won' && status !== 'won') {
        [523, 659, 784].forEach((pitch, i) => tone(pitch, pitch, 0.22, 'triangle', i * 0.15));
      } else if (game.status === 'lost' && status !== 'lost') {
        tone(240, 90, 0.6, 'triangle');
      } else if (king && !kingSeen) {
        tone(130, 90, 0.45, 'triangle');
        tone(195, 260, 0.4, 'triangle', 0.22);
      } else if (game.wave !== wave) {
        tone(390, 520, 0.16, 'triangle');
        tone(520, 650, 0.2, 'triangle', 0.15);
      } else if (game.hatched > hatched) {
        tone(260, 90, 0.15, 'square');
      } else if (game.feast && game.feast !== feast) {
        tone(600, 950, 0.15);
        tone(950, 750, 0.13, 'sine', 0.12);
      } else if (context && context.currentTime - lastAt > 0.09) {
        const fresh = game.effects.find((e) => !heard.has(e));
        if (fresh) {
          lastAt = context.currentTime;
          if (fresh.kind === 'block') tone(530, 340, 0.09, 'triangle');
          else if (
            fresh.kind === 'hit' &&
            game.units.find((u) => u.id === fresh.sourceId)?.kind === 'dino'
          )
            tone(120, 55, 0.22, 'triangle');
          else if (fresh.kind === 'honey') tone(700, 1000, 0.1);
          else if (fresh.kind === 'shell') tone(95, 30, 0.25, 'triangle');
          else if (fresh.kind === 'heal') tone(720, 980, 0.13);
          else if (fresh.kind === 'fire') tone(220, 65, 0.2, 'sawtooth');
          else if (fresh.kind === 'arrow') tone(440, 180, 0.08, 'triangle');
          else if (fresh.kind === 'gold') tone(980, 1180, 0.08);
          else tone(160, 65, 0.07, 'triangle');
        }
      }
    }
    for (const e of game.effects) heard.add(e);
    kingSeen = king;
    wave = game.wave;
    hatched = game.hatched;
    status = game.status;
    feast = game.feast;
  };
}
