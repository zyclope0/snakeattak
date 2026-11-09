# Bilan 0.35.0 — tactique et français/anglais

9 novembre 2026. Demande : réaliser le lot2 de lisibilité, doubler l'application
en anglais sous le nom **Snake Attack TD**, et cacher une petite soucoupe à un
seul endroit. Direction pâte à modeler/papier mâché et jeu inventé par l'enfant
conservés. **Aucune règle de combat ou valeur d'équilibrage modifiée.**

## Ce qui change

| Objectif                                          | Fait / pas fait                                                                                                             | Preuve                                                                                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Placement plus compréhensible                     | Fait : geste explicite, rôle et vraie portée ; suggestion de voie faible parmi les voies ouvertes                           | `src/ui/placementAdvice.ts`, [placement812](captures-0.35.0/placement-812.png), [petit paysage](captures-0.35.0/placement-568-marges.png) |
| Moins de texte médical près du fort               | Fait : pas de badge de stock plein ; stock partiel compact, retour et recharge collective déduits des données réelles       | `src/render/medicalReadout.ts`, [boss et soins en état contrôlé](captures-0.35.0/anglais-boss-soins-controle.png)                         |
| Résultat et défaite                               | Fait : grandes étoiles réellement gagnées, score nommé accessible, consigne correspondant au réessai proposé                | `src/ui/resultCopy.ts`, `battleResult.ts`, [étoiles contrôlées](captures-0.35.0/etoiles-812-controle.png)                                 |
| Événement pendant placement                       | Corrigé après contrôle élargi : l'événement conserve la ligne du bas ; la consigne compacte revient quand il disparaît      | `battleNotices.ts`, recette tactique trois formats et audit interface                                                                     |
| Application FR/EN                                 | Fait : accueil, missions, unités, dangers, pouvoirs, aide, progression, résultats, sauvegarde/import, sons et textes Phaser | `src/i18n/`, [accueil anglais](captures-0.35.0/anglais-accueil-812.png), [aide](captures-0.35.0/anglais-aide.png)                         |
| Choix de langue sans repartir à zéro              | Fait : accueil et pause, préférence mémorisée séparément du camp ; mêmes nœuds, commandes, état et codes                    | [pause avec marges](captures-0.35.0/anglais-pause-568-marges.png), recette locale et adaptateurs                                          |
| Nom anglais Android                               | Fait : Snake Attack TD dans `values-en`, nom français conservé ; identifiant provisoire inchangé                            | `android/app/src/main/res/values-en/strings.xml`, inspection de l'APK                                                                     |
| Petite soucoupe unique                            | Fait : dessin original statique,36×20, en haut à droite des seules ruines classiques                                        | `src/render/saucer.ts`, [capture contrôlée](captures-0.35.0/soucoupe-ruines-controle.png), provenance                                     |
| Nouveaux modes, missions, règles ou rééquilibrage | Pas fait, hors demande                                                                                                      | 34 fichiers canoniques identiques à la base `fb16b71`, empreintes dans le rapport                                                         |
| Relecture anglophone et nouvel APK sur le S24     | À faire avec de vraies personnes/appareil                                                                                   | Les recettes Chromium ne les remplacent pas                                                                                               |

## Langue et compatibilité

Le sélecteur **Français / English** est à l'accueil et dans la pause. Au premier
lancement, le jeu utilise la langue système prise en charge ; ensuite il retient
le choix. Le titre anglais est Snake Attack TD. Changer de langue ne redémarre
pas la partie, ne reprend pas le combat et ne change ni le son ni les achats.
Le nom de l'icône Android suit la langue du téléphone indépendamment du choix
fait dans le jeu, sans redémarrage d'Activity.

Les données du moteur restent canoniques en français. Les adaptateurs projettent
les traductions aux écritures DOM/Phaser et actualisent aussi les labels mis en
cache. Les contenus bruts de code/rapport/sauvegarde restent bruts ; leurs
métadonnées linguistiques peuvent se traduire. Aucun observateur global de
remplacement de mots, aucune API de traduction, aucune dépendance ajoutée.
Le prototype V4 historique et les documents internes ne sont pas traduits.

Inventaire final : **830 entrées sources,861 entrées du catalogue anglais,
aucune entrée manquante ou paramètre ajouté**. Ces nombres incluent des chaînes
techniques et des fragments : ce ne sont pas861phrases de dialogue. Huit
omissions de suffixes d'accord français dans les gabarits sont répertoriées
explicitement et relues ; les valeurs numériques sont préservées.

La couverture automatique avait laissé passer un contresens sur les2PV du cobra
et deux fragments français séparés par du balisage. Ils ont été corrigés après
le conseil, avec tests ciblés. L'absence de détection heuristique ne constitue
pas une garantie de traduction parfaite. Voir le [conseil final](CONSEIL-0.35.0.md)
et le [conseil tactique](CONSEIL-0.35.0-lot1.md).

## Vérification et limites

Les commandes et nombres de cas sont consignés dans
[verification.json](../reports/suivi-0.35.0/verification.json), avec les journaux,
recettes et empreintes. Les captures « contrôlées » montrent des états installés
par fixtures ; elles ne sont pas présentées comme des parties terminées.
Les invariants comparent Game, Session, RNG, checkpoint, départ et commandes
avant/après changement de langue, puis deux jeux de même graine.
Les anciens schémas1–7 sont relus hors ligne.

Formats FR/EN :1280×800,1366×768,812×375,780×360,568×320,375×812 ;
variante568 avec marges système. Le portrait tactile affiche la consigne de
rotation. À812×375, le plateau mesuré fait environ580×327, soit87,2% de la
hauteur et71,4% de la largeur. Les recettes ne valident pas Android physique,
TalkBack, le grossissement système ou la compréhension des enfants.

Le premier échec du test navigateur provenait de son attente de démarrage :
le bootstrap est maintenant asynchrone. Le helper attend le vrai écran visible.
La recette de menaces attend aussi le vrai menu avant d'injecter son profil de
fixture. L'audit interface a, lui, trouvé une vraie régression de priorité de
l'annonce, corrigée ; son ancienne attente de ligne vide après l'événement est
remplacée par le contrôle du retour de la nouvelle consigne de placement.
Aucune attente n'est supprimée pour masquer un défaut.

Les parties d'équilibrage et les532simulations du bilan0.34.2 restent leur
échantillon historique. Aucun nouveau taux de victoire enfant n'est déduit ici.
Suivis mineurs : aide longue, cibles secondaires de l'accueil petites, explication
du nombre/délai médical collectif, petits textes transitoires au fort et indice
de défilement des résultats. Cohérence graphique complète encore progressive.

## Distribution

Version0.35.0/code45, même identifiant provisoire et même certificat debug.
L'APK normal ne démarre pas en diagnostic. Ses fichiers web sont comparés octet
pour octet au build. Ni permission INTERNET/BILLING/AD_ID, ni SDK publicitaire
ou d'achat ajouté. L'export autonome embarque les deux langues ; aucun service
worker ou téléchargement supplémentaire n'est requis pour jouer dans l'APK.
Le site web doit naturellement charger ses fichiers avant une première partie.

Publication et tailles finales : voir le reçu de livraison ajouté à ce bilan.
La nouvelle branche est destinée à une nouvelle PR ; l'accord de fusion de
la PR1 ne vaut pas fusion automatique de cette évolution.

## Résultats et poids mesurés

| Commande / recette                     | Résultat                                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run verify`                       | 458tests verts, types/format/build et budgets verts                                            |
| `npm run test:locale`                  | 392contrôles,24contrats d'adaptateurs,830sources couvertes ; zéro erreur/clé inconnue détectée |
| Tactique / interface / enfant          | 3formats×6critères,24contrôles interface,6formats enfant                                       |
| Audit / interruptions / présentation   | 13/11/14contrôles ou scénarios verts                                                           |
| Missions / régressions / codes / soins | Parcours verts ;12contrôles nommés de départ                                                   |
| Hors ligne                             | 10contrôles, schémas1–7 relus, zéro fichier manquant ou appel externe                          |
| Menaces / défilement renforts          | 5écrans et11critères ;5cas tactiles et ordinateur                                              |
| Portable                               | Build et recette FR verts ; Refuge réellement terminé en anglais,3vagues,100% du cristal       |
| Dépendances de production              | 0vulnérabilité retournée par l'audit à cette date                                              |

HTML normal : **31 771octets**. JS initial du jeu en français : **207 123octets cumulés** répartis entre entrée interface et règles ; anglais additionnel **65 681octets**. Phaser reste séparé. Total des cinq fichiers JS Phaser compris : **1 754 596octets**. Le plafond de200000octets reste appliqué à chaque JS hors Phaser ; il n'a pas été relevé pour masquer la croissance. Portable :15 057 756octets de HTML autonome.
