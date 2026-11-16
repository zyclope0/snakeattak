# Soutien Web par PayPal — proposition à valider

16 novembre 2026. Proposition approuvée par le parent le16novembre2026, en français et en anglais.
Activation et publication en cours ; aucun paiement réel effectué par Codex.

## Destination et preuves

Lien public fourni par le parent : https://www.paypal.com/ncp/payment/XXQ7BEAZQ3QZL

Le parent a créé et enregistré ce lien : montant libre en CHF, ponctuel, sans
adresse ni frais de livraison, sans montants suggérés. Son essai de saisie à7,50CHF
n'a déclenché aucun paiement. Identité sur le reçu et frais réels non vérifiés.

Contre-vérification Codex : Chromium dans un contexte neuf, sans session PayPal,
écran780×360 ; HTTP200 et page publique affichée avec le titre « Soutenir Snake
Attack TD », la description approuvée, le champ « Montant du soutien » et CHF.
Certaines commandes de paiement apparaissent en allemand dans ce navigateur malgré
la préférence fr-CH. Aucun nom ni e-mail de marchand dans le texte initial obtenu.
Cela ne constitue aucune garantie sur le reçu ou les écrans ultérieurs.

## Intégration proposée

- Un lien discret « Soutenir le développement » / « Support development » dans
  le pied des pages publiques et sur les pages parents FR/EN.
- Page parents : « Pour les adultes : soutien ponctuel et facultatif en CHF sur
  PayPal. Aucun avantage dans le jeu. » Traduction : « For adults: an optional,
  one-off contribution in CHF through PayPal. No in-game benefits. »
- Lien normal HTTPS vers la page publique, nouvel onglet,
  `rel="noopener noreferrer nofollow"` ; aucun SDK, iframe, préchargement PayPal,
  QR code imposé, sollicitation pendant une partie ou ajout dans Android/portable.
- Dans le jeu Web, réutiliser l'accès aux informations publiques pour rejoindre
  les pages parents ; ne pas ajouter une ligne dans le petit écran parents déjà
  très dense, ni utiliser le bloc dormant qui dépasserait le budget HTML.
- Contrôles : FR/EN, clavier,1280×800,780×360 et375×812 ; absence de requête PayPal
  avant clic et de lien PayPal dans Android ; budgets existants, build,
  `npm run verify` et `npm run test:browser`. Publication uniquement par le workflow
  « Publier le site » après accord sur l'ajout de confidentialité ci-dessous.

## Ajout exact à la politique — approuvé et intégré

Même source `src/i18n/privacyPolicy.ts` ; ajouter une section dans chaque langue et
actualiser sa date lors de la publication. Aucun changement des autres engagements,
notamment les90jours des e-mails d'assistance. L'application reste sans paiement
intégré ; cette section décrit exclusivement le site Web.

### Français — Soutien facultatif sur le site Web

Le site propose aux adultes un soutien ponctuel et facultatif via un lien vers
PayPal. Ce soutien n'accorde aucun avantage dans le jeu. PayPal traite le paiement
sur son propre site, selon sa politique de confidentialité. Aucun numéro de carte
ni identifiant de connexion PayPal n'est reçu par le site du jeu.

PayPal peut communiquer à zyclope le nom, l'adresse e-mail et les détails de la
transaction, notamment son montant, sa date et sa référence. Ces informations
servent uniquement au suivi du soutien, aux éventuelles réclamations et aux
obligations comptables et fiscales applicables. Elles ne sont pas associées aux
profils des enfants et ne sont pas utilisées pour envoyer de publicité.

Les copies détenues par zyclope sont conservées le temps nécessaire au traitement
de la transaction et d'une éventuelle réclamation, puis supprimées, sauf les pièces
qui doivent être conservées pour respecter une obligation légale. Pour les pièces
comptables soumises à cette obligation en Suisse, la durée est de dix ans à compter
de la fin de l'exercice concerné. PayPal applique ses propres durées de conservation
aux données qu'il détient.

### English — Optional support on the website

The website offers adults an optional, one-off way to support the game through a
link to PayPal. Contributions provide no in-game benefits. PayPal processes the
payment on its own website under its privacy policy. The game's website does not
receive card numbers or PayPal login credentials.

PayPal may share the contributor's name, email address and transaction details,
including the amount, date and reference, with zyclope. This information is used
only to manage contributions, handle any claims and meet applicable accounting
and tax obligations. It is not linked to children's profiles or used to send
advertising.

Copies held by zyclope are kept for as long as needed to handle the transaction
and any claim, then deleted, except for records that must be retained by law.
Accounting records subject to this requirement in Switzerland are kept for ten
years from the end of the relevant financial year. PayPal applies its own
retention periods to the data it holds.

Lier « politique de confidentialité » / « privacy policy » à :
https://www.paypal.com/ch/legalhub/paypal/privacy-full

## Sources et limites

- [PayPal CH : soutien d'une activité](https://www.paypal.com/ch/cshelp/article/how-do-i-raise-financial-support-for-my-business-help241) : nom et e-mail visibles dans les détails du paiement.
- [PayPal : liens de paiement](https://developer.paypal.com/payment-links-buttons/create-payment-link/) : montant libre prévu pour contributions et pourboires.
- [Portail PME de la Confédération : conservation](https://www.kmu.admin.ch/fr/conservation-electronique-des-livres-de-comptes) : dix ans pour les pièces comptables, à partir de la fin de l'exercice. Ce document ne détermine pas le statut fiscal personnel du parent.
- Aucun reçu réel, frais débités ou promesse d'anonymat vérifiés. Aucun changement
  de déclaration Play nécessaire pour le build Android inchangé de ce lot Web.
