# Icône Android — création Magnific retenue

Original immuable : docs/resources-2026-11/assets/icone-source.png. Son SHA256 et
les sorties sont dans manifest.json ; foreground-source.png et icon-512.png sont
des dérivés pour l'export, pas une nouvelle illustration. Aucun appel distant,
aucune génération payante, aucun changement du personnage ou du titre.

Le détourage local conserve les pixels des personnages et enlève l'ancien fond,
avec un léger antialiasing des contours. Couche de fond Android unie #214C3B ;
canvas adaptatif108dp, illustration72dp centrée à18dp. Les masques de lanceur
restent appliqués par Android. Les deux visages et la pointe de l'épée restent
dans le disque central de66dp ; le bas du socle/serpent peut être recadré.

Exports : mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi ; icônes legacy48–192px, premier plan
108–432px ; couches monochromes pour les thèmes Android13+, XML v26 et v33.
Les anciens vecteurs Capacitor inutilisés ont été retirés. Les écrans de démarrage
restent distincts de l'icône et ne sont pas retouchés dans cette étape.

Reproduction hors du build du jeu, dans un environnement Python local isolé :

```sh
python3 -m venv --system-site-packages /chemin/outil-icone
/chemin/outil-icone/bin/pip install opencv-python-headless==4.12.0.88 numpy==2.2.6
/chemin/outil-icone/bin/python scripts/export-android-icon.py --write
```

Pillow12.3.0 était disponible dans l'environnement utilisé. Les versions et
empreintes permettent de repérer les différences d'un autre outil. OpenCV et
NumPy ne sont pas des dépendances du jeu, du build web ou de l'APK. Les ressources
exportées sont suivies dans Git ; une compilation normale ne lance pas cet outil.
