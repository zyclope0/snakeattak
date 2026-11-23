# Décisions du parent — 23 novembre 2026

Réponses données une par une, le matin du 23 novembre, aux questions de
[MOTS-A-LIRE-2026-11-22.md](MOTS-A-LIRE-2026-11-22.md). Elles font foi pour les lots qui suivent.

| #   | Question                                                          | Décision                                                                                                                                                                                                                                                                                                                                           |
| --- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Nom du build dans la politique de confidentialité                 | **Oui** : « 0.41.0 (build 65) » à la place de « 0.40.0 (build 64) », ligne du haut et paragraphe du voyage.                                                                                                                                                                                                                                        |
| 2   | Phrase sur le cache de l'application dans la politique            | **Oui, l'ajouter** après « vous décidez où il est stocké et qui le reçoit » : « Dans l'application Android, le fichier est d'abord écrit dans le cache de l'application, où des copies restent (une par sorte de fichier) tant qu'Android ne vide pas ce cache, puis remis au partage d'Android, où vous choisissez l'application qui le reçoit. » |
| 3   | Partage d'Android (contacts récents), « Pour les parents » ouvert | **Une barrière sur l'export seul** : une petite question pour adulte avant d'ouvrir le partage. Nouveau lot, nouveaux mots à lire.                                                                                                                                                                                                                 |
| 4   | Quand vient la fenêtre « Ta partie n'est pas gardée »             | **Après une vague gagnée** pendant la partie en cours (ce qui est fait). À l'arrivée, la marque seule.                                                                                                                                                                                                                                             |
| 5   | Copie « D'un lancement d'avant » à étoiles égales                 | **Garder la règle actuelle** : elle protège l'aventure de l'enfant contre deux imports par erreur ; le cas rare reste écrit.                                                                                                                                                                                                                       |
| 6   | Phrase des parents, appareil plein                                | **« L'appareil n'a sans doute plus assez de place pour garder la partie. Libère de la place sans fermer le jeu, puis continue à jouer : il réessaiera et le dira. »**                                                                                                                                                                              |
| 7   | Texte publié faux sur la sauvegarde familiale                     | **Corriger** : « L'espace parents propose une sauvegarde familiale ; elle porte l'aventure du joueur en cours, avec son expédition, son voyage et ses records ; elle ne porte pas les autres joueurs. »                                                                                                                                            |
| 8   | Copie gardée avant un import, dans la politique                   | **Oui, ajouter** : « Avant chaque import, le jeu garde sur l'appareil une copie de l'aventure remplacée, pour pouvoir revenir en arrière ; supprimer le joueur la supprime aussi. »                                                                                                                                                                |
| 9   | Les autres phrases nouvelles (sections 1 à 6 et 8)                | **Approuvées telles quelles** (avec la phrase de la décision 6).                                                                                                                                                                                                                                                                                   |
| 10  | Phrase « stockage bloqué » dans l'application                     | **Une phrase propre à l'application** : « Cet appareil ne laisse pas le jeu garder la partie. Elle dure tant que le jeu reste ouvert. » Le site garde la sienne.                                                                                                                                                                                   |

## Ce qui en découle

- **Lot « build 65 »** : version 0.41.0 / build 65 partout (`package.json`, `package-lock.json`,
  `android/app/build.gradle`, `POLICY_APP`), politique de confidentialité (décisions 1, 2, 8,
  avec leur anglais), phrases des décisions 6 et 10, page publique (décision 7), bilan
  `BILAN-0.41.0.md`. Puis construction du build 65 par le parent et recette sur le téléphone
  (`ANDROID-BUILD-65.md`).
- **Lot « barrière de l'export »** (décision 3) : avant d'ouvrir le partage d'Android, une
  question pour adulte. Choix du parent le 23 novembre : une multiplication, dans
  l'application seulement. **Mots à lire par le parent** (`src/texts/fr/gate.ts`, et la
  phrase du refus dans `src/texts/fr/family.ts`) :
  - « Pour envoyer le fichier, un adulte répond : »
  - « Combien font 17 × 9 ? » (deux nombres tirés à chaque fois, de 12 à 19 et de 6 à 9)
  - boutons « Annuler » et « Envoyer »
  - après « Annuler » ou une mauvaise réponse : « Rien n'a été envoyé : il faut la bonne
    réponse d'un adulte. »
- Les traductions anglaises des phrases approuvées en français sont faites par moi ; elles
  sont listées dans le bilan pour que le parent puisse les relire.
- Aucune publication sans le mot du parent pour chaque envoi.
