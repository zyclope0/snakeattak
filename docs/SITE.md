# Le site — snakeattacktd.com sur Infomaniak

Décision du parent, 14 novembre 2026 : le site du jeu quitte
`conquete-serpents-famille.zyclope.chatgpt.site` pour **https://snakeattacktd.com**, sur un
hébergement Web classique d'Infomaniak, publié à la main depuis Git par GitHub Actions.
L'ancien site reste en ligne pendant la transition : personne ne le supprime dans ce lot.

**En ligne depuis le 15 novembre 2026.** Première publication réussie du premier coup,
depuis `main` au commit `7d30a84` (lancement n° 1 de « Publier le site »). Le contrôle du
site en ligne a tout trouvé conforme : page et script servis, en-têtes de sécurité, cache
long des fichiers à empreinte, `version.json` au bon commit, politique identique octet pour
octet à celle du dépôt, `/confidentialite` renvoyé vers `/confidentialite/`, `http://` et
`www.` renvoyés vers `https://snakeattacktd.com`, aucun cookie.

Ce document décrit ce que le build produit, ce qui a été réglé une fois chez Infomaniak et
dans GitHub, comment publier et revenir en arrière, et ce qui reste à vérifier.

## Ce que le build produit

`npm run build` écrit dans `dist/` le site entier, sans serveur d'application :

| Fichier                      | Rôle                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `index.html`, `assets/`      | le jeu ; les fichiers de `assets/` portent une empreinte de contenu                      |
| `confidentialite/index.html` | la politique de confidentialité, HTML simple, sans JavaScript, FR/EN                     |
| `.htaccess`                  | adresse unique, en-têtes de sécurité, cache (`deploy/policy.ts`)                         |
| `_headers`                   | les mêmes en-têtes pour l'ancien hébergeur ; Apache l'ignore                             |
| `fr/`, `en/`                 | présentation, prise en main, personnages, nouveautés et parents, en HTML sans JavaScript |
| `sitemap.xml`, `robots.txt`  | découverte des12URL publiques par les moteurs, prototype exclu de l'exploration          |

L'adresse du site est écrite à un seul endroit, `src/site.ts`.

## Découverte et soutien — 16 novembre 2026

Le jeu reste à `/`, sur la même origine : aucun déplacement des sauvegardes. Les10pages
FR/EN de `deploy/discoveryCopy.ts` sont générées par `deploy/discovery.ts` : contenu réel,
un titre et une description propres, canonical, liens linguistiques réciproques, Open Graph,
image de partage existante et données structurées WebPage factuelles, sans notes inventées.
Elles réutilisent les polices et illustrations locales autorisées, sans nouvelle génération,
script de suivi, cookie ni appel de régie. La rubrique parents du jeu permet de les trouver.
La politique approuvée n'est pas modifiée. Aucune publicité dans ce lot.

Les pages statiques peuvent être lues sans JavaScript, en portrait comme en paysage.
Le bouton Jouer renvoie au jeu existant ; l'orientation paysage reste nécessaire pour le
plateau sur téléphone. La langue déjà choisie dans le jeu reste prioritaire.

### Indexation : opération propriétaire à terminer

1. Dans [Google Search Console](https://search.google.com/search-console), ajouter la
   propriété Domaine `snakeattacktd.com` au compte du propriétaire. Copier uniquement
   l'enregistrement TXT de vérification dans la zone DNS Infomaniak, sans modifier les
   enregistrements Web ou de messagerie ; attendre sa propagation puis vérifier.
2. Envoyer `https://snakeattacktd.com/sitemap.xml`. Inspecter `/fr/`, `/en/` et `/` :
   relire le rendu et la canonical, puis demander l'indexation si nécessaire. Le sitemap
   contient12URL : jeu,10pages et confidentialité ; ni profils ni codes de départ.
3. Dans [Bing Webmaster Tools](https://www.bing.com/webmasters/), importer la propriété
   Search Console ou utiliser la vérification proposée, puis envoyer le même sitemap.
4. Suivre les pages indexées, erreurs et impressions dans ces consoles ; aucun pixel de
   mesure d'audience n'est nécessaire dans le jeu. Les publications suivantes mettent le
   sitemap à jour. Aucune date de modification artificielle ou demande répétée automatisée.

La génération du sitemap et sa publication ne prouvent ni la vérification de propriété,
ni une soumission, ni une indexation ou un classement. Les accès Google/Bing du propriétaire
restent nécessaires. [Guide Google](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

### Soutien préparé, masqué

Le parent a demandé de garder le bouton masqué tant qu'aucune destination n'est fournie.
`SUPPORT_URL = null` dans `deploy/discovery.ts` : aucune ancre vide, page de paiement,
récompense, abonnement ou requête externe. Aucune somme n'est encaissée par le site.

Pour une activation ultérieure : faire choisir et approuver au parent un lien de paiement
HTTPS, les frais et les conditions du prestataire ; relire les informations de confidentialité
et le libellé de soutien avant de configurer ce lien. Le générateur refuse HTTP et les
identifiants inclus dans une URL. Il prépare un lien explicite pour adultes, nouvel onglet,
`noopener noreferrer nofollow`, sans transmettre de profil ni de code de partie.
Les emplacements sont la rubrique parents et le pied des pages publiques, jamais le plateau.
Le bouton n'accorde aucun avantage ; aucune déductibilité fiscale n'est annoncée.
Le HTML du jeu n'a plus que270octets de marge : avant activation, l'alléger et contrôler
le vrai lien avec le budget existant, sans augmenter silencieusement ce plafond.

Android utilise `dist-android/`, excluant toutes ces pages et liens. Les paquets Play déjà
construits restent intacts. Recette : `npm run test:discovery`, plus les contrôles des deux
compilations et le workflow de publication qui relit chaque page et le sitemap en ligne.

- **Adresse unique** : `http://` et `www.` sont renvoyés vers `https://snakeattacktd.com`.
  La règle HTTPS interroge `%{HTTPS}` et `X-Forwarded-Proto`, comme le
  [guide d'Infomaniak](https://www.infomaniak.com/fr/support/faq/1961/forcer-le-https-ssl-de-lurl-affichee-par-le-navigateur-web)
  le prévoit pour éviter une boucle de redirection.
- **Cache** : les pages sont redemandées à chaque visite (`no-cache`), c'est ainsi qu'une
  nouvelle version arrive ; seuls les fichiers à empreinte de `assets/` sont gardés un an.
- **Accès direct** : `/confidentialite` est un dossier ; Apache renvoie vers
  `/confidentialite/` et sert la page. Le jeu n'a qu'une page, il n'y a pas d'autre adresse à
  actualiser.

## Réglé une fois par le parent (15 novembre 2026)

Fait : site `snakeattacktd.com` créé sur l'hébergement (Apache, sans application), `www` en
alias, certificat Let's Encrypt installé, adresses A et AAAA ajoutées à la zone DNS sans
toucher à la messagerie, compte FTP + SSH de déploiement avec une clé ed25519, quatre
secrets dans GitHub. Les étapes, pour les refaire ou changer de clé :

1. **Infomaniak, Manager** : créer le site `snakeattacktd.com` sur l'hébergement Web, activer
   le certificat SSL gratuit, et noter le dossier du site (souvent `sites/snakeattacktd.com`).
2. **Compte FTP + SSH** : en créer un pour le déploiement. Y déposer une clé publique
   **ed25519** (Infomaniak refuse les clés RSA), sur une seule ligne, dans
   `.ssh/authorized_keys` à la racine de l'hébergement
   ([guide](https://www.infomaniak.com/fr/support/faq/2054/se-connecter-avec-cle-ssh)).
   La clé privée ne va nulle part ailleurs que dans le secret GitHub ci-dessous.
3. **GitHub, Settings → Secrets and variables → Actions** du dépôt : créer quatre secrets.

   | Secret                 | Valeur                                                      |
   | ---------------------- | ----------------------------------------------------------- |
   | `INFOMANIAK_SSH_KEY`   | la clé privée ed25519, en entier                            |
   | `INFOMANIAK_SSH_HOST`  | l'hôte SSH donné par le Manager (`xxxx.ftp.infomaniak.com`) |
   | `INFOMANIAK_SSH_USER`  | le nom du compte FTP + SSH                                  |
   | `INFOMANIAK_SITE_PATH` | le dossier du site sur le serveur, sans barre finale        |

Aucun de ces secrets n'est dans le dépôt, ni connu de Claude ou de Codex.

## Publier

Onglet **Actions** de GitHub → **Publier le site** → **Run workflow** :

- `ref` : ce qu'on publie, `main` par défaut ;
- `confirmation` : écrire `PUBLIER` ;
- `prune` : à cocher seulement pour retirer du serveur les fichiers d'anciens builds.

Le workflow (`.github/workflows/deploy-site.yml`) ne se lance jamais seul. Il compile depuis
Git, passe `npm run verify`, écrit `version.json` (commit publié), envoie `dist/` par rsync,
puis relit le site avec `scripts/check-live-site.mjs` : version, en-têtes, redirections,
absence de cookie, et politique en ligne identique octet pour octet à celle du commit. Sans
`prune`, rien n'est retiré du serveur : une page restée ouverte pendant l'envoi retrouve ses
anciens fichiers.

Le même contrôle se lance à tout moment, sans rien modifier :

```sh
node scripts/check-live-site.mjs https://snakeattacktd.com
```

## Revenir en arrière

Relancer **Publier le site** avec, dans `ref`, le commit précédent : `version.json` en ligne
donne le commit publié, `git log` donne celui d'avant. Le site est entièrement reconstruit
depuis ce commit ; aucune donnée n'est à restaurer, le site n'en garde pas.

Si le site ne répond plus du tout après une publication (erreur 500), la cause probable est
une directive de `.htaccess` refusée par l'hébergeur : la retirer ou renommer le fichier
depuis le Manager rétablit le site, puis corriger `deploy/policy.ts`.

## Les sauvegardes ne suivent pas le changement d'adresse

Le jeu web garde tout dans le stockage du navigateur, qui est **propre à chaque adresse**.
Une famille qui jouait sur l'ancien site ne retrouve rien sur le nouveau, et rien ne peut
l'y transférer automatiquement. **L'application Android n'est pas concernée** : ses
sauvegardes ne dépendent pas du site.

Le passage se fait à la main, joueur par joueur, avec l'outil qui existe déjà (« Pour les
parents » → « Sauvegarde familiale ») :

1. sur l'ancien site, choisir le joueur, puis « Exporter mon aventure » ;
2. sur le nouveau site, recréer le joueur, puis « Retrouver un fichier familial ».

Le fichier contient l'aventure, les étoiles, les missions et les carnets du joueur actif. Il
ne contient **ni la liste des joueurs** (personnage, surnom), **ni le voyage en cours, ni son
record**, ni les réglages : ceux-là sont à refaire. Vérifié dans le code (`src/familyBackup.ts`)
et par `npm run test:family` ; pas essayé entre les deux vrais sites.

Texte proposé pour prévenir les familles sur l'ancien site, à faire valider par le parent
avant tout affichage (historique du lot initial) :

> **FR.** Le jeu déménage sur snakeattacktd.com. Tes parties restent sur cet ancien site :
> elles ne suivent pas toutes seules. Pour les emporter, demande à un parent d'ouvrir « Pour
> les parents », puis « Sauvegarde familiale », et d'exporter l'aventure de chaque joueur.
> Sur le nouveau site, il la retrouvera au même endroit. Le voyage en cours et les réglages
> sont à refaire.
>
> **EN.** The game is moving to snakeattacktd.com. Your games stay on this old site: they
> do not follow on their own. To take them along, ask a parent to open “For parents”, then
> “Family save”, and export each player's adventure. On the new site, they will restore it
> in the same place. The voyage in progress and the settings have to be set up again.

## Ce que l'hébergeur enregistre

Le jeu n'ajoute aucun outil de suivi et le site ne pose aucun cookie (contrôlé à chaque
publication). Mais un site n'est jamais sans données techniques : comme tout serveur Web,
l'hébergement Infomaniak tient des **journaux d'accès et d'erreurs**. D'après sa
[documentation](https://www.infomaniak.com/fr/support/faq/1926/afficher-les-logs-dacces-et-derreurs-web),
ils sont consultables dans le Manager et dans le dossier `ik-logs` de l'hébergement, et
conservés peu de temps : la page indique selon les versions « au moins 7 jours » ou « 10
jours au maximum ». Leur contenu exact (adresse IP, date, page demandée, navigateur) est à
relever dans `ik-logs` après la première publication ; il n'a pas été lu ici.

L'ancien site ajoutait à chaque page un script de protection de son hébergeur
(`/cdn-cgi/challenge-platform/…`). Le nouveau site n'en a pas : la page de confidentialité
ne charge aucun script.

**Dit dans la politique.** La page d'abord publiée décrivait l'application Android et ne
parlait pas des journaux du site. Le parent a accepté le 14 novembre 2026 d'y ajouter une
section « Site web » / « Website », dans les deux langues, placée avant le contact :

> **FR.** Le site snakeattacktd.com est hébergé par Infomaniak, en Suisse. Comme tout
> serveur Web, l'hébergeur enregistre dans des journaux techniques l'adresse IP, la date, la
> page demandée et le navigateur des visiteurs, pour faire fonctionner et protéger le
> service. Ces journaux sont conservés quelques jours par l'hébergeur. zyclope ne les
> utilise pas pour suivre les visiteurs et le site ne dépose aucun cookie.
>
> **EN.** The snakeattacktd.com website is hosted by Infomaniak, in Switzerland. Like any
> web server, the host records visitors' IP address, date, requested page, and browser in
> technical logs, to run and protect the service. The host keeps these logs for a few days.
> zyclope does not use them to track visitors, and the site sets no cookies.

Cette section ne devient vraie qu'une fois le site en ligne sur Infomaniak. Tant que
l'ancien site sert sa propre page, celle-ci ne la contient pas.

## La politique de confidentialité : une seule source

`src/i18n/privacyPolicy.ts` contient le texte approuvé, en français et en anglais, repris mot
pour mot de la page publiée le 14 novembre 2026. La page publique
(`deploy/privacyPage.ts`) et la fenêtre « Confidentialité » de l'application
(`src/ui/privacy/`) en sortent toutes les deux.

- `tests/privacy-policy.test.ts` compare le texte à la page telle qu'elle était publiée
  (`tests/fixtures/confidentialite-publiee-2026-11-14.html`). Changer un mot fait échouer le
  test : c'est voulu. Une modification est une décision de l'éditeur, dans les deux langues,
  avec la ligne « Mise à jour » et la page de référence refaites ensemble.
- Le même test compare la version et le build cités par la politique à `package.json` et à
  `android/app/build.gradle`. **Un nouveau build Android demande donc de relire la politique
  et de mettre à jour `POLICY_APP`** dans `src/i18n/privacyPolicy.ts`.
- Ajouts à ce qui était publié, acceptés par le parent le 14 novembre 2026 : la ligne
  « Mise à jour : 14 novembre 2026 » (la page n'avait pas de date), la section « Site web »
  ci-dessus et, dans l'application seulement, le lien « Lire cette politique sur
  snakeattacktd.com ». Le test retire ces ajouts avant de comparer le reste à la page de
  référence, et vérifie la section « Site web » mot pour mot.

## Ce qui n'est pas vérifié

- Le site n'a pas été ouvert ni joué par une personne sur le nouveau domaine : le contrôle
  est automatique (réponses, en-têtes, redirections, texte de la politique).
- Le contenu réel des journaux de l'hébergeur (`ik-logs`) n'a pas été lu ; la section « Site
  web » de la politique s'appuie sur la documentation d'Infomaniak.
- La fenêtre de l'application sur le Galaxy S24 et l'ouverture des liens depuis l'APK.
  Le contenu du véritable APK61 a été contrôlé hors ligne FR/EN dans un navigateur, avec
  marges simulées ; cela ne remplace pas l’essai physique.
- Les liens de la fiche Google Play : à remplacer par le parent ou Codex par
  `https://snakeattacktd.com/confidentialite`.
- L’ancien site sert sa propre page de confidentialité, sans la section Infomaniak.
  Il affiche désormais l’avis de migration : voir ci-dessous.

## Point de livraison Codex — 15 novembre2026

- Android61 préparé : `versionCode`61 et `POLICY_APP.build`61, version0.38.0, même package
  et clé d’envoi. Texte et date de la politique inchangés. La comparaison actualise uniquement
  version/build attendus de la fixture historique, sans la modifier. Les nombres réellement
  affichés et les autres mots restent comparés, en plus du contrôle Gradle/package.json.
- Verify717tests, navigateur, audit13/13, menus5648 (170 confidentialité), hors ligne et
  sauvegarde familiale verts. Politique du vrai APK lisible hors ligne FR/EN à780×360
  avec marges simulées, texte exact, défilement et fermeture, sans requête extérieure.
- Pendant cette préparation, une autre session a déjà publié l’avis FR/EN sur l’ancien
  site : Sites37, source `fe8bd54c391f6ce54df2e0199ee41801b469862b`. Le contrôle avant
  publication a détecté ce changement distant : Codex a retiré son propre brouillon,
  conservé l’avis existant et n’a rien republié sur cet hébergement. Six contrôles locaux
  FR/EN, dont deux avec plusieurs profils, passent ; l’URL publique répond200 et contient
  l’avis. Les128fichiers préexistants hors index sont inchangés, politique comprise.
- La fiche Play n’est pas modifiée ici : aucun profil de navigateur authentifié Google
  disponible. Renseigner **https://snakeattacktd.com/confidentialite** depuis la session
  connectée du parent ; ni Alpha ni production activés.

Notes à coller dans Play :

```text
<fr-FR>
Nouveau dans « Pour les parents » : la politique de confidentialité se lit maintenant dans le jeu, même sans connexion.
</fr-FR>
<en-US>
New in “For parents”: the privacy policy can now be read inside the game, even offline.
</en-US>
```

### Publication du build61

PR55 et56 intégrées, publication manuelle « Publier le site »
[43698517225](https://github.com/zyclope0/snakeattak/actions/runs/43698517225) réussie depuis
main `099cebf07dcf9f119c05d9f792c43248aca1a88b`, sans purge. Le contrôle du workflow est
entièrement vert, politique exacte et redirections comprises. Les131fichiers distribués
comparés au build correspondent aux paquets Android (30MP3) ; `.htaccess` reste propre
au serveur Web. Le navigateur a parcouru accueil, confidentialité et camp FR/EN sur
1280×800,780×360 et812×375, sans erreur ou ressource manquante. Aucun essai humain revendiqué.
La CI complète de main43698515202 est encore en cours au dernier contrôle ; elle est
distincte des717tests et du contrôle de publication déjà passés.
