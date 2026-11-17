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
  blocks: readonly { heading: string; text: string }[];
};

export const DISCOVERY_PAGES: readonly DiscoveryPage[] = [
  {
    key: 'home',
    lang: 'fr',
    path: '/fr/',
    title: 'La Conquête des Serpents — jeu de défense gratuit en famille',
    description:
      'Protège le cristal sur trois chemins avec des ninjas, des dinosaures et des bébés dragons. Un tower defense familial gratuit, jouable dans le navigateur.',
    heading: 'Un cristal. Trois chemins. Toute une bande de copains.',
    lead: 'Un petit jeu imaginé avec un enfant : prépare tes alliés, surveille les serpents et protège ton refuge dans un monde de pâte à modeler et de papier mâché.',
    blocks: [
      {
        heading: 'Tu prépares, tes alliés agissent',
        text: 'Choisis tes renforts et place-les dans ta zone. Ils se déplacent et combattent seuls. Les trois voies se rejoignent : observe les passages fragiles, puis utilise le miel pour attirer ou ralentir les serpents.',
      },
      {
        heading: 'Une aventure à ton rythme',
        text: 'Découvre six missions, rejoue-les avec les caprices, ou lance le Voyage pour enchaîner des étapes et choisir des bonus. La grande aventure propose aussi douze vagues jusqu’au roi à trois têtes.',
      },
      {
        heading: 'Un jeu à partager en famille',
        text: 'Les figurines ont une matière faite main ; les ninjas, les soigneurs et les petits dinosaures ont chacun leur rôle. Le jeu est disponible en français et en anglais, sans création de compte.',
      },
    ],
  },
  {
    key: 'home',
    lang: 'en',
    path: '/en/',
    title: 'Snake Attack TD — free family tower defense game',
    description:
      'Defend a crystal across three paths with ninjas, dinosaurs and baby dragons. A free family tower defense game you can play in your browser.',
    heading: 'One crystal. Three paths. A whole team of friends.',
    lead: 'A small game imagined with a child: prepare your allies, watch the snakes and protect your refuge in a world of modelling clay and papier-mâché.',
    blocks: [
      {
        heading: 'You prepare. Your allies take action.',
        text: 'Choose reinforcements and place them in your area. They move and fight on their own. The three lanes connect: watch the weak passages, then use honey to attract or slow the snakes.',
      },
      {
        heading: 'An adventure at your pace',
        text: 'Discover six missions, replay them with caprices, or start The Voyage to follow a series of stages and choose bonuses. The classic adventure also offers twelve waves leading to the three-headed king.',
      },
      {
        heading: 'Made to share with your family',
        text: 'The figures have a handmade feel. Ninjas, healers and little dinosaurs each have a role. Play in French or English, without creating an account.',
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
    lead: 'Tu n’as pas besoin de diriger chaque soldat. Ton rôle est de composer ton équipe et de renforcer les bons passages.',
    blocks: [
      {
        heading: '1. Regarde les dangers',
        text: 'Avant la vague, consulte les serpents annoncés et les voies d’arrivée. Les ennemis n’ont pas tous les mêmes talents : certains sont rapides, certains attaquent de loin, d’autres volent.',
      },
      {
        heading: '2. Recrute et place tes alliés',
        text: 'Choisis un allié dans les favoris ou ouvre le catalogue complet. Place-le dans ta zone quand tu as assez de pièces. Mélange les rôles : combattants au contact, archers et soigneurs ne répondent pas aux mêmes dangers.',
      },
      {
        heading: '3. Surveille les trois chemins',
        text: 'Lance la vague, puis observe où ton camp tient et où les serpents passent. Tu peux acheter des renforts pendant le combat. Une pause te laisse le temps de regarder ; les alliés reprennent leur activité quand tu relances.',
      },
      {
        heading: '4. Reviens jouer autrement',
        text: 'Une victoire ouvre la suite des missions. Les caprices changent les contraintes d’une mission ; le Voyage propose un autre enchaînement. Sur téléphone, tourne l’écran pour jouer à l’horizontale.',
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
    lead: 'You do not need to command every soldier. Your job is to build a team and reinforce the right passages.',
    blocks: [
      {
        heading: '1. Check the dangers',
        text: 'Before a wave, check the announced snakes and their arrival lanes. Enemies have different talents: some are fast, some attack from a distance, and others fly.',
      },
      {
        heading: '2. Recruit and place your allies',
        text: 'Pick an ally from your favourites or open the full catalogue. Place them in your area when you have enough coins. Mix roles: close-range fighters, archers and healers answer different dangers.',
      },
      {
        heading: '3. Watch all three paths',
        text: 'Start the wave and watch where your camp holds and where snakes get through. You can recruit during the fight. Pause to take a look; allies resume their actions when you continue.',
      },
      {
        heading: '4. Try a different adventure',
        text: 'A victory opens the next mission. Caprices change a mission’s constraints; The Voyage offers another sequence. Turn your phone sideways to play.',
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
        text: 'Les combattants à massue défendent au contact. Les ninjas se déplacent vite pour rejoindre leurs adversaires. Leur place dans le camp compte autant que leur nombre.',
      },
      {
        heading: 'Archers et soigneurs',
        text: 'Les archers atteignent les ennemis à distance, y compris les volants. Les médecins et les infirmiers aident les alliés blessés ; leurs bandages ne sont pas illimités et doivent être rechargés à la base.',
      },
      {
        heading: 'Dragons, dinosaures et gros renforts',
        text: 'Bébés dragons, petits dinosaures, chevaliers et tanks complètent l’équipe au fil de la progression. Choisis un rôle utile au passage que tu veux protéger.',
      },
      {
        heading: 'Sonnette, carapaces et trois têtes',
        text: 'Le serpent à sonnette sème la confusion. Les carapaces résistent aux attaques ; les volants demandent de la portée. Le roi à trois têtes arrive avec une garde rapprochée, dont un soigneur.',
      },
    ],
  },
  {
    key: 'characters',
    lang: 'en',
    path: '/en/characters/',
    title: 'Allies, dinosaurs and snakes — Snake Attack TD',
    description:
      'Meet club fighters, ninjas, archers, healers, dinosaurs and the three-headed snake king in a handmade family tower defense world.',
    heading: 'Very different friends. Snakes full of surprises.',
    lead: 'Baby dragons and little dinosaurs are on your side. Across the paths, every kind of snake brings a different surprise.',
    blocks: [
      {
        heading: 'Club fighters and ninjas',
        text: 'Club fighters defend at close range. Ninjas move quickly to reach their opponents. Where you place them matters as much as how many you recruit.',
      },
      {
        heading: 'Archers and healers',
        text: 'Archers reach enemies at a distance, including flying snakes. Doctors and nurses help injured allies; their bandages are limited and need refilling at the base.',
      },
      {
        heading: 'Dragons, dinosaurs and bigger allies',
        text: 'Baby dragons, little dinosaurs, knights and tanks join the team as you progress. Choose a role that helps the passage you want to protect.',
      },
      {
        heading: 'Rattles, shells and three heads',
        text: 'The rattlesnake causes confusion. Shells resist attacks; flying enemies call for range. The three-headed king arrives with a close guard, including a healer.',
      },
    ],
  },
  {
    key: 'updates',
    lang: 'fr',
    path: '/fr/nouveautes/',
    title: 'Nouveautés du jeu — La Conquête des Serpents',
    description:
      'Les nouveautés de La Conquête des Serpents : le Voyage, les profils locaux, les caprices et les nouveaux serpents de la grande aventure.',
    heading: 'Le camp continue de grandir.',
    lead: 'Les nouveautés naissent des idées de l’enfant qui a inventé le jeu, puis des essais en famille.',
    blocks: [
      {
        heading: 'Le Voyage',
        text: 'Un parcours de cinq étapes avec une carte, des bonus à choisir et un code à partager pour retrouver le même voyage. Une étape quittée recommence à son début ; le camp d’une étape n’est pas enregistré.',
      },
      {
        heading: 'Un espace pour chaque joueur',
        text: 'Les profils locaux permettent à plusieurs joueurs de retrouver leur aventure sur le même appareil. Le carnet garde les autocollants gagnés dans les défis. Les noms et annonces des caprices choisis par l’enfant restent en français, même dans l’interface anglaise.',
      },
      {
        heading: 'De nouveaux serpents dans la grande aventure',
        text: 'Grands crocs, serpent rare et serpent ninja rejoignent la grande aventure. Les anciennes sauvegardes et les anciens codes gardent leur révision : une nouveauté ne réécrit pas une partie déjà commencée.',
      },
      {
        heading: 'Sur le Web et sur Android',
        text: 'Le site évolue avec les mises à jour publiées. L’application Android embarque ses fichiers pour jouer hors ligne ; elle reçoit ses nouveautés lors d’une mise à jour. Les sauvegardes du site et de l’application restent distinctes.',
      },
    ],
  },
  {
    key: 'updates',
    lang: 'en',
    path: '/en/updates/',
    title: 'Game updates — Snake Attack TD',
    description:
      'What is new in Snake Attack TD: The Voyage, local player profiles, caprices and new snakes in the classic adventure.',
    heading: 'The camp keeps growing.',
    lead: 'New ideas come from the child who invented the game, followed by family play sessions.',
    blocks: [
      {
        heading: 'The Voyage',
        text: 'A five-stage route with a map, bonus choices and a code to share the same voyage. Leaving a stage restarts it from the beginning; a stage’s camp is not saved.',
      },
      {
        heading: 'A space for each player',
        text: 'Local profiles let several players keep their own adventure on one device. The sticker album keeps rewards earned in challenges. The child’s chosen caprice names and announcements stay in French, even in the English interface.',
      },
      {
        heading: 'New snakes in the classic adventure',
        text: 'Big Fangs, the Rare Snake and the Ninja Snake join the classic adventure. Older saves and codes keep their own revision: an update does not rewrite a game already in progress.',
      },
      {
        heading: 'On the Web and Android',
        text: 'The website changes when an update is published. The Android app carries its files for offline play and receives new content through an app update. Website saves and app saves remain separate.',
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
        text: 'Le jeu est gratuit, sans achat intégré. Aucun compte n’est demandé pour jouer. Les profils et les sauvegardes restent sur l’appareil. Sur grand écran, le site peut afficher un seul encart publicitaire non personnalisé, que l’on peut couper dans « Pour les parents ». Aucune mesure d’audience ajoutée.',
      },
      {
        heading: 'Conserver une aventure',
        text: 'Le navigateur et l’application Android ont des stockages distincts. Effacer les données du navigateur, changer d’adresse de site ou désinstaller l’application peut faire perdre la progression. L’espace parents propose une sauvegarde familiale ; elle n’exporte pas tout, notamment pas le Voyage ni les profils.',
      },
      {
        heading: 'Lire les informations utiles',
        text: 'La politique de confidentialité explique le stockage local, les journaux techniques de l’hébergeur et les contacts d’assistance. Elle est disponible en français et en anglais, sans compte, depuis le lien en bas de chaque page.',
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
        text: 'The game is free, with no in-app purchases. No account is required to play. Profiles and saves stay on the device. On a large screen, the website may show a single non-personalised ad box, which can be turned off in “For parents”. No audience analytics added.',
      },
      {
        heading: 'Keep an adventure',
        text: 'The browser and the Android app use separate storage. Clearing browser data, moving to another website address or uninstalling the app can lose progress. The parents’ area offers a family backup; it does not export everything, including The Voyage and profiles.',
      },
      {
        heading: 'Read the useful information',
        text: 'The privacy policy explains local storage, the host’s technical logs and support contacts. Read it in French or English without an account, using the link at the foot of every page.',
      },
    ],
  },
];
