# Préflight de fusion PR2 — 9 novembre 2026

Autorisation explicite du parent : « Tu peux fusionner ». Branche
`feat/tactical-english-035`, base `main`, PR2. L'autorisation de fusion ne
supprime pas la vérification des contrôles.

Les deux exécutions du commit `59a9b38` échouent à la même assertion dans
`scripts/offline-033-browser.mjs:63` : le texte visible du body ne contient pas
encore la version. Les étapes précédentes, dont verify, navigateur, menaces,
défilement, enfant et interruptions, réussissent. Exécutions concernées :
[PR](https://github.com/zyclope0/snakeattak/actions/runs/42631338257),
[push](https://github.com/zyclope0/snakeattak/actions/runs/42631321795).

Reproduction locale du même échec avant correction. La page possède un template
initial masqué ; la langue charge ensuite le bootstrap de manière asynchrone.
L'assertion lisait ce template avant que le vrai accueil soit visible.
Correction : attendre `#home-screen` visible, puis conserver les assertions
hors-ligne/version et tous les parcours existants. Aucun délai arbitraire,
contrôle supprimé ou code de production modifié.

Après correction : dix contrôles hors ligne verts, schémas 1–7 restaurés et
chapitres suivants chargés depuis le paquet ; zéro erreur ou fichier manquant.
La suite verify compte 458 tests verts. Les 34 fichiers du build normal ont les mêmes
empreintes que le build publié et l'APK ; aucune republication nécessaire.
[Preuves](../reports/suivi-0.35.0/merge/preflight.json),
[rouge](../reports/suivi-0.35.0/merge/merge-035-offline-baseline.log),
[vert](../reports/suivi-0.35.0/merge/merge-035-offline-green.log).

La relance complète des contrôles GitHub conditionne la fusion. L'état effectif
et le SHA fusionné sont conservés par la
[PR2](https://github.com/zyclope0/snakeattak/pull/2).
Le worktree principal qui contient d'autres modifications locales est préservé.
