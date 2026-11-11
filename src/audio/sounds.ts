import { setText as setDisplayText } from '../i18n/dom.ts';
import type { Game } from '../game.ts';
import type { Effect } from '../game.ts';
import { createSamples, type Cue } from './samples.ts';
/**
 * Sons du jeu : fichiers locaux (`src/assets/audio`, licences dans `docs/AUDIO-LICENCES.md`),
 * avec le petit synthétiseur en repli tant qu'un fichier n'est pas décodé.
 * Aucun appel réseau hors du site, aucune règle de jeu modifiée.
 */
export function bindSounds() {
  const button = document.getElementById('sound-toggle') as HTMLButtonElement;
  const homeScreen = document.getElementById('home-screen')!;
  let context: AudioContext | undefined,
    master: GainNode | undefined,
    samples: ReturnType<typeof createSamples> | undefined,
    enabled = false,
    voices = 0,
    lastAt = -1,
    healAt = -10;
  let observed: Game | undefined,
    wave = 0,
    hatched = 0,
    allies = 0,
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
  /** Joue le fichier du signal ; `fallback` garde l'ancien bip s'il n'est pas prêt. */
  function cue(name: Cue, fallback: () => void, volume = 1) {
    if (!samples?.play(name, volume)) fallback();
  }
  button.onclick = async () => {
    try {
      if (enabled) {
        enabled = false;
        samples?.music(null);
        await context?.suspend();
      } else {
        if (!context) {
          context = new AudioContext();
          master = context.createGain();
          master.gain.value = 0.17;
          master.connect(context.destination);
          const bus = context.createGain();
          bus.gain.value = 0.8;
          bus.connect(context.destination);
          samples = createSamples(context, bus);
        }
        await context.resume();
        enabled = true;
        cue('toggle', () => tone(520, 720, 0.12));
        menuMusic();
      }
      label();
    } catch {
      enabled = false;
      setDisplayText(button, 'Sons indisponibles');
      button.setAttribute('aria-pressed', 'false');
    }
  };
  // L'accueil n'a pas de partie en cours : sa musique ne dépend pas de la boucle du combat.
  const menuMusic = () => {
    if (enabled && !homeScreen.hidden) samples?.music('menu');
  };
  new MutationObserver(menuMusic).observe(homeScreen, {
    attributes: true,
    attributeFilter: ['hidden'],
  });
  // Un petit clic sur chaque bouton, seulement quand le son est activé.
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const pressed = target?.closest('button') ?? target?.closest('summary');
      if (enabled && pressed && pressed !== button) samples?.play('toggle', 0.5);
    },
    true,
  );
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && enabled) {
      enabled = false;
      samples?.music(null);
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
      allies = game.units.length;
      status = game.status;
      feast = game.feast;
      heard = new WeakSet();
      kingSeen = false;
    }
    const king = game.enemies.some((e) => e.boss && e.hp > 0);
    const home = !homeScreen.hidden;
    if (enabled && samples) {
      // Menus : musique d'accueil. En partie : musique calme, ou épique sur la dernière vague,
      // à partir de la vague 8 de l'aventure et dès que le roi à trois têtes arrive.
      const epic =
        game.status === 'fighting' &&
        (king || game.wave >= game.totalWaves || (!game.mission && game.wave >= 8));
      const playing = samples.track();
      if (home) samples.music('menu');
      else if (game.status === 'won' || game.status === 'lost') samples.music(null);
      else if (!epic) samples.music('calm');
      else if (king && !kingSeen) samples.music('king', 'epic');
      else if (playing !== 'king' && playing !== 'epic') samples.music('epic');
      samples.duck(game.paused && !home);
    }
    if (enabled && !game.paused) {
      if (game.status === 'won' && status !== 'won') {
        cue('won', () =>
          [523, 659, 784].forEach((pitch, i) => tone(pitch, pitch, 0.22, 'triangle', i * 0.15)),
        );
      } else if (game.status === 'lost' && status !== 'lost') {
        cue('lost', () => tone(240, 90, 0.6, 'triangle'));
      } else if (king && !kingSeen && !samples) {
        tone(130, 90, 0.45, 'triangle');
        tone(195, 260, 0.4, 'triangle', 0.22);
      } else if (game.status === 'preparing' && status === 'fighting') {
        cue('wave-end', () => tone(520, 780, 0.2, 'triangle'));
      } else if (game.wave !== wave) {
        cue('wave-start', () => {
          tone(390, 520, 0.16, 'triangle');
          tone(520, 650, 0.2, 'triangle', 0.15);
        });
      } else if (game.units.length > allies) {
        samples?.play('place', 0.7);
      } else if (game.hatched > hatched) {
        cue('hatch', () => tone(260, 90, 0.15, 'square'));
      } else if (game.feast && game.feast !== feast) {
        cue('feast', () => {
          tone(600, 950, 0.15);
          tone(950, 750, 0.13, 'sine', 0.12);
        });
      } else if (context && context.currentTime - lastAt > 0.09) {
        const fresh = game.effects.find((e) => !heard.has(e));
        if (fresh) {
          lastAt = context.currentTime;
          const from = fresh.sourceId;
          if (fresh.kind === 'block') cue('block', () => tone(530, 340, 0.09, 'triangle'), 0.6);
          else if (fresh.kind === 'hit' && game.units.find((u) => u.id === from)?.kind === 'dino')
            cue('stomp', () => tone(120, 55, 0.22, 'triangle'), 0.8);
          else if (fresh.kind === 'hit' && game.units.find((u) => u.id === from)?.kind === 'hero')
            cue('sword', () => tone(160, 65, 0.07, 'triangle'), 0.6);
          else if (fresh.kind === 'hit' && game.enemies.some((e) => e.id === from))
            cue('bite', () => tone(160, 65, 0.07, 'triangle'), 0.6);
          else if (fresh.kind === 'honey') cue('honey', () => tone(700, 1000, 0.1));
          else if (fresh.kind === 'shell') cue('shell', () => tone(95, 30, 0.25, 'triangle'));
          else if (fresh.kind === 'heal') {
            // Le son de soin dure près de trois secondes : jamais deux à la fois.
            if (context.currentTime - healAt > 3) {
              healAt = context.currentTime;
              cue('heal', () => tone(720, 980, 0.13), 0.6);
            }
          } else if (fresh.kind === 'fire') cue('fire', () => tone(220, 65, 0.2, 'sawtooth'), 0.7);
          else if (fresh.kind === 'arrow')
            cue('arrow', () => tone(440, 180, 0.08, 'triangle'), 0.6);
          else if (fresh.kind === 'gold') cue('gold', () => tone(980, 1180, 0.08), 0.7);
          else if (fresh.kind === 'poison')
            cue('poison', () => tone(160, 65, 0.07, 'triangle'), 0.6);
          else cue('hit', () => tone(160, 65, 0.07, 'triangle'), 0.5);
        }
      }
    }
    for (const e of game.effects) heard.add(e);
    kingSeen = king;
    wave = game.wave;
    allies = game.units.length;
    hatched = game.hatched;
    status = game.status;
    feast = game.feast;
  };
}
