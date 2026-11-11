# Conseil et décisions — 0.20

Le parent valide 0.19 et demande une suite autonome, avec pour seule règle de
préserver l'esprit du jeu de son fils. Conseil simulé, pas d'essai d'enfant réel.
Référence préservée : /workspace/conquete-serpents-baseline-0.19.

## Conseil de direction

| Regard              | Choix et garde-fou                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Game design         | Célébrer 4/8/12 avec de vrais compteurs, sans nouveau cadeau ou système de points.            |
| Équilibrage         | Conserver exactement 0.19 ; aucune retouche motivée par les seuls résultats des bots.         |
| Interface/DA        | Bilan bref non modal, entrée secondaire Sauvegarde familiale, portraits existants.            |
| Développement       | Fichier borné, valideurs métier, aperçu puis écriture autoritative unique avant remplacement. |
| Projection 8–10 ans | Montrer son armée et ses étoiles ; garder le transfert de fichier hors du combat.             |

Alternatives écartées : davantage d'alliés/vagues, monnaies/badges, galerie persistante,
MVP fictif et synchronisation serveur. Les trois voies, les personnages et tous
les pouvoirs demandés par les enfants restent conservés. Le transfert n'est pas
présenté comme une correction des deux échecs file inexpliqués de 0.19.

Décision du principal : réaliser cette petite 0.20 sans attendre de nouvel accord,
conformément à l'autonomie explicite. Les deux domaines de données et de bilan
ont des fichiers séparés ; main/index/CSS et publication restent au principal.

## Conseil après données familiales

Les regards enfant/parent confirment le transfert des survivants, PV, ressources,
scores et équipes sans armée ajoutée. Architecture : une écriture autoritative
avant mutation ; robustesse : bornes, quota, blocage, copies, profils seuls et
anciens formats éprouvés ; équilibre : aucune récompense v3/v4 réattribuée.
Les formats v1/v2 sans historique gardent la conversion historique du décodeur.

Les tests ont révélé un piège des tableaux creux : JSON.stringify les convertit
en null. La validation structurelle des objets vivants précède désormais leur
sérialisation. 24 tests ciblés et 267 natifs passent après correction. Les APIs
camp et carrière restent utilisables par les anciens contrôleurs ; aucun module
de combat n'a été modifié. Décision : données acceptées pour intégration.

## Conseil après bilan de chapitre

Design/enfant : étoiles et armée valorisées ; équilibre : seuls les compteurs
réels sont lus ; interface : panneau repliable sans focus ni défilement forcé ;
développement : 21 types maximum, reprise statique, fraîche victoire observée.
Sept tests du modèle passent et le binder a été exercé dans Chromium à 320 px,
avec focus et défilement inchangés. La suite finale cohérente de l'agent données
confirme 267/267. Décision : bilan accepté, intégration CSS et transfert à éprouver.

## Intégration et transfert

Le scénario réel passe entre file et HTTPS local (certificat temporaire de test),
puis retourne vers file : fichier téléchargé, import confirmé, rechargement,
équipes, scores, survivants, ressources et cadeaux conservés. Une annulation ou
un fichier invalide ne change rien. Un profil sans camp ne réveille pas l'ancienne
armée. Import depuis un combat suspendu au menu et export pendant combat ont
également été exercés ; seul le dernier camp préparé est repris. Le stockage
refusé garde le dialogue et l'aventure actuelle, avec un message exact.

Le panneau de chapitre reprend les compteurs cumulés en les nommant comme tels,
et reste statique après une reprise. Les appareils physiques et la connexion
privée sur le site publié ne sont pas vérifiés par ce test local.

Contrôle moteur : 19 modules strictement identiques à 0.19, 32 comparaisons
appariées sur quatre graines nouvelles et huit profils, soit 64 exécutions.
Toutes les métriques hors mesure CPU/murale sont identiques, sans erreur ni timeout.
Aucune nouvelle passe de 1 024 simulations ni modification d'équilibrage n'est
revendiquée. Relecture indépendante en cours avant livraison.

## Relecture indépendante et corrections

Le relecteur frais n'a identifié aucun défaut critique ou important. L'import,
les copies défensives, le profil seul et la lecture asynchrone ont été examinés.
Un défaut mineur a été reproduit : les camps v1–v3 initialisent un minimum
historique synthétique. Le bilan qualifie désormais ce minimum comme indisponible
quand il est incohérent avec les étoiles ou la santé actuelle, sans modifier le
décodeur ni inventer une mesure. Régression RED puis GREEN sur les trois versions.

L'arrondi a aussi été éprouvé dans le vrai navigateur : un minimum de 89,9 ne doit
pas s'afficher comme 90 avec seulement deux étoiles. L'affichage est conservateur,
les règles de score restent inchangées. Aucun correctif de combat n'a été ajouté.

La revue refuse de conclure sur l'agrément d'un enfant, une tablette physique,
l'authentification/en-têtes de production ou la résolution des échecs file 0.19.
Ces limites sont conservées ; les contrôles globaux et publication restent les
dernières étapes de livraison.

Le contrôle visuel a aussi repéré le bouton de retour du dialogue familial : son
ancien style de bouton sombre devenait clair sur papier clair hors survol. Le
contraste 1:1 a été reproduit, puis le bouton a reçu le style secondaire adapté
aux dialogues. Le test vérifie un contraste d'au moins 4,5:1 sans survol. Aucune
modification de règles n'accompagne cette correction.

Le lanceur de comparaison est inclus dans scripts/control-020.mjs, avec chemins
relatifs vers le moteur 0.19 archivé. Sa reproduction vérifie les mêmes 32 paires.

## Contrôle de reprise décontaminé

La première passe complète a échoué sur le contrôle de récompense portable. Cette
fois le diagnostic a retrouvé `chapter-fixture=1` après sa suppression explicite.
Une seule écriture de ce marqueur existe : l'initialiseur persistant du test. Il
avait donc réinjecté le camp initial pendant la recharge. Cela ne démontre pas
pourquoi sa lecture précoce de la clé camp était vide.

La correction reste strictement dans le test : bootstrap terminé, injection
unique puis navigation, sans initialiseur de données aux recharges du scénario.
Les assertions de survivants, cadeau consommé et ressources sont conservées.
Un contrôle supplémentaire retire le miroir historique et vérifie que
l'enveloppe autoritative ramène toujours les quatre unités, sans réinjection de
fixture. L'ancien scénario échoue sur cette condition en RED ; la préparation
corrigée passe ensuite sur web et file. Une véritable perte de stockage ferait
toujours échouer les assertions, sans être remplacée par la fixture.

Une seconde lecture indépendante a validé cette décision. Aucun code de production
n'a été modifié pour obtenir ce résultat, et les réserves historiques de 0.19 ne
sont pas déclarées résolues. Le premier échec reste archivé dans la tentative 1.

## Conseil final et publication

Verdict final : version 0.20 acceptée pour livraison. Les 268 tests natifs et les
14 contrôles terminent sans échec ; les 32 comparaisons appariées donnent des
résultats identiques. Les personnages et règles du fils restent préservés.
Le service de publication confirme le déploiement réussi du build exact sur le
Site existant, à audience privée inchangée. Les réserves d’appareil physique,
d’observation d’enfant, de navigateur authentifié et de stockage file historique
restent explicites. Les archives livrées regroupent les preuves et le guide de
transfert ; elles ne constituent pas une synchronisation automatique.
