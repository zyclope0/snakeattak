# Application — 0.30.2

Suite du lot 4. Priorité donnée par le parent à l'application pendant la
validation de son identité Play Console. Les lots 1, 3, 2 et 7 restent livrés ;
les lots commerciaux restent préparés, sans intégration. Prochaine étape :
lot 5, langues de l'application, après ce correctif de reprise.

## Problème observé et correction

Sur la 0.30.1, tourner le téléphone en portrait, passer en arrière-plan,
revenir puis retourner en paysage effaçait la pause d'interruption. Le test
navigateur l'a reproduit avant modification : `false !== true`, alors que le
joueur n'avait pas appuyé sur Reprendre.

Dialogues et rotation partagent maintenant des acquisitions de pause. Les
fermer dans n'importe quel ordre ne reprend jamais à la place d'une autre
acquisition. Une interruption conserve une pause jusqu'à Reprendre, y compris
quand `pagehide` précède le changement de visibilité. Une rotation seule
reprend comme auparavant. Fermer une ancienne fenêtre ne reprend pas un nouveau
Game. Une réouverture immédiate ignore l'ancien événement de fermeture différé.

Aucun changement aux soldats, serpents, trois voies, soins, boss, économie,
statistiques ou difficulté. Moteur, données et codecs sont inchangés. Aucune
dépendance, collecte, publicité ou génération d'image ajoutée.

## Vérifications et limites

400 tests natifs réussis ; types, compilation et budgets verts. Recettes
navigateur générale, mobile (six tailles/marges et quatre catalogues étroits),
interruptions et transport embarqué sans réseau réussies.

Les contrôles du lot sont dans `reports/interruptions-0.30.2.json` et
`reports/offline-0.30.2.json`. La recette de reprise observe le vrai temps du
moteur à 812×375, 375×812 et 1280×800, via une fixture absente de la distribution.
Les événements de visibilité/page sont simulés explicitement ; ils ne prouvent
pas le comportement natif d'Android 17 ou d'une ancienne WebView.

Le contrôle hors ligne coupe le réseau de Chromium et fournit exclusivement
les fichiers du build depuis le disque, comme un transport embarqué Capacitor.
Il charge les trois fonds à la demande, démarre une vague et recharge les
formats de camp 1 à 7 à partir d'instantanés synthétiques validés. Après une
fermeture/recharge, le dernier camp revient : aucun combat en cours n'est
transformé en sauvegarde inventée. Ce n'est pas un service worker ni une
promesse de fonctionnement du site web sans réseau après fermeture du navigateur.

Version Android 33 ; APK familial sans compteur de performances au démarrage.
La livraison contient le même build web que celui vérifié. Les mesures
FPS/RAM, verrouillage d'écran, appel entrant, navigation système et destruction
du processus restent à confirmer sur le téléphone du parent.

## Revue et maintenance des contrôles

Une revue indépendante a relu le correctif et le code adjacent, puis exécuté
les 400 tests natifs : aucun défaut critique, important ou mineur avéré.
Les perspectives moteur, Android et famille ne remplacent pas les essais réels
du parent et des enfants.

Le premier workflow GitHub du dépôt avait échoué sur un test de présentation
historique : il attendait un conseil visible sans ouvrir son volet, désormais
replié. Le scénario ouvre maintenant les vrais boutons de divulgation pour le
conseil et le statut de sauvegarde. Les deux échecs ont été observés avant la
correction ; les quatorze scènes réussissent ensuite. Les recettes interruptions
et paquet hors ligne rejoignent aussi la CI. Le portable et son parcours
navigateur sont vérifiés séparément ; aucun verdict de CI distante n'est déduit
de ces succès locaux.

## Choix du développeur

- Consolider la reprise du lot 4 avant les langues : évite une relance de combat
  surprise. Coût : le lot 5 vient après ce correctif.
- Conserver le worktree isolé déjà disponible et un suivi manuel, les helpers
  de skill n'étant pas accessibles sur disque. Aucun autre worktree n'est effacé.
- Pas de plugin natif supplémentaire sur la base d'un défaut reproduit dans
  l'interface ; si un événement manque sur le vrai appareil, le correctif natif
  sera justifié par ce retour concret.
- Le dossier store 0.30.1 reste historique ; aucune fausse preuve de mise à jour
  de ses captures ou de validation commerciale n'est produite.
