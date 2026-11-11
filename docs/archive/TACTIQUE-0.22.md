# Bandages, volants et cour du roi — 0.22

Ces trois évolutions viennent des idées du fils. Le classique de douze vagues,
les six expéditions, les alliés autonomes et leurs pouvoirs sont conservés.

## Soignants et bandages

| Allié     | Stock      | PV par soin | Intervalle entre soins |
| --------- | ---------- | ----------- | ---------------------- |
| Médecin   | 6 bandages | 24          | 1,6 seconde            |
| Infirmier | 4 bandages | 14          | 1,4 seconde            |

Un bandage est consommé seulement pour un vrai soin sur un allié vivant blessé.
À zéro, le soignant rejoint réellement la réserve du fort, puis y passe quatre
secondes avant de repartir avec un stock plein. Il ne soigne pas pendant ce trajet
ou cette recharge. Les stocks et l'état de retour sont affichés sur les personnages.

Le placement compte : un soignant avancé couvre mieux le front mais voyage plus
longtemps ; un placement arrière facilite le ravitaillement. Répartir les soignants
par voie évite de laisser les angles du front hors de leur zone de soins.
Les morts ne reviennent pas et ouvrir le menu ou recharger ne rend aucun bandage.
Le camp garde stock partiel, retour/recharge et délai restant avant le prochain soin.

## Serpents volants

Ils apparaissent à partir du rang 6 : vague 6 du classique ou vague correspondante
d'une expédition. Ils poursuivent leur route au-dessus de la mêlée. Les archers,
bébés dragons et tanks peuvent les toucher ; les combattants de contact gardent
leurs rôles au sol. Les ailes et une ombre détachée restent visibles même quand
les animations sont réduites.

Un emplacement aérien est prévu dès le rang 6, deux aux rangs 9–11. En vague 12,
la cour du roi utilise l'un de ces emplacements : il reste un volant. La sélection
remplace des ennemis existants, sans ajouter une armée aérienne imprévisible.
Le briefing et les fiches annoncent les contres. Les œufs restent aléatoires.

## Roi, têtes et garde rapprochée

| Tête      | Part de la vie du roi | Comportement                                                      |
| --------- | --------------------- | ----------------------------------------------------------------- |
| Gardienne | 50 %                  | Résistante, mord au contact.                                      |
| Cracheuse | 20 %                  | Tire uniquement à distance, avec zone d'impact annoncée.          |
| Mixte     | 30 %                  | Mord au contact ou prépare un tir si personne n'est assez proche. |

Chaque tête a une barre distincte. Une tête tombée cesse d'agir et ne revient pas.
Les alliés choisissent automatiquement : mêlée vers la gardienne, tirs vers la
cracheuse, puis report sur les têtes encore vivantes. Le joueur compose son armée
sans ordre manuel de ciblage. Les protections des trois phases restent finies.

Deux gardes cuirassés et un serpent soigneur escortent le roi. Ce soigneur dispose
de six soins de 35 PV, espacés de trois secondes ; il soigne seulement le roi et
ses gardes vivants proches. Il ne recharge pas, ne rend pas les protections et
ne relève jamais une tête ou un soldat mort. Ces trois escortes remplacent les
trois derniers serpents habituels. Après la mort du roi, les survivants poursuivent
leur route ; il faut aussi les repousser. Le roi entrant au cristal reste fatal.

## Sauvegardes et limites

Les nouveaux camps sont écrits au format v6 ; les versions 1–5 restent lues et
migrées sans modifier la vie des survivants. Le fichier familial reste v2 et inclut
ces camps. Un ancien jeu 0.21 ne sait pas lire les camps v6 : conserver un export
ancien si l'on souhaite revenir à cette version. Le stockage reste local et le
transfert entre appareils manuel.

Les descriptions et signaux ne simulent pas de soins ou dégâts : ils lisent les
règles réelles. Les crachats restent des impacts uniques, sans poison dans le temps.
Le cobra royal retire toujours exactement 2 PV à son tueur, le mamba noir 3 PV.
Aucun nouvel asset payant, serveur de combat ou compte n'est ajouté.
