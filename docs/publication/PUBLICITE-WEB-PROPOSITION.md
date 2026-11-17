# Publicité sur le site Web — proposition à valider

17 novembre 2026. **Textes approuvés par le parent le 17 novembre 2026 et intégrés ; la
publicité, elle, n'est pas activée.** Ce document rassemble les décisions du parent, les
textes en français et en anglais, et ce qu'il reste à faire avant d'afficher une première
annonce.

Le parent a aussi demandé d'étudier le téléphone : **pas de publicité sur téléphone.** Dans
le jeu, le plateau et les commandes remplissent l'écran (360 px de haut en paysage) et Google
demande environ 150 px entre une annonce et un jeu ; sur les pages publiques, cela
amènerait le script de Google sur des pages courtes, aujourd'hui sans aucun script, que
lisent les plus petits. Le texte « aucune publicité sur téléphone » reste donc vrai.

## Décisions du parent, 17 novembre 2026

1. **Continuer vers l'activation**, préparée par Claude. La revue du site recommandait de ne
   pas activer la publicité ; le parent a décidé de poursuivre.
2. **Qui voit les annonces** : tous les visiteurs du site sur grand écran, avec un moyen de
   couper la publicité. Jamais sur téléphone, jamais dans l'application Android. Un seul
   encart, placé à la main ; les annonces automatiques restent désactivées.
3. **Cookie** : le parent accepte le seul cookie technique que Google pose contre la fraude.
   Sans lui, d'après l'aide de Google, presque aucune annonce n'est servie en Europe et en
   Suisse.

## Ce que cela change, en clair

Les réglages du compte choisissent quelles annonces passent. Ils ne changent pas la façon
dont une annonce arrive :

- le navigateur du visiteur contacte Google, qui reçoit son adresse IP et des informations
  techniques ; le site promet aujourd'hui « sans publicité » et « aucun cookie » ;
- Google pose un cookie et utilise le stockage local pour détecter le trafic frauduleux ;
- le script de Google s'exécute dans la page du jeu : il faut ouvrir pour lui la protection
  du site (CSP), et rien n'empêche techniquement un script tiers de lire ce que la page
  garde sur l'appareil (profils, surnoms, sauvegardes).

## Textes proposés

Intégrés dans `src/i18n/privacyPolicy.ts` et `deploy/discoveryCopy.ts`, avec la date de la
politique ; `tests/fixtures/publicite-web-approuvee-2026-11-17.json` les fige mot pour mot.
Les autres engagements ne changent pas. Dans la politique, la phrase sur les cookies se lit
« zyclope ne les utilise pas pour suivre les visiteurs et ne dépose aucun cookie », sans
répéter le sujet.

### Nouvelle section — français : « Publicité sur le site Web »

Sur un grand écran d'ordinateur, la page du jeu du site peut afficher un seul encart
publicitaire, à l'écart du plateau et des commandes. Il n'y a aucune publicité sur téléphone
ni dans l'application Android. L'encart est fourni par Google AdSense.

Le site est déclaré à Google comme destiné aux enfants : les annonces ne sont pas
personnalisées et ne reposent ni sur un profil ni sur l'historique de navigation. Les
catégories d'annonces sensibles sont bloquées dans le compte ; zyclope ne peut toutefois pas
voir chaque annonce avant qu'elle s'affiche.

Pour afficher une annonce, le navigateur contacte les serveurs de Google, qui reçoivent
l'adresse IP, des informations techniques sur le navigateur et l'appareil, et l'adresse de
la page. Google dépose aussi un cookie technique et utilise le stockage local du navigateur
dans le seul but de détecter le trafic frauduleux. Ces traitements sont effectués par
Google, selon ses propres règles : « Comment Google utilise les informations provenant de
sites ou d'applications qui utilisent ses services »
(https://policies.google.com/technologies/partner-sites?hl=fr).

Vous pouvez couper la publicité sur cet appareil dans l'espace « Pour les parents » du jeu :
le site ne contacte alors plus Google pour des annonces. Le jeu ne transmet à Google ni les
profils, ni les surnoms, ni les sauvegardes.

### New section — English: "Advertising on the website"

On a large computer screen, the game page of the website may show a single ad box, away
from the board and the controls. There are no ads on phones or in the Android app. The ad
box is provided by Google AdSense.

The website is declared to Google as made for children: ads are not personalised and rely
neither on a profile nor on browsing history. Sensitive ad categories are blocked in the
account; zyclope cannot, however, see each ad before it is shown.

To show an ad, the browser contacts Google's servers, which receive the IP address,
technical information about the browser and device, and the address of the page. Google
also sets one technical cookie and uses the browser's local storage for the sole purpose of
detecting fraudulent traffic. Google carries out this processing under its own rules: "How
Google uses information from sites or apps that use our services"
(https://policies.google.com/technologies/partner-sites).

You can turn advertising off on this device in the "For parents" area of the game: the
website then no longer contacts Google for ads. The game sends Google neither profiles,
nicknames nor saves.

### Phrases qui deviendraient fausses, et leur remplacement

| Où                                       | Aujourd'hui                                                                                                                    | Proposé                                                                                                                                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Politique, « Données de jeu » (FR)       | « Cette version ne contient ni publicité, ni achat intégré, ni outil de mesure d'audience ajouté par l'éditeur. »              | « L'application Android ne contient ni publicité, ni achat intégré, ni outil de mesure d'audience ajouté par l'éditeur. Sur grand écran, le site Web peut afficher un encart publicitaire : voir « Publicité sur le site Web ». » |
| Politique, "Game data" (EN)              | "This version contains no ads, in-app purchases, or publisher-added analytics."                                                | "The Android app contains no ads, in-app purchases, or publisher-added analytics. On a large screen, the website may show an ad box: see "Advertising on the website"."                                                           |
| Politique, « Site web » (FR)             | « … et le site ne dépose aucun cookie. »                                                                                       | « … et zyclope ne dépose aucun cookie. Lorsque l'encart publicitaire s'affiche, Google en dépose un : voir « Publicité sur le site Web ». »                                                                                       |
| Politique, "Website" (EN)                | "… and the site sets no cookies."                                                                                              | "… and zyclope sets no cookies. When the ad box is shown, Google sets one: see "Advertising on the website"."                                                                                                                     |
| Page parents, description (FR)           | « Un jeu familial sans compte, publicité ni achat intégré dans cette version. … »                                              | « Un jeu familial sans compte ni achat intégré. … »                                                                                                                                                                               |
| Page parents, « Jouer sans compte » (FR) | « Cette version du jeu est gratuite, sans publicité ni achat intégré. … sans outil publicitaire ni mesure d'audience ajouté. » | « Le jeu est gratuit, sans achat intégré. … Sur grand écran, le site peut afficher un seul encart publicitaire non personnalisé, que l'on peut couper dans « Pour les parents ». Aucune mesure d'audience ajoutée. »              |
| Page parents (EN)                        | "This version is free, without ads or in-app purchases. … without added advertising or audience analytics tools."              | "The game is free, with no in-app purchases. … On a large screen, the website may show a single non-personalised ad box, which can be turned off in "For parents". No audience analytics added."                                  |

Le texte anglais exact des phrases actuelles est dans les fichiers ; seules les parties
citées changent.

### Règle du projet (`CLAUDE.md`)

La règle « aucune collecte, aucun serveur » ne serait plus vraie sans réserve. Proposition,
à écrire par le parent ou avec son accord : « Exception décidée par le parent le 17 novembre
2026 : un encart publicitaire Google sur le site Web, grand écran seulement, non
personnalisé, que l'on peut couper ; jamais dans l'application. »

## Réglages du compte AdSense, à contrôler par le parent

Chemins de menu repris de l'aide de Google, lue par extraits : à confirmer dans la console.

1. Site approuvé par Google (aujourd'hui « En préparation »).
2. Site déclaré destiné aux enfants (fait, selon le compte rendu de Codex).
3. Annonces automatiques désactivées (fait).
4. Sécurité de la marque → Contrôles de blocage → Diffusion d'annonces : « Annonces
   limitées » activées. C'est ce réglage qui autorise le cookie anti-fraude accepté par le
   parent ; désactivé, il n'y a plus de cookie, et presque plus d'annonces.
5. Catégories sensibles bloquées (fait) ; relire la liste une fois le site approuvé.
6. Aucune plateforme de consentement (CMP) : voulu. Sans elle, les visiteurs d'Europe et de
   Suisse ne reçoivent que des annonces « limitées ».

## Travail technique du lot suivant

Tout derrière l'interrupteur `WEB_AD_DELIVERY` (`src/ui/webAds/contract.ts`), qui reste sur
`disabled` jusqu'au feu vert.

- **Chargement.** Un seul encart, demandé une fois par chargement de page quand il y a la
  place (fenêtre d'au moins 1920 px, souris), avec le traitement enfant
  `data-tag-for-age-treatment="1"`. Une fois affiché, il ne bouge plus et n'est plus masqué :
  masquer un encart ou le redemander compte comme une infraction ou un rafraîchissement
  chez Google. L'aperçu local de Codex, lui, masque et déplace : il faudra le simplifier.
- **Couper la publicité.** Un réglage dans « Pour les parents », gardé sur l'appareil, lu
  avant tout appel à Google.
- **Protection du site.** Google ne prend en charge qu'une protection à jeton unique par
  page, qu'un hébergement statique ne sait pas fournir. Il faudra donc autoriser ses
  domaines, sur la page du jeu seulement ; les pages publiques et la politique gardent la
  protection actuelle.
- **Contrôles.** Recette avec un faux serveur d'annonces (aucun appel réel dans la CI) ;
  les contrôles « aucun cookie » de `scripts/check-live-site.mjs` et de
  `scripts/discovery-browser.mjs` deviennent « aucun cookie tant que la publicité est
  coupée ».

## Ordre d'activation

1. Accord du parent sur les textes ci-dessus : **donné le 17 novembre 2026.** Ils peuvent
   être publiés avant l'activation : ils disent ce que le site « peut » afficher.
2. Lot technique, fusionné avec l'interrupteur sur `disabled`. Le bouton « couper la
   publicité » arrive avec lui et n'apparaît que là où un encart peut s'afficher.
3. Approbation du site par Google et contrôle des six réglages.
4. Publication des nouveaux textes, puis passage de l'interrupteur à `enabled` et
   publication.
5. Sur le site en ligne, une capture réseau : domaines contactés, cookies posés, annonce
   réellement servie, puis la même avec la publicité coupée (aucun appel à Google attendu).
   Si la capture montre d'autres cookies que prévu, on coupe et on revoit.

## Ce qui n'est pas vérifié

- **Les règles de Google sont lues par extraits de recherche** : `support.google.com` n'est
  pas joignable depuis l'environnement de travail. Pages citées : annonces limitées
  (https://support.google.com/adsense/answer/14210870), exigences de consentement
  (https://support.google.com/adsense/answer/13554116), traitement par âge
  (https://support.google.com/adsense/answer/9009582), distance aux jeux
  (https://support.google.com/adsense/answer/1346295), protection de la page
  (https://support.google.com/adsense/answer/16283098).
- **Aucune annonce réelle n'a été demandée.** On ne sait pas si Google en servira, ni quel
  cookie exact sera posé : seule la capture de l'étape 5 le dira.
- **Le droit.** Ce document n'est pas un avis juridique. Pour les visiteurs français, la
  CNIL attend un consentement pour les traceurs publicitaires, y compris contre la fraude,
  et un enfant ne peut pas consentir seul : c'est une zone grise que le parent accepte. Une
  relecture par un professionnel reste conseillée avant l'étape 4.
- **Le revenu.** Un seul encart sur les fenêtres d'au moins 1920 px : sans doute quelques
  centimes par mois au trafic actuel. C'est une estimation, pas une mesure.
- Rien n'est essayé avec des enfants : on ne sait pas s'ils confondent l'encart avec le jeu.
