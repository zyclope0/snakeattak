# Pour la contre-analyse Claude — interface et direction artistique

L’application est **La Conquête des Serpents / Snake Attack TD**, un jeu familial créé à partir du concept d’un enfant. La v0.36.2 est fusionnée et publiée ; code fonctionnel `28e958e29ef86b8442c875ce6a96b0707ec0425d`, clôture de publication `336410e5182804211f5c69e678c157e4c3d54de8`. [Site](https://conquete-serpents-famille.zyclope.chatgpt.site/).

Le parent a choisi **audit et propositions avant modification**. Cette mission de contre-analyse ne demande ni code, ni génération payante, ni nouvelle mécanique. Lis AGENTS.md, GAME_DESIGN.md (direction artistique), docs/ARCHITECTURE.md, puis docs/AUDIT-VISUEL-MOBILE-2026-11-10.md et les preuves jointes. Le moteur est Phaser 3 / TypeScript, l’interface en HTML/CSS, Android via Capacitor. Règles, rendu et interface sont séparés.

## Ce que je te demande de challenger

1. **La priorité donnée au carnet et à l’accueil.** Vérifie les mesures sur la version actuelle ; distingue quantité de contenu, hauteur réellement visible, occlusion, défilement local/document et accessibilité des commandes. Les neuf contrôles de portraits ont retiré une fausse suspicion de portrait absent.
2. **L’approche A recommandée.** Un accueil compact, une action principale, des vues courtes, collection par mission, gestion des noms secondaire, préparation et départ fixe. Est-ce réellement plus clair pour un enfant, ou déplace-t-on seulement la complexité ? Compare avec l’approche B centrée sur le plateau, sans supposer l’une validée.
3. **La qualité des références.** Douze jeux grand public et cinq TD ont été documentés, mais certaines captures sont anciennes, promotionnelles, PC ou TV. Aucun jeu de référence n’a été installé ni manipulé. Ne transforme pas une capture fixe en preuve d’absence de scroll ou de nombre d’actions. Signale les références trop faibles et apporte des preuves plus récentes si tu en trouves.
4. **La cohérence de matière.** L’icône Magnific pâte à modeler/papier mâché fait foi. Vérifie quels personnages sont déjà cohérents, lesquels demandent vraiment une retouche, et si les cadres/sols proposés gardent la lisibilité. Les terrains crue/marais sont déjà employés aux bordures depuis 0.34 ; leur présence n’implique pas un nouveau lieu ou de nouvelles règles.
5. **Le recours aux générateurs.** Aucun rendu nouveau n’a été produit : deux préflights gratuits et des catalogues ont été consultés. Les crédits Magnific/Higgsfield sont de monnaies différentes ; Runway n’expose pas de prix par appel dans les outils consultés. Ne présente pas ces estimations partielles comme budget de production ni facture. Évalue l’intérêt d’un seul petit comparatif de style avant toute régénération étendue.

## Garde-fous

- Trois voies interconnectées, soldats autonomes, bébés dragons et dinosaures alliés ; ennemis majoritairement serpents. Aucun ordre manuel au héros, nouvelle tour, unité, mode, pouvoir ou progression.
- Règles, prix, révisions historiques, RNG et sauvegardes conservés. Les noms **et annonces** choisis par l’enfant restent exactement en français, même en interface anglaise.
- Carnets personnels séparés, campagne et étoiles familiales partagées. La refonte ne crée pas de nouveaux profils de combat.
- Contour rouge-orangé ennemi et vert foncé allié ; géométrie jouable, ponts et collisions conservés. La caméra du portrait iconique ne doit pas remplacer la vue haute du terrain.
- Pas de changement de monétisation, serveur ou SDK. Images des autres jeux utilisées seulement pour analyse, jamais comme assets à intégrer.
- Aucun test physique S24, résultat humain enfant ou certification exhaustive d’accessibilité/performance n’est démontré par les captures cloud.

## Réponse attendue

Un tableau « constat / confirmé ou contesté / preuve / importance réelle », les angles morts, puis une recommandation d’approche et un ordre de petits lots. Sépare défaut technique, inconfort mesuré, préférence esthétique et hypothèse non vérifiée. Cite version, plateforme et date quand elles sont connues ; garde les inconnues visibles. Le but est d’améliorer le jugement et le plan, sans changer le jeu pendant cette contre-analyse.
