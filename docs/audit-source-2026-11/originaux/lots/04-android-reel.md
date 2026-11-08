# Lot 4 — Test sur un vrai téléphone Android (≈ 5 h)

Objectif : savoir si le jeu est fluide sur l'appareil de la famille. Aucun APK n'a encore été construit,
et les mesures du cloud (GPU logiciel, 17 à 20 images/s) ne disent rien d'un téléphone.

## Tâches

1. Lister les étapes Windows : Node 24, Android Studio, `npm run android:sync`, build de l'APK debug,
   installation par USB (voir `docs/ANDROID.md`).
2. Ajouter un compteur d'images/s et de mémoire visible seulement avec `?perf=1` ou en build debug
   (réutiliser `src/render/devPerformance.ts`).
3. Le parent joue la mission 6 et la vague 12 classique ; analyser ses relevés : images/s médianes
   et minimales, temps de chargement, mémoire.

## Critères

- Rapport `reports/android-device.json` avec modèle du téléphone, version d'Android et mesures.
- Si moins de 30 images/s en vague chargée : proposer les 3 corrections les plus rentables, mesurées.
