# Correctif tactile des renforts — 0.32.1

Signalement du parent sur l'APK S24 : « Ça bouge pas » lors du balayage dans le
catalogue des renforts. Reproduit dans Chromium avec de vrais événements
Input.dispatchTouchEvent, sans déplacer scrollTop pour l'action vérifiée.

## Cause et correction

En paysage compact, le panneau extérieur pouvait défiler, mais la grille #shop
conservait overflow:auto et overscroll-behavior:contain. Avec une hauteur égale
à son contenu, cette grille n'avait rien à faire défiler et bloquait le relais
du geste vers son parent. Le même balayage passait de 0 à 117 px de déplacement
après suppression de ce piège dans le diagnostic.

Deux propriétés CSS dans la media query compacte : la grille reste visible et
laisse son parent gérer le défilement. #reinforcements conserve sa hauteur
bornée et son confinement pour que la page ne bouge pas à la fin de la liste.
Le catalogue de grand écran garde son défilement propre. Aucun gestionnaire
JavaScript de glissement, changement de moteur, prix, RNG ou sauvegardes.

## Recette

Régression RED sur la 0.32.0, puis GREEN : cinq configurations paysage/marges,
balayages sur cartes disponibles et verrouillées, montée et descente, absence
de sélection/achat/fermeture involontaire, sélection préalable conservée,
sélection par tap encore fonctionnelle et grand écran1280×800.
Le programme prépare parfois un cas en remettant le panneau en haut ; tous les
contrôles de glissement utilisent ensuite de vrais gestes natifs Chromium.
Ce n'est pas un test physique du S24 ni de ses gestes système.

La nouvelle recette passe sur cinq configurations compactes et sur grand écran,
y compris après une sélection préalable d'allié. Les 423 tests, les types, le
build et les budgets passent. Les recettes générales, mobiles (six configurations et quatre catalogues
étroits), interruptions (11 scénarios) et hors ligne (formats 1 à 7 et trois
fonds embarqués) passent aussi. Portable : build et navigateur passent. APK 0.32.1/code 36 compilé hors ligne,
démarrage normal, même certificat et identifiant. Ses 27 fichiers web sont
identiques au build testé. Site public publié en 0.32.1 (version Sites15), commit statique
`44cee24827e0a660eb69d8adda84b1f8f025ee1b`, archive du commit poussé.
Reçus : `reports/verification-0.32.1.json`, `reports/deployment-0.32.1.json`.
URL : https://conquete-serpents-famille.zyclope.chatgpt.site/.
Rapport : `reports/reinforcements-scroll-0.32.1.json`.

## Périmètre

Version patch 0.32.1, identifiant Android conservé et certificat debug précédent.
Conçu pour une mise à jour par-dessus l'application existante. Six missions et
règles inchangées. Le parent doit encore confirmer le confort sur son appareil.

## Relecture et choix de réalisation

Relecture indépendante du correctif : aucun point critique, important ou mineur.
La revue ne couvre pas les essais physiques sur S24 ni la livraison distante.
Le responsable a vérifié signature, fichiers embarqués et publication ci-dessus ;
le S24 reste à confirmer par le parent.

Le worktree hôte isolé est conservé. Choix d'un correctif CSS natif limité à la
vue compacte, sans gestionnaire de gestes supplémentaire. La zone extérieure
retient toujours le défilement aux bords, et la vue de grand écran conserve sa
propre grille défilante. La livraison utilise le mandat autonome existant pour
le Git privé et le même site public ; aucune publication Play.

## Suivi de l'audit — étape 0 du 8 novembre 2026

**Contre-vérification documentaire sur 36305b8 : terminée. STOP demandé par le
parent ; aucune étape 1 à 4 commencée.** L'application reste en 0.32.1/code 36,
aucune nouvelle livraison ni publication. Cette section complète le bilan
historique ci-dessus sans le réécrire. Seul « Suivi v0.32.1 » de la nouvelle
pièce jointe est traité. Les instructions du parent priment sur les propositions
de l'audit. [Original et empreinte](audit-source-2026-11/manifest-suivi-0.32.1.json).

### Constats, état et preuves

« Fait » signifie ici contre-vérifié ; les correctifs restent **pas faits**
jusqu'aux GO prévus. Aucune règle ni image source n'a été modifiée.

| Constat de l'audit                                          | Fait / pas fait                                                           | Preuve et portée                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Catalogue complet sur ordinateur et environ 150 px vides | Vérifié et confirmé ; correction pas faite                                | À 1280×800 : 10 cartes, 2 onglets, 1 filtre ; dock masqué. Canvas 931,97×525,30 px, de y=117 à 642,30 : reste 157,70 px jusqu'à 800. Page sans défilement. [Capture](captures-suivi-0.32.1-etape-0/combat-1280x800.png), [mesures JSON](../reports/suivi-0.32.1-etape-0/geometries.json) ; src/style.css:300 et :3780.                                                                                                                                                                                                                                                    |
| 2. Bandeau CRAC sur la voie du haut et les puces            | Vérifié, avec nuance géométrique ; correction pas faite                   | [Capture naturelle vague 2, tactile](captures-suivi-0.32.1-etape-0/evenement-vague2-780x360.png). Annonce sur deux lignes, rectangle logique (165,60,770,69), src/render/battleFeedback.ts:112. Chevauchement de 2,81 px avec le bord inférieur des puces HTML ; leur texte reste devant le canvas (src/style.css:3713). Le chemin pavé n'est pas couvert dans cette capture, mais il l'est sur le terrain 1 : 13 unités logiques, soit environ 6,5 px à cette échelle. Ne pas interpréter l'audit comme un masquage systématique de toute la voie ou du texte des puces. |
| 3. Réécriture au tutoiement, 13 sources au vouvoiement      | Mécanisme confirmé ; nombre 13 contesté ; correction pas faite            | [Inventaire AST avec textes et lignes](../reports/suivi-0.32.1-etape-0/textes-sources.json) : 9 chaînes waves, 9 missions, 3 game, soit **21**, en incluant les impératifs sans pronom. src/ui/childCopy.ts:1 et :31 assurent les substitutions. Deux autres chaînes sont reconstruites à la reprise, src/checkpoints.ts:233 : elles ne sont pas simplement du texte historique enregistré. L'étape 2 doit donc traiter aussi ce fichier.                                                                                                                                 |
| 4. Trait blanc sous les pieds du héros à l'accueil          | Vérifié et confirmé ; correction pas faite                                | [Détail ordinateur](captures-suivi-0.32.1-etape-0/heros-1280x800.png), [détail tactile](captures-suivi-0.32.1-etape-0/heros-780x360.png). Pixels blancs dans src/assets/illustrated/allies-front.webp, première case ; src/art.ts:47 sélectionne cette case, :94 définit son cadrage CSS ; src/ui/menu.ts:120 l'utilise à l'accueil. Pas un défaut de barre système.                                                                                                                                                                                                      |
| 5. Mission 1 : 2 étoiles sans recrue, 3 avec une seule      | Exemple confirmé, résultat non universel ; aucun changement de difficulté | Code **REFUGE-2-FZZZ-ZZR4-9F**, règles 2, seed 4294967294 : zéro recrutement → 2 étoiles/cristal 73 ; un archer en (900,324) → 3 étoiles/cristal 91. Six départs × deux politiques, **12 victoires**. D'autres départs font déjà 3 étoiles sans recrue ; un autre n'en fait qu'une. [Observations complètes](../reports/suivi-0.32.1-etape-0/refuge-observations.json). L'audit est juste comme observation, pas comme règle générale d'équilibrage.                                                                                                                      |

### Mesures avant correctif

| Fenêtre CSS            | Canvas CSS     | Catalogue / dock                  | Défilement de page |
| ---------------------- | -------------- | --------------------------------- | ------------------ |
| 1280×800               | 931,97×525,30  | Catalogue 10 cartes ; dock masqué | 0 px               |
| 1366×768               | 1017,98×573,78 | Catalogue 10 cartes ; dock masqué | 0 px               |
| 780×360 tactile, DPR 3 | 553,55×312,00  | Dock actif ; catalogue fermé      | 0 px               |

Captures avant correctif : [ordinateur 1280](captures-suivi-0.32.1-etape-0/combat-1280x800.png),
[ordinateur 1366](captures-suivi-0.32.1-etape-0/combat-1366x768.png),
[tactile 780](captures-suivi-0.32.1-etape-0/combat-780x360.png).
Les trois accueils et trois recadrages du héros sont dans le même dossier.
Mesures getBoundingClientRect sur le build de production, profils neufs, zoom
navigateur 100 %. Le code ci-dessus est chargé par l'interface publique.
La vague 2 est jouée sans modification d'état, après le bouton de vitesse ×2.
Les dimensions 780×360/DPR3 sont une **émulation Chromium**, pas une capture
d'Android physique ni une mesure de FPS sur le S24.

Pour l'annonce, laneRoad(0, missionLevel(layout)) est échantillonné sur son
intervalle x=165..935. Les minima du bord pavé (largeur 56, demi-largeur 28)
sont y=140,14 / 116 / 137,38 pour les terrains 0/1/2 ; le bandeau finit à y=129.
Seul le terrain 1 empiète donc sur les pavés. Les épaules très transparentes
(largeur 82) atteignent aussi le bandeau sur les terrains 0/2. Sources :
src/levels.ts:86, src/routes.ts:12, src/render/refinedTerrain.ts:44.
[Mesures consolidées](../reports/suivi-0.32.1-etape-0/contre-verification.json).

Les simulations du constat 5 utilisent le moteur inchangé, un pas de 1/30 s,
lancement immédiat des vagues depuis l'état preparing, aucun miel, pouvoir,
entraînement ni réparation. L'archer est acheté une seule fois via Game.recruit.
Elles constatent le comportement existant : pas un nouveau réglage, pas douze
tests ajoutés et pas un essai de compréhension avec un enfant.

### Commandes exécutées pour cette contre-vérification

| Commande                  | Résultat actuel                                                                             | Preuve conservée                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| npm run verify            | Code 0 ; **423 tests, 423 réussites, 0 échec** ; formatage, TypeScript, build et budgets OK | [Journal](../reports/suivi-0.32.1-etape-0/verify.log)                                                                                     |
| npm run test:browser      | Code 0 ; parcours ordinateur et mobile, 0 erreur JavaScript ; reprise du camp testée        | [Journal](../reports/suivi-0.32.1-etape-0/browser.log)                                                                                    |
| npm run test:audit        | Code 0 ; **13/13 contrôles**                                                                | [Rapport actuel](../reports/suivi-0.32.1-etape-0/audit-baseline.json), [journal](../reports/suivi-0.32.1-etape-0/audit.log)               |
| npm run test:child-mobile | Code 0 ; **6 configurations**, 0 erreur                                                     | [Rapport actuel](../reports/suivi-0.32.1-etape-0/child-mobile-baseline.json), [journal](../reports/suivi-0.32.1-etape-0/child-mobile.log) |

Les sorties fraîches sont archivées ici ; les anciens rapports suivis par Git
ont été restaurés à leurs octets initiaux. Les 13 contrôles de l'ancien audit
peuvent passer malgré les nouveaux défauts : ils ne contrôlent pas un dock
ordinateur identique au téléphone ni la superposition des annonces. Aucun
nouveau test ou correctif n'est ajouté à cette étape documentaire.

### Écarts, risques et décisions en attente

- Le décompte de textes sources est plus large que celui annoncé. Retirer
  childCopy demande de conserver les formulations simples voulues et de relire
  les messages de reprise ; une mise à jour des instantanés ne devra pas cacher
  une différence de simulation. Les anciens codes et formats restent requis.
- Récupérer 150 px de hauteur ne découle pas automatiquement du dock simplifié :
  au ratio 1100/620, le plateau a besoin de plus de largeur ou d'une disposition
  différente. Avec une colonne latérale de 176 px et le même espace entre
  colonnes, le gain ne serait qu'environ 76 px. L'étape 1 devra maximiser le
  plateau sans étirement, découpe des voies ni défilement et publier le gain réel.
- Mission 1 indulgente : compatible avec le tutoriel ; **aucun rééquilibrage**,
  mode Facile ou appel anticipé dans cette mission. Les observations de bots
  ne prouvent pas l'expérience de tous les enfants ni toutes les configurations.
- Pas de nouveau test physique S24, d'APK compilé, de performance Android, de
  nouvelle publication, de changement d'identifiant, d'image générée, de SDK ou
  d'achat. Le parent teste l'APK seulement après l'étape 1. Aucun import physique
  supplémentaire d'ancienne sauvegarde ; les sources/formats restent inchangés.
- MONETISATION.md n'est pas encore corrigé : architecture de reçus serveur et
  compte Play indiqué absent à traiter à l'étape 4 documentaire. Ne pas confondre
  ce cadrage avec l'autorisation d'activer une publicité ou un achat.

**Question en attente : GO pour l'étape 1 / v0.32.2 ?** L'ordre 1 → 2 → 3 → 4 et
les arrêts du parent sont enregistrés dans [PLAN-ACTUEL.md](PLAN-ACTUEL.md). Aucun
accord n'est déduit de l'ancien mandat autonome. Seuls des documents, captures
et rapports de preuve ont changé pendant l'étape 0.
