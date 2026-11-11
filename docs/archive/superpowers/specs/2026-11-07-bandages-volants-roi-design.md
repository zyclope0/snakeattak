# 0.22 — bandages, volants et garde du roi

Le parent transmet trois demandes du fils et délègue difficulté/équilibrage. Il a
autorisé les évolutions autonomes et les conseils. Aucun nouvel accord demandé
pour les choix réversibles ; l'esprit et les personnages restent la contrainte.

## Expérience et choix

Bandages plutôt que mana : vocabulaire du créateur, stock visible et retour réel
au fort. Médecin6soins, infirmier4 ; cadence initiale1.6s/1.4s, recharge 4 s sur
place, valeurs à confirmer par simulation. PV soignés24/14 inchangés. Aucun soin
lors du retour/rechargement, aucune résurrection ; un stock partiel reste partiel
entre vagues et après sauvegarde. Pas de remise à plein à l'ouverture du menu.

Volants dès le rang 6 (classique vague 6, expédition lorsque son rang atteint 6),
progressivement1puis2. Survolent la mêlée et les murs, suivent les trois voies,
contrés par archers, dragons et tanks. Le catalogue et le briefing expliquent ces
contres avant le départ. HP/vitesse ajustables, pas de poison dans le temps.
Ailes, hauteur et ombre les différencient, même avec les mouvements réduits.

Le roi final conserve trois phases de protection finies. Il arrive avec deux
serpents gardes cuirassés et un soigneur, à la place des trois derniers serpents
ordinaires de la vague. Une tête gardienne dispose50%desPV et mord, une cracheuse
20% n'attaque qu'à distance, une mixte30% peut mordre ou cracher. Les dégâts
attaquent automatiquement les têtes selon la portée de l'allié : mêlée vers la
gardienne, projectiles vers la cracheuse, puis report sur les vivantes. Aucun
ordre manuel de ciblage. Une tête tombée cesse d'agir, jamais ressuscitée par
le soigneur. Le soigneur ennemi a aussi un stock fini et ne renouvelle pas les
protections. Garde rapprochée et rôle sont visibles. Le roi qui atteint le
cristal provoque toujours la défaite.

## Architecture et contrats

- healing.ts pur : MedicalState {bandages:number,phase:'ready'|'returning'|'restocking',remaining:number};
  ensureMedical, medicalRules(kind), consumeBandage, tickMedical(state,dt,atBase),
  readMedical(raw,kind). Entity.medical? ; Game marche au fort par A*.
- flying.ts pur : canHitFlying(kind), flyingVariant(base,rank,index), isFlying.
  EnemyKind ajoute flying et courtHealer. Les variantes aériennes remplacent
  quelques emplacements, sans augmenter le nombre d'ennemis. missionWave garde
  la configuration reproductible et utilise aussi cette sélection.
- boss.ts : BossHeadId='guard'|'ranged'|'hybrid', BossState.heads? trois états
  hp/maxHp/cool ; helpers de dégâts/soin ne réactivant jamais les têtes mortes.
  Extension sous tacticalRulesEnabled. Coups/shots dérivés de l'état réel.
- bossCourt.ts : définition de trois escortes et soigneur à charges finies ;
  Entity.court? {bossId:number,role:'guard'|'healer',charges:number,cool:number}.
- balanceTuning.ts : tacticalRulesEnabled true par défaut, false pour LEGACY
  témoin uniquement ; pas de commutateur supplémentaire présenté aux enfants.
- Game reste autoritaire ; nouvelles règles pures séparées, rendu sans combat.
- Checkpoint v6 pour classique et mission, porte medical et restock ; lit1–5.
  Les anciens soignants reçoivent leur premier stock à la migration. Stock futur
  invalide refusé sans effacer l'ancien camp. Enveloppe familialev2inchangée.

## Vérification et livraison

Tests RED/GREEN : épuisement, rythme, pause, retour au fort, recharge, sauvegarde,
aérien/cibles/contre/rang, escorte sans double apparition, mort/soin des têtes,
protections finies et absence d'impasse. Simulations appariées au témoin0.21 sur
classique et missions, plusieurs politiques et graines ; cohorte indépendante
après réglage. Pas de victoire garantie à des bots qui ignorent les volants.
Contrôles web/portable, mobile simulé, import et anciens formats, rendu et sync
Android. Pas d'APK natif prétendu. Publication sur Site privé existant et archives
vérifiées, conseil et limites des simulations fournis.
