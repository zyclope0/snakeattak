# Mots nouveaux à lire par le parent — 22 novembre 2026

Ces phrases ont été écrites sans toi pendant les lots de solidité. Aucune n'est publiée. Elles
sont à lire avant la prochaine publication du site et avant le build 65 : oui, non, ou autre
mot. L'anglais de chacune est dans `src/texts/en/` sous le même nom.

Aucune n'a été essayée avec un enfant.

**Réponses du parent, 23 novembre 2026** : voir [DECISIONS-2026-11-23.md](DECISIONS-2026-11-23.md).

## 1. Le plateau s'arrête sur une erreur

Fenêtre « Oups, le jeu s'est emmêlé ! » (titre déjà dans `main`), bouton « Relancer le jeu ».

| Quand                                            | Phrase                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| En plein combat                                  | « Relance le jeu. Tu devras refaire cette bataille depuis le début. » |
| Ailleurs (camp, résultat, accueil)               | « Relance le jeu pour continuer à jouer. »                            |
| La panne revient moins de cinq minutes plus tard | « Ça recommence. Va chercher un adulte. »                             |

Sous « Pour les parents » : « Une erreur a arrêté le jeu. Ce qui était déjà gardé sur
l'appareil n'est pas touché. Si cela revient, prends cet écran en photo : »

## 2. Le jeu ne démarre pas

- Titre : « Oups, le jeu n'arrive pas à démarrer ! »
- À l'enfant : « Appuie sur Réessayer. Si ça ne marche toujours pas, va chercher un adulte. »
- Bouton : « Réessayer »
- Sous « Pour les parents », sur le site : « Les aventures gardées sur cet appareil sont
  toujours là. N'efface pas les données du jeu avant d'avoir gardé ces fichiers : un par
  joueur, avec son aventure, ses missions et ses carnets. L'expédition, le voyage et les
  records n'y sont pas. Tu reprendras chaque fichier dans « Pour les parents », « Sauvegarde
  familiale ». » — boutons « Garder l'aventure du joueur 1 », « … 2 »
- Sous « Pour les parents », dans l'application tant qu'elle ne sait pas sortir un fichier :
  « Des aventures sont gardées dans cet appareil. N'efface pas les données du jeu et ne
  désinstalle pas l'application : elles partiraient avec. »

## 3. L'application ne sait pas sortir un fichier

À la place du bouton « Exporter mon aventure », seulement si l'export n'est pas possible :
« Dans l'application, l'aventure ne peut pas sortir de cet appareil. Si l'application est
désinstallée ou si ses données sont effacées, elle est perdue. »

Avec les deux modules que tu as acceptés, cette phrase ne se verra que dans un build qui ne les
porte pas (64 et avant).

## 4. Un camp de la sauvegarde ne se lit plus

Ligne d'état, en bas de l'accueil : « Tes étoiles, tes missions et tes carnets sont bien là.
Un camp n'a pas pu être relu. »

## 5. Copies de secours, dans « Sauvegarde familiale »

- Titre de la section repliée : « Copies de secours »
- Dessous : « Le jeu garde tout seul d'anciennes copies de ton aventure, sur cet appareil, au
  cas où. »
- Première copie : « Avant le dernier remplacement » — « L'aventure qui était là juste avant
  qu'un fichier la remplace. »
- Seconde copie : « D'un lancement d'avant » — « Ton aventure comme elle était à un lancement
  d'avant : le dernier, ou celui d'avant une perte d'étoiles ou d'autocollants. »
- Bouton de chaque copie : « Regarder cette copie »
- Un fichier mis de côté que cette version lit : « Fichier mis de côté » — « Un fichier que le
  jeu n'avait pas su lire. Cette version le lit. »
- Un fichier mis de côté qu'elle ne lit pas : « Un fichier que cette version du jeu ne sait
  pas lire est gardé sur cet appareil. Une prochaine version pourra peut-être le lire : il
  sera alors proposé ici. » — sur le site, bouton « Exporter ce fichier », puis « Fichier
  remis. Cette version du jeu ne sait pas le relire : garde-le pour une prochaine version. »

À décider aussi : importer par-dessus une aventure ne la retire plus de l'appareil tout de
suite, elle y reste jusqu'à l'import suivant. La politique de confidentialité reste vraie
(« les parties sauvegardées restent sur l'appareil ») ; veux-tu y ajouter une phrase ?

## 6. Ta partie n'est pas gardée

- Titre : « Ta partie n'est pas gardée »
- À l'enfant : « Tu peux continuer à jouer. Si tu fermes le jeu, il oubliera ce que tu viens
  de faire : va d'abord chercher un adulte. »
- Bouton : « J'ai compris »
- Sous « Pour les parents », selon la cause :
  - appareil plein : « L'appareil n'a sans doute plus assez de place pour garder la partie.
    Libère de la place sans fermer le jeu : il réessaie tout seul et le dira. »
    (« tout seul » veut dire au prochain geste qui sauvegarde : une vague, un achat. Si tu
    préfères, « … sans fermer le jeu, puis continue à jouer : il réessaiera et le dira. »)
  - stockage bloqué : « Cet appareil ne laisse pas le jeu garder la partie (navigation
    privée, ou stockage bloqué dans les réglages). Elle dure tant que le jeu reste ouvert. »
  - le jeu n'arrive pas à écrire : « Le jeu n'arrive pas à garder cette partie. Elle dure
    tant que le jeu reste ouvert. »
- Marque sur l'accueil : « Partie non gardée »
- Quand l'appareil garde de nouveau : « C'est réparé : ta partie est de nouveau gardée. »

## 7. Un texte déjà publié, à corriger avec ton accord

La page publique des parents dit encore : « L'espace parents propose une sauvegarde
familiale ; elle n'exporte pas tout, notamment pas « La Grande Expédition » ni les profils. »
C'est faux depuis la version 6 du fichier, qui porte l'expédition, le voyage et les records.
Proposition : « … elle porte l'aventure du joueur en cours, avec son expédition, son voyage et
ses records ; elle ne porte pas les autres joueurs. »

## 8. Sortir un fichier de l'application (build 65)

Dans l'application, « Exporter mon aventure » ouvre le partage d'Android. Android dit seulement
quelle application a été choisie, s'il y en a une, jamais si le fichier y est bien arrivé. Les
phrases ne disent donc pas plus :

| Quand                                         | Phrase                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Une application a été choisie                 | « Le fichier est parti vers l'application que tu as choisie. Vérifie qu'il y est bien arrivé et garde-le : il permet de retrouver cette aventure sur un autre appareil. » |
| Pareil, pour un fichier mis de côté illisible | « Le fichier est parti vers l'application que tu as choisie. Cette version du jeu ne sait pas le relire : garde-le pour une prochaine version. »                          |
| Aucune application n'a été nommée             | « Le partage s'est fermé. Si le fichier n'est arrivé nulle part, recommence : ton aventure n'est encore que sur cet appareil. »                                           |
| Pareil, pour un fichier mis de côté           | « Le partage s'est fermé. Si le fichier n'est arrivé nulle part, recommence. »                                                                                            |

Sur le site, rien ne change (« Fichier prêt… »).

## 9. Politique de confidentialité, avant le build 65

Elle nomme « l'application Android 0.40.0 (build 64) » : c'est un texte que tu as approuvé, je
ne l'ai pas touché, et c'est pourquoi ce lot ne monte pas la version. Pour le build 65, il faut
ton accord sur :

- le nom du build : « 0.41.0 (build 65) » à la place de « 0.40.0 (build 64) » dans la ligne du
  haut et dans le paragraphe du voyage (ce qui y est dit du fichier reste vrai) ;
- une phrase de plus, si tu la veux, après « vous décidez où il est stocké et qui le reçoit » :
  « Dans l'application Android, le fichier est d'abord écrit dans le cache de l'application,
  où des copies restent (une par sorte de fichier) tant qu'Android ne vide pas ce cache,
  puis remis au partage d'Android, où vous choisissez l'application qui le reçoit. » Elle est
  vraie, mais pas indispensable : la phrase actuelle couvre déjà le partage.
- le partage d'Android montre les contacts récents (noms et photos), et « Pour les parents »
  n'a pas de barrière : à toi de dire si cela te va.
