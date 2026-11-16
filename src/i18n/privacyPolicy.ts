import { SITE_HOST } from '../site.ts';
import type { Language } from './language.ts';

/**
 * The privacy policy, in the two languages its publisher approved. This file is the one
 * source of the public page (deploy/privacyPage.ts) and of the window of the application
 * (ui/privacy): they cannot drift apart.
 *
 * The words are legal commitments, taken as they were published on 14 November 2026
 * (tests/fixtures/confidentialite-publiee-2026-11-14.html, which a test compares them to),
 * with the website section approved that day and the optional Web support section
 * approved in both languages on 16 November 2026.
 * They are not rewritten, shortened or translated here: a change is a decision of the
 * publisher, made in both languages, with a new date. The policy speaks to parents and
 * says « vous »; the rest of the game says « tu ».
 */

/** A run of text: plain, in bold, or a link. */
export type PolicyPart = string | { b: string } | { a: string; href: string };
export type PolicySection = { heading: string; paragraphs: PolicyPart[][] };
export type PolicyText = {
  title: string;
  /** The version of the application the policy describes, and who publishes it. */
  scope: PolicyPart[];
  /** When the words last changed, written out in their language. */
  updated: string;
  /** The words of the link to the public page. */
  publicLink: string;
  sections: PolicySection[];
};

/**
 * The application the policy describes. A test holds these to package.json and to the
 * Android build: a new build is a moment to read the policy again.
 */
export const POLICY_APP = { version: '0.38.0', build: 62 };

/**
 * The section about the website, added by the publisher on 14 November 2026 when the site
 * moved to its own address: what the host records. It is the only part of the policy that
 * was not on the page first published.
 */
export const WEBSITE_HEADING = { fr: 'Site web', en: 'Website' } as const;

export const PRIVACY_POLICY: Readonly<Record<Language, PolicyText>> = {
  fr: {
    title: 'Politique de confidentialité de La Conquête des Serpents / Snake Attack TD',
    scope: [
      { b: `Application Android ${POLICY_APP.version}, build ${POLICY_APP.build}` },
      ' · Éditeur ',
      { b: 'zyclope' },
    ],
    updated: 'Mise à jour : 16 novembre 2026',
    publicLink: `Lire cette politique sur ${SITE_HOST}`,
    sections: [
      {
        heading: 'Données de jeu sur votre appareil',
        paragraphs: [
          [
            'Vous pouvez jouer sans créer de compte et sans connexion Internet pour les parties. Le jeu permet de créer jusqu’à quatre profils locaux sur le même appareil. Chaque profil peut avoir un personnage et un surnom facultatif. La progression, les parties sauvegardées, les autocollants, les favoris et les réglages restent sur l’appareil. zyclope ne reçoit pas ces données par l’application. Cette version ne contient ni publicité, ni achat intégré, ni outil de mesure d’audience ajouté par l’éditeur.',
          ],
          [
            'Le jeu garde ces informations pour reprendre la partie et retrouver les réglages. Lorsqu’il existe plusieurs profils, vous pouvez supprimer un profil dans l’espace « Pour les parents ». Le dernier profil ne peut pas être supprimé depuis ce menu. Pour effacer toutes les données du jeu, utilisez les réglages Android. La désinstallation peut aussi supprimer les données locales. Ces actions ne suppriment pas les fichiers déjà exportés ni les copies conservées ailleurs.',
          ],
        ],
      },
      {
        heading: 'Export volontaire d’une sauvegarde',
        paragraphs: [
          [
            'L’espace « Pour les parents » permet d’exporter et de réimporter une sauvegarde de l’aventure du joueur actif. Le fichier peut contenir l’état de la partie, la progression, les autocollants et les noms des anciens carnets conservés. Un fichier exporté peut donc contenir un prénom précédemment saisi pour nommer un carnet. Si vous choisissez de conserver ou de transmettre ce fichier, vous décidez où il est stocké et qui le reçoit. zyclope ne le reçoit pas automatiquement. Vous pouvez supprimer les copies conservées à l’endroit où vous les avez enregistrées.',
          ],
          [
            'Le voyage enregistre aussi l’itinéraire, les étapes terminées et les bonus sur l’appareil, pour chaque joueur. Le fichier de sauvegarde familiale ne contient pas le voyage. Le code du Voyage contient la graine qui détermine la configuration du Voyage, la version de ses règles et des caractères de contrôle. Une autre personne qui saisit le code obtient le même itinéraire, les mêmes caprices et les mêmes propositions de bonus. Le code ne transmet ni le profil, ni le surnom, ni la progression, ni les bonus choisis du joueur. Vous pouvez communiquer ce code vous-même. Le jeu ne le transmet pas à zyclope.',
          ],
        ],
      },
      {
        heading: 'Google Play',
        paragraphs: [
          [
            'Google Play gère le téléchargement et les mises à jour. Google Play applique aussi un contrôle de la provenance de l’installation. Ce contrôle peut demander ponctuellement une connexion si le Play Store est resté longtemps hors ligne. Les traitements effectués par Google dans le cadre de ses services sont décrits dans la ',
            {
              a: 'politique de confidentialité de Google',
              href: 'https://policies.google.com/privacy?hl=fr',
            },
            '.',
          ],
        ],
      },
      {
        heading: WEBSITE_HEADING.fr,
        paragraphs: [
          [
            `Le site ${SITE_HOST} est hébergé par Infomaniak, en Suisse. Comme tout serveur Web, l’hébergeur enregistre dans des journaux techniques l’adresse IP, la date, la page demandée et le navigateur des visiteurs, pour faire fonctionner et protéger le service. Ces journaux sont conservés quelques jours par l’hébergeur. zyclope ne les utilise pas pour suivre les visiteurs et le site ne dépose aucun cookie.`,
          ],
        ],
      },
      {
        heading: 'Soutien facultatif sur le site Web',
        paragraphs: [
          [
            "Le site propose aux adultes un soutien ponctuel et facultatif via un lien vers PayPal. Ce soutien n'accorde aucun avantage dans le jeu. PayPal traite le paiement sur son propre site, selon sa ",
            {
              a: 'politique de confidentialité',
              href: 'https://www.paypal.com/ch/legalhub/paypal/privacy-full',
            },
            ". Aucun numéro de carte ni identifiant de connexion PayPal n'est reçu par le site du jeu.",
          ],
          [
            "PayPal peut communiquer à zyclope le nom, l'adresse e-mail et les détails de la transaction, notamment son montant, sa date et sa référence. Ces informations servent uniquement au suivi du soutien, aux éventuelles réclamations et aux obligations comptables et fiscales applicables. Elles ne sont pas associées aux profils des enfants et ne sont pas utilisées pour envoyer de publicité.",
          ],
          [
            "Les copies détenues par zyclope sont conservées le temps nécessaire au traitement de la transaction et d'une éventuelle réclamation, puis supprimées, sauf les pièces qui doivent être conservées pour respecter une obligation légale. Pour les pièces comptables soumises à cette obligation en Suisse, la durée est de dix ans à compter de la fin de l'exercice concerné. PayPal applique ses propres durées de conservation aux données qu'il détient.",
          ],
        ],
      },
      {
        heading: 'Responsable du traitement et contact',
        paragraphs: [
          [
            'Le responsable du traitement est ',
            { b: 'Yannick Malgorn' },
            ', qui édite le jeu à titre personnel sous le nom ',
            { b: 'zyclope' },
            '.',
          ],
          [
            'Les parents et les joueurs peuvent écrire à ',
            { b: 'sulegnasdev@gmail.com' },
            ' pour toute question sur la confidentialité ou pour demander l’accès à leurs informations, leur rectification ou leur suppression. Si vous nous écrivez, zyclope utilise votre adresse et le contenu de votre message pour répondre et assurer le suivi de votre demande. Évitez d’inclure le nom de votre enfant ou de joindre une sauvegarde dans votre premier message.',
          ],
          [
            'Nous conservons les e-mails d’assistance pendant le traitement de la demande, puis pendant 90 jours à compter de sa clôture pour pouvoir reprendre le suivi si nécessaire. Passé ce délai, nous les supprimons, sauf obligation légale de les conserver plus longtemps.',
          ],
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy for Snake Attack TD / La Conquête des Serpents',
    scope: [
      { b: `Android app ${POLICY_APP.version}, build ${POLICY_APP.build}` },
      ' · Publisher ',
      { b: 'zyclope' },
    ],
    updated: 'Last updated: November 16, 2026',
    publicLink: `Read this policy on ${SITE_HOST}`,
    sections: [
      {
        heading: 'Game data on your device',
        paragraphs: [
          [
            'You can play offline without creating a player account. The game supports up to four local player profiles on one device. Each profile can have a character and an optional nickname. Progress, saved games, stickers, favorites, and settings stay on the device. The app does not send this data to zyclope. This version contains no ads, in-app purchases, or publisher-added analytics.',
          ],
          [
            'The game keeps this information so you can resume playing and keep your settings. If there is more than one profile, you can delete a profile in the “For parents” area. The last profile cannot be deleted from that menu. To erase all game data, use Android settings. Uninstalling the app may also remove local data. These actions do not delete files you have already exported or copies kept elsewhere.',
          ],
        ],
      },
      {
        heading: 'Exporting a save at your request',
        paragraphs: [
          [
            "From the “For parents” area, you can export and import a save file for the current player's adventure. The file may include saved game state, progress, stickers, and the names of older sticker albums that have been kept. An exported file may therefore contain a first name previously entered as an album name. If you keep or share the file, you choose where it is stored and who receives it. zyclope does not receive it automatically. You can delete copies from the location where you saved them.",
          ],
          [
            'The Voyage also stores the route, completed stages, and earned bonuses on the device for each player. The family save file does not contain voyage data. A voyage code contains the seed that determines the voyage setup, the version of its rules, and check characters. Anyone who enters the code gets the same route, challenges, and bonus offers. The code does not transmit the player’s profile, nickname, progress, or chosen bonuses. You can share the code yourself. The game does not send it to zyclope.',
          ],
        ],
      },
      {
        heading: 'Google Play',
        paragraphs: [
          [
            "Google Play handles downloads and updates. Google Play also checks where the app was installed from. This check may occasionally require a connection if the Play Store has been offline for a long time. Google's handling of information through its services is described in the ",
            { a: 'Google Privacy Policy', href: 'https://policies.google.com/privacy?hl=en' },
            '.',
          ],
        ],
      },
      {
        heading: WEBSITE_HEADING.en,
        paragraphs: [
          [
            `The ${SITE_HOST} website is hosted by Infomaniak, in Switzerland. Like any web server, the host records visitors’ IP address, date, requested page, and browser in technical logs, to run and protect the service. The host keeps these logs for a few days. zyclope does not use them to track visitors, and the site sets no cookies.`,
          ],
        ],
      },
      {
        heading: 'Optional support on the website',
        paragraphs: [
          [
            'The website offers adults an optional, one-off way to support the game through a link to PayPal. Contributions provide no in-game benefits. PayPal processes the payment on its own website under its ',
            {
              a: 'privacy policy',
              href: 'https://www.paypal.com/ch/legalhub/paypal/privacy-full',
            },
            ". The game's website does not receive card numbers or PayPal login credentials.",
          ],
          [
            "PayPal may share the contributor's name, email address and transaction details, including the amount, date and reference, with zyclope. This information is used only to manage contributions, handle any claims and meet applicable accounting and tax obligations. It is not linked to children's profiles or used to send advertising.",
          ],
          [
            'Copies held by zyclope are kept for as long as needed to handle the transaction and any claim, then deleted, except for records that must be retained by law. Accounting records subject to this requirement in Switzerland are kept for ten years from the end of the relevant financial year. PayPal applies its own retention periods to the data it holds.',
          ],
        ],
      },
      {
        heading: 'Data controller and contact',
        paragraphs: [
          [
            'The data controller is ',
            { b: 'Yannick Malgorn' },
            ', who publishes the game in a personal capacity under the name ',
            { b: 'zyclope' },
            '.',
          ],
          [
            'Parents and players can email ',
            { b: 'sulegnasdev@gmail.com' },
            ' with privacy questions or to request access to, correction of, or deletion of their information. If you email us, zyclope uses your address and the contents of your message to respond and follow up. Please leave your child’s name and save files out of your first message.',
          ],
          [
            'We keep support emails while handling your request and for 90 days after it is closed, so we can follow up if needed. We then delete them unless the law requires us to keep them for longer.',
          ],
        ],
      },
    ],
  },
};
