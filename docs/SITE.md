# Le site — snakeattacktd.com sur Infomaniak

Décision du parent, 14 novembre 2026 : le site du jeu quitte
`conquete-serpents-famille.zyclope.chatgpt.site` pour **https://snakeattacktd.com**, sur un
hébergement Web classique d'Infomaniak, publié à la main depuis Git par GitHub Actions.
L'ancien site reste en ligne pendant la transition : personne ne le supprime dans ce lot.

**Rien n'est encore en ligne sur le nouveau domaine.** Ce document décrit ce qui est prêt
dans le dépôt, ce que le parent doit faire une fois, et ce qui n'a pas pu être essayé.

## Ce que le build produit

`npm run build` écrit dans `dist/` le site entier, sans serveur d'application :

| Fichier                      | Rôle                                                                 |
| ---------------------------- | -------------------------------------------------------------------- |
| `index.html`, `assets/`      | le jeu ; les fichiers de `assets/` portent une empreinte de contenu  |
| `confidentialite/index.html` | la politique de confidentialité, HTML simple, sans JavaScript, FR/EN |
| `.htaccess`                  | adresse unique, en-têtes de sécurité, cache (`deploy/policy.ts`)     |
| `_headers`                   | les mêmes en-têtes pour l'ancien hébergeur ; Apache l'ignore         |

L'adresse du site est écrite à un seul endroit, `src/site.ts`.

- **Adresse unique** : `http://` et `www.` sont renvoyés vers `https://snakeattacktd.com`.
  La règle HTTPS interroge `%{HTTPS}` et `X-Forwarded-Proto`, comme le
  [guide d'Infomaniak](https://www.infomaniak.com/fr/support/faq/1961/forcer-le-https-ssl-de-lurl-affichee-par-le-navigateur-web)
  le prévoit pour éviter une boucle de redirection.
- **Cache** : les pages sont redemandées à chaque visite (`no-cache`), c'est ainsi qu'une
  nouvelle version arrive ; seuls les fichiers à empreinte de `assets/` sont gardés un an.
- **Accès direct** : `/confidentialite` est un dossier ; Apache renvoie vers
  `/confidentialite/` et sert la page. Le jeu n'a qu'une page, il n'y a pas d'autre adresse à
  actualiser.

## À faire une fois par le parent

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
avant tout affichage (ce lot n'ajoute aucun message dans le jeu) :

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

**Écart à faire trancher par l'éditeur.** La politique approuvée décrit l'application
Android ; elle ne dit rien des journaux du site. Elle ne prétend pas non plus que le site
n'en a pas. Si l'éditeur veut le dire, voici une formulation de travail, **non publiée** et
à relire, à ajouter dans les deux langues avec une nouvelle date :

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
- Ajouts à ce qui était publié, à confirmer par l'éditeur : la ligne « Mise à jour : 14
  novembre 2026 » (la page n'avait pas de date) et, dans l'application seulement, le lien
  « Lire cette politique sur snakeattacktd.com ».

## Ce qui n'est pas vérifié

- Aucune publication sur Infomaniak : ni le `.htaccess` sur un vrai Apache, ni rsync sur
  l'hébergement, ni le certificat, ni les redirections réelles. Le premier lancement du
  workflow est le premier essai ; son dernier pas dit ce qui ne va pas.
- La fenêtre de l'application sur le Galaxy S24 et l'ouverture des liens depuis l'APK.
- Les liens de la fiche Google Play : à remplacer par le parent ou Codex par
  `https://snakeattacktd.com/confidentialite` une fois le site en ligne et contrôlé.
