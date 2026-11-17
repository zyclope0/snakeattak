# Plan actuel — 15 novembre 2026

Une page. L'historique des livraisons et des lots jusqu'au 15 novembre est dans
[archive/PLAN-ACTUEL-avant-2026-11-15.md](archive/PLAN-ACTUEL-avant-2026-11-15.md).

## Livraison préparée — 0.38.0, Android build62, site snakeattacktd.com

- **Application** : 0.38.0 / build62 préparé par Codex le 15 novembre (AAB signé), à importer
  dans le canal de test interne de Google Play. Aventure de 12 vagues, 6 missions, 36
  caprices, le voyage (version 1, figée), quatre joueurs locaux, français et anglais, et la
  politique de confidentialité lisible hors ligne dans « Pour les parents ».
  [Bilan](BILAN-0.38.0.md), [Android](ANDROID.md), [Voyage](VOYAGE.md).
- **Site** : https://snakeattacktd.com sur Infomaniak, publié à la main depuis `main` par
  « Publier le site ». Politique de confidentialité publique à `/confidentialite`. L'ancien
  site `…chatgpt.site` reste en ligne et affiche l'avis de migration. [Site](SITE.md).

## Dans le build 62

- **Build release optimisé** : R8 activé pour répondre à deux remarques de la Play Console.
  Le build 62 est construit et signé, mapping embarqué, verify et navigateur verts.
  **Recette native passée selon le compte rendu du parent** sur Android15 x86_64/WHPX :
  hors ligne, victoire, reprise61→62, sauvegarde, Voyage, confidentialité et marges système.
  Aucun crash/ANR ; échec cloud non reproduit. Preuves conservées dans sa session Windows,
  non accessibles ici. PR 58 fusionnée le 15 novembre avec l'accord du parent ; aucun envoi à
  Play ni publication du site ([Android](ANDROID.md)).
- **Ménage du 15 novembre** : CI en cinq tâches parallèles, une seule fois par commit ;
  diagnostic de performance chargé à la demande (paquet principal 189,6 Ko sur 200) ;
  scripts et recettes morts retirés, recettes vivantes mises dans la CI ; ce plan ramené à une
  page.

## Dans `main`, pas dans le build 62

Le paquet 62 a été construit avant ces lots : ils attendent le **build 63**, à construire
depuis `main`. Le site est publié depuis `main` : le publier en même temps que le build 63,
parce qu'une grande aventure commencée sur le nouveau site ne se relit pas dans le build 62
([bilan de la révision 3](BILAN-REVISION-3.md), « À savoir avant de publier »).

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
  d'environ une minute. Le parent a revu quatre réglages sur 200 parties chacun et a gardé
  celui-ci ([bilan](BILAN-REVISION-3.md)). **Pas encore joué par les enfants.**
- **Trois nouveaux serpents** (idées du fils) : « Grands crocs » (morsure double, dès la
  vague 8), « Serpent rare » (très fragile, sa morsure fait tomber une Massue, vagues 8 et 11) et « Serpent ninja » (rapide, esquive le premier coup, dès la vague 6), dans la grande
  aventure seulement. C'est la **révision d'équilibrage 4**. Le parent a choisi ce que fait le
  ninja et accepté qu'un expert simulé gagne une partie sur deux (62 % → 52 %). **Noms et
  images provisoires** : au fils de nommer, au parent de décider des dessins
  ([bilan](BILAN-REVISION-4.md)). **Pas encore joué par les enfants.**

## Site : revue du 17 novembre

- Corrigé : « Jouer » dans le premier écran sur téléphone, liens de 48 px, en-tête de la page
  du jeu (deux noms, image de partage, icône d'écran d'accueil), images légères, prototype
  hors des résultats de recherche, deux erreurs d'anglais ([détail](SITE.md)).
  Fusionné et publié le 17 novembre.
- **Publicité sur le site** : la revue recommandait de ne pas l'activer ; le parent a décidé
  de poursuivre (tous les visiteurs sur grand écran, un seul cookie anti-fraude de Google,
  un moyen de la couper ; pas de publicité sur téléphone). **Rien n'est activé.** Les textes
  FR/EN, approuvés le 17 novembre, sont dans la politique de confidentialité et sur la page
  parents. L'encart et le bouton « couper la publicité » sont codés et éteints : le site
  publié n'en contient rien. Restent l'approbation du site par Google, le feu vert du
  parent, puis une capture sur le site en ligne :
  [proposition et ordre d'activation](publication/PUBLICITE-WEB-PROPOSITION.md).
- **Suite de la revue (17 novembre, accord du parent sur les six points)** : lien PayPal
  sur la seule page parents (les autres pieds de page y mènent), image de partage large
  faite d'une vraie bataille, titres « tower defense … pour enfants / for kids »,
  « Nouveautés » écrite pour l'enfant, bloc « Qui a fait ce jeu ? », lien « À propos du
  jeu » à 48 px dans « Pour les parents » ([détail](SITE.md)). **Pas encore publié** : à
  faire par « Publier le site », sur accord du parent. Rien n'est essayé sur le téléphone.

## Site : découverte FR/EN et soutien — lot du16novembre

-10pages publiques : présentation, comment jouer, personnages, nouveautés et parents,
chacune en FR/EN ; jeu et sauvegardes toujours à la même adresse. Sitemap, robots,
canonicals et partage préparés. [Détail et procédure Google/Bing](SITE.md).

- Soutien volontaire préparé mais **masqué**, sur décision du parent ; pas de destination
  de paiement configurée dans ce premier lot. Le soutien a ensuite reçu un GO
  distinct le16novembre2026 : voir la section suivante. Publicité repoussée.
- Build Android séparé dans `dist-android/` : aucun contenu Web ou soutien embarqué.
  Les AAB/APK62 existants ne sont pas reconstruits par ce lot.
- Vérification de propriété et soumission Search Console/Bing à faire dans les comptes
  du propriétaire ; ne pas confondre fichiers publiés et indexation effective.

## Ce qui n'est pas vérifié

- **Le voyage avec les enfants.** Réglé sur des joueurs automatiques, puis figé à la
  publication. Les simulations disent qu'un joueur « apprenti » tombe devant le roi trois
  fois sur quatre. Aucune séance d'enfant n'est notée dans le dépôt.
- **Le build 62 sur le téléphone** : essayé par le parent sur un émulateur Android 15, pas
  sur son Galaxy S24 (derniers retours notés sur le téléphone : build 50 et 13 novembre) ;
  la mise à jour distribuée par Play n'est pas essayée non plus.
- **Les lots d'après le build 62** (King Snake, index des serpents, catalogue en un écran,
  œuf de plus, trois nouveaux serpents) : dans aucun build, jamais vus sur un téléphone ni
  par les enfants.
- **Le site** : contrôlé automatiquement à la publication ; pas encore noté comme ouvert et
  joué par une personne sur le nouveau domaine.
- **L'anglais** : pas relu par une personne.

## À faire, dans l'ordre

1. **Faire jouer les enfants au voyage**, 30 à 45 minutes sur le téléphone, et noter : où ils
   tombent, si la marche devant le roi les décourage, combien de temps dure un voyage, ce
   qu'ils redemandent. C'est ce qui décide du point 4.
2. **Fiche Play** : mettre `https://snakeattacktd.com/confidentialite` comme adresse de
   confidentialité, puis importer l'AAB62 dans le canal interne. Le premier release
   optimisé a passé la checklist sur l'émulateur accéléré selon le parent ; mise à jour via
   Play et confort du build62 sur S24 restent à contrôler. Ensuite, **build 63** (Codex)
   depuis `main` pour les ajouts du fils, à essayer sur le téléphone avec les enfants.
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

## Soutien Web PayPal — accord du16novembre2026

- Lien public créé et approuvé par le parent : montant libre en CHF, ponctuel,
  sans adresse ni livraison. Pas de paiement réel par Codex.
- Activation dans les pages publiques FR/EN et leurs pieds de page ; menu du jeu
  conservé, Android/portable sans lien de paiement ni SDK.
- Section de confidentialité bilingue approuvée ajoutée à la source unique ;
  anciens engagements préservés, date16novembre2026. Aucun nouveau build Android signé.
- Plan : `docs/superpowers/plans/2026-11-16-web-paypal-support.md`.
- Recette et livraison : `docs/BILAN-SOUTIEN-WEB-2026-11-16.md`.
- Restent à constater par le titulaire lors d'une vraie contribution : identité
  sur le reçu, frais réels. Aucun anonymat ou avantage fiscal annoncé.

## AdSense Web — liaison avant examen Google

- Parent : fournisseur AdSense automatique, pas encore de partenaire direct ;
  ID public `pub-8498417364292905` ; domaine validé et examen demandé selon le retour du parent,
  approbation de diffusion encore non constatée.
- Première livraison : meta de validation Web et ads.txt uniquement. Aucun script,
  annonce, cookie publicitaire ou changement de confidentialité/CSP ; aucune modification Android.
- Plan : `docs/superpowers/plans/2026-11-16-adsense-verification.md`.
- Prochaines dépendances : approbation du site dans AdSense,
  cadrage enfant/consentement, confidentialité FR/EN approuvée et recette du placement.
- « Automatique » désigne la fourniture des annonces : un seul emplacement maîtrisé
  sur la page du jeu sera étudié, pas d’annonces automatiques intrusives ou en remerciements.

## Encart AdSense — conseil et préparation désactivée

Consensus appliqué : calcul de placement indépendant, maquette locale compilée
séparément, aucune réservation de place ou annonce sur le site public, Android
ou portable. Le plateau garde ses dimensions ; ses bornes Phaser sont rafraîchies
après déplacement, avec contrôle des coordonnées réellement recrutées.

Le bloc manuel `7092707633` est préparé, mais aucun chargeur Google n'est livré.
Restent avant activation : approbation du domaine, consentement et paramètres de
compte, puis confidentialité FR/EN approuvée. Pas de modification des règles,
sauvegardes, codes de départ ou du numéro de build Android.

Détail : [bilan de préparation](BILAN-ADSENSE-PREPARATION-2026-11-16.md) et
[plan](superpowers/plans/2026-11-16-web-ad-placement-disabled.md).
