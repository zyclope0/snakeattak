# SDD ledger — plan: docs/superpowers/plans/2026-11-07-performance-rendu.md

Ruling: Le Go utilisateur poursuit le lot 2 existant; pas de changement de règles du lot 3.
Ruling: Sans Git source, copie intégrale des sources 0.23 préservée; checkout statique séparé pour la publication.
Ruling: Le terrain et les effets sont déjà regroupés; cibler les vues d’acteurs et textes dont le renouvellement alloue réellement.
Pre-flight: Task 1 mesure les mêmes chemins de rendu que Task 2; stats de pool optionnelles pour la référence 0.23. Task 3 consomme la préférence uniquement dans le rendu, pas dans Session/Game.

Task 1: complete — baseline 338 tests et protocole avant WebGL/Canvas. Renouvellement synthétique de 108 acteurs : 2592 images + 48 textes créés/détruits sur 8 générations.
Ruling: 384 images inactives max (contre estimation initiale 192), pour réutiliser une génération synthétique de 108 acteurs ×3 couches; seule la réserve inactive est limitée, aucun acteur vivant ne disparaît.
Ruling: Pas de nouvel atlas géant : seulement 1 draw WebGL/image en charge normale et 2 en forte charge, donc regroupement supplémentaire sans gain démontré et risque de mémoire GPU/compatibilité.

Task 2: complete — 6 tests pool RED→GREEN, rendu pixel-identique WebGL/Canvas, recyclage egg/main/outline réinitialisé, nettoyage scène vérifié.
Task 2 fix: réserve inactive encore dans la display list; assertion navigateur RED observée puis retrait/réajout de display list aux transitions d’activité.
Task 3: tests purs préférences et métriques RED→GREEN, contrôle visuel dans l’aide, compteur uniquement DEV et opt-in URL.

Ruling: Comparaison pixel = présentation stabilisée avant capture; le temps visuel bridé laissait des textes de renfort sur GPU logiciel après le même délai réel. Protocole corrigé des deux côtés et référence à refaire sur la source 0.23 intacte.
Ruling: Chronométrage final avant/après sérialisé, sans compilation ou autre navigateur concurrent; les compteurs d’allocations sont déterministes, les millisecondes restent indicatives.

Final review: /root/review_performance_024 — deux Important : destruction directe et génération de charge non acquittée.
Final: fixed cleanup — test réel RED avec 69 images inactives restant après SceneManager.remove, puis GREEN; helper onSceneExit testé shutdown/destroy et 20 redémarrages.
Final: fixed benchmark — chaque génération acquittée après super.update avant de passer à la suivante; protocole final avant et après identique.
Final: clarification — compteur « Maj. jeu » = coût de BattleScene.update, pas tout le CPU du rendu; sortie absente du build normal. Ancrage dans .battle-stage déjà correct, bornes contrôlées dans le navigateur.
Ruling: La réserve retient un nombre borné de vues en échange de moins d’allocations; ne pas présenter cela comme une réduction garantie de la mémoire ou une augmentation générale des FPS.

Task 4: complete — 354 tests et contrôles web/portable/Canvas/WebGL/confort/tactique/soins verts; empreintes des 69 modules TS inchangés et 25 assets conservés; 28 fichiers Android identiques.
Final: important findings resolved — destruction directe RED→GREEN (7+3 tests pool/lifecycle et navigateur); benchmark acquitte 8 générations par moteur; 4 PNG avant/après identiques, états sérialisés identiques.
Final: minor (deferred) — aucun; coût CPU libellé Maj. jeu, ancrage compteur vérifié, compromis de rétention mémoire documenté.
Ruling: Validation Android physique non réalisable ici; objectif 30/60 FPS non revendiqué et mesure sur appareil reportée explicitement dans PERFORMANCE-0.24.md.
Distribution poussée 6af17495158eb2365c1858d8c3acda179e169bea; publication native demandée sur le site privé existant.
