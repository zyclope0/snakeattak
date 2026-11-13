import { setAttribute, setText } from '../i18n/dom.ts';
import { HELP_CLOSE, HELP_TOPICS, type HelpTopicId } from './helpTopics.ts';
import './helpBubble.css';

let dialog: HTMLDialogElement | undefined;
let opener: HTMLElement | null = null;
let waiting = false;
let closed: () => void = () => {};

/**
 * La bulle d'aide : une petite fenêtre construite ici, pour ne pas alourdir la page de
 * démarrage. Il n'y en a qu'une ; elle s'ouvre par-dessus la fenêtre déjà ouverte (la
 * préparation de mission, par exemple) sans la fermer. Elle ne touche jamais à la pause
 * du jeu.
 */
function helpBubble() {
  if (dialog) return dialog;
  const made = document.createElement('dialog');
  made.id = 'help-bubble';
  made.className = 'help-bubble';
  made.setAttribute('aria-labelledby', 'help-bubble-title');
  made.setAttribute('aria-describedby', 'help-bubble-text');
  const title = document.createElement('h2');
  title.id = 'help-bubble-title';
  const text = document.createElement('div');
  text.id = 'help-bubble-text';
  const close = document.createElement('button');
  close.id = 'help-bubble-close';
  close.type = 'button';
  close.className = 'primary';
  setText(close, HELP_CLOSE);
  const settle = () => {
    // Échap ferme la fenêtre puis annonce `close` ; le bouton passe ici tout de suite, et
    // l'annonce qui suit ne compte pas une seconde fois.
    if (made.open || !waiting) return;
    waiting = false;
    const back = opener;
    opener = null;
    if (back?.isConnected) back.focus({ preventScroll: true });
    closed();
  };
  close.onclick = () => {
    made.close();
    settle();
  };
  made.addEventListener('close', settle);
  made.append(title, text, close);
  document.body.append(made);
  dialog = made;
  return made;
}

/** Ouvre la bulle sur un sujet ; à la fermeture, le focus revient au « ? » touché. */
function openHelp(topic: HelpTopicId, from: HTMLElement | null = null) {
  const panel = helpBubble();
  const help = HELP_TOPICS[topic];
  panel.dataset.help = topic;
  setText(panel.querySelector('#help-bubble-title')!, help.title);
  // Le conteneur de texte seul est vidé : l'avis « tourne ton téléphone » peut loger ici.
  panel.querySelector('#help-bubble-text')!.replaceChildren(
    ...help.text.map((paragraph) => {
      const p = document.createElement('p');
      setText(p, paragraph);
      return p;
    }),
  );
  // Une seule bulle : déjà ouverte, elle change de sujet et garde son premier « ? ».
  if (panel.open) return;
  opener = from;
  waiting = true;
  panel.showModal();
}

/** Un petit « ? » rond à toucher : cible de 48 px, nom lisible par un lecteur d'écran. */
export function helpPoint(topic: HelpTopicId) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'help-point';
  button.dataset.help = topic;
  button.setAttribute('aria-haspopup', 'dialog');
  setAttribute(button, 'aria-label', HELP_TOPICS[topic].label);
  const mark = document.createElement('span');
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = '?';
  button.append(mark);
  button.onclick = () => openHelp(topic, button);
  return button;
}

/** Comme les réglages : à la fermeture, l'écran du dessous se redessine. */
export function bindHelpBubble(refresh: () => void) {
  closed = refresh;
}
