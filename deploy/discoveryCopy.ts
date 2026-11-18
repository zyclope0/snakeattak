import { CONTACT_EMAIL, PRIVACY_FOLDER } from '../src/site.ts';
// The words of the game's own buttons, so that a page never names a button that changed.
import * as FR from '../src/texts/fr/page.ts';
import * as EN from '../src/texts/en/page.ts';
import * as ALLY_FR from '../src/texts/fr/allies.ts';
import * as ALLY_EN from '../src/texts/en/allies.ts';
import * as SNAKE_EN from '../src/texts/en/snakes.ts';
import { NEWCOMERS } from '../src/waves.ts';

/** Public editorial copy, independent from the game and its translation catalogue. */
export type DiscoveryKey = 'home' | 'guide' | 'characters' | 'updates' | 'parents';
export type DiscoveryPage = {
  key: DiscoveryKey;
  lang: 'fr' | 'en';
  path: string;
  title: string;
  description: string;
  heading: string;
  lead: string;
  /** A block may end with one link to another page of the site. */
  blocks: readonly { heading: string; text: string; link?: { href: string; label: string } }[];
};

export const DISCOVERY_PAGES: readonly DiscoveryPage[] = [
  {
    key: 'home',
    lang: 'fr',
    path: '/fr/',
    title: 'La Conquête des Serpents — tower defense gratuit pour enfants',
    description:
      'Protège le cristal avec des ninjas, des dinosaures et des bébés dragons. Un jeu de tower defense gratuit pour enfants, à jouer en famille dans le navigateur.',
    heading: 'Un cristal. Trois chemins. Toute une bande de copains.',
    lead: 'Un petit jeu imaginé avec un enfant : prépare tes alliés, surveille les serpents et protège ton cristal dans un monde de pâte à modeler et de papier mâché.',
    blocks: [
      {
        heading: 'Tu prépares, tes alliés agissent',
        text: 'Choisis tes alliés et pose-les dans ton camp. Ils marchent et se battent tout seuls. Les trois chemins se rejoignent : regarde par où les serpents passent, puis pose du miel pour les attirer ou les ralentir.',
      },
      {
        heading: 'Une aventure à ton rythme',
        text: `Six missions t’attendent. Rejoue-les avec un caprice : c’est un défi des serpents. Pars en Voyage : cinq étapes, et des bonus à choisir en chemin. Dans l’« ${FR.aventureClassique} », douze vagues mènent à King Snake, le roi à trois têtes.`,
      },
      {
        heading: 'Un jeu à partager en famille',
        text: 'Les figurines ont l’air faites à la main ; les ninjas, les soigneurs et les petits dinosaures ont chacun leur rôle. Le jeu se joue sans compte, en français ou en anglais : là, il s’appelle Snake Attack TD.',
      },
    ],
  },
  {
    key: 'home',
    lang: 'en',
    path: '/en/',
    title: 'Snake Attack TD — free tower defense game for kids',
    description:
      'Defend the crystal with ninjas, dinosaurs and baby dragons. A free tower defense game for kids and families, played in your browser.',
    heading: 'One crystal. Three paths. A whole team of friends.',
    lead: 'A small game imagined with a child: prepare your allies, watch the snakes and protect your crystal in a world of modelling clay and papier-mâché.',
    blocks: [
      {
        heading: 'You prepare. Your allies take action.',
        text: 'Choose reinforcements and place them in your area. They move and fight on their own. The three lanes connect: watch the weak passages, then use honey to attract or slow the snakes.',
      },
      {
        heading: 'An adventure at your pace',
        text: `Six missions are waiting. Replay them with a caprice: a challenge from the snakes. Set off on The Voyage: five stages, with bonuses to choose along the way. In the “${EN.aventureClassique}”, twelve waves lead to King Snake, the three-headed king.`,
      },
      {
        heading: 'Made to share with your family',
        text: 'The figures look handmade. Ninjas, healers and little dinosaurs each have a role. Play without an account, in English or in French, where the game is called La Conquête des Serpents.',
      },
    ],
  },
  {
    key: 'guide',
    lang: 'fr',
    path: '/fr/comment-jouer/',
    title: 'Comment jouer — La Conquête des Serpents',
    description:
      'Prépare ton camp, recrute des alliés, observe les trois voies et utilise le miel. Les premiers pas dans La Conquête des Serpents.',
    heading: 'Prépare ton camp, puis lance la vague.',
    lead: 'Tes alliés se battent tout seuls. Toi, tu choisis qui poser, et où.',
    blocks: [
      {
        heading: '1. Regarde les dangers',
        text: `Avant la vague, touche « ${FR.dangers} » : tu vois quels serpents arrivent, et quels chemins sont ouverts. Ils n’ont pas tous les mêmes talents : certains sont rapides, certains attaquent de loin, d’autres volent.`,
      },
      {
        heading: '2. Recrute et place tes alliés',
        text: `Touche un allié dans « ${FR.tesFavoris} », ou ouvre « ${FR.tousLesAllies} ». Pose-le dans ton camp quand tu as assez de pièces. Mélange-les : ceux qui tapent de près, les archers et les soigneurs n’arrêtent pas les mêmes serpents.`,
      },
      {
        heading: '3. Surveille les trois chemins',
        text: 'Lance la vague, puis regarde où ton camp tient et où les serpents passent. Tu peux acheter des alliés pendant la bataille. La pause te laisse le temps de regarder ; tes alliés repartent quand tu relances.',
      },
      {
        heading: '4. Reviens jouer autrement',
        text: 'Une victoire ouvre la mission suivante. Un caprice change les règles d’une mission ; le Voyage enchaîne cinq étapes. Sur téléphone, tourne l’écran pour jouer en largeur.',
      },
    ],
  },
  {
    key: 'guide',
    lang: 'en',
    path: '/en/how-to-play/',
    title: 'How to play — Snake Attack TD',
    description:
      'Prepare your camp, recruit allies, watch three lanes and use honey. Your first steps in the Snake Attack TD family defense game.',
    heading: 'Prepare your camp. Then start the wave.',
    lead: 'Your allies fight on their own. You choose who to place, and where.',
    blocks: [
      {
        heading: '1. Check the threats',
        text: `Before a wave, tap “${EN.dangers}”: you see which snakes are coming, and which lanes are open. They have different talents: some are fast, some attack from a distance, and others fly.`,
      },
      {
        heading: '2. Recruit and place your allies',
        text: `Tap an ally in “${EN.tesFavoris}”, or open “${EN.tousLesAllies}”. Place it in your camp when you have enough coins. Mix them: close fighters, archers and healers do not stop the same snakes.`,
      },
      {
        heading: '3. Watch all three paths',
        text: 'Start the wave, then watch where your camp holds and where snakes get through. You can buy allies during the battle. Pause to take a look; your allies carry on when you resume.',
      },
      {
        heading: '4. Try a different adventure',
        text: 'A victory opens the next mission. A caprice changes the rules of a mission; The Voyage strings five stages together. Turn your phone sideways to play.',
      },
    ],
  },
  {
    key: 'characters',
    lang: 'fr',
    path: '/fr/personnages/',
    title: 'Alliés, dinosaures et serpents — La Conquête des Serpents',
    description:
      'Découvre les alliés et les serpents du jeu : massues, ninjas, archers, soigneurs, dinosaures et roi à trois têtes, dans un univers fait main.',
    heading: 'Des copains très différents. Des serpents pleins d’idées.',
    lead: 'Les bébés dragons et les petits dinosaures sont de ton côté. En face, les serpents ont chacun leurs surprises.',
    blocks: [
      {
        heading: 'Massues et ninjas',
        text: 'Les combattants à massue défendent au contact. Les ninjas courent vite jusqu’aux serpents. L’endroit où tu les poses compte autant que leur nombre.',
      },
      {
        heading: 'Archers et soigneurs',
        text: 'Les archers atteignent les ennemis à distance, y compris les volants. Les médecins et les infirmiers soignent les alliés blessés. Ils n’ont pas des bandages à l’infini : ils retournent en chercher à la base.',
      },
      {
        heading: 'Dragons, dinosaures et gros renforts',
        text: 'Bébés dragons, petits dinosaures, chevaliers et tanks rejoignent ton équipe quand tu avances dans le jeu. Choisis celui qui aide le chemin que tu veux protéger.',
      },
      {
        heading: 'Sonnette, carapaces et trois têtes',
        text: 'Le serpent à sonnette sème la confusion. Les carapaces encaissent les coups ; contre les serpents volants, il faut des alliés qui tirent loin. Dans l’aventure classique, King Snake, le roi à trois têtes, arrive avec ses gardes, dont un soigneur.',
      },
    ],
  },
  {
    key: 'characters',
    lang: 'en',
    path: '/en/characters/',
    title: 'Allies, dinosaurs and snakes — Snake Attack TD',
    description: `Meet ${ALLY_EN.massue}s, ninjas, archers, healers, dinosaurs and King Snake, the three-headed king, in a handmade family tower defense world.`,
    heading: 'Very different friends. Snakes full of surprises.',
    lead: 'Baby dragons and little dinosaurs are on your side. Across the paths, every kind of snake brings a different surprise.',
    blocks: [
      {
        heading: `${ALLY_EN.massue}s and ninjas`,
        text: `${ALLY_EN.massue}s defend at close range. Ninjas run fast to reach the snakes. Where you place them matters as much as how many you have.`,
      },
      {
        heading: 'Archers and healers',
        text: `Archers reach enemies at a distance, including flying snakes. ${ALLY_EN.medecin}s and ${ALLY_EN.infirmier}s heal injured allies. Their bandages run out: they go back to the base for more.`,
      },
      {
        heading: 'Dragons, dinosaurs and bigger allies',
        text: 'Baby dragons, little dinosaurs, knights and tanks join your team as you progress. Choose the one that helps the path you want to protect.',
      },
      {
        heading: `Rattles, ${SNAKE_EN.carapace}s and three heads`,
        text: `The ${SNAKE_EN.serpentASonnette} causes confusion. ${SNAKE_EN.carapace}s soak up hits; against flying snakes, you need allies that shoot far. In the classic adventure, King Snake, the three-headed king, arrives with his guards, including a healer.`,
      },
    ],
  },
  {
    key: 'updates',
    lang: 'fr',
    path: '/fr/nouveautes/',
    title: 'Nouveautés du jeu — La Conquête des Serpents',
    description:
      'Les nouveautés de La Conquête des Serpents : trois nouveaux serpents, des œufs en plus quand une vague dure, le Voyage et un joueur pour chacun.',
    heading: 'Le camp continue de grandir.',
    lead: 'Voici ce qui vient d’arriver dans le jeu. Beaucoup d’idées viennent de l’enfant qui l’a inventé.',
    blocks: [
      {
        heading: 'Trois nouveaux serpents',
        text: `Pour les voir, commence une nouvelle partie : touche « ${FR.aventureClassique} », puis « ${FR.laGrandeAventure12Vagues} ». Ils arrivent à partir de la vague ${NEWCOMERS.ninja.fromWave}. Le serpent ninja court vite : au premier coup, il disparaît et revient derrière celui qui l’a frappé. Les grands crocs mordent deux fois plus fort : pose un ${ALLY_FR.bouclier} devant. Le serpent rare tombe vite, mais sa morsure fait tomber une ${ALLY_FR.massue} d’un coup. Pose un ${ALLY_FR.archer} : il peut le toucher avant qu’il morde.`,
      },
      {
        heading: 'Des œufs en plus',
        text: `Dans une nouvelle « ${FR.aventureClassique} », quand une vague dure longtemps, un œuf de plus apparaît chez les serpents. Puis un deuxième. Deux serpents sortent de chaque œuf.`,
      },
      {
        heading: 'Le Voyage',
        text: 'Cinq étapes sur une carte, et des bonus à choisir en chemin. Ton voyage a un code : donne-le à un copain, il fera le même voyage que toi. Si tu quittes une étape, tu la recommences au début.',
      },
      {
        heading: 'Un joueur pour chacun',
        text: 'Sur le même appareil, jusqu’à quatre joueurs ont chacun leur aventure. Ton carnet garde les autocollants que tu gagnes en réussissant les caprices.',
      },
    ],
  },
  {
    key: 'updates',
    lang: 'en',
    path: '/en/updates/',
    title: 'Game updates — Snake Attack TD',
    description:
      'What is new in Snake Attack TD: three new snakes, extra eggs when a wave runs long, The Voyage and a player for everyone.',
    heading: 'The camp keeps growing.',
    lead: 'Here is what just arrived in the game. Many of the ideas come from the child who invented it.',
    blocks: [
      {
        heading: 'Three new snakes',
        text: `To see them, start a new game: tap “${EN.aventureClassique}”, then “${EN.laGrandeAventure12Vagues}”. They show up from wave ${NEWCOMERS.ninja.fromWave} on. The Ninja Snake runs fast: at the first hit, it vanishes and comes back behind whoever struck it. Big Fangs bites twice as hard: place a ${ALLY_EN.bouclier} in front. The Rare Snake falls fast, but its bite knocks out a ${ALLY_EN.massue} in one go. Place an ${ALLY_EN.archer}: it can hit the snake before it bites.`,
      },
      {
        heading: 'Extra eggs',
        text: `In a new “${EN.aventureClassique}”, when a wave runs long, one more egg appears on the snakes’ side. Then a second one. Two snakes hatch from each egg.`,
      },
      {
        heading: 'The Voyage',
        text: 'Five stages on a map, with bonuses to choose along the way. Your voyage has a code: give it to a friend and they play the same voyage as you. If you leave a stage, you start it again from the beginning.',
      },
      {
        heading: 'A player for everyone',
        text: 'On one device, up to four players each have their own adventure. Your sticker book keeps the stickers you win by beating caprices. The child who invented the game chose the caprice names and announcements: they stay in French, even when you play in English.',
      },
    ],
  },
  {
    key: 'parents',
    lang: 'fr',
    path: '/fr/parents/',
    title: 'Pour les parents — La Conquête des Serpents',
    description:
      'Un jeu familial sans compte ni achat intégré. Comprendre les sauvegardes locales et accompagner les premiers pas.',
    heading: 'Une petite aventure à découvrir ensemble.',
    lead: 'Le jeu vient d’une idée d’enfant. Une première partie à deux permet de découvrir les trois voies, les alliés et le rythme des vagues.',
    blocks: [
      {
        heading: 'Jouer sans compte',
        text: 'Le jeu est gratuit, sans achat intégré. Aucun compte n’est demandé pour jouer. Les profils et les sauvegardes restent sur l’appareil. Sur grand écran, le site peut afficher un seul encart publicitaire non personnalisé, que l’on peut couper dans « Pour les parents » du jeu. Aucune mesure d’audience ajoutée.',
      },
      {
        heading: 'Sur le Web et sur Android',
        text: 'L’application Android est en préparation ; elle n’est pas encore disponible. Le site reçoit les nouveautés dès leur publication. L’application embarquera ses fichiers pour jouer hors ligne et recevra les nouveautés lors d’une mise à jour. Une nouveauté ne change pas une partie déjà commencée : les anciennes sauvegardes et les anciens codes gardent leurs règles.',
      },
      {
        heading: 'Conserver une aventure',
        text: 'Le navigateur et l’application Android auront des stockages distincts. Effacer les données du navigateur, changer d’adresse de site ou désinstaller l’application peut faire perdre la progression. L’espace parents propose une sauvegarde familiale ; elle n’exporte pas tout, notamment pas le Voyage ni les profils.',
      },
      {
        heading: 'Lire les informations utiles',
        text: 'La politique de confidentialité explique le stockage local, les journaux techniques de l’hébergeur, la publicité sur le site, le soutien facultatif et les contacts d’assistance. Elle est disponible en français et en anglais, sans compte, depuis le lien en bas de chaque page.',
      },
      {
        heading: 'Qui a fait ce jeu ?',
        text: `Un enfant a inventé ce jeu sur papier : ses règles, ses alliés et ses serpents. Son parent le réalise et le publie sous le nom zyclope. Pour toute question : ${CONTACT_EMAIL}.`,
        link: { href: `/${PRIVACY_FOLDER}/`, label: 'Lire la politique de confidentialité' },
      },
    ],
  },
  {
    key: 'parents',
    lang: 'en',
    path: '/en/parents/',
    title: 'For parents — Snake Attack TD',
    description:
      'A family game with no account and no in-app purchases. Understand local saves and help with the first steps.',
    heading: 'A little adventure to discover together.',
    lead: 'The game grew from a child’s idea. Playing the first session together helps introduce the three lanes, the allies and the rhythm of the waves.',
    blocks: [
      {
        heading: 'Play without an account',
        text: 'The game is free, with no in-app purchases. No account is required to play. Profiles and saves stay on the device. On a large screen, the website may show a single non-personalised ad box, which can be turned off in “For parents” in the game. No audience analytics added.',
      },
      {
        heading: 'On the Web and Android',
        text: 'The Android app is being prepared; it is not available yet. The website gets updates as soon as they are published. The app will carry its files for offline play and will get updates through an app update. An update does not change a game already in progress: older saves and codes keep their own rules.',
      },
      {
        heading: 'Keep an adventure',
        text: 'The browser and the Android app will use separate storage. Clearing browser data, moving to another website address or uninstalling the app can lose progress. The parents’ area offers a family backup; it does not export everything, including The Voyage and profiles.',
      },
      {
        heading: 'Read the useful information',
        text: 'The privacy policy explains local storage, the host’s technical logs, advertising on the website, optional support and support contacts. Read it in French or English without an account, using the link at the foot of every page.',
      },
      {
        heading: 'Who made this game?',
        text: `A child invented this game on paper: its rules, its allies and its snakes. Their parent builds it and publishes it under the name zyclope. Any question: ${CONTACT_EMAIL}.`,
        link: { href: `/${PRIVACY_FOLDER}/#en`, label: 'Read the privacy policy' },
      },
    ],
  },
];
