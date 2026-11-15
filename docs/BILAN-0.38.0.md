# Bilan 0.38.0 — Confidentialité et Android optimisé

## Livraison Android build62 — 15 novembre 2026

Source produit `4d9724d98f27e9df69289c3954163609e3c27898`, sur PR58 :
`versionCode`61→62 et `POLICY_APP.build`62, version0.38.0 conservée.
R8 activé dans main par PR57 ; aucun changement de règle, valeur, sauvegarde, code de
départ, permission, SDK ou texte juridique dans cette livraison.

- AAB signé avec la clé d'envoi d'origine, release non débogable, validé par bundletool.
  Mapping R8 embarqué :5426936octets ; DEX7111200→790240octets.
  Les132fichiers web correspondent à l'APK release extrait de cet AAB.
- AAB `conquete-serpents-v0.38.0-build62-play.aab` :20829159octets,
  SHA256 `6835420d034acceb92904eca82f4f33555dd5ae5e593ca1113501f02efd27ad2`.
- APK testé `conquete-serpents-v0.38.0-build62-release.apk` :20566827octets,
  SHA256 `e21bda8e43b84bba9e8227c95290e48a82af931b5f0c51f858089130ee1a3d7b`.
- Contrôles cloud relancés après réception de la recette : `npm run verify`717tests,
  zéro échec, compilation et budgets verts ; `npm run test:browser` vert, aucune erreur
  de page. Les132fichiers du nouveau build restent identiques au bundle et à l'APK testé.
  Empreintes, signature jarsigner et validation bundletool revérifiées sans reconstruire
  ni remplacer le bundle signé.
- Recette native **transmise par le parent** : Android15 x86_64/WHPX, APK installé
  identique au kit, aucun crash/ANR. Accueil hors ligne, mission1 gagnée, reprise61→62 sans
  effacement, sauvegarde62 après arrêt forcé, Voyage et confidentialité FR/EN hors ligne,
  paysage avec gestes et trois boutons. Détail et réserves dans [ANDROID.md](ANDROID.md).
- Les preuves Windows `RECETTE.md` et `Snake-Attack-TD-build62-preuves.zip` ne sont pas
  accessibles depuis cette session : ne pas présenter cette recette comme exécutée ici.
  L'échec WebView cloud avec et sans R8 reste archivé, non reproduit sur WHPX.
- Réserve : Réglages brièvement rogné au changement de navigation système, récupéré
  après sélection du profil ; journaux WebView de cache/rendu sans interruption observée.
  Pas de modification d'interface dans cette livraison. S24 et mise à jour signée par
  Play restent à essayer ; le téléphone familial a été préservé.

PR58 reste ouverte. Aucun envoi à Google Play, activation Alpha, fusion ou publication
du site dans cette étape. Le site reste celui publié pour la livraison61.

Notes à importer avec l'AAB62 :

```text
<fr-FR>
Version Android allégée et optimisée, avec des diagnostics natifs améliorés. Les règles, sauvegardes et contenus du jeu sont conservés.
</fr-FR>
<en-US>
Smaller, optimized Android build with improved native crash diagnostics. Game rules, saves and content are unchanged.
</en-US>
```

## Historique — livraison Android build61

Livraison préparée le15novembre2026 : **0.38.0 / Android61**. Site officiel :
https://snakeattacktd.com/ ; politique : https://snakeattacktd.com/confidentialite.
Source des paquets : `b6919be4164813df84977b670a07f95cbf397173`, issue de main `675d52f` (PR53 et54 de Claude). La préparation parallèle PR55
(`961883c`) est intégrée à la branche de livraison : produit identique, contrôle de texte
plus strict conservé.

## Fait

- Bouton « Confidentialité » / « Privacy policy » dans « Pour les parents » : texte complet
  FR/EN embarqué, défilement et fermeture, lien public volontaire. Une seule source
  `src/i18n/privacyPolicy.ts` pour la fenêtre et la page publique.
- `versionCode`60→61 et `POLICY_APP.build`61, version0.38.0 conservée. Aucun engagement de
  confidentialité ni date du texte approuvé changé ; aucun réglage de jeu, format de
  sauvegarde, code de départ, permission ou SDK ajouté.
- Le test actualise uniquement version/build attendus dans la portée de l’archive ; la
  fixture publiée du14novembre reste intacte. Tous les autres mots et les numéros réellement
  affichés sont comparés, les métadonnées étant aussi vérifiées contre Gradle/package.json.
- AAB signé avec la clé Play d’origine ; APK debug avec le certificat familial distinct.
  Notes de version FR/EN fournies ; historique [build60](archive/BILAN-0.38.0-build60.md).

## Vérifié

- `npm run verify` : **717 tests**,0échec ; format, types, build et budgets verts.
- Navigateur, audit13/13, menus **5648 contrôles** (dont170 confidentialité), hors ligne et
  sauvegarde familiale verts. Les anciens formats de sauvegarde restent lisibles.
- Politique du vrai APK démarrée à froid hors ligne FR/EN,780×360 avec marges simulées :
  texte exact, build61, défilement, fermeture et lien correct, aucune requête extérieure.
- AAB : signature jarsigner et validation bundletool vertes, paquet
  `com.conqueteserpents.famille`, paysage, minSdk24/targetSdk36, non débogable.
  **131 fichiers web**, dont30MP3, identiques au build dans APK et AAB ; `.htaccess` est
  réservé au serveur Apache et exclu par le packaging Android. Aucune clé privée embarquée.
- Avis de migration déjà publié par une autre session sur l’ancien hébergement :
  Sites37, source `fe8bd54c391f6ce54df2e0199ee41801b469862b`. Brouillon concurrent de Codex
  abandonné pour préserver ce travail. Six cas locaux FR/EN, dont deux à plusieurs profils,
  verts ; réponse publique200 et présence de l’avis vérifiées. Aucun fichier préexistant
  hors index, ni politique de cet hébergement remplacé.
- Relecture indépendante : aucune anomalie source/paquet ; un défaut multi-profils du
  brouillon de notice a été reproduit et corrigé, avant abandon de ce brouillon au profit
  de l’avis déjà publié. Aucun changement graphique ou fonctionnel supplémentaire.

- Publication Infomaniak réussie par le seul workflow « Publier le site », run43698517225,
  source main `099cebf07dcf9f119c05d9f792c43248aca1a88b` (PR55 et56 intégrées). Le workflow
  vérifie717tests, HTTPS, redirections HTTP/www, cache, politique exacte et absence de cookie.
  Les131fichiers distribués sont identiques aux paquets ; contrôle public navigateur
  accueil→confidentialité→camp à1280×800FR,780×360FR,812×375EN sans erreur ni ressource manquante.
  Le plateau mesure1065,66×600,81px à1280×800,553,55×311,73px à780×360.
- CI complète de main43698515202 en cours au dernier contrôle ; ne pas la confondre avec
  la publication terminée ou les recettes locales vertes. Le contrôle HTTP de Node depuis
  ce conteneur est limité par son proxy ; la redirection301 est confirmée par curl et par
  le contrôle complet du workflow.

Preuves hors Git : `artifacts/livraison-build61/` et `/workspace/serpents-build61-20261115/`.

## Livraison et limites

Importer `conquete-serpents-v0.38.0-build61-play.aab` dans une nouvelle version du canal
interne existant. Ni upload Play, ni activation Alpha, ni production, ni attestation par
Codex. L’accès authentifié Play est absent de cette session : la mise à jour de son URL
reste à faire dans la session connectée du parent.

L’installation/mise à jour physique, les liens externes depuis la WebView et le confort S24
restent à essayer sur appareil ; les tests navigateur simulent les fichiers de l’APK et
les marges système. Aucun test TalkBack/Safari/Firefox ni examen des journaux Infomaniak.
Les exports familiaux n’incluent pas les profils ni le Voyage : voir [SITE.md](SITE.md).
