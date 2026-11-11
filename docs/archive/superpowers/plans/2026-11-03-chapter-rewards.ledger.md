# Ledger0.17

Pre-flight: Task1→Task2 : rewardOffer/choose/skip/cost/feastDuration identiques ; Task1→Task3 : choix via API publique, RNG bot séparé. Aucune contradiction.
Native execution dans workspace existant sans Git ; snapshot0.16 conservé. Les scripts de ledger liés aux commits Git sont remplacés par ce journal et les logs de tests. Autorisation d'autonomie persistante : pas de nouvelle approbation intermédiaire.

Task1 complete : tests/rewards.test.ts8/8, suite194/194 ; types/build passent. RED observé API absente, puis RED sauvegarde non persistée, puis GREEN. Les tests historiques conservent leurs assertions de campagne et renoncent explicitement aux offres ; hash legacy omet seulement les nouvelles métadonnées rewards, empreinte historique inchangée. Le test ancienv2 construit toujours un vrai campv2. Snapshot avant travaux dans /workspace/conquete-serpents-baseline-0.16.
Task2 in progress : scénario navigateur RED0cartes avant UI, panneau et flux implémentés ; vérification en cours.

Task2 complete : navigateur web passe3formats1440/390/320, clavier/pause/reload/placementgratuit, aucune erreur ni requête tierce. Visuel inspecté.
Task3 in progress : trois tests labo RED (blocagevague5/cohorte absente), puis GREEN3/3. Les bons sont placés viaGame.recruit avec coût 0 réel ; choix tracés séparément pour ne pas fausser les dépenses.
Plan adjustment : réutiliser CLI balance-lab.mjs avec stage rewards017 plutôt qu'un second runner ; mêmes empreintes et workers, moins de duplication.
Tests additionnels : persistance du bon consommé et de la protection dépensée. Feedback protection RED puis GREEN ; le test initial finissait la vague et son message était légitimement remplacé, scénario corrigé avec une apparition restante.

Final review : reviewer indépendant /root/review_rewards_017, aucunCritical/Important initial. Deux constats requalifiés : perte silencieuse d'un choix acquis via sauvegarde incohérente (contrat de persistance) et couverture focus explicitement promise. Decoder reproduit RED puis corrigé ; encode canonique pour frontière, vieux fixtures désormais vraisv2. Test navigateur ajouté : dialogue ouvert avant assemblageUI et focus préservé ; stabilité au rafraîchissement.
Final fix verification : suite200/200 et build/types passés ; navigateur final en cours. Aucun effet ni valeur d'équilibrage changé.
Final Rulings : résultats des 768 campagnes et conclusions seront vérifiés par root ; builds/navigateur/archives/liens par root ; tablette physique et plaisir ne peuvent être validés ici et resteront explicitement limités aux simulations/navigateur.
Control comparison :0.17 avec renoncement vs snapshot0.16, graine 42 et profilsmixed/mutants/ranged : tous les champs de gameplay sélectionnés identiques (actions, vagues, morts, or, santé, boss, temps). Rapport structuré control-comparison.json.
Source engine/lab frozen for768 validation campaigns, 16fresh seeds offsets64..79, six public reward policies×eight profiles. No parameter selection from this batch.

Task3 validation complete :768/768 campagnes terminées, zéroerror/timeout, sourceUnchangedtrue.661renforts offerts placés,0bons oubliés,1071dégâts absorbés. Taux selon politique111à121/128, référence120/128 ; les bonus ne sont pas des victoires garanties. Aucun réglage modifié après résultats ; tableau, paires gagnées/perdues et limites publiés.
Final browser tests : web/portable jeu, interface et bonus passent. La présentation a révélé une course du harness (HUD initial3, moteur 21), reproduite en retardant les WebP1,5s. Le harness omettait l'appel initialrefresh présent en production. Ajout refresh avantPhaser ; scénario retardé GREEN. Suite présentation complète et rendu relancés ; aucun code métier ni hash simulation changé.

Final verification complete : dix contrôles de livraison GREEN,200tests natifs, versions web/portable, interface web/portable, bonus web/portable,14scénarios présentation et restaurationWebGL. Source simulation toujours exacte après 768 campagnes. L'échec initial de présentation et son empreinte restent dans previousFailedChecks ; correction du harness seule, sans modifier les règles. Replay d'une défaite miel reproduit toutes les métriques non temporelles.
Livraison en archives ; intégrité et liens publics vérifiés avant réponse au parent. Le journal public des liens et SHA est conservé séparément du ZIP pour éviter une référence circulaire à son propre hash.
