# Trouver des joueurs pour le site et des testeurs pour Android — analyse du 19 novembre 2026

Demande du parent, le soir du 19 novembre : il n'a pas de contacts particuliers et cherche (1) des
gens qui jouent sur le site, (2) des testeurs pour l'application Android. Idées de départ : une
campagne depuis l'adresse de contact `sulegnasdev@gmail.com`, et un bouton « Tester Android »
visible partout sur le site, avec un formulaire.

Deux recherches sur le Web le même soir (sans accès direct aux pages de Google, de Reddit ni
d'itch.io depuis la session : seulement des extraits de moteurs de recherche ; tout ce qui est
marqué « à vérifier » doit être relu sur la page officielle). Rien n'a été essayé, publié, créé
ni dépensé.

## Ce qu'il faut savoir d'abord : la règle de Google

- Un compte développeur **personnel** créé après le 13 novembre 2023 ne peut publier en
  production qu'après un **test fermé d'au moins 12 testeurs inscrits sans interruption pendant
  14 jours** (Google l'a baissé de 20 à 12 en décembre 2024 ; rien de plus récent trouvé, à
  vérifier : <https://support.google.com/googleplay/android-developer/answer/14151465>).
- Le **test interne** (où se trouve le build 63) **ne compte pas** : il faut publier une version
  sur une piste de **test fermé**. Le même build peut y être promu.
- Un testeur qui quitte le test avant 14 jours ne compte pas ; s'il revient, ses 14 jours
  recommencent. Viser **15 à 20 testeurs** pour garder de la marge.
- Au moment de demander la production, Google pose des questions : comment les testeurs ont été
  trouvés, s'ils ont vraiment joué, quels retours, quels changements. Il peut refuser pour
  « engagement insuffisant ». Il faut donc de **vrais** testeurs qui jouent.
- **Interdits** : testeurs payés, services « 12 testeurs », installations automatiques. Google
  interdit de manipuler les installations ; en cas de fraude, il peut fermer le compte et tous
  les comptes liés. À éviter absolument.

## Le formulaire sur le site : non, un lien oui

Un formulaire qui recueille des adresses e-mail sur snakeattacktd.com :

- contredit la règle du projet : **aucune collecte, aucun serveur** (le site est statique, il
  faudrait un service tiers pour recevoir le formulaire) ;
- oblige à réécrire la politique de confidentialité (loi suisse sur la protection des données,
  RGPD pour les visiteurs européens) ;
- n'évite pas la suite : Google demande de toute façon un compte Google à chaque testeur.

**À la place, sans rien collecter sur le site :**

1. Un **groupe Google** (créé depuis le compte `sulegnasdev@gmail.com`), réglé sur « tout le
   monde peut rejoindre », où personne ne peut écrire sauf le propriétaire, sans e-mails aux
   membres. Ce groupe est ajouté comme liste de testeurs du test fermé.
2. Une page **« Tester l'application Android »** sur le site, sans formulaire, en deux gestes :
   rejoindre le groupe, puis ouvrir le lien d'inscription au test de Google Play. Un lien
   « écris-nous » vers l'adresse de contact pour qui ne veut pas de groupe.
3. Le **bouton** qui y mène : dans l'en-tête des pages du site (accueil, « Comment jouer »,
   « Nouveautés », « Pour les parents »), pas dans le jeu ni dans l'application. Il disparaît
   quand l'application est publiée.

Attention, ce n'est pas « zéro donnée » : le parent, propriétaire du groupe, voit les adresses
des membres. Il faut **une phrase de plus dans la politique de confidentialité** (le groupe est
géré par Google, les adresses servent seulement au test, le groupe est supprimé après la
sortie). La politique est un texte approuvé : rien ne change sans l'accord du parent.

Les testeurs sont des **adultes** (les parents), avec leur propre compte Google ; ils installent
le jeu sur l'appareil où leur enfant joue. Pas de compte d'enfant supervisé (Family Link) :
impossible de vérifier s'il peut rejoindre un test fermé.

## Où trouver les testeurs, sans contacts

Du plus sûr au moins sûr :

1. **Cercle proche** : famille, collègues, amis — et chaque testeur peut en amener un autre (un
   compte adulte par famille). C'est ce que Google conseille lui-même.
2. **Parents de l'école ou du club** : un petit papier avec un QR code vers la page « Tester »,
   remis avec l'accord de l'enseignant ou de l'entraîneur, sans liste tenue par l'école.
3. **Ludothèques, bibliothèques, associations** de la région : le jeu n'a ni minuteur, ni
   récompense de retour, ni hasard payant : c'est un argument.
4. **Échanges de testeurs** sur Reddit (r/AndroidClosedTesting, r/TestersCommunity) : seulement
   en appoint. Engagement faible, refus signalés, il faut tester leurs applications chaque jour en
   retour, et ce sont des adultes inconnus devant le jeu d'un enfant.

## Des joueurs pour le site

Ce qui ne marche pas pour ce jeu : CrazyGames (refuse les jeux pour enfants), GameDistribution et
Poki (leur kit publicitaire dans le jeu ou l'exclusivité), Newgrounds et Kongregate (public
adulte), r/Parenting et les forums de parents (publicité interdite), Lumni (jeux commandés).

Ce qui peut marcher, classé :

|   # | Action                                                                                                                                                                                                    | Il faut                                                        | Effort      | Portée                                         |
| --: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------- | ---------------------------------------------- |
|   1 | Page « L'histoire du jeu » sur le site (le dessin du fils, des images, une courte vidéo, l'adresse de contact ; ni prénom ni visage) : elle sert à la presse, aux enseignants et aux moteurs de recherche | rien d'extérieur ; accord du parent et du fils sur les mots    | faible      | rend tout le reste plus efficace               |
|   2 | Déclarer le site dans Google Search Console et Bing Webmaster Tools                                                                                                                                       | comptes du parent                                              | très faible | lente, durable                                 |
|   3 | Proposer le jeu à Outils Tice (formulaire « Proposer un site ») et à la section jeux vidéo du CNLJ (BnF), qui conseille les bibliothécaires                                                               | adresse de contact                                             | faible      | enseignants et bibliothèques francophones      |
|   4 | Le journal régional ou l'hebdomadaire local du canton, puis Radio Lac, La Télé ou la RTS : « un jeu inventé par un enfant de N ans, sans publicité dans le jeu, sans données »                            | identité du parent ; décider avant ce qu'on montre de l'enfant | moyen       | un pic local ; d'autres médias suivent souvent |
|   5 | Sortir l'application en production : un jeu « Familles » est examiné d'office pour le badge **Teacher Approved** et peut entrer dans l'onglet Enfants de Google Play                                      | le test fermé ci-dessus                                        | en cours    | peut-être la plus grande                       |
|   6 | Une page itch.io (version portable, étiquettes tower defense, famille, français), commentaires fermés                                                                                                     | compte itch.io du parent                                       | faible      | petite, plus un lien vers le site              |
|   7 | Une présentation en anglais : « Show HN » sur Hacker News, puis r/WebGames ou r/playmygame après lecture de leurs règles                                                                                  | comptes du parent                                              | faible      | un pic d'adultes curieux, des retours          |
|   8 | Tout près : l'enseignant du fils, la bibliothèque, la ludothèque, une affichette A5 avec QR code                                                                                                          | rien en ligne                                                  | faible      | petite mais réelle                             |

**Point à trancher avant le 3 et le 4** : l'encart publicitaire prévu sur le site (grand écran
seulement) gênera l'accueil par les écoles et les bibliothèques, et interdit de dire « sans
publicité ». Tant qu'il reste éteint, on peut le dire ; ensuite, seulement « aucune publicité
dans le jeu ni dans l'application ».

## Recommandation

1. **Cette semaine, sans rien publier** : je prépare dans le dépôt la page « Tester
   l'application Android » et le bouton (éteints, comme l'encart), le paragraphe à ajouter à la
   politique, et la page « L'histoire du jeu ». Le parent relit les mots.
2. **Le parent** : crée le groupe Google depuis `sulegnasdev@gmail.com`, promeut le build sur une
   piste de test fermé, et me donne les deux liens (groupe, inscription au test). J'allume alors
   la page et le bouton.
3. **Recruter 15 à 20 parents** d'abord dans son entourage et à l'école ; un message type que je
   rédige, envoyé depuis l'adresse de contact.
4. **En parallèle, pour le site** : Search Console et Bing, puis Outils Tice et le CNLJ, puis le
   journal local quand la page « L'histoire du jeu » existe.

## Décisions du parent (20 novembre 2026)

- **Lien public** : un groupe Google ouvert à tous.
- **Bouton partout** : en haut de chaque page du site, et dans l'écran « Pour les parents » de la
  page du jeu sur le site. Jamais dans l'application.
- **Le fils** : seulement son dessin et son âge.
- **Publicité** : éteinte (AdSense n'a pas encore validé le site).

## Ce qui est prêt (éteint)

Tout est dans `deploy/siteFeatures.ts`. Tant qu'une valeur est vide, sa page n'existe pas et
aucun lien n'y mène ; le site publié ne change pas.

- **« Tester sur Android »** (`/fr/tester-android/`, `/en/test-android/`) : qui peut tester,
  rejoindre le groupe, rejoindre le test sur Google Play, garder l'application 14 jours, écrire
  son avis, ses données. Aucun formulaire. S'allume quand `ANDROID_TEST.group` (adresse
  `https://groups.google.com/…`) et `ANDROID_TEST.optIn` (adresse `https://play.google.com/…`)
  sont remplis tous les deux ; une adresse sur un autre site est refusée à la construction.
- **« L'histoire »** (`/fr/histoire/`, `/en/story/`), juste après l'accueil dans le menu : le
  dessin, l'âge, les règles du fils, ses idées depuis, ce que le jeu ne fait pas. S'allume quand
  `STORY.age` est rempli et que le dessin est à `resources/site/dessin-du-jeu.jpg` (JPEG ou PNG).
  **Allumée le 20 novembre** avec la photo déjà dans le dépôt
  (`public/references/dessin-original.jpg`), à la demande du parent (« prend celui que tu as
  pour le moment ») : coupée au-dessus de la feuille pour enlever le billet de train, 720 px
  de large (la largeur affichée), moins de 60 Ko, sans métadonnées. Une photo prise d'en haut,
  sur fond uni, peut la remplacer à tout moment au même endroit.
- Vérifié par `tests/site-features.test.ts` (éteint aujourd'hui ; réglages faux refusés ; une
  fois allumé, 14 pages, le bouton sur chacune, les deux liens vers Google, le plan du site) et
  par des captures, pages allumées avec de faux liens, à 1280×800 et 390×844.

## Ce qu'il faut du parent pour allumer

1. **Phrase de la politique de confidentialité** : **acceptée le 20 novembre** et ajoutée
   (section « Test de l'application Android », mise à jour du 20 novembre 2026) :
   - FR : « Test de l'application Android. Pour essayer l'application avant sa sortie, un adulte
     peut rejoindre un groupe Google Groups ouvert à tous, puis le test de Google Play. Le groupe
     est géré par Google, selon ses propres règles. zyclope voit l'adresse e-mail des membres du
     groupe ; elle sert uniquement à ouvrir le test et à répondre aux retours. Le groupe est
     supprimé après la sortie de l'application. Le site lui-même ne recueille aucune adresse. »
   - EN : "Testing the Android app. To try the app before its release, an adult may join a
     Google Group open to everyone, then the Google Play test. The group is run by Google,
     under its own terms. zyclope can see the email address of the group's members; it is used
     only to open the test and answer feedback. The group is deleted once the app is out. The
     website itself collects no address."
2. **Fait le 20 novembre** : groupe https://groups.google.com/g/snakeattack-testeurs, piste
   « Alpha » ; lien d'inscription https://play.google.com/apps/testing/com.conqueteserpents.famille.
   Ce qui était demandé : **le groupe Google** créé depuis `sulegnasdev@gmail.com` (« tout le monde peut rejoindre »,
   liste des membres visible par le propriétaire seulement, personne ne peut écrire), ajouté
   comme liste de testeurs d'une piste de **test fermé** où le build 63 est promu ; puis les
   deux adresses : celle du groupe et celle du lien d'inscription au test.
3. **L'âge du fils** : **8 ans** (20 novembre). **Le dessin** : attendu, à déposer à
   la photo du dépôt, recadrée, en attendant une meilleure (20 novembre).

## Pas vérifié

Les pages officielles de Google n'ont pas pu être ouvertes depuis la session (seulement leurs
extraits) ; ni les règles exactes de chaque sous-forum Reddit, ni les conditions d'âge d'itch.io,
ni si un compte enfant supervisé peut rejoindre un test fermé, ni si une version de test fermé
passe un examen de Google avant que le lien marche. Aucun canal n'a été essayé : comment les
familles et les enseignants répondront reste inconnu.
