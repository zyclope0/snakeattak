# Livraison autonome — v0.33.1, lot C

9 novembre 2026. Version Android41, même identité provisoire et même certificat.
Trois lots applicatifs terminés ; le programme global de l'audit reste partiel.
[Bilan A](BILAN-0.33.0.md), [bilan B](BILAN-0.33.1.md),
[conseil C](CONSEIL-LIVRAISON-0.33.1.md).

## Résultat

L'aide volontaire explique les quatre outils du camp, leurs vrais coûts et
conditions, sans dépenser ni modifier les règles. L'accueil reprend l'icône
retenue et présente les six missions existantes en parcours papier. Jouer et
la reprise restent prioritaires. Les états viennent de la vraie progression.
L'image originale n'est pas retouchée ; aucune génération ni dépendance ajoutée.

Le lot C corrige deux défauts reproduits : six racines de test qui contournaient
l'initialisation normale laissaient #app caché ; en portrait étroit non tactile,
les commandes rigides débordaient et le titre pouvait être coupé. Les recettes
initialisent maintenant leur propre racine ; le CSS autorise le retour à la
ligne et la hauteur naturelle du titre, uniquement en petit portrait. Aucune
réduction des cibles tactiles ni masquage du débordement.

## Constats, état et preuve

| Constat                                        | État                                                                               | Preuve                                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Outils difficiles à comprendre                 | Aide et conseils livrés ; compréhension familiale à observer                       | Bilan A, recette camp-tools quatre formats                                                   |
| Progression trop textuelle                     | Parcours des six missions livré ; verrous, étoiles et reprise inchangés            | Bilan B, 16 cas navigateur et 4 096 profils exhaustifs                                       |
| Ressources fournies insuffisamment exploitées  | Icône réutilisée au lanceur, accueil et favicon ; fonds HD conservés, non intégrés | PNG512 identique à la source, bilan B et inventaire du plan                                  |
| Racines de recette cachées                     | Corrigé dans les compositions de test                                              | Sept racines visibles, canvas non nul ; interruptions 11 contrôles                           |
| Petit portrait : commandes et titre débordants | Corrigé après reproduction sur production                                          | Recette tactical 12 combinaisons, mesures avant/après dans summary.json                      |
| Sauvegardes, codes et règles préservés         | Aucun changement de leurs modules ; compatibilité automatisée verte                | Schémas1–7 et chapitres1–3, test hors ligne ; diff des fichiers protégés vide depuis f2a6c00 |
| APK normal à tester                            | Assemblé et inspecté ; test physique pas fait                                      | apk.json et apk-inspection.txt                                                               |
| Site synchronisé                               | Fait : Sites18, recette en ligne trois formats verte                               | reports/deployment-0.33.1.json                                                               |

## Vérification

Sur le produit final : npm run verify **438 tests, zéro échec**, types,
formatage, build et budgets verts ; test:browser ordinateur et tactile vert.
Tactical12, interruptions11, hors ligne10, défilement5 formats tactiles et
ordinateur, enfant6 formats, aide4 formats, transitions2 contextes et racines7
verts. Les transitions utilisent l'app réelle avec stockage normal puis bloqué.
Le hors ligne sert uniquement les fichiers embarqués, réseau coupé : 23 fichiers,
zéro manquant ou externe. Il ne démontre pas une installation PWA.

Audit d'interface13 et interface24 verts au lot B ; pas de répétition inutile :
le seul CSS C affecte le portrait inférieur à600px, hors de leurs vues paysage.
Les recettes finales tactical/enfant couvrent ce changement. Tutoriel et stockage
bloqué ont aussi été vérifiés avant ce CSS ; leur portée est précisée dans le
rapport. Les **4 096 profils ne sont pas des parties simulées**.

HTML31 299octets, JS jeu191 833octets ; budgets32KiB/200 000 conservés.
27 captures finales et manifeste de28 fichiers figés dans
[reports/night-0331-delivery](../reports/night-0331-delivery/summary.json).
Au démarrage mesuré en navigateur neuf, le corps des réponses image passe de
2 618 518 à772 165octets, soit environ70,5% de moins. Ce n'est ni une mesure de
trafic total, de FPS, de mémoire ni de vitesse Android.

## APK et limites

[Télécharger l'APK debug normal](/workspace/conquete-serpents-v0.33.1-debug.apk).
13 960 650octets ; SHA256
`80f9ab97cdf1471dd49583ee6df58d3a2a5aab8f56e4331043359abd1f4026a7`.
AppID `com.conqueteserpents.famille` provisoire conservé, code41, paysage capteur.
Même certificat que0.32.4 ; 28 fichiers web identiques au build validé ; 20 PNG
natifs décodés et comparés. Démarrage `/`, sans mode diagnostic ; aucune permission
INTERNET, BILLING ou AD_ID. Compilation Gradle assembleDebug hors ligne après
synchronisation Capacitor normale, à partir du dist déjà vérifié.

Pas de téléphone physique, de test de mise à jour avec un camp réel, de lecteur
d'écran ou de validation réelle des enfants. Les recettes tactiles Chromium ne
les remplacent pas. Pas de mesure FPS/RAM native ni de CI distante nouvelle.
Aucune règle, sauvegarde, ancien code de départ, publicité, achat ou image payante
modifiés. Les langues, lieux, campagne et choix commerciaux restent distincts.

## Publication et clôture

Site existant publié en0.33.1, version Sites18, audience publique conservée.
[Reçu complet](../reports/deployment-0.33.1.json). Contrôle en ligne à1280×800,
812×375 tactile et375×812 tactile : zéro erreur JavaScript. Mission, vague1,
quatre favoris, aide et pause HTML vérifiées ; portrait avec consigne de rotation.
Plateau812×375 :580,13×326,98px, soit87,20% de la hauteur et71,44% de la largeur.
HTML, JS jeu et CSS en ligne identiques octet par octet au build validé.

Un premier contrôle réseau Node a été indisponible ; la lecture CDP du texte CSS
réencodait ensuite quelques glyphes. La lecture brute arrayBuffer dans le
navigateur a confirmé les octets exacts : aucun défaut du produit et aucune
modification supplémentaire. Source Site072a778, déploiement réussi.

Les trois lots autonomes sont clôturés, chacun suivi de son conseil de six.
Pour le prochain essai : installer par-dessus l’ancienne version sans effacer les
données, retrouver un camp, parcourir le catalogue au doigt, consulter ? puis
revenir à l’action. Ce sont des observations encore nécessaires, pas des tests
physiques déjà réalisés.
