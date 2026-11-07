# Décision avant le holdout

Les cohortes de découverte finales contiennent 776 parties sur le candidat gelé d’empreinte `1f2da8dce576b5864ba2ec02f1fe174edb9ef8344d66c9b218b5efcf26ff82e5` et son vrai témoin 0.21. Zéro erreur et zéro dépassement de durée.

Décision communiquée avant de lire les résultats du holdout : conserver les budgets, PV, vitesses et cadences initiaux. Aucun fichier source du moteur n’a été modifié par le travail d’équilibrage.

Le contrôle adapté gagne 16/16 classiques et 108/108 missions ; il tue les dix vrais volants de chaque classique et les trois têtes du roi. La hausse des pertes moyennes classiques (8,69→11,19) et des blessés survivants (2,13→6,06) rend la limite de soins visible sans empêcher une stratégie compétente de gagner. Le bot ranged gagne 15/16, le bot melee 10/16 et le casual 8/16. Garantir la victoire à une composition sans contre-aérien ne fait pas partie de l’objectif.

Les budgets de mission restent 450/550/700/850/1050/1300 pièces. La baisse du casual se concentre surtout sur le carrefour (14/18→5/18), mais il y conserve 891 pièces moyennes : davantage d’or ne corrigerait pas sa politique d’achats et de placement. Le contrôle gagne 18/18 sur chacune des six missions.

Les soins restent 24 PV avec six bandages pour le médecin, 14 PV avec quatre pour l’infirmier ; cadence 1,6/1,4 s et recharge 4 s au fort. Les volants restent à 65 % des PV de base et vitesse × 1,2. Le roi garde son multiplicateur de PV 6,5, ses trois têtes 50/20/30 et sa cour à deux gardes et un soigneur à six charges de 35 PV. Aucun candidat alternatif de PV/cadence n’est prétendu avoir été mesuré : l’option retenue est le défaut réellement simulé.

Le holdout utilise ensuite 16 nouvelles graines classiques appariées au témoin et 216 nouvelles missions du candidat (deux politiques,18 configurations et six missions). Ces graines servent à vérifier la tendance après cette décision et ne doivent pas être réutilisées comme cible d’optimisation. Si le holdout révèle un problème exigeant un réglage, une nouvelle cohorte indépendante devra être réservée.
