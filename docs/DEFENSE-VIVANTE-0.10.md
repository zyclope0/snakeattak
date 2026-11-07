# Défense vivante 0.10 — bilan mesuré

La ruée collective vers le bord est corrigée : les gardiens et tireurs restent
liés à leur placement ; les ninjas/cavaliers interviennent entre voies et se
répartissent les cibles. Les secours contre un vrai blocage restent limités aux
deux combattants les plus proches si aucun allié n'est déjà capable d'intervenir.
Les soldats reviennent à leur point de défense après l'engagement.

## Résultats comparables

100 campagnes par version : cinq politiques × les mêmes vingt graines initiales,
moteur réel à 30 Hz, mêmes achats automatisés légaux avant vague, préparation fixe
de 10 secondes, miel en bataille. Aucun PV ennemi, ressource ou règle de combat
n'est modifié par les bots. Les paramètres de la 0.10 sont ceux du jeu livré.
Les états et tirages ultérieurs divergent avec les actions et nouvelles règles.

| Politique       | Victoires, 0.9 → 0.10 | Base finale moyenne /100 | Part au bord, 0.9 → 0.10 |
| --------------- | --------------------- | ------------------------ | ------------------------ |
| Équilibrée      | 20/20 → 16/20         | 92.7 → 68.5              | 86.4 % → 5.2 %           |
| Mêlée et soins  | 20/20 → 18/20         | 94.0 → 84.6              | 87.6 % → 7.1 %           |
| Distance        | 20/20 → 20/20         | 100.0 → 91.8             | 87.5 % → 0.1 %           |
| Unités lourdes  | 18/20 → 19/20         | 73.8 → 91.2              | 85.2 % → 8.2 %           |
| Choix spontanés | 18/20 → 14/20         | 79.7 → 65.0              | 85.6 % → 6.2 %           |

**87/100 victoires, 13 défaites, aucun blocage** sur le dernier lot.
La part moyenne au bord passe de **86.5 % à 5.4 %**. Elle est
échantillonnée une fois par seconde pendant les batailles : pour chaque relevé,
on compte les combattants non mobiles (ni médecins, ni murs, ni ninjas/cavaliers)
à x ≤ 636, rapportés à l'effectif de ces combattants. Puis on moyenne par partie
et par politique. Ce n'est ni le temps passé à l'écran ni une mesure de plaisir.

Les vagues ont des durées médianes de 26.0
à 59.7 secondes ; le maximum concerne
le roi. Les premières attaques arrivent en médiane entre
7.7 et
15.0 secondes. La vitesse ×2 reste disponible.

## Ce qui varie pendant la partie

- Vagues 2/6/10 : arrivées alternées sur les trois voies ; les jonctions restent
  tactiques et le miel peut toujours influencer les départs.
- Vagues 3/9 : ruées par trois, 0,4 seconde entre membres, puis 2 secondes de
  respiration ; proportion de rapides accrue, types toujours débloqués progressivement.
- Vagues 4/8 : couvées décalées (6–9, 12–15 et, si trois œufs, 18–21 secondes),
  sur des voies distinctes. Chaque œuf libère toujours deux petits serpents.
- Les annonces et le guide décrivent ces mécaniques ; aucun pouvoir manuel ajouté.

## Réglages et corrections

- Points de placement réservés même pendant un déplacement, pour éviter les domiciles
  superposés. Repères bleus en préparation, rôle visible dans le guide et pendant le placement.
- Dégâts au contact renforcés : massue 26, héros 36, bouclier 18, batteur 40,
  chevalier 42, dinosaure 54, deux têtes 56 ; ninja 155 PV et 40 dégâts.
- Archer : 150 pièces, 15 dégâts, portée 210 inchangée. Sa sécurité demande un
  investissement ; dragons et tanks gardent leurs pouvoirs d'origine.
- Cracheur : portée 220 dans le camp et priorité aux tireurs exposés à sa portée.
- Progression des dégâts ennemis plus douce : 7 + floor(vague × 0,9) ; roi ×2.
- Les médecins/infirmiers soignent les vivants, pas les palissades en bois. Un soigneur
  peut être mordu mais ne retient pas à lui seul un serpent par auto-guérison.
- Objectifs de déplacement près des rochers projetés vers une case libre.
- Sauvegarde v2, même clé locale ; lecture v1 conservée. L'ancien homeX étant inconnu,
  la position sauvegardée sert d'approximation, corrigée vers un domicile légal voisin
  si nécessaire. Pas de résurrection ni de remise à zéro du camp.

## Validation et limites

Les tests couvrent le retour au placement, les trois secteurs, la mobilité, les secours,
les duels hors portée, le cristal, les domiciles réservés, la migration près d'un rocher,
les soins sur le bois, les tempos, la pause et les œufs.

La stratégie à distance reste la plus sûre dans ce petit échantillon, malgré des pertes
et dégâts réels au camp ; l'équilibre n'est pas certifié. Les stratégies de mêlée et lourdes
sont désormais viables dans ces conditions. Les bots n'achètent pas pendant les vagues,
préparent dix secondes sans réfléchir et ne représentent pas des enfants. La politique
« équilibrée » est un algorithme fixe de rotation d'achats, pas la meilleure composition
possible. Aucun essai sur tablette physique ni test de plaisir avec des enfants.

Le coût CPU exclut Phaser/GPU ; les simulations ne prouvent pas la fluidité d'un appareil.
Aucun compte, serveur, nouvelle dépendance ou génération payante ajouté.

## Reproduire

`npm ci`, puis `BALANCE_OUTPUT=reports/final-0.10 npm run balance` avec Node 24.
Le résumé et chaque campagne sont conservés ; le script refuse une campagne bloquée.
Les valeurs de référence 0.9 sont archivées dans `reports/baseline-0.9`.
Le graphique optionnel se regénère avec `python scripts/compare-balance.py` (matplotlib).

Empreinte SHA-256 des TypeScript racine de src/ : `8d078809b9af260f226f832a37635ce5eba97e98c578f8cbbba4f979ffca1814`.
