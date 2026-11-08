# La Conquête des Serpents — aventure familiale 0.30

Le nouveau refuge de la version 0.30 ouvre progressivement les menaces : centre, deux voies,
puis trois. Les anciens codes et sauvegardes gardent leurs règles.
[Bilan et simulations](docs/BILAN-0.30.md) · [Conseil](docs/CONSEIL-0.30.md).

La version 0.29 met Jouer, la reprise et la prochaine mission au premier plan.
La préparation utilise trois cartes ; les codes sont côté parents. Les conseils
et actions du camp sont repliables, sans supprimer de pouvoir ni changer les règles.
[Bilan lisibilité](docs/BILAN-0.29.md) · [Conseil](docs/CONSEIL-AUDIT-3-2.md).

La version 0.28 rend les raccords secondaires plus étroits et en terre battue,
sous les voies pavées. Le fond bleu des bâtiments est retiré par un script local
reproductible. Positions, navigation et combat restent identiques.
[Bilan plateau](docs/BILAN-0.28.md).

La préparation Android 0.27.1 ajoute un diagnostic local activé par `?perf=1` et
un script de compilation APK debug. Les performances sur appareil réel restent
à mesurer. [Protocole Android](docs/ANDROID.md).

La version 0.27 rend le plateau et le HUD entièrement visibles sur ordinateur,
agrandit les commandes tactiles et garde le lancement des missions à portée.
Les messages de victoire et les contrastes de l’accueil sont corrigés.
Aucune règle de combat ni format de sauvegarde ne change.
[Bilan des contrôles](docs/BILAN-0.27.md).

La version 0.26 corrige la pause, la visibilité des serpents et le ruisseau,
agrandit le plateau sur téléphone, gère la rotation et le redimensionnement,
charge les images à la demande et garantit un nouveau terrain à chaque tirage.
Les anciennes sauvegardes et les codes de départ restent lisibles.
[Bilan et fichiers modifiés](docs/CORRECTIONS-0.26.md).

La version 0.25 généralise les terrains lisibles à tous les chapitres et missions,
avec trois ambiances. Les codes de départ permettent de retrouver une aventure
ou une expédition, avec aperçu et lancement explicite. Version visible à l’écran.
[Guide et validation](docs/CARTES-CODES-0.25.md).

La version 0.24 réutilise les vues d’acteurs et étiquettes médicales dans une
réserve bornée, ajoute Effets légers dans l’aide et un compteur réservé au
développement. Règles, sauvegardes et graphismes de la 0.23 sont préservés.
[Mesures et limites](docs/PERFORMANCE-0.24.md).

La version 0.23 refond uniquement la mission « Les trois ponts » : clairière plus
lisible, trois vrais ponts dégagés, bâtiments cadrés et ombres des acteurs.
Placement libre, règles et sauvegardes sont conservés.
[Présentation et validation](docs/BILAN-0.23.md).

La version 0.22 ajoute les bandages finis et le retour au fort, des serpents
volants après le rang 6 et un roi escorté à trois têtes distinctes. Les six
expéditions et les sauvegardes précédentes restent accessibles.
[Guide tactique](docs/TACTIQUE-0.22.md) · [Bilan](docs/BILAN-0.22.md).

La version 0.21 ajoute six expéditions à détachement neuf, trois terrains et
18 configurations annoncées par mission. Une victoire ouvre la suivante ;
l'aventure classique et ses camps restent séparés. Voir
[EXPEDITIONS-0.21.md](docs/EXPEDITIONS-0.21.md) et le
[bilan de validation](docs/BILAN-0.21.md).

Le moteur reste Phaser/TypeScript dans des modules, indépendant du HTML et du
réseau. Une enveloppe Android Capacitor est fournie :
[ANDROID.md](docs/ANDROID.md). Aucun APK/AAB compilé ou publié n'est revendiqué.

Jeu de défense inventé en famille. Version courte en Phaser 3, TypeScript et Vite.

## Jouer et développer

Node.js 24. Installer avec `npm ci`, puis `npm run dev`.

- `npm run verify` : format, tests, types, build et budgets de taille.
- `npm run test:browser` : essais ordinateur/tactile sur le build web ; serveur local démarré automatiquement.
- `npm run build` : site statique dans `dist/`, à servir en HTTPS. Les fichiers restent séparés et cacheables ; ne pas ouvrir cette version avec file://.
- `npm run build:portable` : version autonome dans `dist-portable/`. Ouvrir son `index.html` par double-clic sur PC.
- `npm run test:presentation` : scènes de contrôle du roi, des trois terrains, de toute l’armée et des mouvements réduits.
- `npm run test:render` : contrôle du rendu illustré et de sa restauration après perte du contexte WebGL.
- `npm run benchmark` : mesure reproductible de la simulation.
- `npm run balance` : 100 campagnes reproductibles, cinq stratégies sur vingt graines.
- `npm run balance:paths` : 540 sondes de traversée isolées, hors campagnes.
- `npm run format` : mise en forme du code source.

Pour les essais navigateur, installer Chromium une fois avec `npx playwright install chromium`.

L'archive contient également les deux distributions déjà compilées. Sur tablette, préférer un hébergement web. Le prototype V4 reste à côté de chaque distribution. [Architecture, performances et hébergement](docs/ARCHITECTURE.md).

Choisir un renfort, toucher le camp à droite, puis lancer la vague. Les soldats combattent automatiquement. Douze vagues et un roi à trois têtes à vaincre ; sauvegarde automatique du camp entre les vagues sur le même appareil. Les combats autonomes et les trois voies sont conservés. Le goûter est une option tactique facultative.

## Nouveautés 0.20 — chapitres et sauvegarde familiale

Un bilan repliable accompagne les chapitres accomplis : étoiles de ce passage,
cristal et armée présente. Les serpents vaincus sont comptés depuis le départ de
l'aventure. Les camps anciens affichent un minimum historique indisponible quand
il ne peut pas être établi ; aucune statistique individuelle ou récompense ajoutée.

Au menu, **Sauvegarde familiale** permet d'exporter un fichier, puis de l'importer
sur un autre navigateur ou sur le site. Il garde le dernier camp préparé, les
étoiles et les trois équipes. Un combat en cours est à rejouer depuis son début ;
les étoiles finales se conservent, sans sauvegarde du plateau de victoire.

L'import montre un aperçu et demande confirmation dans le jeu. Annuler, fournir
un fichier invalide ou rencontrer un stockage plein ne remplace pas la partie.
Un profil seul efface explicitement l'ancien camp. Le format est borné et une
clé autoritative permet le remplacement en une seule écriture persistante.

`npm run test:family` exerce file → HTTPS local → file avec un certificat de
contrôle temporaire (OpenSSL requis pour ce seul test), rechargement, cadeaux,
annulation, profil seul et stockage refusé. Aucun serveur ajouté au jeu publié.
Pour cette version 0.20, le combat restait celui de 0.19 : 19 modules inchangés, 32 comparaisons
appariées (64 exécutions) identiques. Le transfert n'est pas une synchronisation
cloud ni une résolution prétendue des échecs file antérieurs.

[Conseil et choix 0.20](docs/CONSEIL-0.20.md) · [Bilan 0.20](docs/BILAN-0.20.md).

## Nouveautés 0.19 — comprendre et varier l'aventure

Œufs annoncés pendant leurs trois dernières secondes, hésitation expliquée,
encouragement visible avec sa durée réelle, cible du crachat légendée. Les textes
du bandeau HTML relaient ces faits sur petit écran et respectent les priorités.
Les étiquettes d'œufs voisins se séparent sans déplacer les œufs du moteur.

Les cartes présentent l'intention des trois chapitres. Deux vagues seulement
changent d'ordre ou de cadence, avec les mêmes effectifs, variantes et budgets
de vie. Les premiers apprentissages et les pouvoirs des enfants restent intacts.
Le titre du menu est désormais entièrement lisible à 320 px.

Accès HTTPS privé : <https://conquete-serpents-famille.zyclope.chatgpt.site>.
La publication demande la connexion du propriétaire ; le jeu n'ajoute aucun
compte, serveur de gameplay ou API. La sauvegarde reste locale à ce navigateur
et à cette adresse : celle du ZIP ne s'y transfère pas automatiquement.

`npm run test:signals` vérifie les états simultanés, la pause et les mouvements
réduits sur quatre formats. Le protocole compare les moteurs à graines appariées,
puis les entraînements et deux moments d'encouragement sur une cohorte distincte.

[Conseil après les étapes](docs/CONSEIL-0.19.md) ·
[Chapitres et invariants](docs/CHAPITRES-0.19.md) ·
[Protocole avant résultats](docs/PROTOCOLE-0.19.md).

## Nouveautés0.18 — la vallée, les équipes et la progression

Accueil illustré, reprise de la partie et carte de trois chapitres. Les meilleurs
scores sont conservés (neuf étoiles maximum), avec de vrais camps de reprise aux
frontières de chapitres. Trois équipes de huit favoris personnalisent les raccourcis ;
le catalogue complet reste disponible aux prix et vagues habituels.

Le héros peut choisir un entraînement exclusif après la vague4. Un encouragement
de huit secondes est utilisable une fois par vague. Les portées initiales au
placement distinguent Contact, Tir et Soin. Les soldats restent autonomes.
Campv4 compatible avec1/2/3, progression séparée et reprise en mémoire si le
stockage du navigateur est bloqué (le rechargement de page requiert ce stockage).

[Analyse des inspirations et choix](docs/INSPIRATIONS-0.18.md) · [Validation](docs/BILAN-0.18.md).
`npm run test:journey` vérifie menu, équipes, progression, confirmation, reprise,
commandes, clavier et formats mobiles. Les simulations utilisent le stagecampaign018.

## Nouveautés 0.17 — les cadeaux de chapitre

Après les vagues **4 et 8**, choisis un cadeau parmi trois propositions : un
renfort offert, du miel plus durable, une protection limitée du cristal ou des
pièces. Les offres varient entre les parties ; un seul choix par étape, avec
possibilité de continuer sans bonus. Les soldats restent autonomes.

Le renfort est offert **à placer** : un emplacement refusé ne consomme pas le bon.
Les offres, choix et bons utilisés sont conservés au rechargement. Les anciens
camps v1/v2 sont lus et migrés vers le format v3. La protection du cristal ne peut
pas arrêter le roi lorsqu'il entre dans le camp.

`npm run test:rewards` vérifie les choix, rechargements, clavier, pause, bons et
téléphones. [Fonctionnement et validation](docs/BONUS-0.17.md).

## Nouveautés 0.16 — roi protégé et équilibrage mesuré

- Roi à trois têtes : trois phases, protections cassables et crachat annoncé au sol, à impact unique.
- Les attaques de mêlée brisent mieux ses protections ; les boucliers alliés continuent à protéger leurs voisins.
- Mutants rééquilibrés ; guide des unités aligné sur les dégâts réellement joués.
- Réglages immuables par campagne, moteur indépendant du rendu et laboratoire reproductible à huit profils.
- Pause, camps existants, douze vagues, trois voies et dégâts complets du dragon/tank conservés.

[Bilan des simulations et limites](docs/BILAN-EQUILIBRAGE-0.16.md) · [Protocole du laboratoire](docs/BALANCE-LAB-METHOD-0.16.md) · [Règles et tests du boss](docs/BOSS-MOTEUR-0.16.md).

`npm run balance:lab -- --help` décrit le lancement et les cohortes. Les résultats
et configurations sont inclus dans `reports/balance-0.16/`. La validation finale
est séparée des scénarios qui servent à choisir les réglages.

## Nouveautés 0.15 — interface et audit du moteur

- Plateau prioritaire, recrutement par portraits, commandes regroupées, vue agrandie et pause visible.
- Interface adaptée aux téléphones et tablettes en portrait et paysage ; cibles tactiles de 44 px.
- Redémarrage protégé contre un clic accidentel, dialogues cohérents et détail des règles à la demande.
- Moteur local renforcé : entrées invalides refusées, horloge bornée, sauvegardes cohérentes et camps très denses réorganisés sans perdre les survivants.
- Statistiques, vagues et pouvoirs conservés ; boss renforcé et protections reportés à une future version.

`npm run test:interface` vérifie les parcours d'interface et de clavier sur sept formats. [Design, références et choix](docs/INTERFACE-0.15.md) · [Audit moteur et preuves](docs/AUDIT-MOTEUR-0.15.md).

## Nouveautés 0.14 — bestiaire et lisibilité

- Quatre nouveaux dinosaures et deux mutants alliés ; ninja nettement plus rapide.
- Sonnette et hésitation courte, cobra royal (2 PV au tueur), mamba noir (3 PV au tueur) ; boss final à trois têtes. Poison à impact unique.
- Sol plus discret, silhouettes détourées et confusion visible ; filtres de famille dans le catalogue.
- Trois nouvelles planches illustrées, 832 crédits avec une correction après inspection.

[Détails des règles, recherches et images](docs/BESTIAIRE-LISIBILITE-0.14.md).

## Nouveautés 0.13 — deux miels et des rôles

- Choisir **Attirer** ou **Ralentir**, puis une voie. Un seul pot gratuit de 14 secondes par vague. Le miel collant suit un morceau du chemin et ralentit la marche de 45 % (roi : 25 %), sans attirer.
- Bouclier : protège un voisin proche de 60 % d'un tir de cracheur, recharge de 3 secondes. Sa réduction personnelle de 40 % reste conservée.
- Ninja : préfère les cracheurs exposés à proximité ; les urgences au cristal passent avant les réservations de cible.
- Serpent parapluie à partir de la vague 6 : sa feuille réduit de 75 % les flèches frontales en marche ; elle se rabat au contact. Massues, souffle et obus restent efficaces.
- Ondulation des serpents, frappes des combattants, souffle du dragon et rugissement visuel du petit dino, à partir des vrais coups. Signaux « Poc ! » et « Protégé ! ».
- Secours limités pour les groupes bloqués au pont, objectifs de déplacement projetés vers un point navigable près des rochers. Camps v2 compatibles.

Nouvelle planche Recraft V4 Pro via Magnific : **218 crédits vérifiés**, quatre images dans un atlas transparent de 336 234 octets. [Détails et contrôles](docs/MIELS-ROLES-0.13.md).

## Nouveautés 0.12 — le refuge et les antres

- Petit fort de gardiens en pierre et bois autour du cristal bleu, porte tournée vers les arrivants.
- Jauge de vie sur le plateau, réactions aux impacts et réparations, fissures aux seuils de 50 et 25 %.
- Trois antres illustrées suivant la clairière : racines, bois à rouages et vieilles pierres.
- Poussière/lueur et apparition progressive sur une sortie réelle ; éclosions signalées à leur œuf.
- Pause, mouvements réduits et redémarrage respectés. Règles, rythme d'apparition et sauvegardes conservés.

Une planche Recraft V4 Pro via Magnific, préparée en atlas 1024² : **218 crédits**
vérifiés (175 génération + 3 détourage + 40 préparation). Aucun appel payant en partie.
[Présentation et contrôles](docs/REFUGE-ANTRES-0.12.md).

## Nouveautés 0.11.1 — chemins vivants

- Routes courbes partagées entre dessin et déplacements, avec contournement des rochers, jonctions et convergence vers le cristal.
- Lit de terre, pavés irréguliers et bordures plus contrastées ; ponts réorientés dans le sens du passage.
- Sens d'origine propre à chaque figurine ; les monstres regardent leur cible lorsqu'ils mordent, y compris les soigneurs qu'ils dépassent.
- Miniatures plus petites, barres pleines masquées, alliés davantage espacés et deux traces de marche pour les serpents.
- Les tireurs arrière s'approchent à portée d'un front retenu, tout en conservant leur secteur ; cela évite les longs duels isolés.
- Reprise hors sentier près des rochers sécurisée. Prix, santé, dégâts et format de sauvegarde conservés. Aucun nouvel asset payant.

[Changements et contrôles](docs/CHEMINS-0.11.1.md).

## Nouveautés 0.11 — le livre des clairières

- Quinze alliés illustrés (quatorze personnages et la palissade), six familles de serpents et le roi cobra, œufs, miel, terrain et interface : des miniatures de conte en bois peint, générées avec Recraft via Magnific.
- Trois fonds et trois dispositions de rochers sur les douze vagues : clairière des fougères, bosquet ambré, jardin des vieilles pierres. Les survivants, leur vie et le trésor sont conservés quand le camp avance.
- Passages de pierre dans un roncier, pavés irréguliers, camp au cristal bleu. Les obstacles dessinés viennent des mêmes données que la navigation.
- Interface compacte bois/papier : le plateau prend la place principale, portraits communs à la boutique et au terrain, carnet de vague et guide conservés.
- Serpent à rouages : plaque résistante qui casse à mi-vie avec « Clac ! ». Serpent à ressort : alternance de lenteur et d’impulsion, annoncée avant son arrivée.
- Ciblage plus stable, priorité cristal conservée, couverture des tanks et dragons tenant compte de leur portée. A* et cache adaptés à chaque carte ; aucune IA réseau.
- Décor précalculé une fois par terrain et restauré après perte du contexte WebGL ; animations procédurales sur poses fixes, respect des mouvements réduits.

[Direction artistique, mesures et limites](docs/REFONTE-0.11.md). [Provenance et coût des images](public/assets/illustrated/PROVENANCE.md) : 2389 crédits Magnific, vérifiés sur le compte, sous le plafond annoncé de 2500. Les images de production pèsent environ 6,25 Mo au total et restent séparées du HTML web. Le jeu ne dépend pas de Magnific ou d’un service payant pendant une partie.

## Nouveautés 0.10 — défense vivante

- Les gardiens défendent leur secteur et reviennent au placement. Les tireurs attendent les intrusions ; ninjas et cavaliers restent mobiles et répartissent leurs cibles.
- Deux combattants proches peuvent secourir une défense bloquée. Les points de retour restent réservés pendant les déplacements.
- Ruées par petits groupes, arrivées sur trois fronts, couvées à éclosions décalées : les annonces décrivent les changements réels des vagues.
- Contact renforcé, archer à 150 pièces / 15 dégâts, cracheurs capables de menacer les tireurs. Progression des dégâts ennemis et du roi adoucie.
- Soins réservés aux alliés vivants ; les palissades ne sont plus réparées par les médecins. Les soigneurs n’immobilisent pas seuls les serpents.
- Repères de placement, guide des rôles et reprise des anciennes sauvegardes, y compris près des rochers.

[Comparaison des 100 parties par version](docs/DEFENSE-VIVANTE-0.10.md) : regroupement des combattants non mobiles au bord réduit d’environ 86,5 % à 5,4 % dans les relevés. 87 victoires sur 100 pour la nouvelle version, aucun blocage. Les armées à distance restent les plus sûres dans ce lot ; l’équilibre et le plaisir demandent encore un essai avec les enfants. Aucun nouvel asset ni serveur dans cette passe.

## Diagnostic d’équilibrage

[Résultats des 100 campagnes et mesures des chemins](docs/EQUILIBRAGE-100.md). Ce bilan historique de la 0.9 est conservé comme référence ; la comparaison actuelle est présentée ci-dessus.

## Nouveautés 0.9 — comprendre en jouant

- Boutique sur les unités disponibles par défaut ; les prochains renforts restent consultables dans « À découvrir » et dans le guide.
- Premiers gestes accompagnés : choisir un allié, repérer des cercles bleus libres, placer puis lancer. Les cercles sont des suggestions : toute place légale dans le camp reste autorisée.
- Le losange bleu des alliés est repris dans les cartes de recrutement ; un triangle orange signale les serpents. Une légende explique les deux repères.
- Le miel signale les décisions réellement influencées aux jonctions avec « Miam ! » et une trace. Le compteur indique les changements de voie provoqués, pas le nombre de serpents uniques. Un gourmand peut rester dans sa voie si elle contient déjà le miel.
- Annonces de sauvegarde corrigées : seul le statut du stockage peut confirmer une sauvegarde. Stockage absent, bloqué ou saturé : le jeu reste jouable et l’indisponibilité est affichée.
- Le passage du roi dans le cristal provoque la défaite : cet enjeu est annoncé avec sa ponte.

Aucun rééquilibrage, changement de prix ou de probabilité d’attraction. Une comparaison sur plus de 20 000 pas de simulation, avec achats et miel, retrouve les mêmes états de jeu et tirages que la 0.8, en excluant les nouveaux signaux visuels et leur compteur. Seules les coordonnées invalides non finies sont maintenant explicitement refusées au recrutement.

Les achats et réparations restent possibles pendant le combat, comme dans les versions précédentes ; ils sont bloqués en pause et en fin de partie. Aucun nouvel asset payant généré pour cette passe.

## Nouveautés 0.8 — le roi entre en scène

- Nouveau roi cobra couronné, créé avec Recraft V4 Pro via Magnific, dans le style du serpent existant. Image détourée et préparée en 768 × 768 (436 Ko).
- Annonce du roi au moment où il apparaît vraiment, barre de vie persistante et signature sonore si les sons sont activés.
- Dégâts et soins visibles : nombres courts, réactions, petits éclats et cercles de soin. Les corps réagissent sans modifier leur position dans la simulation.
- Annonces des vagues, éclosions et fins de vague ; pertes alliées signalées sans violence graphique.
- Victoire : célébration, bilan et bouton pour rejouer.
- Respect de prefers-reduced-motion pour les nouveaux déplacements décoratifs, déformations et secousses.

Les règles, prix, statistiques, IA et sauvegardes restent ceux de la 0.7. La présentation est une couche d’observation indépendante et bornée (40 textes flottants, 24 éclats). Il s’agit d’animations procédurales ; les unités n’ont pas encore des sprites dessinés image par image. La mise en scène du roi est jouée dans le moteur, sans vidéo à charger.

MCP : Recraft est accessible ici via Magnific et a été utilisé pour le roi. Higgsfield est connecté ; aucun clip vidéo n’a été généré pour cette passe. Icons8 n’a pas été trouvé dans les outils ou dans la recherche de plugins de cette session.

## Nouveautés 0.7 — la grande petite armée

Le catalogue du ZIP est réintégré : héros, massue, bouclier, batteur, archer, infirmier, médecin, ninja, chevalier, cavalier, chevalier à deux têtes, bébé dragon, petit dinosaure et tank. Ils sont tous alliés. La palissade reste une défense supplémentaire. Les prix et les vagues de déblocage sont des propositions d’équilibrage, pas une copie des valeurs V4.

- Bouclier : réduit les dégâts reçus de 40 %. Chevalier : réduction de 20 %.
- Infirmier : soin de 14 PV ; médecin : soin de 24 PV.
- Cavalier : charge renforcée après un déplacement prolongé.
- Chevalier à deux têtes : frappe deux voisins.
- Tank : blindage de 15 %, obus de groupe à longue portée, mobilité lente.
- Guide de notre armée : toutes les unités, leurs statistiques et leurs pouvoirs, même avant déblocage.
- Sons synthétiques locaux pour les combats, soins, vagues, œufs et fins de partie. Coupés au départ ; activation par le bouton Sons. Pas de musique ni de fichiers audio externes.
- Boutique à défilement ; sur téléphone, sélectionner un renfort ramène le camp à l’écran pour le placement.

## Nouveautés 0.6 — une aventure complète en douze vagues

- Préparation : annonce des menaces et des unités à venir avant chaque vague.
- Serpents vifs, carapaces résistantes et cracheurs à distance ; variantes introduites progressivement.
- Bébé dragon à la vague 4 : souffle de groupe. Petit dinosaure à la vague 6 : combat robuste au contact.
- Roi cobra final qui pond de nouveaux œufs ; ces éclosions doivent aussi être repoussées pour gagner.
- Sauvegarde automatique du dernier camp préparé : survivants, santé et pièces. Recharger pendant un combat reprend ce camp, puis la vague peut être rejouée. « Nouvelle partie » remplace la sauvegarde.

La sauvegarde utilise le stockage local du navigateur, avec validation et format versionné. Elle ne voyage pas entre PC et tablette. Dans certains navigateurs privés ou avec file:// elle peut être indisponible ; le statut l'indique et le jeu continue. Les œufs ordinaires sont plafonnés à trois par vague, et les œufs du roi peuvent s'y ajouter. Les chiffres sont des propositions d'équilibrage pour jouer en famille.

## Nouveauté 0.5 — le goûter des serpents

Pendant une vague, utilisez les boutons Haut / Centre / Bas du panneau au miel. Un goûter gratuit par vague influence pendant 14 secondes les choix au départ et aux jonctions. 75 % des décisions ordinaires suivent directement le miel, puis les autres suivent l’IA habituelle ; le roi cobra ne cède directement que dans 25 % des cas. Les unités ne se téléportent pas et un combat engagé reste prioritaire. Les œufs conservent leur voie d’éclosion ; leurs serpents sont ensuite tentés aux jonctions comme les autres.

Le pot est facultatif : sans utilisation, l’IA et la séquence aléatoire habituelles sont conservées à graine égale. Pause et vitesse s’appliquent à sa durée en temps de jeu. Il disparaît à la fin de la vague, puis se recharge pour la suivante. Pas de coût en pièces, de serveur ou d’API.

## Structure technique 0.4

Moteur sans navigateur, session séparée, dessin du terrain, rendu des entités et commandes HTML dans leurs propres modules. Le HTML n'embarque plus le moteur ou les images dans le build web standard. Le format tout-en-un reste disponible uniquement dans l'export portable.

Un workflow de vérification GitHub est fourni dans `.github/workflows/check.yml`. Les contrôles ont été exécutés localement dans le cloud ; aucun dépôt distant ni hébergement n'a été créé.

## Nouveautés — trois voies et œufs

- Trois ponts et deux liaisons verticales ; les changements de voie empruntent les jonctions visibles.
- Décisions ennemies au départ et à deux jonctions, pondérées par les défenses vivantes (puissance, santé, soins et palissades).
- Part tactique croissante avec les vagues ; une part aléatoire subsiste. Pas d’apprentissage automatique : IA locale à règles explicites.
- Une graine différente à chaque nouvelle partie ; une simulation avec la même graine reste reproductible pour les tests.
- Un à trois œufs par vague, incubation de 7 à 15 secondes, chacun libère deux serpents plus fragiles. Éclosions suspendues en pause.
- Soldats autonomes : priorité combinant distance, protection de leur voie d’origine et menaces proches de la base.
- Indicateurs relatifs de défense haut/centre/bas et nombre d’œufs restant ; flèches lors des changements de voie.

## Implémenté

- Douze vagues configurables, ennemis spécialisés et boss final qui pond.
- Deux massues et un héros au départ ; massues, archers, ninjas, médecins et palissades recrutables.
- Combats, soins des vivants et déplacements autonomes A* avec cache ; évitement local simple.
- Économie, réparations, santé de base, victoire/défaite et contrôles tactiles.
- Terrain et soldats dessinés en code ; serpent issu de Magnific, PNG détouré.
- Prototype V4 préservé dans `public/prototype-v4.html`.

## Limites du pilote

Pas de sauvegarde cloud, musique ni animation dessinée image par image. Les personnages utilisent des mouvements procéduraux simples ; le roi possède une silhouette à trois têtes et des protections finies. Les palissades arrêtent les ennemis par le combat, sans modifier la grille statique de navigation. Équilibrage proposé à tester avec l'enfant. Smartphone utilisable, tablette ou ordinateur conseillés pour la lisibilité du terrain.

## Fichiers

- `src/waves.ts` : campagne et annonces.
- `src/enemies.ts` : variantes ennemies.
- `src/checkpoints.ts` : format versionné et stockage local.
- `src/ai.ts` : évaluation des voies et choix pondéré.
- `src/data.ts` : statistiques et équilibrage.
- `src/game.ts` : simulation déterministe indépendante du navigateur.
- `src/navigation.ts` : grille et A*.
- `src/main.ts` : démarrage.
- `src/session.ts` : session et pas de simulation.
- `src/render/` : terrain et personnages.
- `src/ui/controls.ts` : commandes et indicateurs.
- `tests/game.test.ts` : règles et régressions de gameplay.
- `tests/browser.mjs` : essais ordinateur et tactile.
- `public/assets/enemies/PROVENANCE.md` : provenance du serpent et conditions à vérifier avant distribution.

## Retrouver le projet

Les fichiers de cette tâche sont dans son environnement cloud `/workspace/conquete-serpents-codex`. Ils ne sont pas automatiquement copiés sur le PC. Télécharger l'archive source permet de reprendre ce dossier dans un autre environnement Codex. L'archive contient les règles et le plan pour reprendre sans l'historique de la discussion.
