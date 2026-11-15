# Plan actuel — 15 novembre 2026

Une page. L'historique des livraisons et des lots jusqu'au 15 novembre est dans
[archive/PLAN-ACTUEL-avant-2026-11-15.md](archive/PLAN-ACTUEL-avant-2026-11-15.md).

## Livraison actuelle — 0.38.0, Android build61, site snakeattacktd.com

- **Application** : 0.38.0 / build61 préparé par Codex le 15 novembre (AAB signé), à importer
  dans le canal de test interne de Google Play. Aventure de 12 vagues, 6 missions, 36
  caprices, le voyage (version 1, figée), quatre joueurs locaux, français et anglais, et la
  politique de confidentialité lisible hors ligne dans « Pour les parents ».
  [Bilan](BILAN-0.38.0.md), [Android](ANDROID.md), [Voyage](VOYAGE.md).
- **Site** : https://snakeattacktd.com sur Infomaniak, publié à la main depuis `main` par
  « Publier le site ». Politique de confidentialité publique à `/confidentialite`. L'ancien
  site `…chatgpt.site` reste en ligne et affiche l'avis de migration. [Site](SITE.md).

## Dans `main`, pas encore dans un build

- **Build release optimisé** : R8 activé pour répondre à deux remarques de la Play Console.
  **Jamais construit** : le build 62 sera le premier ; à vérifier sur un build release
  installé avant tout envoi ([Android](ANDROID.md)).
- **Ménage du 15 novembre** : CI en cinq tâches parallèles, une seule fois par commit ;
  diagnostic de performance chargé à la demande (paquet principal 189,6 Ko sur 200) ;
  scripts et recettes morts retirés, recettes vivantes mises dans la CI ; ce plan ramené à une
  page.
- **Rien en dur (15 novembre)** : textes, clés de stockage, nombres du jeu, repères du
  plateau, limites et couches du dessin ont chacun un nom et un seul lieu ; aucune valeur ni
  aucun texte n'a changé ([bilan](BILAN-NETTOYAGE-2026-11.md), « Rien en dur »).
- **King Snake (15 novembre)** : le roi à trois têtes porte le nom choisi par le fils, dans
  les deux langues ; « le roi » tout court reste. Trois messages du moteur le nomment : les
  empreintes de cinq parties de référence ont changé de hachage, rien d'autre.
- **Écran étroit** : le code suit maintenant la même largeur que les styles (920 px au lieu
  de 800) pour ramener le plateau ou une récompense à l'écran. **À essayer sur le téléphone.**
- **Carte d'une mission** : les noms des voies sont dans la police du jeu (ils étaient en
  Arial). Ils restent très petits sur téléphone : à regarder avec les enfants.
- **Index des serpents** (idée du fils) : « Tous les serpents », treize serpents et l'œuf,
  depuis « Dangers » et depuis « Favoris ». Pas encore montré aux enfants.
- **Catalogue en un seul écran** (idée du fils, choix du parent) : tous les alliés en petites
  cartes, sans pages ni liste de familles. Pas encore montré aux enfants.
- **Un œuf de plus quand une vague dure** (idée du fils, valeurs choisies par le parent) :
  dans la grande aventure, après 45 secondes de vague un œuf apparaît, un second 15 secondes
  plus tard, pas plus de deux par vague. C'est la **révision d'équilibrage 3** : les parties,
  codes et sauvegardes d'avant gardent leurs règles ; missions, défis et voyage ne changent
  pas. Mesuré sur 1 200 parties simulées : même taux de victoire, parties plus longues
  d'environ une minute ([bilan](BILAN-REVISION-3.md)). **Pas encore joué par les enfants.**

## Ce qui n'est pas vérifié

- **Le voyage avec les enfants.** Réglé sur des joueurs automatiques, puis figé à la
  publication. Les simulations disent qu'un joueur « apprenti » tombe devant le roi trois
  fois sur quatre. Aucune séance d'enfant n'est notée dans le dépôt.
- **Le build 61 sur le téléphone** : le parent essaie les builds sur son Galaxy
  S24 (derniers retours notés : build 50 et 13 novembre) ; rien n'est noté pour le voyage, la
  fenêtre de confidentialité, ni l'ouverture de ses liens.
- **Le site** : contrôlé automatiquement à la publication ; pas encore noté comme ouvert et
  joué par une personne sur le nouveau domaine.
- **L'anglais** : pas relu par une personne.

## À faire, dans l'ordre

1. **Faire jouer les enfants au voyage**, 30 à 45 minutes sur le téléphone, et noter : où ils
   tombent, si la marche devant le roi les décourage, combien de temps dure un voyage, ce
   qu'ils redemandent. C'est ce qui décide du point 4.
2. **Fiche Play** : mettre `https://snakeattacktd.com/confidentialite` comme adresse de
   confidentialité, puis importer l'AAB61 dans le canal interne. Le **build 62** (Codex)
   sera le premier build release optimisé : l'installer et le lancer avant de l'envoyer.
3. **Préparer le test fermé** : Google demande à un compte personnel 12 testeurs pendant 14
   jours avant la production. Il faut une fiche à jour (textes et captures du jeu actuel ; le
   dossier [publication/](publication/) décrit encore la 0.32.4) et une décision du parent sur
   une première sortie gratuite, sans publicité ni achat.
4. **Du contenu, choisi d'après la séance** : voyage sans fin si les enfants finissent le
   voyage, version 2 du voyage s'ils tombent devant le roi, nouvelles missions dessinées par
   le fils s'ils réclament du neuf. Une quatrième sortie ou de nouveaux terrains demandent
   l'accord du fils et une nouvelle révision des règles.

## Décisions qui attendent le parent

- Dire quand l'ancien site s'arrête ; il affiche déjà l'avis de migration.
- La marche devant le roi dans le voyage : l'accepter ou demander une version 2.
- À l'accueil, « Reprendre » s'affiche encore pour un joueur qui a tout fini : le corriger
  demande d'enregistrer une donnée de plus.
- Publicité et achats : repoussés ou abandonnés pour la première sortie.
- Connexion Google ou sauvegarde en ligne : écartée tant que le jeu vise d'abord les enfants
  (règles lues le 13 novembre, à relire avant toute décision).
- Mission 1 gagnable sans recruter : mesure, puis accord du fils et du parent avant toute règle.

## Dettes connues

- `reports/` : 845 fichiers de rapports encore suivis dans Git ; plusieurs scripts y écrivent.
- Les pages de test (`tests/*-harness.ts`) ne chargent pas les feuilles de style comme le jeu.
- `test:mobile-menus` est la plus longue tâche de la CI (10 à 17 minutes) ; à découper si
  elle grossit encore.
- Pour redonner de la place au paquet principal, la suite est de charger à la demande les
  fenêtres ouvertes rarement (joueurs, sauvegarde familiale, carnet de caprices).
- Détail des dettes de code : [bilan du nettoyage](BILAN-NETTOYAGE-2026-11.md).

## Où lire le détail

[Architecture](ARCHITECTURE.md) · [Voyage](VOYAGE.md) · [Site](SITE.md) ·
[Android](ANDROID.md) · [Caprices](CAPRICES.md) · [Bilan 0.38.0](BILAN-0.38.0.md) ·
[Passation](PASSATION-CLAUDE-CODE.md) · règles du jeu : `GAME_DESIGN.md`, `AGENTS.md`.
