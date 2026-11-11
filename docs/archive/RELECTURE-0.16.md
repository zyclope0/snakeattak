# Relectures indépendantes — 0.16

Deux relectures distinctes ont porté sur le moteur/rendu et sur le laboratoire,
sans modification des fichiers par les relecteurs. Elles ne remplacent pas les
tests automatisés ni les essais familiaux.

## Moteur et rendu

Aucun défaut bloquant trouvé dans les phases, protections, débordements, impacts,
mort, pause, annulation, rendu ou camps existants. Deux points mineurs ont été
reproduits puis corrigés :

- Le guide affichait parfois les résidus des flottants (`38.400000000000006`).
  Format français appliqué à l'affichage seulement (`38,4` ou `52,5`).
- Une absorption totale pouvait renvoyer environ1,8e-15 de dégâts. Un booléen
  calculé avant la mutation garantit désormais un retour nul, y compris lors
  d'une rupture exacte. Le débordement réel reste conservé. Test rouge puis vert.

La relecture finale du changement de précision a vérifié six cas arithmétiques,
dont protections actives, rupture exacte, débordements à deux facteurs et
absence de protection. Les autres unités, charges, PV, prix et cadences restent
inchangés par le facteur mutant. Le legacy fixe explicitement ce facteur à 1.

Le readout et les deux objets Graphics réutilisés lisent l'horloge réelle du jeu.
Les cartes de présentation sont nettoyées. `BossState` reste hors du camp : les
sauvegardes v1/v2 ne changent pas de format. Un réglage personnalisé de laboratoire
n'est pas persisté ; un camp rechargé reprend le défaut du build courant.

## Méthode d'équilibrage

Les relectures ont vérifié les graines, les empreintes, l'absence de bonus caché,
l'immutabilité des réglages et l'absence de résultat final lors de la décision.
Les 22 empreintes source/script du premier tour et celles de discovery2 ont été
contrôlées indépendamment. Les 64 graines des cinq cohortes sont distinctes ;
les 24 graines finales originales ont été conservées.

Améliorations intégrées avant la validation :

- Compléter le Wilson global nominal par un bootstrap de graines entières, car
  les huit profils d'une même graine sont corrélés.
- Compter les rencontres de boss censurées et préciser que les durées publiées
  sont conditionnelles aux boss tués.
- Pénaliser les nouvelles défaites précoces appariées, même si d'autres scénarios
  auparavant perdus deviennent gagnants ; protéger aussi les bots occasionnels.
- Conserver l'empreinte du score et exclure toute sélection sur la cohorte finale.

Le second tour est adaptatif. L'effet du facteur mutant s'isole contre
`boss-no-boost`, qui conserve le même boss. La comparaison finale à la0.15 porte
sur le paquet entier, boss compris. Les bots combinent composition, placement,
achats et politique de miel ; leurs écarts ne mesurent pas uniquement les unités.
Les résultats ne prouvent ni un optimum unique ni le plaisir des enfants.

## Contrôle final des résultats

La relecture des données brutes confirme les 1920 campagnes complètes sans erreur
ni timeout, les 162→180 victoires sur 192 scénarios appariés par version, les 20
nouvelles victoires et 2 nouvelles défaites. Les défaites précoces passent de 10 à 3 ;
la seule nouvelle défaite précoce est un bot occasionnel perdant à la vague 10,
contre une défaite à la vague 12 dans la référence. Ce cas a été rejoué avec
métriques identiques.

Le tableau, le graphique, les intervalles et les compteurs du boss ont été
contrôlés depuis les résultats bruts. Les 192 campagnes du réglage livré utilisent
réellement `Game(seed)` sans override ; leur tuning correspond au choix enregistré.
Les 22 empreintes du manifeste final correspondent aux sources livrées. Le taux
93,8 %, supérieur au repère75 %, et les limites de la difficulté sont explicités.
