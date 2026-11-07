# SDD ledger — plan: docs/superpowers/plans/2026-11-07-cartes-et-codes.md

Ruling: Le Go approuve les deux objectifs proposés et la version visible; pas encore de conteur, draft ou nouveaux serpents.
Ruling: Deux fonds supplémentaires générés pour conserver bosquet ambré et jardin de pierres, en réutilisant les acteurs et props existants.
Ruling: Codes classiques supportés avec initialSeed optionnel v6; ancien camp classique sans ce renseignement n’a pas de faux code. Les codes transportent un départ, jamais une armée ou des blessures.
Pre-flight: UI consomme codec et actions de lancement existantes; rendu consomme le Level existant et une graine visuelle, sans modifier les collisions.

Task 1: codec et métadonnée — 7 tests ciblés verts sur 432 cas (108 configurations ×4 graines), corruption et version, persistance des camps.
Task 2: cartes généralisées — six identités de terrain testées, 3 ambiances inspectées; Canvas, restauration GPU et pose tactile verts.
Task 3: interface — parcours navigateur classique/mission, verrouillage, annulation, copie et rechargement verts. Version visible 0.25.0.
Final review: /root/review_cards_codes_025 — un défaut important : initialSeed énumérable modifiait le témoin historique. Corrigé avec métadonnée privée/accessor, digest original inchangé, 25 tests ciblés GREEN après le RED complet.
Final: minor (deferred) — rejet presse-papiers tardif après fermeture/changement d’aperçu peut déplacer le focus; aucun état du jeu modifié.

Task 4: complete — 362 tests, 17 contrôles incluant web/portable/codes/missions/présentation/soins/tactile/Canvas/GPU, 27 fichiers Android identiques.
Ruling: Le site est maintenant public d’après get_site; publication via save_site_version + deploy_site_version, audience existante conservée.
Validation sur téléphone réel toujours non revendiquée. Prix graphique du lot : 130 crédits Magnific.

Publication réussie : 840b4bd7f4ea365ec44d62bf0dc9eb9e536c2041, version Sites 8, URL existante conservée.
