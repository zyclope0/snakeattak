# Conseil 0.22 — les idées du fils dans le combat

Conseil simulé et revue de code indépendante, sans enfant réel ou téléphone physique.
Le parent délègue les réglages et demande de préserver l'esprit du jeu.

| Regard                     | Décision                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| Game design                | Garder les bandages du fils ; soins plus espacés et retour visible au fort.                |
| Équilibrage                | Volants rares après leurs contres, escorte dans le budget d'effectifs, soins du roi finis. |
| Développement              | Stocks, vol, têtes et cour dans des modules purs ; Game coordonne ; checkpoint versionné.  |
| Interface familiale        | Stocks sur les soignants, réserve identifiable, volants ailés, trois barres nommées.       |
| Joueur enfant hypothétique | Pouvoir raconter une nouvelle tactique, sans ordres manuels ou monnaie supplémentaire.     |

## Étapes

Modèles écrits après tests RED : stocks/retour/recharge, ciblage aérien et rang,
répartition des vies, attaques et soins sans réanimation. L'intégration exerce
le trajet réel au fort, le passage au-dessus de la mêlée et l'arrivée du roi avec
ses trois escortes. Les soignants gardent leurs stocks dans les fichiers et après
rechargement. Les mouvements réduits gardent les ailes, ombres et états visibles.

La revue a identifié le roi classé flying lors de son arrivée au quatrième dernier
emplacement. Un test reproduit flying au lieu de normal, puis passe après exclusion
explicite du boss dans la sélection aérienne. Les labels de la vague finale ont
également été actualisés. Les 41 tests ciblés et trois replays de libération de la
cour ne révèlent pas de blocage ; les contrôles globaux restent distincts.

## Équilibre

Les 1120 parties finales vérifiées comprennent des comparaisons au vrai moteur 0.21
et des cohortes à graines séparées. Zéro erreur ou dépassement de durée. Le contrôle
adapté gagne 31/32 classiques et 216/216 missions. Les pertes et blessés augmentent
sans rendre les stratégies adaptées impraticables. Les budgets, PV et cadences
initiaux sont conservés ; cette décision précède la lecture du holdout.

Des explorations ont corrigé le placement des soignants du bot avant les mesures
finales : les grouper au centre du fort laissait du front hors de leur rayon.
Ces essais ne sont pas ajoutés aux 1120 parties finales. Le conseil ne prétend pas
que les enfants auront les mêmes résultats. Voir reports/balance-0.22/SUMMARY.md,
DECISION.md et audit.json pour les sources exactes et les limites.

## Livraison

Le verdict produit est favorable sous réserve des contrôles web/portable et des
anciennes sauvegardes. Une première passe navigateur vérifie déjà retour, pause,
contre aérien, mort de tête et absence de réanimation, sur une vraie scène Phaser.
Le projet Android reste synchronisable ; aucun APK compilé, signé ou testé sur
appareil réel n'est revendiqué. La réserve historique du stockage file demeure.

## Validation finale

Les 333 tests natifs et 24 contrôles finaux réussissent : web et portable, interface,
missions, cadeaux, transfert familial, trois états médicaux, vol et cour dans
une scène Phaser, mouvements réduits et écrans 320/390/844/1440. L'audit confirme
1120 parties finales, sources figées et graines de holdout séparées. Les 26 fichiers
web sont identiques à ceux embarqués dans le projet Android après synchronisation.
Le conseil accepte la livraison. Aucun appareil physique ou APK compilé testé.

Le service de publication confirme succeeded pour le build exact, commit
20d5781a09fe0f4f5ddd3d0bfdf3ebbfce4e027d. La même adresse et l'audience privée
propriétaire sont conservées. L'authentification depuis le navigateur du parent
n'a pas été testée ; la confirmation native porte sur la publication.
