# Confidentialité — la politique publiée et la fiche Play

État au 26 novembre 2026. **Ce document ne rédige pas de politique.** La politique approuvée
par l'éditeur est publiée à **https://snakeattacktd.com/confidentialite** ; sa seule source est
`src/i18n/privacyPolicy.ts`, en français et en anglais, qui sert aussi la fenêtre
« Confidentialité » de l'application. Son texte ne se change pas ici : toute modification est
une décision de l'éditeur, dans les deux langues, avec une nouvelle date
([SITE.md](../SITE.md)).

## Ce que la politique publiée dit de l'application

Résumé pour s'y retrouver ; le texte qui fait foi est celui de la page.

- Elle décrit l'application Android **0.41.0, build 65** (`POLICY_APP`, qu'un test tient égal
  à `package.json`), et nomme son éditeur.
- On joue sans compte et sans connexion Internet pour les parties. Jusqu'à quatre profils
  locaux, avec un surnom facultatif. Progression, sauvegardes, autocollants, favoris et
  réglages restent sur l'appareil ; l'éditeur ne les reçoit pas par l'application.
- L'application ne contient ni publicité, ni achat intégré, ni outil de mesure d'audience
  ajouté par l'éditeur.
- Export volontaire de la sauvegarde depuis « Pour les parents » : le fichier passe par le
  cache de l'application, puis par le partage d'Android, où l'adulte choisit le destinataire.
- Google Play gère le téléchargement, les mises à jour et un contrôle de provenance de
  l'installation.
- Le test Android passe par un groupe Google : l'éditeur voit l'adresse e-mail des membres.
- Le site Web (hébergeur, encart publicitaire sur grand écran, soutien facultatif) a ses
  propres paragraphes.

## À garder cohérent avant d'envoyer la fiche

- **La page en ligne nomme la version envoyée.** Si un autre build que le 65 part sur Play, la
  politique doit d'abord le nommer (nouvelle approbation de l'éditeur). Le contrôle local
  compare `POLICY_APP` à `package.json`, pas la page en ligne : le parent l'ouvre et vérifie
  (`legal.privacyOnlineMatchesBuild`).
- **La fiche ne promet rien de plus que la politique** : pas de pub et pas d'achat dans
  l'application, pas de compte, progression sur l'appareil, export volontaire.
- **Le formulaire Sécurité des données dit la même chose** que la politique et que le
  comportement mesuré du build : [SECURITE-DES-DONNEES-V2.md](SECURITE-DES-DONNEES-V2.md).
- **L'URL** saisie dans la Console est celle de `configuration.json`, que le contrôle compare
  à `PUBLIC_PRIVACY_URL` (`src/site.ts`).

## Historique

Les brouillons de politique écrits pour l'ancien modèle (publicité entre missions et achats,
novembre 2026) ont quitté ce fichier : ils décrivaient une version qui n'existera pas. Ils
restent dans l'historique Git (ce fichier avant le 26 novembre 2026), avec
[MONETISATION.md](MONETISATION.md) et [SECURITE-DES-DONNEES-V1.md](SECURITE-DES-DONNEES-V1.md).
