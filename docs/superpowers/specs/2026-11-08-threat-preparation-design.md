# Dangers et préparation illustrée — 0.32.0

Le parent valide les deux premières étapes proposées : anticiper les dangers et
mieux préparer les six missions existantes. La campagne étendue reste à proposer
avec ses valeurs avant toute implémentation. Phaser 3/TypeScript/Vite, UI HTML/CSS,
Capacitor restent les outils ; aucun service ou asset payant.

## Approche retenue pour cette réalisation

Une annonce d'espèces par voie serait trompeuse : l'IA choisit et change les voies.
Un long briefing seul conserve le défaut relevé dans l'audit. Le développeur
retient un catalogue visuel de la vague, avec portraits aux antres actifs et un
bouton « Dangers » ouvrant les capacités. Les portraits illustrent les espèces
possibles à ces sorties, pas une répartition ou le prochain individu exact.
Les trois voies restent visibles et le masque centre→2→3 reste autoritaire.

Projection UI pure depuis `missionWave`, `waveStats`, `variantFor`,
`flyingVariant` et `BOSS_COURT` : aucune simulation parallèle, aucun tirage, aucun
choix de voie, aucune mutation. La cour remplace ses quatre créneaux habituels ;
les œufs sont annoncés séparément et éclosent en serpents ordinaires.
Les tests comparent les espèces projetées aux naissances réelles du moteur.
Les réglages tactiques historiques sont respectés ; roi absent des expéditions.

## Préparation

Le tracé SVG réutilise la géométrie partagée et les images existantes : fond
adouci, chemins, jonctions, rochers, antres et refuge. Une image de référence ne
remplace jamais les routes. Les trois principaux dangers de toute la mission
sont illustrés, les autres se déplient ; le libellé dit « Dans cette mission ».
Un seul conseil avec portrait d'allié disponible, sans achat automatique ni
promesse de victoire. Les trois compagnons de départ, le budget, les variantes,
le code de départ et les actions actuelles restent disponibles.
Le lancement reste hors de la zone défilante, comme en 0.31.

## Invariants et recette

Aucun changement des règles, prix, statistiques, vagues, IA, codecs ou profils.
Aucun Math.random, RNG consommé par la lecture, ordre de déplacement, bonus
anticipé, Facile, indisponibilité nouvelle d'un outil, SDK ou langue supplémentaire.
Version 0.32.0, Android code35 ; certificat debug existant.

Tester six missions × assauts/couvées et classique1–12, réglages historiques,
œufs, volants, roi/garde/soigneur, dernières vagues, refus et pauses de dialogues.
Contrôler 1280×800, 812×375, 568×320, 480×320 avec marges système, et 375×812.
Contrôles≥48px, toutes les actions de départ visibles sans scroller, aucune
réduction de la hauteur du plateau 812×375 (≥85% hauteur utile et≥65% largeur).
La lecture et la fermeture ne changent ni sauvegarde ni RNG ; changement de
mission/départ/vague ne laisse pas d'ancien portrait ou conseil.
Build/suite native, navigateur général, mobile, interruptions, hors ligne,
portable ; APK et publication du même build, dépôt privé synchronisé.
Les essais Chromium ne remplacent pas le S24 ni les enfants.
