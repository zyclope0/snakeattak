# Plan actuel — 20 novembre 2026

Une page. Ce qui s'est passé du 15 au 20 novembre (revues du site, décisions du parent du
18 novembre, révisions 3 à 6, soutien, AdSense) est dans
[archive/PLAN-ACTUEL-2026-11-15-au-20.md](archive/PLAN-ACTUEL-2026-11-15-au-20.md) ; avant le
15 novembre : [archive/PLAN-ACTUEL-avant-2026-11-15.md](archive/PLAN-ACTUEL-avant-2026-11-15.md).

## Où on en est

| Quoi                      | État                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Site**                  | https://snakeattacktd.com, publié depuis `main` le 20 novembre (publication n° 32, contrôle en ligne vert). 14 pages FR/EN, dont « L'histoire » et « Tester sur Android ». Révision 7 (spinosaure) jouable.                                                                                                                                                                                                |
| **Application**           | 0.39.0 / build 63 (révisions 3 à 6, sans le spinosaure). Arrivée sur le téléphone du parent par Google Play (19 novembre). Promue dans le test fermé « Alpha » le 20 novembre, en attente de l'examen de Google ([passation](ANDROID-BUILD-63.md), [bilan](BILAN-0.39.0.md)).                                                                                                                              |
| **Test fermé Android**    | Créé par le parent le 20 novembre : groupe public `snakeattack-testeurs`, piste « Alpha ». Trois modifications (pays, liste de testeurs, adresse de retours) restaient à envoyer à l'examen de Google d'après le compte rendu du parent du 20 novembre : à confirmer. Le lien d'inscription marche quand Google les a acceptées. Google demande 12 testeurs pendant 14 jours de suite avant la production. |
| **Publicité sur le site** | Éteinte. AdSense n'a pas encore approuvé le site. Rien ne s'allume sans le message du parent ([ordre d'activation](publication/PUBLICITE-WEB-PROPOSITION.md)).                                                                                                                                                                                                                                             |
| **Les enfants**           | Le fils a joué 2 ou 3 parties sur le site le 19 novembre, content, sans remarque précise. Aucune séance notée depuis.                                                                                                                                                                                                                                                                                      |

## En cours (20 novembre) : La Grande Expédition

Le long voyage demandé par le parent : trois tableaux de cinq missions, des chemins, des
haltes, le camp qui suit l'enfant, les cadeaux de l'aventure sans fin
([proposition et décisions](VOYAGE-LONG-PROPOSITION.md), [compte rendu](BILAN-GRANDE-EXPEDITION.md)).
Moteur mesuré et publié (PR 103) ; écrans et recette faits dans le lot suivant. Ensuite : les
défis originaux, un par un, montrés au fils avant.

L'aventure sans fin est finie et publiée ([compte rendu](BILAN-MODE-INFINI.md)).

## Dans `main` et sur le site, pas encore dans l'application

- **Le spinosaure** (révision 7, 19 novembre) : allié du fils dans la grande aventure dès la
  vague 8, voile et nage ; valeurs choisies par le parent après mesure
  ([bilan](BILAN-REVISION-7.md)). Le catalogue des alliés met ses onglets dans la ligne du
  titre pour tenir sur un téléphone.
- **La politique de confidentialité du 20 novembre**, avec la section « Test de
  l'application Android ». L'application 0.39.0 montre encore celle d'avant.

Ils attendent le **build 64**, construit par Codex depuis `main` comme le 63
(`npm run android:package`, [ANDROID-BUILD-63.md](ANDROID-BUILD-63.md)), puis promu dans
« Alpha » par le parent.

## Ce qui attend le parent

1. **Play Console** : vérifier que les trois modifications du test « Alpha » sont envoyées et
   acceptées ; ouvrir le lien d'inscription depuis un autre compte Google pour voir qu'il
   marche.
2. **Recruter les testeurs** : 15 à 20 adultes pour en garder 12 pendant 14 jours. Claude peut
   écrire le message type et une affichette A5 avec QR code
   ([TESTEURS-ET-JOUEURS.md](TESTEURS-ET-JOUEURS.md), « Recommandation »).
3. **Search Console et Bing** : déclarer le site et envoyer le plan du site, dans les comptes du
   parent ([SITE.md](SITE.md)). Aucune trace dans le dépôt que ce soit fait.
4. **Une séance avec les enfants**, 30 à 45 minutes sur le téléphone : le voyage, les nouveaux
   serpents, le spinosaure (sur le site). Noter où ils tombent, ce qui les décourage, ce qu'ils
   redemandent. C'est ce qui choisit le contenu suivant. Montrer aussi au fils les phrases
   d'annonce à valider (« Nouveau serpent : … ! », « Nouvel allié : … ! » ; « Nouveau serpent :
   Serpent ninja ! » lui va-t-il, ou plus court ?), et regarder sur le téléphone l'écran étroit
   (920 px) et les noms des voies sur la carte d'une mission, encore petits.
5. **Plus tard, quand il veut** : une meilleure photo du dessin (prise d'en haut, fond uni) ;
   dire si la photo d'origine, où l'on voit un billet de train de la région, doit sortir de
   `public/references/` (elle n'est pas publiée sur le site, mais elle est dans Git, qui est
   public) ; l'ancien site `…chatgpt.site`, où personne ne joue, peut être arrêté quand il
   veut.

## À faire, dans l'ordre

1. **Build 64** (Codex) : spinosaure et politique du 20 novembre dans l'application. Version
   à changer ensemble à trois endroits : `package.json`, `android/app/build.gradle` et
   `POLICY_APP` dans `src/i18n/privacyPolicy.ts`. Avant de le promouvoir, faire la recette
   native : celle du build 63 n'est pas remplie (`ANDROID-BUILD-63.md`, cases vides).
2. **Dossier Google Play** : `docs/publication/` et `npm run store:check` décrivent encore
   l'ancien modèle (publicité entre missions, achats). Le parent a décidé : ni publicité ni
   achat dans l'application. À refaire avant la sortie en production, avec des captures du jeu
   actuel.
3. **Après la séance des enfants** : voyage sans fin s'ils finissent le voyage ; voyage plus
   doux s'ils tombent devant le roi ; nouvelles
   missions du fils s'ils veulent du neuf. Idées du fils en attente : le boss caché aux pommes
   (nombre de pommes à mesurer), le pierre-feuille-ciseaux entre dinosaures (« il faut plus de
   dinosaures »). Chaque règle nouvelle passe par une mesure, l'accord du parent et une
   nouvelle révision.
4. **Trouver des joueurs pour le site**, une fois les testeurs lancés : Outils Tice, CNLJ,
   journal local ([TESTEURS-ET-JOUEURS.md](TESTEURS-ET-JOUEURS.md)). Tant que la publicité est
   éteinte, le site peut se dire « sans publicité ».

## Ce qui n'est pas vérifié

- **La recette native du build 63** (`ANDROID-BUILD-63.md`) : cases vides ; seule celle du
  build 62, sur émulateur, est faite.
- **Sur un vrai téléphone** : le spinosaure, le catalogue à 21 alliés, les deux nouvelles pages
  du site. Le build 63 est arrivé sur le téléphone, mais aucune séance n'est notée.
- **Avec les enfants** : le voyage (les simulations disent qu'un joueur « apprenti » tombe trois
  fois sur quatre devant le roi), les révisions 3 à 7, les textes à 11 et 13 px.
- **Le lien d'inscription au test** : jamais ouvert depuis cette session (les sites Google y
  sont bloqués).
- **L'anglais** : pas relu par une personne.

## Dettes connues

- `reports/` : 844 fichiers de rapports encore suivis dans Git.
- **Paquet principal : 199,3 Ko sur 200** (build du 20 novembre) : il reste 0,7 Ko avant que
  la construction refuse. Avant le prochain lot qui touche l'interface, charger à la demande
  la sauvegarde familiale et le carnet de caprices.
- `test:mobile-menus` est la plus longue tâche de la CI (10 à 17 minutes).
- Les pages de test (`tests/*-harness.ts`) ne chargent pas les feuilles de style comme le jeu.
- Détail : [bilan du nettoyage](BILAN-NETTOYAGE-2026-11.md).

## Règles de travail en vigueur

- Une branche, une PR par lot. Le parent a autorisé, dans les sessions de travail de
  novembre 2026, la fusion des PR de Claude quand les cinq tâches de la CI sont vertes, sans
  conflit ni fil de revue ouvert, puis la publication du site. Tout le reste de `CLAUDE.md`
  tient : il demande avant une dépense, une publication sur Google Play ou un changement de
  règle.
- Relectures : huit angles pour un lot qui change une règle ou un écran du jeu, trois pour un
  petit lot de textes ou de corrections.

## Où lire le détail

[Architecture](ARCHITECTURE.md) · [Site](SITE.md) · [Testeurs et joueurs](TESTEURS-ET-JOUEURS.md)
· [Android](ANDROID.md) · [Voyage](VOYAGE.md) · [Caprices](CAPRICES.md) ·
[Passation](PASSATION-CLAUDE-CODE.md) · règles du jeu : `GAME_DESIGN.md`, `AGENTS.md`.
