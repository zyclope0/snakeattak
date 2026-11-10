# Boss et laboratoire d'équilibrage — plan 0.16

## Demande et décisions

Le parent valide la priorité boss + équilibrage, et autorise une dépense de calcul
plus importante pour les simulations. Le boss garde ses trois têtes et reçoit
des protections cassables et des attaques annoncées. Garder le combat automatique,
les deux zones, les trois voies, l'économie, les alliés inventés par les enfants,
les réactions exactes2/3PV et les crachats à impact unique. Pas de service réseau,
de modèle payant par partie ni d'adaptation cachée des chiffres pendant une partie.

Augmenter seulement les PV rendrait le combat long. Choix retenu : une tête
protège, une tête prépare un crachat local annoncé au sol, une tête garde la ponte
existante. Trois phases aux seuils60% et 25% ; chaque phase apporte une protection
finie, jamais un bouclier qui se recharge indéfiniment. Le corps et les œufs restent
attaqués automatiquement. Le crachat frappe une fois la zone annoncée ; aucune
résurrection ni dégâts périodiques. Les alliés mobiles peuvent sortir naturellement
de la marque, sans exiger un nouvel ordre de déplacement.

On évalue aussi une baisse des dégâts secondaires du souffle/obus : la cible
principale garde ses dégâts, les voisins prennent une fraction configurable.
C'est une hypothèse mesurée pour réduire l'avantage des batteries à distance,
pas une décision imposée avant les résultats.

## Contrat technique (fichiers sans conflit)

### Moteur — travail indépendant

Créer `src/balanceTuning.ts`, `src/boss.ts`, modifier `src/game.ts`, créer tests
de règles `tests/boss-016.test.ts`. Aucun rendu/UI/scripts modifié par ce travail.

`Game(seed = 2026, tuning?: Partial<BalanceTuning>)` expose `readonly tuning`.
`makeBalanceTuning(overrides?)` copie, valide et gèle les champs connus ; aucun
objet mutable global ne change entre campagnes. Exports `BalanceTuning`,
`DEFAULT_BALANCE`, `LEGACY_BALANCE`, `makeBalanceTuning`.

Champs exacts : bossEnabled:boolean, bossHpMultiplier:number(6..10),
bossShieldFraction:number(0..0.35), bossShieldRangedFactor:number(0.2..1),
bossShieldMeleeFactor:number(1..2), bossShotDamage:number(0..50),
bossShotInterval:number(3..8), bossShotWindup:number(0.8..2.5),
bossShotRadius:number(24..70), bossShotRange:number(180..300),
splashSecondaryFactor:number(0.25..1), mutantDamageFactor:number(1..2).

Valeurs provisoires par défaut : true,6.5,0.10,0.55,1.4,26,6,1.6,42,260,0.75.
Valeurs legacy : bossEnabled=false, bossHpMultiplier=6, bossShieldFraction=0,
bossShotDamage=0, splashSecondaryFactor=1 ; autres champs non utilisés identiques.
Elles doivent reproduire le moteur0.15 pour des commandes identiques.

Entity ajoute `bossState?: BossState`. État sérialisable exact : phase:1|2|3,
shield:number, shieldMax:number, shieldsBroken:number, shotsFired:number,
shotCooldown:number, windup:number, targetX:number, targetY:number,
shotTargetId:number|null, breakFlash:number. Export BossState depuis boss.ts.
Création paresseuse pour les fixtures qui convertissent un serpent en boss.

Protection initiale puis aux phases2/3, égale à maxHp×fraction ; absorption avec
facteur de source (rôle ranged vs autres). Débordement de coup converti en dégâts
de santé, pas perdu. Aucun bouclier ne ressuscite un boss mort. Aucun blindage
ordinaire modifié. La protection du bouclier allié peut réduire un impact de tête
selon la règle existante et son délai 3 s, sans annuler tous les impacts de zone.

Crachat à partir de x576, cible à portée260, priorité aux tireurs puis proximité ;
point d'impact fixé au début, délai puis impact local. Horloge de simulation,
pause stricte, cible morte n'annule pas une marque mais mort du boss l'annule.
Ponte/bite/portée du corps existantes. Compteurs et flash transitoires uniquement.

Tests rouge→vert : absorption/débordement/armure selon source, phases finies,
pas de résurrection, télégraphe avant impact, impact unique, déplacement hors
zone, pause, disparition du lanceur, deux Games isolés, dégâts secondaires
distincts du principal, legacy identique. Signaler les anciens tests de campagne
qui échouent sous le réglage provisoire ; ne pas affaiblir leurs assertions.

### Laboratoire — travail indépendant

Créer seulement `scripts/balance-lab.mjs`, `scripts/balance-lab/` et
`tests/balance-lab.test.ts`. Pas de src/package/rendu/UI modifié.

API pure : huit profils mixed/melee/ranged/heavy/dinosaurs/mutants/casual/clustered,
avec compositions, placement, miel et achats explicites. N'utiliser que
Game.recruit/repair/offerFeast/startWave/step. Achats avant vague et au plus toutes
les 6 s en combat pour profils réactifs, plus lents pour casual ; budgets réels.
RNG du bot séparé de Game et déterministe par graine/profil/vague. Aucun tirage
ne dépend du nombre de callbacks de présentation. Pas d'accès DOM/renderer.

Plans de graines disjoints : discovery8, confirmation 12, holdout24 ; huit profils
par graine, mêmes graines pour chaque configuration. Runner parallèle borné
(4CPU disponibles,3workers par défaut), sortie déterministe triée et hashée.
Limite240s par vague ; conserver toute défaite, timeout, erreurs avec état/replay.

Entrées CLI proposées : `--stage discovery|confirmation|holdout --configs path.json
--out reports/... --workers 3`. JSON liste objets {id,tuning,useDefault?}. Le mode
useDefault=true instancie Game(seed), vérifie le tuning effectif, sert au test final.
Exporter fonctions réutilisables cohortSeeds(stage), runCampaign(job), summarize
pour tests et replay. Enregistrer prix/dégâts réels, achats par kind, vagues,
cause de fin, progression, première rencontre boss, durée réelle du boss,
plaques cassées, tirs, morts, santé, réparations, or restant, temps CPU et config.
Le replay reprend id/profil/graine/tuning, donne les mêmes métriques non temporelles.

Statistiques : Wilson95% pour taux, durées médiane/p90, tableaux par profil,
pairage par graine ; bootstrap des différences avec la graine comme cluster.
Objectif multi-critères : zéro blocage, peu de nouvelles défaites précoces,
réduire l'écart entre stratégies tout en gardant de vraies victoires familiales,
combat boss autour de 15–60 s après entrée en zone de combat (environ 35–100 s depuis son apparition). Les écarts sont des observations de bots, pas une
preuve de plaisir ou un entraînement des poids d'un modèle d'IA.

### Intégration — principal

- [x] Préserver snapshot0.15 et mettre à jour version 0.16.
- [x] Évaluer baseline +six candidats sur discovery (7×8×8=448campagnes).
- [x] Évaluer trois candidats retenus +baseline sur confirmation (4×8×12=384).
- [x] Choisir un candidat uniquement avec ces données, écrire le défaut livré.
- [x] Geler code/config puis vérifier défaut et baseline sur holdout (2×8×24=384).
      Total prévu1216 ; si un défaut réel impose une correction, conserver les anciens
      essais exploratoires et utiliser une nouvelle cohorte de validation indépendante.
- [x] Rendu `render/bossSignals.ts`, BattleScene/battleFeedback, aide et briefings :
      bouclier lisible, phase, cercle d'alerte correspondant au vrai rayon/temps,
      trois rôles, aucune collision définie par une animation. Réutiliser les assets.
- [x] Vérifier tests natifs/types/build/web/portable/interface/présentation/GPU,
      relecture indépendante, rejouer les échecs, tracer les résultats et limites.
      Livraison prévue : rapport lisible, graphique de comparaison, archives jouable
      et sources, aperçus ; liens HTTPS à retélécharger et vérifier avant remise.

Le lien web jouable sans ZIP demeure l'étape de publication suivante. Le présent
lot est le boss et l'équilibrage validés par le parent, pas une refonte d'hébergement.

## Extension du calibrage après les deux premières cohortes

Les 448 campagnes de découverte puis 384 de confirmation sont conservées avec
leurs configurations, empreintes et sources exactes dans
`reports/balance-0.16/source-snapshots/round1`. Le premier lancement interrompu
(140 campagnes) est archivé séparément et exclu de la sélection : son identifiant
de référence ne correspondait pas à celui attendu par le comparateur.

Constat : les mutants gagnent seulement1/12 en confirmation, avec des échecs aux
vagues10/11. Durcir uniquement le boss laisse cette faiblesse intacte. Tester un
facteur de dégâts réservé aux deux mutants, sans changer vie, prix, portée ou
vitesse. Contrôle sans renforcement, puis facteurs1.25/1.5/1.75 ; toutes ces
variantes partagent le boss shield-focus et conservent les dégâts secondaires
complets. Le mode legacy fixe explicitement le facteur mutant à 1.

Ajouter deux cohortes de développement disjointes : discovery2 (8 graines,
offsets44–51), confirmation2 (12 graines, offsets52–63). La validation finale reste
les 24 graines originales offsets20–43, qui n'ont pas été utilisées pour le choix.
Prévision totale :832+320+384+384=1920 campagnes complètes, hors diagnostics.

Le score préétabli sert d'aide au choix. Contrôler aussi les résultats par famille,
les paires de nouvelles défaites précoces, les joueurs occasionnels, les erreurs
et les limites des bots. Ne pas présenter une moyenne globale comme preuve que
toutes les compositions sont viables. Les huit profils d'une même graine sont
corrélés : accompagner le Wilson global nominal d'un intervalle rééchantillonné
par graine entière. Les durées de boss sont conditionnelles à sa mort ; compter
séparément les rencontres inachevées. Aucune sélection sur la cohorte finale.

### Relecture avant confirmation2

La relecture indépendante du moteur ne relève aucun défaut bloquant. Deux points
mineurs sont corrigés avant la validation : format français des dégâts affichés,
et retour exact de zéro lorsqu'un coup est entièrement absorbé (le calcul par
soustraction pouvait laisser environ1.8e-15 de dégâts). Un test reproduit ce
résidu avant correction. Ne pas modifier les sources pendant discovery2 ; en
conserver un snapshot exact avant la correction, puis confirmer sur le moteur
corrigé. Ce changement ne modifie pas les dégâts intentionnels ni les paramètres.

### Décision figée avant validation finale

Les candidats ×1,5 et ×1,75 ont été confirmés sur 12 nouvelles graines. Le score
est très proche (33,54 contre 33,25) : ce n'est pas la preuve d'un optimum unique.
Retenir ×1,75, qui améliore la viabilité des mutants (10/12 contre4/12 au contrôle)
et réduit les défaites précoces (1 contre 7), sans régression des familles par
rapport au contrôle dans cette cohorte. Les occasionnels passent de11/12 à12/12.
Le taux global89,6 % reste au-dessus du repère75 % ; préserver les victoires
familiales plutôt que durcir artificiellement les autres équipes pour ce chiffre.

`chosen-config.json` et `holdout-configs.json` sont écrits avant le premier résultat
final. Le défaut de production correspond exactement au candidat choisi. La
cohorte finale instancie réellement `new Game(seed)`, avec contrôle du tuning,
face à la référence explicite. Le test de précision a aussi été étendu au cas
d'une rupture exacte et corrigé avant ce gel final.
