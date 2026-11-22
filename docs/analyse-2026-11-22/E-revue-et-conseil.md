# Annexe E — Revue sévère et conseil du 22 novembre 2026

Les six lots fusionnés de l'analyse (PR 125 à 128) et un septième resté local (« rien ne
s'enregistre ») ont été relus après coup, à la demande du parent (« revue, conseil et
continue »). Cette annexe garde ce qui a été trouvé et ce qui a été décidé. Les rapports
complets et les captures ne sont pas dans le dépôt : ils étaient dans un dossier temporaire.

**Qui a relu.** Quatre relecteurs et trois juges, tous des agents automatiques lancés par
Claude : ni des personnes, ni des testeurs. Les relecteurs ont cherché à casser ce que les lots
annonçaient, en lançant le jeu dans Chromium sans écran et en écrivant des essais. Les juges
ont lu leurs rapports et le code, chacun depuis un siège : les sauvegardes, ce que voient
l'enfant et le parent, la livraison et la méthode.

**Ce qui n'a été essayé par personne.** Un vrai téléphone (sauf un appui du parent sur
« Exporter mon aventure », build 64), des enfants, Firefox, Safari, la garde de publication sur
GitHub, du code Android natif.

## Ce qui tient

| Constat                                                                                                                                             | Prouvé par                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Aucune règle n'a bougé                                                                                                                              | 301 parties entières rejouées, 4 400 empreintes, 1 952 camps identiques |
| L'ancien et le nouveau code de sauvegarde font la même chose, sauf le sauvetage voulu                                                               | 195 609 opérations tirées au hasard, comparées une à une                |
| Lire n'ajoute rien sur l'appareil ; supprimer un joueur retire ses dix clés ; aucune phrase de la politique de confidentialité n'est devenue fausse | essais unitaires et lecture                                             |
| Les nouvelles fenêtres tiennent à 780×360, 812×375 et 1280×800, en français et en anglais, cibles de 48 px                                          | Chromium sans écran                                                     |
| Les nombres annoncés dans les lots sont justes, à quatre près (corrigés dans l'analyse)                                                             | recomptés                                                               |

## Ce qui a été trouvé

État au 22 novembre au soir. « PR 129 » : corrigé dans cette PR, attaquée deux fois par une
relecture indépendante avant sa fusion, fusionnée le soir même.

| Constat                                                                                                                                                                                                               | Gravité            | État                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------- |
| **Android** : tout export est un téléchargement de navigateur ; dans l'application il ne fait rien (essai du parent, build 64), puis le jeu écrit « Fichier prêt ». `allowBackup="false"` : rien ne sort du téléphone | le plus grave      | décision du parent (deux modules)                    |
| La copie d'avant, une seule place gardée par les étoiles : perte à étoiles égales, import par erreur d'un fichier plus étoilé, copie figée après un import moins étoilé                                               | à corriger         | lot « copies »                                       |
| Le sauvetage n'atteint que le champ `camp` ; le même camp est écrit à deux ou trois endroits ; refusé partout, tout part comme avant                                                                                  | à corriger         | lot « sauvetage »                                    |
| La copie est écrite avant la sauvegarde : sur un appareil presque plein, elle peut prendre sa place                                                                                                                   | mineur, régression | lot « copies »                                       |
| Le drapeau « rien n'est enregistré » n'est pas toujours vrai ; les records de l'aventure sans fin sont refusés en silence                                                                                             | mineur             | lot « partie non gardée »                            |
| Le fichier mis de côté n'a qu'un tiroir, écrasé au refus suivant, alors que la fenêtre dit « sans être effacé »                                                                                                       | mineur             | lot « copies »                                       |
| La fenêtre « rien ne s'enregistre » dit au parent « puis rouvre le jeu » : c'est le geste qui perd la partie                                                                                                          | à corriger         | lot « partie non gardée » (non fusionné)             |
| Cette fenêtre peut s'ouvrir par-dessus « Qui joue ? » ou un combat sur un réseau lent                                                                                                                                 | à corriger         | lot « partie non gardée » (non fusionné)             |
| La fenêtre d'erreur se ferme au troisième appui sur Échap et ne revient plus                                                                                                                                          | à corriger         | PR 129                                               |
| Des erreurs qui continuent d'arriver repoussent la fenêtre sans fin et remplacent la vraie erreur                                                                                                                     | à corriger         | PR 129                                               |
| « Relance le jeu : tu retrouveras ton camp. » est faux dans La Grande Expédition et sur un appareil qui ne garde rien                                                                                                 | à corriger         | lot « écrans », mots à lire par le parent            |
| Le secours au démarrage ne rend que le fichier familial : ni les copies, ni l'expédition, ni les records ; une clé illisible retire tous les boutons                                                                  | à corriger         | lot « écrans »                                       |
| Rien ne tenait l'indépendance du secours vis-à-vis des règles du jeu                                                                                                                                                  | à corriger         | PR 129                                               |
| Sur téléphone, le premier bouton d'export en vue est « Exporter la sauvegarde d'avant »                                                                                                                               | à corriger         | lot « copies »                                       |
| Le test de la garde de publication ne lisait que le texte : huit façons sur neuf de l'éteindre passaient ; « urgence » échouait si GitHub ne répondait pas                                                            | à corriger         | PR 129                                               |
| Le test des serpents qui grandissent dans l'expédition ne regardait qu'une bataille                                                                                                                                   | à corriger         | PR 129                                               |
| Aucune recette ne tient « au moment calme »                                                                                                                                                                           | à corriger         | lot « partie non gardée »                            |
| Le haut du plan disait encore que rien ne change dans le jeu                                                                                                                                                          | à corriger         | corrigé avec cette annexe                            |
| Ordre de démarrage : une variable lue avant d'être déclarée empêche le jeu de démarrer, sans qu'un test unitaire le voie                                                                                              | à surveiller       | tenu par les recettes de la CI ; pas de test de plus |
| Page publique des parents : « elle n'exporte pas tout, notamment pas La Grande Expédition » — faux depuis la version 6 du fichier                                                                                     | texte publié       | à proposer au parent                                 |

## Ce que le conseil a décidé

### Android (les trois juges)

- Tout de suite, sans attendre personne : dans l'application, plus de bouton qui ne fait rien,
  plus de « Fichier prêt » ; une phrase vraie à la place. « Fichier prêt » ne s'affiche que
  lorsqu'un fichier a vraiment été remis.
- Pour réparer : les deux modules officiels de Capacitor, Filesystem et Share, avec l'accord du
  parent (ajout de dépendances). Pas de code natif écrit à la main : personne ici ne peut le
  compiler. Pas de `allowBackup="true"` : la sauvegarde partirait chez Google, contre la
  politique de confidentialité.
- Avant d'envoyer l'application à d'autres testeurs, sur le téléphone du parent : exporter,
  trouver le fichier hors de l'application, désinstaller, réinstaller, importer, retrouver les
  étoiles.
- **Suite, le 22 novembre au soir** : le parent a dit oui aux deux modules, après lecture des
  risques. Il a aussi essayé l'import sur le build 64 : il marche. Seul l'export est cassé.
- Le recrutement des testeurs n'attend pas ; la production attend un export vu en marche.

### Sauvegardes (juge 1)

- **Deux copies, deux clés.** `family-before-import` (nouvelle) : avant chaque import, le jeu
  garde l'aventure remplacée, avec l'expédition et les records ; si la copie échoue, l'import
  est refusé. `family-previous` (déjà dans `main`, jamais publiée) : la sauvegarde du lancement
  d'avant, ou celle qui avait le plus d'étoiles et d'autocollants tant qu'il en manque ; une
  copie que cette version ne sait pas lire n'est jamais remplacée. Sauvegarde d'abord, copie
  ensuite. Les noms des clés sont arrêtés avant toute publication.
- **Une section repliée « Copies de secours »**, après l'import. Un bouton par copie, qui
  l'envoie dans l'aperçu d'import existant : aucun fichier à sortir, même confirmation.
- **Le sauvetage** écarte tout camp qui ne se décode pas, aux cinq endroits où il est écrit ;
  le camp repris vient du même fichier, jamais de la clé `camp`.
- **Le secours au démarrage** rend un seul fichier avec toutes les clés du jeu, et l'import
  sait le relire, joueur par joueur.
- **Ce que les copies ne protègent pas**, à écrire tel quel : un camp perdu à étoiles et
  autocollants égaux, vu deux lancements plus tard ; deux imports par erreur de suite ; tout,
  si le téléphone est perdu, l'application désinstallée ou ses données effacées.

### Écrans et mots (juge 2)

- Un seul gabarit pour « quelque chose ne va pas » : un titre, une phrase à l'enfant, un
  bouton, « Pour les parents » replié. Un seul vocabulaire : garder, ton aventure, exporter,
  copie.
- Phrases proposées, à lire par le parent avant toute publication : fenêtre d'erreur, panne
  qui revient, partie non gardée (une phrase par cause), guérison dite, démarrage manqué avec
  « Réessayer », copies de secours, application sans export.
- La fenêtre « ta partie n'est pas gardée » : une fois par épisode, à un moment calme, jamais
  avant d'avoir joué ; une marque lisible sur l'accueil tant que c'est vrai.

### Livraison et méthode (juge 3)

- **Ne pas publier `main` en l'état** : la première publication écrirait une clé de copie dont
  le sens va changer. Aujourd'hui aucun appareil ne la porte.
- **`main` reste toujours publiable.** Un lot « à risque » est attaqué par une relecture
  indépendante **avant** sa fusion. Est à risque un lot qui : écrit, lit autrement ou efface
  quelque chose sur l'appareil ; change ce qui se passe quand quelque chose casse ; montre une
  phrase qui promet ; change ce qui juge les autres (CI, publication, limites) ; repose sur une
  chose jamais vue sur la vraie cible. Un seul lot à risque en vol ; une correction est
  attaquée à son tour.
- Chaque affirmation d'un compte rendu porte trois choses : **prouvé par** (le test, la
  recette, la mesure), **sur quoi** (un cas construit par l'auteur, l'appareil figé d'un
  testeur, le téléphone du parent), **ne couvre pas**. Pas de « jamais » ni de « toujours »
  sans un test qui tient l'universel. La mauvaise nouvelle d'abord.
- Les mots pour les enfants et les parents ne sont pas publiés avant que le parent les ait lus.
- Paquet principal : la limite de 200 000 octets reste ; aucun lot ne laisse moins de 2 500
  octets de marge ; un lot à part fait de la place avant de refaire l'accueil.

### La règle appliquée une première fois

La PR 129 (garde de publication, filet d'erreur) a été attaquée avant sa fusion, comme le veut
la règle. L'attaque a trouvé cinq points de plus, tous corrigés dans la même PR, puis attaqués
à leur tour :

- une étiquette Git nommée « main » trompait la garde (`git fetch origin main` prenait
  l'étiquette) : la branche est maintenant demandée par son nom entier ;
- le test de la garde ne tenait pas la réponse de GitHub (`--jq '1'` passait) : la question est
  comparée mot pour mot ;
- le test « une poussée lance toute la CI » laissait passer sept façons de l'alléger : le
  script de « portée » est lancé pour de vrai, et ce qu'une poussée lance est tenu par son nom ;
- la ligne des parents ne montrait pas toujours l'erreur qui a arrêté le plateau : Phaser
  compte une image une fois finie ; le guetteur garde les premières erreurs vues sur la même
  image, trois au plus ;
- l'indépendance du secours tenait à trois noms de fichiers : c'est maintenant la liste des
  fichiers permis.

Ce que l'attaque a aussi montré, et que rien dans le dépôt ne peut fermer : la garde est écrite
dans le fichier du workflow, et GitHub lance le fichier de la branche choisie dans « Use
workflow from ». Lancé depuis une autre branche que `main`, il n'y a pas de garde
(`docs/SITE.md`). Le parent peut ranger les secrets de publication dans un « environment »
limité à `main`.

### Ordre retenu

1. Les documents disent vrai (cette annexe, le suivi, le haut du plan).
2. La garde de publication et le filet d'erreur (PR 129), attaqués avant fusion.
3. Les écrans de panne : phrases, « Réessayer », secours en un fichier.
4. Les sauvegardes, trois lots à la suite, chacun attaqué avant le suivant : le sauvetage, les
   copies, « ta partie n'est pas gardée ».
5. Le parent lit les mots et accepte les copies gardées sur l'appareil ; toute la plage depuis
   la dernière publication est attaquée une fois ; il republie le commit déjà en ligne
   (répétition de la garde), puis `main`.
6. Build 65 : `main` et l'export, rien d'autre de natif ; installé par-dessus le build 64 ;
   essayé sur son téléphone.

Puis l'analyse reprend à son étape 3.
