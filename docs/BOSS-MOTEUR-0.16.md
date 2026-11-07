# Moteur du roi à trois têtes — 0.16

`Game(seed, tuning?)` possède sa copie validée et gelée des douze paramètres de
`balanceTuning.ts`. Les overrides inconnus ne sont pas conservés. Aucun réglage
n'est réécrit pendant la campagne. Les valeurs par défaut ont été fixées après
les cohortes de développement ; les fixtures de règles fixent leurs propres valeurs.

La tête protectrice reçoit une réserve finie `maxHp × bossShieldFraction` à
l'apparition, puis une nouvelle réserve au franchissement de 60 % et 25 % de santé.
Les phases ne reculent pas. Les dégâts contre la réserve sont multipliés selon le
rôle de la source : `ranged` ou autre. Le reste d'un coup qui casse la protection
est reconverti en dégâts d'origine, puis l'armure ordinaire s'applique à la santé.
Le franchissement vivant → mort n'active aucune protection et annule le crachat.
La santé strictement positive n'est ni arrondie ni remplacée.

À partir de x576, la tête cracheuse compte son délai dans l'horloge de simulation.
Elle choisit un tireur à portée en priorité, puis la distance et l'identifiant.
Les coordonnées de la marque restent celles du début de préparation. Le délai
entre deux préparations vaut `bossShotInterval` ; la préparation est comprise dans
cet intervalle. À expiration du préavis, un seul impact touche les alliés encore
vivants dans le vrai rayon. La disparition de la cible ne retire pas la marque.
La mort du roi, sa fuite et la défaite annulent la préparation. La pause fige
intégralement les horloges, la marque et les compteurs.

Le bouclier allié peut réduire un impact sur un voisin selon sa règle existante :
60 % de réduction, puis 3 secondes de recharge. Une même protection ne peut donc
pas couvrir tous les voisins du même impact. Les armures personnelles s'appliquent
également. La ponte et la morsure du roi conservent leurs règles antérieures.

`BossState` est sérialisable et facultatif sur `Entity`. Les fixtures qui changent
un serpent en roi obtiennent l'état au prochain pas ou coup, avant absorption.
`phase`, `shieldsBroken`, `shotsFired` servent au rendu et au laboratoire ; aucune
animation ne décide des dégâts. `breakFlash` est un bref signal transitoire.

Le souffle et l'obus gardent leurs dégâts complets sur leur cible principale ;
seuls les voisins reçoivent `splashSecondaryFactor`. Tous les coups passent par
`hitEnemy`, qui conserve le tueur réel pour les réactions de mort exactement 2/3 PV.
Le roi reste exclu de ces réactions.

Le paramètre `mutantDamageFactor`, borné à [1, 2], multiplie seulement les dégâts
sortants de `mutantRock` et `mutantStretch`. Il vaut 1,75 dans le défaut livré et
explicitement 1 dans `LEGACY_BALANCE`. Il ne change ni les PV, ni le prix, ni la
cadence, ni les soins ou armures. Les autres unités gardent leurs dégâts, y compris
la charge des cavaliers et tricératops. `attackDamage` reçoit le facteur de la
campagne ; son troisième argument facultatif vaut 1 pour les appels historiques.
Les cohortes de développement ont motivé ce renforcement ciblé ; les essais
initiaux et leurs sources restent archivés séparément. Voir le bilan 0.16.

## Vérification du moteur historique

`LEGACY_BALANCE` désactive l'état avancé du roi, garde le multiplicateur de santé 6
et les dégâts secondaires complets. Une comparaison directe au snapshot 0.15 a
vérifié 180 états complets dans six scénarios (trois graines, première et dernière
vagues, roi avancé au front, tank, miel collant). Seul le nouveau champ `tuning`
est retiré pour comparer les structures. Empreinte SHA-256 :

`18761719ae593f389cf84e34b1f96e97e50f0f7abfb5f553c5525f01ac2a0d1b`

Cette empreinte est gardée dans `tests/boss-016.test.ts`, sans exiger le snapshot
local pour les futures exécutions. Les dix-huit tests de ce fichier couvrent aussi
les trois protections réellement cassées, les facteurs et l'armure, le préavis,
l'impact unique, la sortie du cercle, la disparition des acteurs, la pause, les
rôles, la recharge alliée et l'isolation des configurations. Trois tests couvrent
aussi les bornes du facteur mutant, tous les autres types d'alliés et deux combats
réels aux réglages distincts, sans mutation du catalogue.

## Défaut livré

Le choix est enregistré avant la validation finale dans
`reports/balance-0.16/chosen-config.json`. PV du roi ×6,5, protection12 %, facteurs
protection0,45 à distance et1,6 au contact ; crachat18, recharge7s, préavis1,8s,
rayon38 et portée260. Dégâts secondaires complets ; mutants ×1,75. La protection
entièrement absorbante renvoie exactement zéro dégât, y compris à la rupture
exacte : aucun résidu de calcul n'est soustrait à la santé. Le débordement réel
reste conservé et testé. Les décimales du guide sont formatées pour l'affichage,
sans arrondir les calculs du moteur.
