# B — Analyse technique : standards du domaine et écart avec le projet

> Annexe de [ANALYSE-2026-11-22.md](../ANALYSE-2026-11-22.md). Rapport brut d'une recherche
> du 22 novembre 2026, gardé pour ses sources et ses mesures. Seul ce qui est repris dans
> l'analyse a été recoupé ; le reste est à vérifier avant d'être cité. Les chemins de travail
> cités (dossier « scratchpad ») n'existent plus.

22 novembre 2026. Dépôt lu à `36e207b` (`main`, 0.40.0 / build 64), sans rien modifier. Paquets
mesurés : `dist/` et `dist-android/` déjà construits (commit `a82a3b9`, arbre marqué « dirty »
par le build).

## Comment lire ce document

**Statut de chaque source** (noté entre crochets) :

- **[lu]** : page ouverte et lue pendant cette session.
- **[paquet]** : texte lu dans le paquet installé (`node_modules/`), qui est la source de la
  documentation en ligne ; l'adresse en ligne est donnée à côté.
- **[résumé]** : obtenu par un résumé de moteur de recherche ; la page elle-même n'a pas pu être
  ouverte (voir ci-dessous).
- **[mémoire]** : cité de mémoire, non revérifié aujourd'hui. À contrôler avant de s'appuyer dessus.

**Sites bloqués par le réseau de cette session** : `developer.mozilla.org`, `docs.phaser.io`,
`capacitorjs.com`, `web.dev`, `unpkg.com`, et le site du jeu. Contournement : mêmes textes lus
dans leurs dépôts GitHub (MDN, Capacitor) ou dans le paquet installé (Phaser, Capacitor, Vite).
`developer.android.com` a été lu directement.

**Statut de chaque mesure** :

- **[fichier]** : compté sur les fichiers construits. Vrai partout.
- **[compte]** : nombre d'appels WebGL comptés dans un Chromium sans écran. Un compte d'appels
  dépend du moteur et de la scène, pas de la vitesse de la machine ; il est attendu identique
  sur un téléphone, mais **son coût sur un téléphone est inconnu**.
- **[sans écran]** : temps ou images par seconde d'un navigateur sans carte graphique. Sert à
  comparer deux versions, **ne dit rien d'un téléphone**.
- **[téléphone]** : rien dans ce document. Aucune mesure ne vient d'un vrai appareil.

Scripts de mesure (hors dépôt) : `measure.mjs`, `drawcalls3.mjs`, `ctxloss.mjs` dans ce dossier.

---

# Partie 1 — Standards

## 1. Rendu Phaser 3 / WebGL sur mobile

**Atlas et lots de dessin.** Changer de texture coupe un lot : « Since you need to split draw
call batches to change textures », d'où le conseil de regrouper les images dans un atlas — MDN,
_WebGL best practices_ [lu, dépôt mdn/content]
(https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices). Phaser dit la
même chose : « This is why using texture atlases is so important. The more on-screen objects
that share an atlas, the less texture binds and draws that take place. » [paquet,
`phaser/changelog/3.60/MobilePerformance.md` ;
https://github.com/phaserjs/phaser/blob/v3.60.0/changelog/3.60/MobilePerformance.md].

**Sur Android, Phaser ne regroupe pas plusieurs textures dans un lot.** Depuis la 3.60, « Phaser
will check to see if the device is iOS or Android and invoke the new Mobile Pipeline
automatically » ; ce pipeline « uses one single-bound texture ». Sur ordinateur, le pipeline
« Multi » regroupe typiquement 16 textures par appel. Réglage : `render.autoMobilePipeline`
(défaut `true`). [paquet, même fichier ; `phaser/src/core/Config.js:366`,
`phaser/src/renderer/webgl/PipelineManager.js:495`.] Conséquence : sur téléphone, chaque
changement de texture dans l'ordre d'affichage est un appel de dessin.

**Taille maximale de texture.** « effectively all systems support at least » `MAX_TEXTURE_SIZE:
4096` ; « Your desktop may support 16k textures but lower-end systems may not » — MDN [lu].
Puissance de deux : plus exigée pour une image 2D sans mipmap en WebGL (MDN, même page [lu] :
pas de mipmap pour une texture 2D jamais réduite).

**Mémoire d'une texture.** Une image PNG, JPEG ou WebP est décompressée avant d'aller sur la
carte : largeur × hauteur × 4 octets, quel que soit le poids du fichier. WebGL ne donne aucun
moyen de connaître la mémoire disponible : « Estimate the current VRAM usage » soi-même — MDN
[lu]. Seules les textures compressées pour la carte (ASTC, ETC2) restent petites en mémoire ;
Phaser sait les charger depuis la 3.60 (`this.load.texture`, conteneurs KTX et PVR) [paquet,
`phaser/changelog/3.60/CompressedTextures.md`]. Parc Android : ASTC sur plus de 80 % des
appareils, ETC2 sur plus de 95 % [résumé,
https://developer.android.com/guide/playcore/asset-delivery/texture-compression].

**Résolution du canevas.** Dessiner dans une surface plus petite et l'agrandir est le réglage
de performance le plus simple (« rendering into a smaller back buffer ») — MDN [lu]. L'usage
courant est de plafonner `devicePixelRatio` à 2 [mémoire].

**Attributs du contexte.** « Avoid alpha:false, which can be expensive » ; ne demander un
tampon stencil que si l'on s'en sert — MDN [lu]. Phaser met `antialiasGL: true`,
`powerPreference: 'default'`, `roundPixels: false`, `batchSize: 4096`, pas de mipmaps par défaut
[paquet, `phaser/src/core/Config.js:381-448` ;
https://docs.phaser.io/api-documentation/typedef/types-core].

**Envois de texture.** « Most texture uploads from DOM elements will incur a processing pass » ;
les faire avant de dessiner plutôt qu'au milieu d'une image — MDN [lu].

**Objets `Text`.** « Every time the contents of a Text object changes […] it needs to remake the
Text canvas, and if on WebGL, re-upload the new texture to the GPU. This can be an expensive
operation if used often, or with large quantities of Text objects […] you would be better off
using Bitmap Text instead, as it benefits from batching and avoids expensive Canvas API calls. »
[paquet, `phaser/src/gameobjects/text/Text.js` ;
https://docs.phaser.io/api-documentation/class/gameobjects-text].

**Objets `Graphics`.** « Under WebGL the graphics data is decomposed into polygons. Both of
these are expensive processes, especially with complex shapes. If your Graphics object doesn't
change much (or at all) […] you will help performance by calling `generateTexture`. » [paquet,
`phaser/src/gameobjects/graphics/Graphics.js` ;
https://docs.phaser.io/api-documentation/class/gameobjects-graphics].

**Cadence.** `fps.limit` : « Enforces an fps rate limit that the game step will run at,
regardless of browser frequency. 0 means 'no limit'. » Défaut 0 : le jeu suit l'écran (90 ou
120 images par seconde sur les téléphones récents) [paquet,
`phaser/src/core/typedefs/FPSConfig.js`].

**Réserve d'objets, culling, particules, tweens.** Réutiliser les objets au lieu de les créer
(groupes de Phaser) est l'usage [mémoire, https://docs.phaser.io/phaser/concepts/gameobjects/group].
Le projet n'emploie ni particules ni tweens de Phaser : rien à comparer.

## 2. Ne pas charger ce qui ne sert pas

**Phaser 3 ne se « secoue » pas.** Le code est en CommonJS ; le fichier `phaser.esm.js` est ce
même code « wrap[ped] in modern ES Module declarations » [paquet,
`phaser/changelog/3.60/ESMSupport.md`]. Un bundler ne peut donc rien en retirer. Les voies
officielles : le fichier livré `dist/phaser-arcade-physics.min.js` (sans Matter), un build sur
mesure (https://github.com/phaserjs/custom-build, « hundreds of KB » [résumé]) ou Phaser
Compressor (« over 60% », https://phaser.io/news/2024/05/phaser-compressor-released [résumé]).

**Découpe du code.** Import dynamique pour ce qui ne sert pas au premier écran [mémoire,
https://vite.dev/guide/features#dynamic-import]. Cible par défaut de Vite 6 : `es2020`,
`chrome87`, `edge88`, `firefox78`, `safari14` [paquet, `vite/dist/node/constants.js:57-63` ;
https://vite.dev/config/build-options#build-target].

**Son.** Les navigateurs refusent le son avant un geste : le démarrer sur un appui. Un « audio
sprite » réunit les bruitages en un fichier (« reduce the number of server requests »). Les
bruitages se décodent en mémoire avec `decodeAudioData` — MDN, _Audio for Web Games_ [lu, dépôt
mdn/content] (https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games).
Un son décodé pèse 44 100 × canaux × 4 octets par seconde (environ 20 Mo par minute en stéréo)
[calcul] : la musique se lit en flux, pas décodée. Couper le son quand la page est cachée
[mémoire, API Page Visibility].

## 3. Démarrage

- Android vitals juge un démarrage excessif à 5 s à froid, 2 s à tiède, 1,5 s à chaud
  [mémoire, https://developer.android.com/topic/performance/vitals/launch-time]. TTID = première
  image ; TTFD = application utilisable, que l'application signale par `reportFullyDrawn`
  [lu, https://developer.android.com/topic/performance/issues/launch-time].
- Écran de lancement : API `SplashScreen` obligatoire depuis Android 12 [lu, même page].
- Web : LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 [mémoire, https://web.dev/articles/vitals].
- Cache : fichiers à empreinte en `immutable` un an, page HTML en `no-cache` [mémoire,
  https://web.dev/articles/http-cache]. Compression Brotli plutôt que gzip pour le texte
  [mémoire, https://web.dev/articles/reduce-network-payloads-using-text-compression].
- Service worker : nécessaire pour jouer hors ligne ou installer le site comme application ;
  pas une obligation pour un site statique [mémoire, https://web.dev/learn/pwa/service-workers].

## 4. Mémoire et stabilité dans le WebView Android

**Processus de rendu tué.** « The Termination Handling API handles cases where the renderer
process for a WebView object goes away, either because the system kills the renderer to reclaim
necessary memory or because the renderer process crashes. » Sans `onRenderProcessGone` qui
renvoie `true`, l'application tombe avec lui ; avec, il faut détruire le WebView et en recréer
un [lu, https://developer.android.com/develop/ui/views/layout/webapps/managing-webview].
La mémoire du rendu se lit avec `adb shell dumpsys meminfo <pid du rendu>`, pas avec le nom du
paquet [résumé, https://developer.android.com/develop/ui/views/layout/webapps/manage-webview-memory].

**Versions du WebView.** Sur Android 7 à 9, c'est Chrome qui fournit le WebView ; sur 10 et
plus, « Android System WebView ». Capacitor demande un WebView 60 au moins [résumé,
https://capacitorjs.com/docs/android]. Réglages : `android.minWebViewVersion` (défaut 60,
plancher 55) ; sous ce seuil, « an error message will be shown on Logcat. If `server.errorPath`
is configured, the WebView will redirect to that file » [paquet,
`@capacitor/cli/dist/declarations.d.ts:189-200, 603-609`]. Chrome 138 est la dernière version
pour Android 8 et 9, Chrome 139 exige Android 10 [résumé,
https://www.androidauthority.com/chrome-dropping-support-android-8-9-3571442] ; Android 7 a été
abandonné fin 2023 (Chrome 119, [mémoire], non confirmé).

**Perte du contexte WebGL.** Écouter `webglcontextlost`, qui « can be emitted when the GPU runs
out of memory » — MDN [lu]. Phaser le gère depuis la 3.80 : « Phaser now performs a WebGL
Context Restore to keep the game running » [paquet, `phaser/changelog/3.80/CHANGELOG-v3.80.md:5`].
Le contenu d'une `RenderTexture` est perdu et doit être redessiné.

**Saccades.** Une tâche de plus de 50 ms est une « tâche longue » [mémoire,
https://web.dev/articles/optimize-long-tasks] ; API Long Animation Frames pour les repérer
[mémoire, https://developer.chrome.com/docs/web-platform/long-animation-frames].

**Android vitals** [lu, https://developer.android.com/topic/performance/vitals] :

| Mesure                             | Seuil de mauvais comportement                                                                                                    | S'applique à un jeu en WebView ?                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Plantages perçus                   | 1,09 % global, 8 % par modèle                                                                                                    | Oui. Un rendu WebView tué non géré compte comme un plantage.                                                    |
| ANR perçus                         | 0,47 % global, 8 % par modèle                                                                                                    | Peu : le JavaScript tourne dans le processus de rendu.                                                          |
| Verrous de réveil partiels         | 5 %                                                                                                                              | Non : le jeu n'en prend pas.                                                                                    |
| Mémoire (RSS anonyme + swap), jeux | de 2,25 Go (appareil 4 Go) à 5 Go, au premier plan                                                                               | Très loin. Effet sur la visibilité à partir de février 2027.                                                    |
| Sessions lentes (jeux seulement)   | plus de 25 % d'images à plus de 50 ms (20 i/s) ; second relevé à 34 ms (30 i/s) ; compté après une minute, depuis SurfaceFlinger | Oui si Play classe l'application comme jeu [lu, https://developer.android.com/google/play/vitals/slow-session]. |
| Démarrage, LMK, réveils            | voir § 3                                                                                                                         | Démarrage : oui. Réveils : non.                                                                                 |

## 5. Sauvegarde dans un WebView

- `localStorage` : synchrone, bloque le fil principal, environ 5 Mo, chaînes seulement ;
  web.dev conseille IndexedDB [résumé, https://web.dev/articles/storage-for-the-web].
- Éviction : un navigateur peut effacer les données d'une origine quand le disque manque ;
  `navigator.storage.persist()` demande à en être protégé [résumé,
  https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria].
- Capacitor : le stockage local sert à « small amounts of temporary data » et doit être tenu
  pour transitoire, car « the OS will reclaim local storage from Web Views if a device is
  running low on space » ; pour ce qui doit rester, l'API Preferences (petites données) ou
  SQLite [lu, dépôt ionic-team/capacitor-docs ; https://capacitorjs.com/docs/guides/storage].
  Le risque décrit vise surtout iOS.
- Écriture sur disque : `setItem` rend la main avant que le disque soit écrit. Des revues de
  code Chromium de 2015 décrivent des écritures groupées, et un vidage plus fréquent dans le
  WebView Android [résumé, https://codereview.chromium.org/1129233003]. **Ancien, non vérifié
  dans le code actuel.**
- Modèle d'écriture sûre : écrire un nouveau fichier puis le renommer à la place de l'ancien
  (classe `AtomicFile` d'Android [mémoire,
  https://developer.android.com/reference/android/util/AtomicFile]) ; garder la sauvegarde
  précédente ; somme de contrôle ; numéro de version et migrations.
- Mise à jour de l'application : les données sont gardées ; une désinstallation les efface
  [mémoire, comportement standard d'Android].
- Sauvegarde automatique Android [lu, https://developer.android.com/identity/data/autobackup] :
  25 Mo par application, vers le Google Drive de l'utilisateur ; elle inclut les préférences
  partagées et les dossiers `getFilesDir()` / `getDir()`, pas le cache. `allowBackup="false"`
  la coupe ; mais « on devices from some device manufacturers, specifying
  `android:allowBackup="false"` disables cloud-based backup […] but doesn't disable
  device-to-device transfers ». Savoir si elle restaure bien le stockage d'un WebView n'est
  écrit nulle part dans cette page : **à essayer avant d'y compter**.

## 6. Cycle de vie avec Capacitor

- Plugin `@capacitor/app` : événements `pause`, `resume`, `appStateChange` ; `backButton` :
  « Listening for this event will disable the default back button behaviour » [lu, dépôt
  ionic-team/capacitor-plugins ; https://capacitorjs.com/docs/apis/app]. Sans ce plugin, le
  cœur de Capacitor 8 n'a aucun code pour le bouton retour [paquet : aucune occurrence de
  `BackPressed` ni `goBack()` dans `@capacitor/android`].
- Android 16 (cible 36) [lu, https://developer.android.com/about/versions/16/behavior-changes-16] :
  - retour : « `onBackPressed` is not called and `KeyEvent.KEYCODE_BACK` is not dispatched
    anymore » ; il faut les nouvelles API ou `android:enableOnBackInvokedCallback="false"` ;
  - grands écrans : « orientation, resizability, and aspect ratio restrictions no longer apply
    on displays with smallest width >= 600dp ». Exceptions : « Games (based on the
    `android:appCategory` flag) » et les écrans de moins de 600 dp ;
  - bord à bord : plus de dérogation possible.
- Marges système : plugin `SystemBars` de Capacitor 8, `insetsHandling: 'css'` injecte
  `--safe-area-inset-*` [paquet, `@capacitor/cli/dist/declarations.d.ts:708-736`].
- Écran allumé : `FLAG_KEEP_SCREEN_ON` sur l'activité, sans permission [mémoire,
  https://developer.android.com/develop/background-work/background-tasks/awake/screen-on].
  Côté web : `navigator.wakeLock.request('screen')` ; les données de compatibilité disent que le
  WebView Android suit Chrome (84) [lu, dépôt mdn/browser-compat-data, `api/WakeLock.json`] —
  **à vérifier sur l'appareil**.
- Orientation : `screenOrientation` dans le manifeste (ignoré sur tablette Android 16, voir
  plus haut).

## 7. Tests d'un petit jeu

- Pas de temps fixe et simulation déterministe, pour pouvoir rejouer une partie à l'identique
  [mémoire, https://gafferongames.com/post/fix_your_timestep/].
- Parties de référence (« golden traces ») : une empreinte par partie rejouée ; tout écart est
  un changement de règle [mémoire, pratique courante].
- Tests par propriétés sur les formats de sauvegarde (entrées tirées au hasard, graine notée)
  [mémoire, https://fast-check.dev/].
- Budgets de performance tenus par la CI (tailles de fichiers, puis temps)
  [mémoire, https://web.dev/articles/performance-budgets-101].
- Rapport de pré-lancement de Google Play : à chaque envoi, Google installe l'application sur
  des appareils de son laboratoire, la parcourt quelques minutes et relève stabilité,
  performance et accessibilité ; ces plantages ne comptent pas dans les statistiques [résumé,
  https://support.google.com/googleplay/android-developer/answer/9842757]. Aucun SDK n'est
  demandé [mémoire].
- Firebase Test Lab, test « Robo » : même parcours automatique, lancé à la main sur un APK,
  sans SDK [mémoire, https://firebase.google.com/docs/test-lab/android/robo-ux-test]. Demande un
  compte et une connexion : décision du parent.
- Matrice d'appareils : Play juge par modèle (seuil de 8 %) [lu, page Android vitals]. Trois
  appareils couvrent l'essentiel : un bas de gamme de 3 à 4 Go avec puce Mali, un milieu de
  gamme Adreno, une tablette ; plus la version d'Android la plus ancienne visée [jugement].

## 8. Accessibilité et sécurité des enfants

- Cibles tactiles : WCAG 2.2, critère 2.5.8, 24 × 24 px CSS au moins ; critère renforcé 2.5.5,
  44 × 44 [lu en partie, dépôt w3c/wcag ; https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum].
  Android : 48 × 48 dp [mémoire, https://support.google.com/accessibility/android/answer/7101858].
- Mouvement réduit : requête `prefers-reduced-motion` [mémoire, MDN ; WCAG 2.3.3].
- Couleur : ne jamais porter une information par la couleur seule [mémoire, WCAG 1.4.1].
- Taille du texte : lisible agrandi à 200 % [mémoire, WCAG 1.4.4]. Le WebView Android applique
  la taille de police du système au texte de la page [mémoire] : **à essayer sur l'appareil**.
- Google Play, règles Familles : une application pour enfants ne montre de publicité que par
  des SDK auto-certifiés, sans personnalisation [résumé,
  https://support.google.com/googleplay/android-developer/answer/9893335]. Le « portail
  parental » devant un lien externe est une exigence écrite d'Apple ; côté Google, la recherche
  n'a pas rendu de règle explicite : **non vérifié**.

---

# Partie 2 — Écart avec le projet

## Mesures

### Paquets [fichier]

| Fichier (`dist-android/assets/`)                                                         |        Octets |     gzip −9 | Brotli 11 |
| ---------------------------------------------------------------------------------------- | ------------: | ----------: | --------: |
| `phaser`                                                                                 |     1 481 792 |     335 416 |   269 205 |
| `bootstrap`                                                                              |       194 006 |      73 001 |    63 231 |
| `rules`                                                                                  |       129 128 |      46 281 |    41 216 |
| `english` (à la demande)                                                                 |        92 080 |      31 372 |    26 856 |
| `voyageScreens` (à la demande)                                                           |        28 840 |      10 715 |         — |
| `privacyWindow` (à la demande)                                                           |        16 585 |       6 608 |         — |
| `index`                                                                                  |        12 021 |       5 198 |     4 660 |
| `missionDraft`, `devPerformance`, `playerWindow`, `missionPreview`, `snakeIndex`, `keys` |        22 913 |      10 410 |         — |
| **Tout le JavaScript**                                                                   | **1 977 365** | **519 001** |         — |
| Styles (5 fichiers)                                                                      |       159 348 |      33 487 |         — |

- Phaser : 74,9 % de tout le JavaScript ; 80,8 % (71,8 % en gzip) des 8 fichiers chargés pour
  jouer en français.
- Le fichier officiel `phaser.min.js` fait 1 196 122 octets (314 863 gzip) ;
  `phaser-arcade-physics.min.js` 1 086 308 (282 301). Vite prend `phaser.esm.js` et le
  re-minifie plus gros.
- Dans le paquet Phaser livré, on trouve la physique Arcade et Matter, les cartes à tuiles
  (31 occurrences de `Tilemap`), les particules, les tweens, la vidéo, les lumières, les
  manettes, le texte bitmap, les effets (`Bloom`, `Bokeh`…) et les trois moteurs de son. Le jeu
  n'en utilise aucun (`audio: { noAudio: true }`, pas de clé `physics`).
- Dossier de l'application : 21,1 Mo, dont images 11,6 Mo (55 %), sons 7,25 Mo (34 %),
  JavaScript 1,98 Mo, polices 61 Ko.

### Premier chargement sur le site [fichier ; liste des demandes relevée dans Chromium, profil neuf, 812 × 375]

| Étape                                                            | Demandes |       Octets | Sur le fil (texte en gzip) |
| ---------------------------------------------------------------- | -------: | -----------: | -------------------------: |
| Accueil utilisable                                               |       48 |    2 811 937 |                  1 321 181 |
| dont JavaScript                                                  |        8 |    1 833 770 |                    469 677 |
| dont `interface-craft.webp` (planche d'icônes)                   |        1 |      415 986 |                    415 986 |
| Premier plateau (« Le refuge »), images attendues avant de jouer |       12 |    4 471 070 |                  4 471 070 |
| Poses d'attaque, ensuite, deux à la fois                         |        7 |    2 445 888 |                  2 445 888 |
| Bruitages (dès le premier geste)                                 |       26 | 418 000 env. |                       idem |
| Musiques (flux)                                                  |        2 |    5 230 011 |                       idem |

Il faut donc **5,8 Mo** avant de poser le premier allié sur le site, 14,8 Mo si tout arrive.
En Brotli le JavaScript ferait environ 383 Ko au lieu de 470. `allies-front` et
`allies-support` sont demandées deux fois (portraits en CSS, puis Phaser) : le cache du
navigateur sert la seconde. Dans l'application, tout est sur le disque : rien de ceci ne compte.

### Images [fichier]

- 87 images livrées, 11,63 Mo. Aucune ne dépasse 2048 px : le plus grand côté est 1600.
- Textures du jeu : 16 planches et 11 planches d'attaque en 1024 × 1024 (4,0 Mio décodées
  chacune), 5 fonds en 1600 × 900 (5,5 Mio chacun).
- 26 planches sont en WebP sans perte (220 à 690 Ko chacune) ; le spinosaure, encodé avec
  perte et transparence exacte, pèse 30 Ko pour la même taille.
- Mémoire décodée (largeur × hauteur × 4, sans mipmaps) :
  - première mission : 10 planches + 2 fonds = **51 Mio**, chargées avant le plateau ;
  - plus 7 planches d'attaque arrivées ensuite = **79 Mio** ;
  - toutes les textures du jeu : 135,5 Mio ; les 87 images : 146 Mio.
  - S'y ajoutent le cache du terrain (2200 × 1240 × 4 = 10,4 Mio, `src/render/terrain.ts:49-54`)
    et la surface du canevas (jusqu'à 2200 × 1240, multipliée par l'anticrénelage).
- Une figurine occupe une cellule de 512 px et s'affiche sur 70 unités de plateau environ,
  soit 70 à 140 px d'écran. `Figurines` la réduit sur un petit canevas (`src/render/figurines.ts:130-157`)
  et c'est ce canevas qui est dessiné. La planche entière reste pourtant en mémoire graphique.
- Chargement : seules les planches de la partie sont demandées (`src/render/missionAssets.ts:25-41`),
  y compris celles de tous les alliés débloqués, recrutés ou non. Les poses d'attaque viennent
  après, hors du chargeur, décodées hors du fil principal (`missionAssets.ts:152-181`).

### Son [fichier]

30 fichiers MP3, 7,25 Mo : 4 musiques (6,83 Mo, 128 kbit/s stéréo, 35 à 191 s) et 26 bruitages
(418 Ko, 30,8 s au total, soit environ 6,9 Mio une fois décodés). Bruitages décodés par Web
Audio, musiques lues en flux par un élément audio (`src/audio/samples.ts:113-121`). Pas de
fichier unique pour les bruitages.

### Travail par image dans le rendu

Scène de mesure : vague 11, 48 alliés, graine 1234 (celle de `scripts/hygiene/reference-charge.mjs`).

| Relevé [compte]                                    |     Pipeline d'ordinateur | Pipeline que Phaser prend sur Android |
| -------------------------------------------------- | ------------------------: | ------------------------------------: |
| Appels de dessin, 48 alliés immobiles              |                         3 |                               **116** |
| Appels de dessin en combat (médiane ; 95e centile) |                 4 à 6 ; 7 |                   **104 à 124 ; 131** |
| Sommets envoyés, 48 alliés immobiles               |                    41 016 |                                41 016 |
| Sommets en combat (médiane ; maximum)              | 38 000 à 66 000 ; 108 732 |                                  idem |
| Envois de texture en 30 s de combat                |                     3 370 |                                 3 507 |
| dont petits canevas de texte (15 à 43 × 14 px)     |                     3 332 |                                 3 468 |
| Envois de texture dans une seule image (maximum)   |                        48 |                                    29 |

Le second pipeline a été obtenu en donnant au navigateur un agent utilisateur Android : c'est
ce test que Phaser fait (`phaser/src/device/OS.js:91-94`). Le compte est celui du moteur, pas
d'un téléphone.

Ce que ces nombres disent :

- **Appels de dessin.** Chaque figurine préparée est un canevas à part, ajouté comme source à
  sa planche (`src/render/figurines.ts:102-107`) : autant de textures que de sortes de
  figurines à l'écran. Triées par profondeur, elles alternent, et sur Android chaque
  alternance coupe le lot.
- **Sommets.** 48 alliés font 96 images, soit 576 sommets. Les 40 000 autres (98,6 %) viennent
  des `Graphics` recalculés à chaque image : ombres et anneaux (`src/render/actors.ts:344-351`),
  marques de camp et barres de vie (`actors.ts:458-474`), éclats (`src/render/battleFeedback.ts:109-133`).
  Seize `Graphics` sont vidés et redessinés par image : `BattleScene.ts:268-269, 326` ;
  `actors.ts:238, 382, 401` ; `battleFeedback.ts:94` ; `bossSignals.ts:48-49` ;
  `flightSignals.ts:19-20` ; `juice.ts:166, 172` ; `medicalSignals.ts:67` ;
  `strongholds.ts:95-96, 188` ; `threatMarkers.ts:50`. C'est le point 6 de la revue, chiffré.
- **Textes.** Aucun `Text` n'est créé par image : 40 étiquettes flottantes sont créées une fois
  (`battleFeedback.ts:57-69`). Mais elles suivent le rang du mot dans la liste
  (`battleFeedback.ts:97-108`) : quand le plus vieux mot s'efface, tous les suivants changent
  d'étiquette, donc sont redessinés et renvoyés à la carte. Environ 110 envois par seconde.
- **Allocations dans la boucle** (petites, à chaque image) :
  - `MissionAssets.ready` est appelé deux fois par image (`BattleScene.ts:247, 253`) et refait
    à chaque fois quatre ensembles et la composition de la vague (`missionAssets.ts:25-60, 114`) ;
  - `[...game.units, ...game.enemies]` (`battleFeedback.ts:122`) ;
  - deux clés en texte par combattant (`actors.ts:357, 369`), un nom et un objet de taille par
    combattant (`figurines.ts:158-164, 219`) ;
  - `floats.filter` (`presentation.ts:235`).
- Déjà en place : terrain dessiné une fois dans une `RenderTexture` (`terrain.ts:46-61`),
  réserves d'images et de dessins (`src/render/framePool.ts`, `actors.ts:192-223`), une seule
  posture réutilisée (`actors.ts:176-188`).

### Configuration de Phaser (`src/bootstrap.ts:129-140`)

| Réglage                                                                  | Valeur                                                                                                                                | Ligne                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Moteur de rendu                                                          | `Phaser.AUTO` (WebGL 1 obtenu dans Chromium)                                                                                          | 130                                               |
| Taille                                                                   | 1100 × 620, puis canevas agrandi aux pixels de l'écran                                                                                | 133-134, 158                                      |
| Plafond de résolution                                                    | 2 × le plateau (2200 px) ; 1 × en « Effets légers » ; baisse d'un demi-cran après 3 s sous 40 images par seconde, gardée si elle aide | `src/render/boardResolution.ts:7, 21-30, 119-164` |
| `antialias`                                                              | `true` (et `antialiasGL` par défaut : contexte anticrénelé)                                                                           | 137                                               |
| Échelle                                                                  | `Scale.FIT`, centré                                                                                                                   | 138                                               |
| Son de Phaser                                                            | coupé (`noAudio`)                                                                                                                     | 139                                               |
| `fps`, `physics`, `powerPreference`, `roundPixels`, `autoMobilePipeline` | absents : défauts de Phaser (pas de plafond d'images, pas de physique démarrée, `'default'`, `false`, `true`)                         | —                                                 |
| Pas de simulation                                                        | fixe, 1/30 s, retard plafonné à 0,1 s                                                                                                 | `src/session.ts:8, 82-98`                         |

Contexte obtenu [sans écran] : `alpha:false`, `antialias:true`, `depth:true`, `stencil:true`,
`powerPreference:"default"`. Avec un rapport de pixels de 3, le canevas est descendu seul de
1740 à 1190 px : le régulateur a joué (machine sans carte graphique).

### Cycle de vie

| Sujet                            | État                                                                                          | Où                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Page cachée, `pagehide`          | Pause, attend « Reprendre »                                                                   | `src/ui/lifecycle.ts:5-21`                               |
| Boucle de Phaser en arrière-plan | Arrêtée par Phaser                                                                            | `phaser/src/core/Game.js:590-592`                        |
| Son en arrière-plan              | Musique en pause, contexte suspendu, reprise seule                                            | `src/audio/sounds.ts:153-161`                            |
| Déblocage du son                 | Au premier geste, réessayé à chaque geste                                                     | `src/audio/sounds.ts:74-77, 127-135`                     |
| Perte du contexte WebGL          | Phaser restaure ; le terrain est redessiné                                                    | `src/render/terrain.ts:24`                               |
| Bouton et geste retour           | **Rien** : ni plugin `@capacitor/app`, ni code natif, ni historique                           | `MainActivity.java` (vide), `package.json`               |
| Écran allumé                     | **Rien**                                                                                      | —                                                        |
| Processus de rendu tué           | **Rien** : Capacitor renvoie `false`                                                          | `@capacitor/android/.../BridgeWebViewClient.java:92-104` |
| Orientation                      | `sensorLandscape` ; pas de `android:appCategory` ; avis « tourne ton téléphone » dans la page | `AndroidManifest.xml:15`, `index.html:11-17`             |
| Marges système                   | `SystemBars`, `insetsHandling: 'css'`, `viewport-fit=cover`                                   | `capacitor.config.ts:7-9`                                |

Essai fait ici [sans écran] : contexte perdu puis rendu par `WEBGL_lose_context` sur le plateau
à 48 alliés, avec les deux pipelines. Événements `lost` puis `restored`, aucune erreur, terrain,
figurines et textes revenus (3,2 à 3,5 % de pixels différents, le balancement des alliés), la
vague se lance ensuite. Aucune recette du dépôt ne fait cet essai.

### Chemin d'une sauvegarde

- **Quand** : après chaque commande et toutes les 180 ms pendant que le plateau tourne
  (`src/render/BattleScene.ts:52, 353-358` → `src/bootstrap.ts:278-290`). Depuis le lot 1,
  une demande identique ne refait plus le fichier (`src/familyPersistence.ts:179-180`).
- **Quoi** : le camp sous sa clé (`src/checkpoints.ts:436-449`), puis le fichier familial
  entier sous la sienne (`familyPersistence.ts:67-90`, écriture ligne 80). Un texte JSON par
  clé, un `setItem` par clé. Un appareil à deux joueurs garde 5,8 Ko en tout
  (`tests/fixtures/appareil-build-63.json`) : le coût synchrone est négligeable et le quota
  (5 Mo) très loin.
- **Atomicité** : un `setItem` réussit ou lève une erreur ; l'ancien texte reste si l'écriture
  est refusée. Pas d'écriture « nouveau puis échange », pas de copie de la sauvegarde
  précédente. Le camp et la carrière ont toutefois leur propre clé en plus du fichier familial :
  si celui-ci est illisible, le camp est relu sous sa clé (`bootstrap.ts:90-94`).
- **Intégrité** : pas de somme de contrôle ; à la place, relecture stricte, bornée en longueur
  (`checkpoints.ts:33, 406-408` ; `src/familyBackup.ts:72-73` ; `src/plainData.ts:49-60`) et
  refus au moindre doute.
- **Versions** : chaque format reste lisible, par numéro ; un fichier illisible est mis de côté
  avant d'être remplacé (`familyPersistence.ts:105-110`, clé `family-refused`).
- **Refus d'écriture** : message, nouvelle tentative au changement suivant ; un stockage
  illisible n'est jamais écrasé (`familyPersistence.ts:76-89, 126-129`).
- **Hors de l'appareil** : `allowBackup="false"` (`AndroidManifest.xml:5`) ; seul le fichier
  familial exporté à la main sort du téléphone. Ni `navigator.storage.persist()`, ni copie
  native.

### Langage visé et vieux WebView

- `tsconfig.json` vise ES2022, mais ne produit rien (`noEmit`). `vite.config.ts` ne fixe pas
  `build.target` : Vite 6.4.5 prend `es2020` / `chrome87`.
- Dans les fichiers construits : `??` reste (148 fois, Chrome 80) ; `?.` est réécrit (0), et
  il n'y a ni `??=`, ni champs de classe, ni membres privés. Appels non remplacés :
  `Object.hasOwn` (34, Chrome 93), `.at()` (8, Chrome 92), `WeakRef` (Chrome 84). Styles : `:has()` (23, Chrome 105), unités `dvh` (14, Chrome 108),
  `@container` (3, Chrome 105), `text-wrap: balance` (114, sans gravité).
- Donc : sous Chrome 80, le premier fichier ne se lit pas et la page reste inerte, sans
  message ; de 80 à 92, le démarrage échoue et `src/main.ts:13-16` affiche « impossible de
  démarrer » ; de 93 à 107, le jeu tourne avec une mise en page abîmée, sans message.
- `capacitor.config.ts` ne fixe ni `android.minWebViewVersion` (défaut 60) ni
  `server.errorPath`. Aucun `<script nomodule>` sur le site.
- Portée réelle : un Android 7 à 9 dont Chrome est à jour a un WebView 119 ou 138, suffisant.
  Le risque est l'appareil jamais mis à jour.

### Tests

- 151 fichiers de tests unitaires, 909 appels `test(` (914 tests comptés par le bilan
  d'hygiène).
- Parties de référence : `tests/engine-traces.test.ts`, `render-traces`, `voyage-traces`.
- Tests proches des tests par propriétés, à graine : 600 demandes de sauvegarde
  (`family-sync-settled`), 9 000 buts de camp (`camp-points`), 26 400 sauvegardes abîmées
  (bilan d'hygiène).
- 59 scripts, dont 33 recettes en navigateur (Playwright, axe-core) ; 8 tâches de CI ; quatre
  recettes de sauvegarde (mise à jour, fichier familial, fermeture forcée, doubles appuis).
- Budgets tenus par la CI : page < 32 768 octets, `bootstrap` ≤ 200 000, Phaser ≤ 2 000 000
  (`scripts/check-dist.mjs:15, 25-32`).
- Absents : seuil sur les appels de dessin ou les envois de texture ; essai de perte de
  contexte ; essai sur un vieux moteur ; Firefox et Safari pour le site ; matrice d'appareils ;
  lecture du rapport de pré-lancement dans la recette de publication.

## Tableau des écarts

Effort : S = moins d'une journée, M = quelques jours, L = plus. « Inconnu » = il faut un vrai
téléphone pour trancher.

| #   | Pratique                                      | Standard (source)                                                                                            | Ce que fait le projet                                                                                                                            | Écart                                                                                | Effort                                                                                              | Risque du changement                                                                               |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | Garder l'écran allumé pendant une bataille    | `FLAG_KEEP_SCREEN_ON` sur l'activité (Android [mémoire]) ; Wake Lock sur le web                              | Rien. Les soldats se battent seuls : une vague regardée sans toucher laisse l'écran s'éteindre                                                   | **Notable**, à confirmer en 1 minute sur le téléphone                                | S                                                                                                   | Faible. Code natif ou attribut de vue : accord du parent                                           |
| 2   | Texte qui change souvent                      | Éviter de refaire un `Text` ; chaque changement refait le canevas et le renvoie à la carte (Phaser [paquet]) | 40 étiquettes rangées par rang : 3 300 à 3 500 envois en 30 s, jusqu'à 48 dans une image (`battleFeedback.ts:97-108`)                            | **Notable** ; coût réel inconnu                                                      | S (une étiquette fixe par mot) ; M (police bitmap)                                                  | Faible pour l'étiquette fixe : mêmes pixels. Moyen pour une police bitmap (accents, police du jeu) |
| 3   | Android 16 : orientation sur grand écran      | Verrou d'orientation ignoré dès 600 dp, sauf jeux déclarés par `android:appCategory` (Android [lu])          | Cible 36, `sensorLandscape`, pas d'`appCategory`. Repli : l'avis « tourne ton téléphone »                                                        | **Notable** sur tablette Android 16                                                  | S                                                                                                   | Faible                                                                                             |
| 4   | Bouton et geste retour                        | Écouteur `backButton` (Capacitor [lu]) ; nouvelles API de retour sur Android 16 (Android [lu])               | Aucun traitement : le retour quitte l'application depuis n'importe quel écran. Déjà dans la recette du build 64, sans comportement attendu écrit | **Notable / inconnu**                                                                | S à M                                                                                               | Moyen. Le plugin est une dépendance de plus : accord du parent                                     |
| 5   | Plancher de WebView et écran de repli         | `minWebViewVersion` + `server.errorPath` (Capacitor [paquet])                                                | Défauts (60, pas de page). Le code demande 93 pour tourner, 108 pour la mise en page                                                             | Mineur (appareils rares), mais échec muet                                            | S                                                                                                   | Faible                                                                                             |
| 6   | Plafond d'images par seconde                  | `fps.limit` (Phaser [paquet])                                                                                | Absent. Simulation à 30 pas par seconde, dessin à la cadence de l'écran                                                                          | **Inconnu** : sur un écran 120 Hz, probablement deux fois le dessin utile            | S                                                                                                   | Faible à moyen : vérifier le régulateur de résolution et le relevé `?perf=1`                       |
| 7   | Lots de dessin sur mobile                     | Un atlas partagé ; sur Android une texture par lot (Phaser [paquet], MDN [lu])                               | 104 à 131 appels par image avec le pipeline d'Android, contre 3 à 7 avec celui d'ordinateur                                                      | **Notable ; coût inconnu**                                                           | S pour comparer (`autoMobilePipeline: false` avec `?perf=1`) ; M pour un atlas commun des figurines | Moyen : touche `figurines.ts` ; pixels attendus identiques                                         |
| 8   | Formes redessinées à chaque image             | Cuire en texture ce qui ne change pas (Phaser [paquet])                                                      | 16 `Graphics` vidés par image ; 98,6 % des sommets ; jusqu'à 108 732 sommets (point 6 de la revue)                                               | **Notable ; coût inconnu**                                                           | M                                                                                                   | Moyen : quelques pixels changent                                                                   |
| 9   | Mémoire des textures                          | Compter largeur × hauteur × 4 ; ne garder que ce qui est dessiné (MDN [lu])                                  | 51 Mio avant le premier plateau, 79 avec les poses ; les planches de 512 px par figurine ne servent que de source à des figurines de 70 à 140 px | **Notable / inconnu** : mesurer le processus de rendu                                | M                                                                                                   | Moyen : netteté sur tablette et ordinateur, œil du parent                                          |
| 10  | Poids des images                              | Encodage avec perte quand il ne se voit pas                                                                  | 26 planches sans perte, 9,44 Mo (point 2 de la revue) ; 4,47 Mo à attendre avant le premier plateau du site ; 416 Ko d'icônes dès l'accueil      | **Notable** pour le site et la taille de l'APK ; nul pour la mémoire                 | S à M                                                                                               | Visuel : œil du parent                                                                             |
| 11  | Durée de vie de la sauvegarde                 | Stockage local tenu pour transitoire ; copie native ou sauvegarde du système (Capacitor [lu], Android [lu])  | `localStorage` seul ; `allowBackup="false"` ; export familial à la main                                                                          | **Notable** hors de l'appareil (choix fait) ; mineur sur l'appareil                  | M ; décision du parent                                                                              | Élevé : touche aux sauvegardes                                                                     |
| 12  | Écriture sûre                                 | Nouveau puis échange, copie précédente, somme de contrôle (`AtomicFile` [mémoire])                           | Un `setItem` par clé, relecture stricte, versions, copie du fichier refusé ; ni somme, ni copie précédente                                       | Mineur                                                                               | S à M                                                                                               | Moyen                                                                                              |
| 13  | Rendu WebView tué                             | `onRenderProcessGone` qui recrée le WebView (Android [lu])                                                   | Défaut de Capacitor : l'application tombe                                                                                                        | Mineur / **inconnu** (dépend de la mémoire, ligne 9)                                 | M (code natif)                                                                                      | Moyen                                                                                              |
| 14  | Phaser allégé                                 | Fichier sans Matter ou build sur mesure (Phaser [paquet], [résumé])                                          | Phaser complet, 1,48 Mo, 335 Ko gzip (point 3 de la revue)                                                                                       | Notable pour le site ; **inconnu** pour l'application (temps d'analyse)              | S (alias) à M (build sur mesure)                                                                    | Moyen : toutes les recettes et le téléphone                                                        |
| 15  | Compression du texte                          | Brotli [mémoire]                                                                                             | `.htaccess` : `mod_deflate` seulement. Phaser 337 Ko en gzip, 269 Ko en Brotli. Ce que sert l'hébergeur n'a pas pu être lu                       | Mineur / à vérifier                                                                  | S si l'hébergeur le permet                                                                          | Faible                                                                                             |
| 16  | Allocations dans la boucle                    | Ne rien allouer par image                                                                                    | `MissionAssets.ready` deux fois par image, plus quelques tableaux et clés                                                                        | Mineur / inconnu (pauses du ramasse-miettes)                                         | S                                                                                                   | Faible                                                                                             |
| 17  | Bruitages en un fichier                       | Audio sprite (MDN [lu])                                                                                      | 26 fichiers, 26 demandes sur le site                                                                                                             | Mineur (site seulement)                                                              | S à M                                                                                               | Faible                                                                                             |
| 18  | Musiques                                      | —                                                                                                            | 128 kbit/s, 6,83 Mo (34 % de l'application) ; la revue propose 96                                                                                | Mineur                                                                               | S                                                                                                   | À écouter                                                                                          |
| 19  | Attributs du contexte                         | Éviter `alpha:false`, stencil seulement si utile (MDN [lu])                                                  | Défauts de Phaser : `alpha:false`, stencil, anticrénelage                                                                                        | **Inconnu**                                                                          | S pour essayer                                                                                      | Visuel (bords des formes)                                                                          |
| 20  | Taille de police du système                   | Texte agrandi sans casse (WCAG 1.4.4 [mémoire])                                                              | Mise en page réglée à 780 × 360 ; effet d'une grande police système non essayé                                                                   | **Inconnu**                                                                          | S pour essayer                                                                                      | —                                                                                                  |
| 21  | Essai de perte de contexte                    | Gérer `webglcontextlost` (MDN [lu])                                                                          | Fonctionne ici [sans écran] ; aucune recette ne le tient                                                                                         | Mineur (test manquant)                                                               | S                                                                                                   | Nul                                                                                                |
| 22  | Site sur d'autres moteurs                     | —                                                                                                            | Chromium seulement (déjà noté par la revue)                                                                                                      | Mineur                                                                               | S à M                                                                                               | Nul                                                                                                |
| 23  | Rapport de pré-lancement, matrice d'appareils | Play [résumé]                                                                                                | Un émulateur Android 15 (build 62) ; S24 familial ; rapport de pré-lancement absent de la recette                                                | Notable pour la confiance, pas pour le code                                          | S                                                                                                   | Nul                                                                                                |
| 24  | Service worker                                | Facultatif [mémoire]                                                                                         | Aucun                                                                                                                                            | Aucun                                                                                | —                                                                                                   | —                                                                                                  |
| 25  | Textures compressées (ASTC, ETC2)             | Usage des jeux natifs (Android [résumé], Phaser [paquet])                                                    | Non utilisées                                                                                                                                    | Aucun : incompatible avec les figurines préparées sur canevas, qui lisent les pixels | —                                                                                                   | —                                                                                                  |

## Les dix écarts qui valent le plus d'être fermés

Classés par (effet pour l'enfant × confiance) / effort. Les six premiers sont petits ; les
points 5 à 9 commencent par une mesure sur le téléphone.

1. **Écran qui s'éteint pendant une vague** (ligne 1). Une ligne, effet immédiat. À confirmer
   d'abord : lancer une vague et ne plus toucher l'écran.
2. **Étiquettes flottantes** (ligne 2). Une étiquette fixe par mot : mêmes pixels, environ
   110 envois de texture par seconde en moins. C'est la piste déjà écrite au point 6 de la
   revue, maintenant chiffrée.
3. **`android:appCategory="game"` et le retour** (lignes 3 et 4). La première est une ligne.
   La seconde est d'abord une décision : que doit faire « retour » sur chaque écran ?
4. **Plancher de WebView et page de repli** (ligne 5). Deux réglages et une page statique.
5. **Plafond à 60 images par seconde** (ligne 6). Vérifier d'abord, avec `?perf=1`, à quelle
   cadence tourne le S24.
6. **Appels de dessin sur Android** (ligne 7). Comparer d'abord les deux pipelines sur le
   téléphone ; l'atlas commun ne vaut le coup que si la différence se voit.
7. **Images à ré-encoder** (ligne 10, point 2 de la revue). Le plus gros gain pour le site :
   environ −70 % sur les planches, mais seulement avec l'œil du parent.
8. **Formes redessinées** (ligne 8, point 6 de la revue). Ombres, marques de camp et barres de
   vie en images préparées. À faire après la mesure du téléphone.
9. **Mémoire des textures** (lignes 9 et 13). Mesurer le processus de rendu sur le téléphone
   (`adb shell dumpsys meminfo <pid>`) avant de choisir : cellules plus petites, ou planche
   libérée une fois les figurines préparées.
10. **Sauvegarde hors de l'appareil** (lignes 11 et 12). Décision du parent, pas un défaut :
    rester sur l'export à la main, ou ajouter une copie (stockage natif, ou sauvegarde
    automatique d'Android vers le Drive de la famille, à essayer avant d'y compter).

Hors des dix : Phaser allégé et Brotli (site surtout), recette de perte de contexte, essai avec
une grande police système.

## Ce que le projet fait déjà au niveau du standard ou au-dessus (à ne pas refaire)

- **Pas de temps fixe** (1/30 s, retard plafonné) et moteur indépendant du navigateur :
  `src/session.ts:82-98`. Parties de référence rejouées, sauvegardes forgées par milliers,
  recettes de mise à jour, de fermeture forcée et de doubles appuis dans la CI.
- **Résolution adaptée** : pixels réels de l'écran, plafond à 2 ×, baisse automatique quand
  l'appareil ne suit pas, mode « Effets légers » (`src/render/boardResolution.ts`). Plus fin
  que le plafond de `devicePixelRatio` habituel.
- **Terrain en cache** dans une `RenderTexture`, bornée par la taille maximale de texture de la
  carte (`boardResolution.ts:97-108`, `BattleScene.ts:230-244`).
- **Réserves d'objets** pour les figurines et les dessins ; aucune image ni texte créé par
  image.
- **Chargement au besoin** : seules les planches de la partie, poses d'attaque après coup et
  décodées hors du fil principal, panneau de reprise en cas d'échec.
- **Aucune image au-dessus de 2048 px.**
- **Son** : moteur propre, Phaser muet ; déblocage au geste ; pause en arrière-plan ; musique
  en flux, bruitages décodés ; voix plafonnées.
- **Cycle de vie** : pause à la mise en arrière-plan, reprise demandée à l'enfant ; perte de
  contexte restaurée (essayée ici).
- **Sauvegarde** : formats versionnés tous lisibles, relecture stricte et bornée, fichier
  illisible mis de côté, écriture refusée retentée, stockage illisible jamais écrasé, profils
  isolés, export familial vérifié à l'octet.
- **Site** : fichiers à empreinte en `immutable`, page en `no-cache`, politique de contenu
  stricte, compression du texte.
- **Découpe** : Phaser, règles, anglais, fenêtres rares et compteur de performance dans des
  paquets séparés ; budgets de taille tenus par la CI.
- **Android** : R8, cible 36, aucune permission, `SystemBars` pour les marges, écran de
  lancement par l'API `SplashScreen`.
- **Enfants et accessibilité** : mouvement réduit suivi (`BattleScene.ts:65, 250`), cibles de
  48 px contrôlées par recette, taille minimale du texte du plateau
  (`boardResolution.ts:38-51`), camps distingués par la forme et pas seulement la couleur
  (`actors.ts:458-468`), aucun lien externe dans l'application.
- **Outil de mesure** : `?perf=1` et `SERPENTS_PERF=1` existent déjà pour le téléphone.

## Ce que seul un téléphone peut dire

- Le coût des 104 à 131 appels de dessin, des 110 envois de texte par seconde et des 40 000 à
  109 000 sommets par image.
- La cadence réelle du WebView sur un écran 120 Hz, et la chauffe.
- La mémoire du processus de rendu avec 51 à 79 Mio de textures, et s'il est tué sur un
  appareil de 3 à 4 Go.
- Le temps de démarrage (analyse des 1,48 Mo de Phaser, polices, contexte graphique).
- L'extinction de l'écran pendant une vague ; le geste retour sur Android 16 ; la rotation sur
  une tablette Android 16 ; une grande police système.
- Le délai d'écriture du stockage sur disque quand l'application est tuée.
- `navigator.wakeLock` dans le WebView.
