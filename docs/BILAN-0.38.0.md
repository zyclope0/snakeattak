# Bilan 0.38.0 — Confidentialité, Android build61

Livraison préparée le15novembre2026 : **0.38.0 / Android61**. Site officiel :
https://snakeattacktd.com/ ; politique : https://snakeattacktd.com/confidentialite.
Source des paquets : `b6919be4164813df84977b670a07f95cbf397173`, issue de main `675d52f` (PR53 et54 de Claude).

## Fait

- Bouton « Confidentialité » / « Privacy policy » dans « Pour les parents » : texte complet
  FR/EN embarqué, défilement et fermeture, lien public volontaire. Une seule source
  `src/i18n/privacyPolicy.ts` pour la fenêtre et la page publique.
- `versionCode`60→61 et `POLICY_APP.build`61, version0.38.0 conservée. Aucun engagement de
  confidentialité ni date du texte approuvé changé ; aucun réglage de jeu, format de
  sauvegarde, code de départ, permission ou SDK ajouté.
- Le test de texte historique neutralise uniquement les nombres version/build des deux
  portées : la fixture publiée du14novembre reste intacte, tous les autres mots sont
  comparés, les métadonnées réelles restent vérifiées contre Gradle/package.json.
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
