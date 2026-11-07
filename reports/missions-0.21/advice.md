# Conseil moteur et équilibrage 0.21

La cohorte complète contient 324 parties, 266 victoires, 58 défaites, aucune erreur et aucun dépassement de 300 secondes par vague. Les trois terrains et les 18 configurations réelles fonctionnent dans chacune des six missions. Les échecs apparaissent à partir de la quatrième mission pour les armées peu renforcées ; le contrôle méthodique gagne les 108 parties avec le cristal intact, tout en perdant des alliés sur les missions tardives.

| Mission | Budget | Méthodique | Casual | Novice | Durée active s | Équilibré · rapide · escorte | Répartie · concentrée |
| --- | --- | --- | --- | --- | --- | --- | --- |
| refuge | 450 | 18/18 | 18/18 | 18/18 | 69–99 | 18/18 · 18/18 · 18/18 | 27/27 · 27/27 |
| trois-ponts | 550 | 18/18 | 18/18 | 18/18 | 74–109 | 18/18 · 18/18 · 18/18 | 27/27 · 27/27 |
| course | 700 | 18/18 | 18/18 | 18/18 | 71–113 | 18/18 · 18/18 · 18/18 | 27/27 · 27/27 |
| coquilles | 850 | 18/18 | 16/18 | 10/18 | 85–141 | 16/18 · 16/18 · 12/18 | 22/27 · 22/27 |
| sonnette | 1050 | 18/18 | 10/18 | 0/18 | 87–146 | 10/18 · 10/18 · 8/18 | 13/27 · 15/27 |
| carrefour | 1300 | 18/18 | 14/18 | 0/18 | 84–225 | 10/18 · 12/18 · 10/18 | 16/27 · 16/27 |

## Décision conseillée

Conserver provisoirement les six budgets 450/550/700/850/1050/1300 et les délais actuels. Les trois premières missions servent d’apprentissage accessible : même le novice gagne, avec un cristal minimum de 91, 55 puis 46. Les coquilles introduisent une vraie transition : casual16/18, novice10/18. Sonnette constitue le seuil le plus exigeant pour casual10/18 ; carrefour casual14/18 dispose d’un budget plus généreux et d’une vague supplémentaire pour acheter. Ce dernier écart n’établit pas un déséquilibre sur une seule graine par configuration.

Le novice perd toutes les parties sonnette/carrefour en conservant en moyenne 1403/1620 pièces : augmenter son budget ne corrigerait pas sa sous-dépense ou son placement groupé. Avant tout durcissement pour le contrôle, vérifier en jeu humain si la consigne de répartir des gardiens, acheter des renforts et garder des soins est comprise. Réduire les budgets maintenant pénaliserait les achats spontanés sans mesure d’un bénéfice pour cette expérience familiale.

Les escortes sont descriptivement plus exigeantes : coquilles12/18 contre16/18 en plans équilibré et rapide ; sonnette8/18 contre10/18. Les écarts entre terrains sont plus faibles (coquilles14–16 victoires sur18, sonnette9–10, carrefour10–11). Aucune configuration ne bloque le moteur. Les couvées donnent des durées différentes sans domination constante : la concentration ajoute environ7s à refuge mais les taux de victoire tardifs sont voisins. Conserver les tempos pour cette première livraison ; si les retours humains confirment le seuil sonnette, étudier d’abord l’escorte et la lisibilité des cracheurs plutôt qu’ajouter des pièces.

## Limites et risques

Les politiques sont scriptées. Chaque couple mission/configuration n’utilise qu’une graine, choisie par une permutation équilibrée entre les facteurs ; les trois bots partagent cette graine et restent corrélés. Les tableaux sont descriptifs, sans intervalle de confiance ou affirmation causale. La durée CPU est mesurée pendant d’autres vérifications concurrentes et ne constitue pas une mesure de performance du moteur. La durée active dépend exclusivement du pas fixe de simulation.

Le classique a été comparé séparément à la copie0.20 : 21600 instantanés complets identiques sur trois graines et quatre vagues de départ (1/4/8/12), en retirant uniquement les deux nouvelles métadonnées mission/missionMinBase. Les checkpoints classiques v4 correspondants sont identiques octet pour octet. Le test legacy doit continuer à conserver son hash attendu ; seules ces métadonnées sont exclues de son instantané.

Les limites de reprise sont intentionnelles : un checkpoint mission v5 contient seulement une préparation valide, avec configuration, graine initiale, RNG courant, survivants, or et minimum du cristal. Une victoire se synchronise par la progression et ne devient jamais un camp chargé comme déjà gagné. Les sauvegardes classiques v1–v4 restent lisibles. Les plans d’attaque ne créent aucune espèce située au-delà du rang courant ; le roi reste réservé au classique.

Empreinte de la cohorte : `00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da`. Reproduction et détails dans [cohort-324.md](cohort-324.md) et [cohort-324.json](cohort-324.json). Aucune modification du moteur après le gel demandé pour cette mesure.

## Confirmation holdout

Voir [holdout-summary.md](holdout-summary.md) :324 parties supplémentaires sur graines disjointes confirment 262 victoires, 62 défaites et aucun blocage, sans changement moteur. Sur les 648 parties réunies, le combat actif observé dure environ 1 à 4 minutes (69–225 secondes), plus la préparation libre. Les résultats ne justifient pas une annonce de 5 à 8 minutes de combat actif. Le conseil de conserver les budgets et tempos est maintenu.
