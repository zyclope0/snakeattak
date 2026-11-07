# Aventure plus vivante — 0.19

Le parent valide le conseil du 4 novembre et demande une réalisation autonome,
avec un conseil de cinq personas après chaque étape. Cela autorise les choix
ordinaires, les corrections et la publication du jeu ; aucun nouvel accord
intermédiaire n'est nécessaire.

## Intention et limites

Donner envie de rejouer les douze vagues actuelles : ouvrir facilement le jeu,
comprendre les pouvoirs pendant la mêlée, distinguer les trois chapitres.
Préserver la DA forestière, les personnages des enfants, les trois voies liées,
les soldats autonomes, les œufs aléatoires et la mort définitive en combat.
Conserver exactement les réactions de mort de 2/3 PV et le poison à impact unique.
Aucune dépendance supplémentaire, serveur de gameplay ou service payant requis.
Les tests de navigateur mobile ne remplacent pas un essai physique ou les enfants.

## Approche retenue

Renforcer le contenu existant avant d'allonger la campagne, conformément au conseil
validé. Une extension de campagne diluerait la validation ; une nouvelle refonte
graphique coûterait davantage sans résoudre la compréhension des décisions.

1. Accès : publier un build statique HTTPS privé via Sites, sans changer son
   audience. Il utilise la sauvegarde locale de sa propre origine. Garder un
   export portable et expliquer que la sauvegarde du ZIP ne migre pas toute seule.
   Aucun essai physique ne peut être annoncé sans appareil disponible.
2. Lisibilité : signes dérivés de l'état réel pour les œufs proches d'éclore,
   la confusion, l'encouragement et le crachat annoncé du roi. Texte et forme
   complètent les couleurs. Respecter pause et mouvements réduits, borner les
   objets visuels, ne pas ajouter de RNG ni modifier le combat pour un effet.
3. Identité : préparer des vagues plus caractérisées avec les ennemis existants,
   à budgets de monstres, de vie, de récompenses et d'œufs inchangés. Modifier
   seulement composition et cadence annoncées ; introductions progressives
   inchangées, une seule sonnette par vague. Comparer avant/après à graines
   appariées, puis valider séparément sur de nouvelles graines sans retouche.

## Architecture

La logique de signaux reste pure et testable hors navigateur ; le rendu Phaser
consomme ce modèle. Les règles de composition et cadence restent dans waves.ts.
L'orchestration UI/main reste distincte des règles. La copie de déploiement
statique est dans /workspace/sites/conquete-serpents ; l'identité opaque du Site
y est conservée dans .openai/hosting.json, aucune clé dans les fichiers.

## Conseil après chaque étape

Cinq regards explicitement simulés : game designer, équilibrage, interface/DA,
développement/mobile, projection joueur 8–10 ans. Un agent de revue lit les
preuves, formule objections et verdict ; aucune expérience de vrai enfant n'est
inventée. Corriger les défauts importants avant de poursuivre. Conserver le
journal dans docs/CONSEIL-0.19.md et les preuves dans reports/.
