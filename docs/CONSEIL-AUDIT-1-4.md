# Conseil — affichage et préparation Android

8 novembre 2026. Revue par trois angles ; ce ne sont pas des essais d’enfants réels.

**Interface parent/enfant.** Le plateau retrouve sa place, les commandes tactiles
sont atteignables. Diagnostic invisible sans opt-in ; relevé lisible à812×375.
La remise à zéro doit actualiser le texte à copier : corrigé et testé.

**Moteur/mobile — revue indépendante.** Calcul des fenêtres FPS cohérent, collecte
bornée, distinction tasJS/RAM totale correcte. Deux écarts corrigés : le relevé
possède une pause de dialogue ; une nouvelle partie reçoit une nouvelle collecte.
Le début et la fin du contexte sont enregistrés. La veille/réactivation de scène
coupe l’intervalle. Relecture ciblée indépendante : écarts résolus.

**QA/livraison.** Lot1 : 367 tests,15 contrôles d’affichage, anciens formats de
sauvegarde et codes conservés ; commandes de mission mobiles réparées après revue.
Préparation4 : trois tests purs supplémentaires et contrôle du build de production
(opt-in, rapport, pauses, Échap, reset, nouvelle mission). L’APK debug final a
été reconstruit après ces corrections : signature vérifiée,27 fichiers embarqués
identiques au dist, démarrage perf local, sync normale rétablie.

## Décision

Poursuivre le plateau puis la lisibilité selon le mandat du parent. Le lot4 est
**préparé techniquement, en attente de validation sur téléphone réel**. Ne pas
conclure à30/60FPS Android à partir du cloud. Aucun changement de combat,
d’activation des voies ou de monétisation. Les propositions du lot7 attendront
le parent et son fils ; les essais tactiles natifs et la performance restent suivis.
