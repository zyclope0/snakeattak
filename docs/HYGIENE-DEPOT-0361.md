# Hygiène du dépôt — proposition 0.36.1

> Appliqué le 11 novembre 2026, sans réécriture d'historique : voir [ARCHIVES.md](ARCHIVES.md).
> Le texte ci-dessous est la proposition d'origine.

**Proposition seulement.** Aucun ancien fichier retiré du suivi, aucune migration,
réécriture d’historique, configuration Git ou publication d’archive distante.
Les nouvelles preuves 0.36.1 restent dans `artifacts/interface-0361/` et dans
une archive locale externe, avec un petit index suivi.

Mesure reproductible : tailles des blobs de `git ls-tree -r -l`, sans dépendre
des fichiers de travail mutables. Les Mo ci-dessous sont décimaux ; les octets
font foi. Script, résultats complets et empreintes dans l’archive de preuves.

| Mesure                    | Audit `9287e60` | Début de livraison `49a1e5a` |
| ------------------------- | --------------: | ---------------------------: |
| Fichiers suivis           |           6 631 |                        6 639 |
| Octets suivis             |     670 253 713 |                  670 317 902 |
| Dont `reports/`           |     442 082 822 |                  442 082 822 |
| Dont `docs/`              |     197 471 545 |                  197 481 415 |
| Différence depuis l’audit |               — |  +64 189 octets, +8 fichiers |

Au commit source avant APK `72cc788`, le total est de 6 642 fichiers /
670 337 761 octets, soit +84 048 octets et +11 fichiers depuis l’audit.
Les candidats restent identiques ; le reste conservé est de 190 620 619 octets
avec le seuil 256 Kio. Les petits résumés de livraison ajoutés ensuite sont
comptés séparément dans l’index ; aucun retrait de suivi n’a eu lieu.

La mesure de 670 253 713 octets appartient à `9287e60`, avant les nouveaux
plan et spécification ; elle ne décrit pas un comptage effectué sur `79e0f8a`.

Deux politiques possibles : images de rapports et de `docs/captures-*`, plus
JSON de rapports strictement au-dessus du seuil. Le fichier canonique
`docs/captures-0.32.4/rounded-square.png` (667 227 octets), référencé par
`GAME_DESIGN.md`, reste exclu des deux politiques. Les sources, ressources
originales, audits, code et petits index Markdown sont conservés.

| Politique future                                  | Fichiers candidats | Octets candidats | Reste à l’audit | Reste au début de livraison |
| ------------------------------------------------- | -----------------: | ---------------: | --------------: | --------------------------: |
| JSON >256 Kio + images, aperçu canonique conservé |                442 |      479 717 142 |     190 536 571 |                 190 600 760 |
| JSON >64 Kio + images, aperçu canonique conservé  |                466 |      482 811 626 |     187 442 087 |                 187 506 276 |

Le potentiel brut initial de 480 384 369 octets / 443 fichiers devient
479 717 142 octets / 442 fichiers après cette protection canonique. Ce calcul
reste une **liste de candidats à examiner**, pas l’autorisation de rompre les
liens des bilans, ni un gain garanti. Un inventaire de toutes les références
entrantes devra encore distinguer les preuves à garder accessibles. Aucun
volume compressé futur n’est estimé ici.

Ordre proposé après un GO explicite :

1. Copier les fichiers candidats dans un stockage d’artefacts privé et conserver
   une copie locale externe. Aucun téléversement n’est effectué dans ce lot.
2. Vérifier chaque taille et SHA-256, relire l’archive puis tester une restauration
   complète. Conserver les sources d’audit et références artistiques canoniques.
3. Ajouter un index JSON léger : chemin original, taille, SHA-256, archive,
   emplacement réel et procédure de récupération. Vérifier les liens concernés
   avant de les remplacer par cet index.
4. Proposer un commit distinct retirant seulement les candidats approuvés du
   suivi courant. Ne jamais supprimer la seule copie d’une preuve.
5. Mesurer les résultats sur un checkout neuf, un clone superficiel et un clone
   complet ; conserver les chiffres séparés.

L’audit relevait 212,01 Mio de packs et 61,57 Mio d’objets Git libres ; ces
mesures de stockage Git diffèrent des octets du checkout. Un retrait du suivi
courant aide les futurs clones superficiels (`fetch-depth: 1`, notamment en CI)
et les checkouts, mais les clones complets et existants gardent les anciens
objets. Un clone partiel est une autre option future ; aucune configuration
n’est changée ici. Une réécriture d’historique pourrait diminuer ces anciens
objets, avec coordination des clones et sauvegarde ; elle attend une
approbation explicite distincte.

Git LFS faciliterait le suivi futur de gros fichiers, mais n’enlève pas les
objets déjà présents et ajoute quotas, transfert et dépendance à son stockage.
Des artefacts privés (par exemple une Release privée) avec index JSON léger
conviennent mieux aux preuves de livraison rarement consultées. Leur création
et leur envoi restent soumis au GO ; aucune URL distante fictive n’est fournie.
