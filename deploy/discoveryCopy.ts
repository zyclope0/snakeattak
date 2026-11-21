import { CONTACT_EMAIL, PRIVACY_FOLDER } from '../src/site.ts';
// The words of the game's own buttons, so that a page never names a button that changed.
import * as FR from '../src/texts/fr/page.ts';
import * as EN from '../src/texts/en/page.ts';
import * as ALLY_FR from '../src/texts/fr/allies.ts';
import * as ALLY_EN from '../src/texts/en/allies.ts';
import * as SNAKE_EN from '../src/texts/en/snakes.ts';
import { NEWCOMERS } from '../src/waves.ts';
import {
  PLAY_TEST_DAYS,
  PLAY_TESTERS,
  siteFeatures,
  type AndroidTest,
  type SiteFeatures,
  type Story,
} from './siteFeatures.ts';
import { unlockWave } from '../src/data.ts';
import { TOTAL_WAVES } from '../src/gameConstants.ts';
import { BOON_MAX_LEVEL, BOON_PLACES } from '../src/boons.ts';
import * as EXP_FR from '../src/texts/fr/expedition.ts';
import * as EXP_EN from '../src/texts/en/expedition.ts';
import {
  BATTLES_PER_TABLEAU,
  CURRENT_EXPEDITION_VERSION,
  EXPEDITION_BATTLES,
  EXPEDITION_TUNINGS,
} from '../src/expedition.ts';

// « La Grande Expédition » took the voyage's place (decision of the parent, 21 November 2026).
const TABLEAUX = EXPEDITION_TUNINGS[CURRENT_EXPEDITION_VERSION].tableaux.length;

/** Public editorial copy, independent from the game and its translation catalogue. */
export type DiscoveryKey =
  'home' | 'story' | 'guide' | 'characters' | 'updates' | 'parents' | 'test';
export type DiscoveryPage = {
  key: DiscoveryKey;
  lang: 'fr' | 'en';
  path: string;
  title: string;
  description: string;
  heading: string;
  lead: string;
  /** A block may end with one link: to another page of the site, or to Google for the test. */
  blocks: readonly { heading: string; text: string; link?: { href: string; label: string } }[];
  /** The child's drawing, on the page of the story only. */
  figure?: { src: string; width: number; height: number; alt: string; caption: string };
};

const BASE_PAGES: readonly DiscoveryPage[] = [
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
        text: `Six missions t’attendent. Rejoue-les avec un caprice : c’est un défi des serpents. Pars pour « ${EXP_FR.laGrandeExpedition} » : ${TABLEAUX} tableaux de ${BATTLES_PER_TABLEAU} étapes, et des cadeaux à choisir en chemin. Dans l’« ${FR.aventureClassique} », douze vagues mènent à King Snake, le roi à trois têtes.`,
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
        text: `Six missions are waiting. Replay them with a caprice: a challenge from the snakes. Set off on “${EXP_EN.laGrandeExpedition}”: ${TABLEAUX} lands of ${BATTLES_PER_TABLEAU} stages, with gifts to choose along the way. In the “${EN.aventureClassique}”, twelve waves lead to King Snake, the three-headed king.`,
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
        text: `Une victoire ouvre la mission suivante. Un caprice change les règles d’une mission ; « ${EXP_FR.laGrandeExpedition} » enchaîne ${EXPEDITION_BATTLES} étapes. Sur téléphone, tourne l’écran pour jouer en largeur.`,
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
        text: `A victory opens the next mission. A caprice changes the rules of a mission; “${EXP_EN.laGrandeExpedition}” strings ${EXPEDITION_BATTLES} stages together. Turn your phone sideways to play.`,
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
      'Les nouveautés de La Conquête des Serpents : La Grande Expédition, l’aventure sans fin, le spinosaure, quatre nouveaux serpents, des œufs en plus quand une vague dure, un joueur pour chacun.',
    heading: 'Le camp continue de grandir.',
    lead: 'Voici ce qui vient d’arriver dans le jeu. Beaucoup d’idées viennent de l’enfant qui l’a inventé.',
    blocks: [
      {
        heading: EXP_FR.laGrandeExpedition,
        text: `${TABLEAUX} tableaux de ${BATTLES_PER_TABLEAU} étapes sur une route qui se sépare en deux : « ${EXP_FR.leCheminTranquille} » ou « ${EXP_FR.leCheminDesBraves} », avec un cadeau rare au bout. En chemin, des haltes : ${EXP_FR.leFeuDeCamp}, ${EXP_FR.laRoulotteDeMamiePistache}, ${EXP_FR.lOeufMystere}. Tes alliés encore debout te suivent d’une étape à l’autre, et tu gardes tes cadeaux jusqu’au bout. King Snake attend à la fin. Chaque étape a son défi, toujours le même : à toi de le connaître. Si tu perds une étape, tu la rejoues depuis le même camp.`,
      },
      {
        heading: 'Un camp plus solide',
        text: 'Dans une nouvelle mission ou une nouvelle expédition, tes alliés font le tour des rochers au lieu de rester collés devant. Si ton doigt touche deux fois le même bouton, tu ne prends plus un cadeau sans l’avoir choisi. Et la sauvegarde familiale garde aussi ton expédition et tes records.',
      },
      {
        heading: FR.laventureSansFin,
        text: `Une fois King Snake battu dans la « ${FR.aventureClassique} », une nouvelle porte s’ouvre : « ${FR.laventureSansFin} ». Toutes les ${TOTAL_WAVES} vagues, King Snake revient, un peu plus fort, et la partie continue. Après chaque roi, tu choisis un cadeau qui dure : ${BOON_PLACES} places, et chaque cadeau monte jusqu’au niveau ${BOON_MAX_LEVEL}. Chaque joueur garde son record, rien que pour lui.`,
      },
      {
        heading: `Le ${ALLY_FR.spinosaure.toLowerCase()}`,
        text: `Un nouvel allié inventé par l’enfant ! Dans une nouvelle « ${FR.aventureClassique} », le ${ALLY_FR.spinosaure.toLowerCase()} arrive à la vague ${unlockWave.spinosaurus}. Sa morsure est très forte, et sa voile touche aussi les serpents autour de lui. De temps en temps, il plonge dans la rivière pour mordre un serpent sur un pont, puis il revient.`,
      },
      {
        heading: 'Le serpent sauterelle',
        text: `Dans une nouvelle « ${FR.aventureClassique} », à partir de la vague ${NEWCOMERS.grasshopper.fromWave}, un serpent sauterelle saute une fois par-dessus tes alliés et retombe derrière eux. Ensuite, il marche vers le cristal. Garde un allié près du cristal pour l’attendre.`,
      },
      {
        heading: 'Trois nouveaux serpents',
        text: `Pour les voir, commence une nouvelle partie : touche « ${FR.aventureClassique} », puis « ${FR.laGrandeAventure12Vagues} ». Ils arrivent à partir de la vague ${NEWCOMERS.ninja.fromWave}. Le serpent ninja court vite : au premier coup, il disparaît et revient derrière celui qui l’a frappé. Les grands crocs mordent deux fois plus fort : pose un ${ALLY_FR.bouclier} devant. Le serpent rare tombe vite, mais sa morsure fait tomber une ${ALLY_FR.massue} d’un coup. Pose un ${ALLY_FR.archer} : il peut le toucher avant qu’il morde.`,
      },
      {
        heading: 'Des œufs en plus',
        text: `Dans une nouvelle « ${FR.aventureClassique} », quand une vague dure longtemps, un œuf de plus apparaît chez les serpents. Puis un deuxième. Deux serpents sortent de chaque œuf.`,
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
      'What is new in Snake Attack TD: The Great Expedition, the endless adventure, the Spinosaurus, four new snakes, extra eggs when a wave runs long, a player for everyone.',
    heading: 'The camp keeps growing.',
    lead: 'Here is what just arrived in the game. Many of the ideas come from the child who invented it.',
    blocks: [
      {
        heading: EXP_EN.laGrandeExpedition,
        text: `${TABLEAUX} lands of ${BATTLES_PER_TABLEAU} stages on a road that splits in two: “${EXP_EN.leCheminTranquille}” or “${EXP_EN.leCheminDesBraves}”, with a rare gift at the end. Along the way, stops: ${EXP_EN.leFeuDeCamp}, ${EXP_EN.laRoulotteDeMamiePistache}, ${EXP_EN.lOeufMystere}. Your allies still standing follow you from one stage to the next, and you keep your gifts to the very end. King Snake waits at the finish. Each stage has its own challenge, always the same: learn it. If you lose a stage, you play it again from the same camp.`,
      },
      {
        heading: 'A sturdier camp',
        text: 'In a new mission or a new expedition, your allies walk around rocks instead of standing stuck in front of them. If your finger taps the same button twice, you no longer take a gift without choosing it. And the family save now keeps your expedition and your records too.',
      },
      {
        heading: EN.laventureSansFin,
        text: `Once King Snake is beaten in the “${EN.aventureClassique}”, a new door opens: “${EN.laventureSansFin}”. Every ${TOTAL_WAVES} waves, King Snake comes back a little stronger, and the game goes on. After each king, you choose a gift that lasts: ${BOON_PLACES} spots, and each gift goes up to level ${BOON_MAX_LEVEL}. Each player keeps their own record, just for them.`,
      },
      {
        heading: `The ${ALLY_EN.spinosaure}`,
        text: `A new ally invented by the child! In a new “${EN.aventureClassique}”, the ${ALLY_EN.spinosaure} arrives at wave ${unlockWave.spinosaurus}. Its bite is very strong, and its sail also hits the snakes around it. Now and then, it dives into the river to bite a snake on a bridge, then comes back.`,
      },
      {
        heading: 'The Grasshopper Snake',
        text: `In a new “${EN.aventureClassique}”, from wave ${NEWCOMERS.grasshopper.fromWave} on, a Grasshopper Snake leaps once over your allies and lands behind them. Then it walks on to the crystal. Keep an ally near the crystal to wait for it.`,
      },
      {
        heading: 'Three new snakes',
        text: `To see them, start a new game: tap “${EN.aventureClassique}”, then “${EN.laGrandeAventure12Vagues}”. They show up from wave ${NEWCOMERS.ninja.fromWave} on. The Ninja Snake runs fast: on the first hit, it vanishes and comes back behind whoever struck it. Big Fangs bites twice as hard: place a ${ALLY_EN.bouclier} in front. The Rare Snake falls fast, but its bite knocks out a ${ALLY_EN.massue} in one go. Place an ${ALLY_EN.archer}: it can hit the snake before it bites.`,
      },
      {
        heading: 'Extra eggs',
        text: `In a new “${EN.aventureClassique}”, when a wave runs long, one more egg appears on the snakes’ side. Then a second one. Two snakes hatch from each egg.`,
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
        text: `Le navigateur et l’application Android auront des stockages distincts. Effacer les données du navigateur, changer d’adresse de site ou désinstaller l’application peut faire perdre la progression. L’espace parents propose une sauvegarde familiale ; elle n’exporte pas tout, notamment pas « ${EXP_FR.laGrandeExpedition} » ni les profils.`,
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
        text: `The browser and the Android app will use separate storage. Clearing browser data, moving to another website address or uninstalling the app can lose progress. The parents’ area offers a family backup; it does not export everything, including “${EXP_EN.laGrandeExpedition}” and profiles.`,
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

/** The page of the story: the child's drawing and his age, nothing else about him. */
function storyPages(story: Story): DiscoveryPage[] {
  const figure = { src: story.drawing, width: story.width, height: story.height };
  return [
    {
      key: 'story',
      lang: 'fr',
      path: '/fr/histoire/',
      title: 'L’histoire du jeu — La Conquête des Serpents',
      description: `Un enfant de ${story.age} ans a dessiné ce jeu sur papier. Ses règles, ses alliés et ses serpents sont devenus un jeu gratuit, construit en famille.`,
      heading: 'Un jeu né sur une feuille de papier.',
      lead: `Un enfant de ${story.age} ans a dessiné ce jeu au feutre : l’antre des serpents, les chemins et le camp à défendre. On l’a construit en famille, en gardant ses règles.`,
      figure: {
        ...figure,
        alt: 'Le dessin d’origine du jeu, au feutre, sur une grande feuille.',
        caption: 'Le dessin d’origine.',
      },
      blocks: [
        {
          heading: 'Ses règles',
          text: 'Les serpents arrivent par vagues depuis leur antre, à gauche. Tes alliés défendent le camp, à droite, tout seuls : tu ne les déplaces pas. Tu les achètes avec les pièces gagnées en combattant. Des œufs éclosent parfois, un roi à trois têtes vient à la fin, et un allié tombé ne revient pas.',
        },
        {
          heading: 'Ses idées depuis',
          text: 'Il continue d’inventer : King Snake, le serpent ninja qui se téléporte, le serpent sauterelle qui saute par-dessus les alliés, le spinosaure qui nage. Chaque idée est essayée, puis ajoutée quand elle rend le jeu plus amusant.',
          link: { href: '/fr/nouveautes/', label: 'Voir les nouveautés' },
        },
        {
          heading: 'Ce que le jeu ne fait pas',
          text: 'Pas de compte, rien à acheter, pas de minuteur qui oblige à revenir. Les parties restent sur l’appareil.',
          link: { href: '/fr/parents/', label: 'Lire la page pour les parents' },
        },
        {
          heading: 'Nous écrire',
          text: `Une question, une idée ? ${CONTACT_EMAIL}. N’écris pas le prénom de ton enfant dans ton premier message.`,
        },
      ],
    },
    {
      key: 'story',
      lang: 'en',
      path: '/en/story/',
      title: 'The story of the game — Snake Attack TD',
      description: `A ${story.age}-year-old child drew this game on paper. His rules, allies and snakes became a free game, built as a family.`,
      heading: 'A game born on a sheet of paper.',
      lead: `A ${story.age}-year-old child drew this game in felt pen: the snakes’ den, the paths and the camp to defend. We built it as a family, keeping his rules.`,
      figure: {
        ...figure,
        alt: 'The original drawing of the game, in felt pen, on a large sheet.',
        caption: 'The original drawing.',
      },
      blocks: [
        {
          heading: 'His rules',
          text: 'Snakes come in waves from their den, on the left. Your allies defend the camp, on the right, on their own: you do not move them. You buy them with the coins won in battle. Eggs sometimes hatch, a three-headed king comes at the end, and a fallen ally does not come back.',
        },
        {
          heading: 'His ideas since',
          text: 'He keeps inventing: King Snake, the Ninja Snake that teleports, the Grasshopper Snake that leaps over your allies, the Spinosaurus that swims. Each idea is tried, then added when it makes the game more fun.',
          link: { href: '/en/updates/', label: 'See the updates' },
        },
        {
          heading: 'What the game does not do',
          text: 'No account, nothing to buy, no timer that makes you come back. Games stay on the device.',
          link: { href: '/en/parents/', label: 'Read the page for parents' },
        },
        {
          heading: 'Write to us',
          text: `A question, an idea? ${CONTACT_EMAIL}. Please leave your child’s name out of your first message.`,
        },
      ],
    },
  ];
}

/** The page of the Android test: two links to Google, no form, nothing collected here. */
function testPages(test: AndroidTest): DiscoveryPage[] {
  return [
    {
      key: 'test',
      lang: 'fr',
      path: '/fr/tester-android/',
      title: 'Tester l’application Android — La Conquête des Serpents',
      description: `Aide-nous à tester l’application Android avant sa sortie sur Google Play : il faut au moins ${PLAY_TESTERS} familles pendant ${PLAY_TEST_DAYS} jours.`,
      heading: 'Teste l’application Android avant tout le monde.',
      lead: `Avant de sortir sur Google Play, l’application doit être essayée par au moins ${PLAY_TESTERS} familles pendant ${PLAY_TEST_DAYS} jours de suite. C’est gratuit, et ça nous aide beaucoup.`,
      blocks: [
        {
          heading: 'Qui peut tester ?',
          text: 'Un adulte avec un compte Google et un téléphone ou une tablette Android. Ton enfant joue sur ton appareil : il n’a pas besoin de compte.',
        },
        {
          heading: '1. Rejoins le groupe des testeurs',
          text: 'Ouvre le groupe sur Google Groups et rejoins-le. Il sert seulement à t’ouvrir le test.',
          link: { href: test.group, label: 'Rejoindre le groupe (Google Groups)' },
        },
        {
          heading: '2. Rejoins le test sur Google Play',
          text: 'Ensuite, ouvre la page du test et deviens testeur. Installe le jeu depuis le Play Store, avec le même compte Google.',
          link: { href: test.optIn, label: 'Rejoindre le test (Google Play)' },
        },
        {
          heading: `Pendant ${PLAY_TEST_DAYS} jours`,
          text: 'Garde l’application installée et joue quelques fois par semaine. Si tu quittes le test avant la fin, tu ne comptes plus pour Google.',
        },
        {
          heading: 'Ton avis',
          text: `Ce qui plaît, ce qui coince : écris-nous à ${CONTACT_EMAIL}. N’écris pas le prénom de ton enfant.`,
        },
        {
          heading: 'Tes données',
          text: 'Le groupe est géré par Google. Seul l’auteur du jeu voit les adresses des membres. Elles servent uniquement à ce test, et le groupe sera supprimé après la sortie de l’application.',
          link: { href: `/${PRIVACY_FOLDER}/`, label: 'Lire la politique de confidentialité' },
        },
      ],
    },
    {
      key: 'test',
      lang: 'en',
      path: '/en/test-android/',
      title: 'Test the Android app — Snake Attack TD',
      description: `Help us test the Android app before it comes out on Google Play: it needs at least ${PLAY_TESTERS} families for ${PLAY_TEST_DAYS} days.`,
      heading: 'Try the Android app before everyone else.',
      lead: `Before it comes out on Google Play, the app must be tried by at least ${PLAY_TESTERS} families for ${PLAY_TEST_DAYS} days in a row. It is free, and it helps us a lot.`,
      blocks: [
        {
          heading: 'Who can test?',
          text: 'An adult with a Google account and an Android phone or tablet. Your child plays on your device: they do not need an account.',
        },
        {
          heading: '1. Join the testers’ group',
          text: 'Open the group on Google Groups and join it. It is only there to let you into the test.',
          link: { href: test.group, label: 'Join the group (Google Groups)' },
        },
        {
          heading: '2. Join the test on Google Play',
          text: 'Then open the test page and become a tester. Install the game from the Play Store, with the same Google account.',
          link: { href: test.optIn, label: 'Join the test (Google Play)' },
        },
        {
          heading: `For ${PLAY_TEST_DAYS} days`,
          text: 'Keep the app installed and play a few times a week. If you leave the test before the end, you no longer count for Google.',
        },
        {
          heading: 'Your feedback',
          text: `What works, what gets stuck: write to us at ${CONTACT_EMAIL}. Please leave your child’s name out.`,
        },
        {
          heading: 'Your data',
          text: 'The group is run by Google. Only the author of the game sees the members’ addresses. They are used for this test only, and the group will be deleted once the app is out.',
          link: { href: `/${PRIVACY_FOLDER}/#en`, label: 'Read the privacy policy' },
        },
      ],
    },
  ];
}

/**
 * The public pages for these features: the five of each language, the story after the home
 * page once the parent has given the drawing and the age, the Android test last once its two
 * links exist.
 */
export function discoveryPages(features: SiteFeatures): readonly DiscoveryPage[] {
  const story = features.story ? storyPages(features.story) : [];
  const test = features.androidTest ? testPages(features.androidTest) : [];
  return [
    ...BASE_PAGES.filter((p) => p.key === 'home'),
    ...story,
    ...BASE_PAGES.filter((p) => p.key !== 'home'),
    ...test,
  ];
}
/** What the website publishes today: the values of `deploy/siteFeatures.ts`. */
export const SITE_FEATURES = siteFeatures();
export const DISCOVERY_PAGES = discoveryPages(SITE_FEATURES);
