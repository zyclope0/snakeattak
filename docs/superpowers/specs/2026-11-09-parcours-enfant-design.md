# Parcours enfant — reprise autonome du plan

## Mandat et limites

Le 9 novembre 2026, le parent délègue la suite du plan sans interruption pour les
choix ordinaires et demande un conseil après chaque lot : trois personas
techniques, trois profils cibles. Cela remplace les STOP intermédiaires de la
mission précédente pour les travaux réversibles non critiques ci-dessous.
Ce sont des avis simulés ; aucune compréhension enfant ou recette S24 réelle
n'en sera déduite.

Préserver règles, RNG déterministe, sauvegardes et codes anciens. Pas de nouveau
verrou d'outil, Facile, appel anticipé, mission, unité, statistique ou récompense.
Pas de terrain crue/marais intégré, génération payante, SDK commercial, choix de
package, produit/prix, collecte ou publication Play. La direction artistique
validée est celle de l'icône : pâte à modeler / papier mâché, reliefs arrondis et
matière faite main ; la lisibilité sur mobile prime sur la densité décorative.

## Choix de réalisation délégués

Le brainstorming est borné par les choix déjà validés et le mandat « réponds
toi-même aux questions non critiques ». Deux approches restantes : masquer les
outils par mission changerait leur disponibilité et exige une règle validée ;
les expliquer à la demande conserve tous les choix de l'enfant. Je retiens
l'explication, sans nouvelle obligation ni fenêtre automatique.

Pour la progression, conserver les six boutons fonctionnels plutôt qu'inventer
une carte interactive ou de nouvelles régions. Les présenter comme un chemin
illustré, dérivé des étoiles et déblocages réels, avec les mêmes commandes.
Conserver Jouer/reprise en premier. La liste reste repliable pour petits écrans.
Aucune génération n'est nécessaire : portraits existants, petits éléments SVG/CSS
et dérivé local de l'icône déjà fourni suffisent. L'harmonisation de tous les
sprites n'est pas prétendue accomplie.

## Lot A — outils compréhensibles, v0.33.0

Une aide courte et illustrée à la demande pour miel, encouragement, réparation
et entraînement. Accessible par le dock sans augmenter sa hauteur : le bouton
? occupe la place du X lorsqu'aucun placement n'est choisi ; X revient pendant
un placement. Même aide accessible dans les actions du camp. Un sujet à la fois,
quatre sélecteurs, Quand / geste / résultat, fermeture facile. Réutiliser
pauseForDialog : fermer l'aide ne relance pas une pause utilisateur/interruption.
Ne pas modifier sélection, RNG, économie ou campagne en consultant l'aide.

Corriger l'indication d'entraînement : classique après vague 4 ; expédition selon
unlockRank de la mission, jamais inventer un verrou « mission5 ». Conseil contextuel
pour cristal blessé et entraînement éligible seulement en préparation, après les
priorités de placement, danger, encouragement et miel existantes.

## Lot B — progression illustrée, v0.33.1

Six étapes, mêmes identifiants et vraies étoiles, états « terminé », « prochaine »
et « verrouillé » lisibles sans dépendre seulement d'une couleur. Même progression
et budget, aucune étoile accordée par l'interface. Portraits actuels et matière
artisanale, traits reliant les boutons ; conserver le gros Jouer et la reprise,
les boutons existants et la navigation clavier/tactile. Petit aperçu de l'icône
retenue permis dans l'accueil, pas l'original HD de 2048 px dans le runtime.
Aucun fond de mission future chargé au seul affichage du menu.

## Lot C — transitions et livraison

Reproduire aide ouverte→interruption→fermeture→reprise, sélection→aide→retour,
mission→accueil→reprise, stockage bloqué et anciens camps/codes. Corriger uniquement
les défauts observés ; aucune refonte de simulation. Livrer l'APK debug normal,
sans diagnostic imposé, même identifiant et certificat. Synchroniser le site
après réussite des contrôles ; pas de publication commerciale.

## Conseils et critères

Après chaque lot : six perspectives indépendantes, trois techniques (architecture
et sauvegardes ; Android/performance ; UX/accessibilité) et trois cibles simulées
(enfant 6 ans peu lecteur ; enfant 9 ans habitué ; enfant 12 ans tacticien). Rapporter
objections, arbitrage et limites, jamais un faux essai humain.

Build et suite native, navigateur et audit13/13 ; plateau≥85% hauteur et≥65%
largeur en812×375, trois voies visibles et pause unique. Recettes contextuelles
sur1280×800,1366×768,780×360 tactile et portrait375×812. Anciens camps/codes
chargés, même déroulement moteur puisque ses fichiers restent inchangés.
