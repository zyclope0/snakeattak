# Recette jouée et équilibrage — 9 novembre2026

Mandat : jouer quelques parties dans le navigateur, examiner graphismes,
interface, bugs et équilibrage. Baseac671ed, application0.34.1. Aucun changement
de règle, RNG ou sauvegarde prévu. Corriger un défaut d’interface seulement
après reproduction ; distinguer recommandations de modifications réalisées.

1. Parties sur le vrai site, contextes isolés : commandes et placements de
   l’interface, progression réelle, départs reproductibles via codes publics.
   Captures/vidéos courtes et journal de vagues. L’environnement n’expose pas
   de navigateur intégré pilotable (capabilities[] vide) : Chromium automatisé
   sert de navigateur réel, pas de session du parent.
2. Complément moteur indépendant : cohortes appariées de terrains/attaques/
   couvées et stratégies explicites, sans faux tests enfants ni réglages cachés.
   Mesurer durée, victoires, cristal, pertes, achats, morts et blocages.
3. Contre-vérifier les défauts ; conseil trois techniques + cibles6/9/12 simulées.
   Corriger les défauts d’interface confirmés en un lot borné, conserver les
   ajustements d’équilibrage comme propositions si les données le justifient.
4. Bilan : parties réellement terminées vs abandonnées, clics vs simulations,
   temps réel vs horloge de navigateur accélérée, captures, risques et suites.

Pas de génération payante, SDK, nouveau mode, mécaniques ou nombre de missions.
Budgets et anciens camps/codes conservés ; sources et rapports historiques intacts.

## Résultats initiaux et lot retenu

Neuf parties de0.34.1 réellement terminées sur le site : six missions jouées
en progression naturelle, deux contrôles Refuge (aucun achat et achats simples)
et une défaite classique sans recrutement à la vague5.30vagues observées,
8victoires/1défaite, aucune erreurJavaScript. Les commandes sont natives
souris/tactile ; codes saisis dans l’interface ; aucune écriture de sauvegarde
ou commande de moteur injectée. Horloge Playwright runFor + vitesse ×2 du jeu :
ce n’est pas une session enfant en temps réel, ni un test physique S24.

432simulations missions (6×18configurations×4stratégies), plus100classiques
(5profils×20graines). Ce sont des cohortes du moteur, séparées des neuf parties
navigateur et des fixtures UI. Aucun timeout de combat. L’ancien outil100 bloquait
après le cadeau de chapitre ; reproduction puis correction en utilisant le vrai
skipReward, politique neutre documentée, sans modifier les règles.

Défaut confirmé après chaque victoire et après la défaite classique : les actions
existent mais restent sous le catalogue caché/inert. Correctif0.34.2/code44 :
présenter un panneau de résultat à la place des favoris désactivés. Les mêmes
nœuds/boutons/handlers existants y sont déplacés, puis restaurés à la préparation.
Aucune progression, étoile, graine, reprise ou règle calculée une seconde fois.
Le joueur garde l’accès volontaire au catalogue. Focus d’entrée une fois ;
CTA48px, panneau défilant sur très petit paysage.

Recette contrôlée rouge sur l’action cachée, puis18cas UI verts (six états ×
trois formats). Les fixtures ne sont pas18parties. Verify441/441, buildHTML31774
etJS194697octets, budgets inchangés. Conseil demandé après ce lot.

Les statistiques suggèrent des débuts permissifs et un avantage des compositions
à distance en classique, mais aucune valeur de jeu n’est ajustée sans isoler
l’effet des programmes de test et vérifier avec le parent/fils.

## Après conseil et contre-vérification

Six avis terminés. Trois défauts d’interface du nouveau panneau reproduits
rouges dans l’app : accès catalogue perdu sur ordinateur, ordre Tab différent
de l’ordre visuel, CTA partiellement coupé avec marges système568. Correction
bornée : accès catalogue dédié desktop (même contrôleur), ordre des mêmes nœuds
aligné/restauré, défilement du seul panneau après focus.30états et35contrôles
verts, y compris marges24/32/16, sélection, catalogue et restauration.

Une partie locale complète du correctif (Refuge,3vagues) est gagnée et le bouton
visible ouvre réellement l’aperçu des Trois ponts. Une dixième partie publique,
classique avec davantage d’archers mais placements en avant, perd à la vague7 :
les résultats du bot distant au moteur ne prédisent pas le joueur sur l’interface.
Évaluation publique totale :10parties,37vagues,8victoires/2défaites,0pageerrors.
Les9premières et cette phase supplémentaire sont archivées séparément puis
réunies dans le journal, sans effacer les enregistrements.

Ruling : aucune valeur de jeu ajustée — les politiques changent aussi miel,
encouragement et placements ; seules3graines uniques par mission servent les
18paramétrages. Conclure à une unité trop forte serait prématuré. Risque assumé :
conserver provisoirement une courbe perfectible, contrôlable lors de l’essai familial.
Mineurs différés : étoiles plus saillantes, ancien texte central de défaite,
indice de défilement sur très petit paysage. Pas de nouvelle génération.
