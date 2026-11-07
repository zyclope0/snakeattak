# Instructions Codex — La Conquête des Serpents

## Mission

Faire évoluer le prototype HTML V4 en jeu 2D Phaser 3 + TypeScript + Vite, simple à publier, jouable sur ordinateur et tablette. Le projet vient d'un jeu papier inventé par un enfant. Préserver ses règles, son ton ludique et son contrôle créatif.

## Source de vérité

- `public/prototype-v4.html` : prototype jouable existant (ne pas le supprimer).
- `public/references/dessin-original.jpg` : dessin de l'enfant.
- `public/references/maquette-deux-zones.png` et `maquette-graphique.png` : inspirations visuelles, pas des captures de gameplay.
- `GAME_DESIGN.md` : règles confirmées et idées non confirmées.

## Règles confirmées

- Deux zones : antre des monstres à gauche, défense du joueur à droite.
- Vagues de serpents; vagues parfois plus nombreuses, parfois plus puissantes; progression douce.
- Les ennemis peuvent tuer les soldats; aucune résurrection.
- Soldats 100 % autonomes, aucun ordre manuel de déplacement; pathfinding pour éviter les obstacles.
- Le joueur achète des unités et des défenses avec des récompenses gagnées en combattant.
- Départ : deux combattants à massue en bois; héros avec épée et bouclier.
- Unités évoquées : ninjas, infirmiers, médecins, combattants à batte, chevaux/cavaliers, chevaliers à deux têtes, bébés dragons, tanks, petits dinosaures. Pas de licornes.
- Œufs présents qui éclosent aléatoirement et ajoutent des monstres ; boss final.
- Au moins trois voies interconnectées ; les monstres privilégient progressivement les voies moins défendues.

## Priorités d'implémentation

1. Auditer V4 et dresser la liste des mécaniques fonctionnelles et des bugs.
2. Migrer progressivement le gameplay dans `src/` avec scènes, entités, économie, vagues, HUD et tests.
3. IA locale déterministe (FSM : rechercher cible, approcher, attaquer, soigner, se repositionner), A* sur grille et évitement simple entre unités; prévoir cache de chemins pour la performance.
4. Ninjas nettement plus mobiles; médecins priorisent alliés blessés; soldats autonomes sans clic de déplacement.
5. Courbe de difficulté lissée, récompenses légèrement plus généreuses; équilibrage configurable dans un fichier de données.
6. Améliorer le style 2D/2.5D et les animations, avec licence claire pour chaque asset.
7. Support tactile et publication statique (GitHub Pages ou itch.io).

## MCP et outils visuels

Avant de choisir un générateur graphique, demander à l'utilisateur la sortie de `codex mcp list` (sans secrets), identifier les capacités réelles et tester une génération minimale. Ne pas présumer qu'un MCP est disponible. Ne jamais exposer de clés ou tokens dans le dépôt.

## Qualité

- `npm run build` doit réussir avant chaque livraison.
- Ne pas casser le prototype V4; migrer fonction par fonction et comparer le comportement.
- Pas de serveur ni d'API payante nécessaire au gameplay.
- Expliquer clairement ce qui est implémenté et ce qui reste une maquette.
- Ne pas transformer le jeu en FPS, en jeu de rôle ou en 3D complexe sans accord.

## Architecture

- Lire docs/ARCHITECTURE.md. Préserver le moteur indépendant du navigateur et du réseau.
- src/main.ts assemble les composants ; les règles restent dans game.ts, pas dans le rendu ou le HTML.
- Build web normal dans dist/ ; export autonome optionnel dans dist-portable/. Ne pas réintégrer les images et le moteur dans le HTML web normal.
- npm run verify et npm run test:browser avant livraison. Ne pas ajouter de serveur sans fonction qui en a besoin.
