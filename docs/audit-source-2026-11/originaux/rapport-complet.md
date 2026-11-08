# Audit Serpent Defender

Nov 7, 2026 · @Yannick

## Résumé : les 5 décisions qui comptent

La v0.26 a corrigé 6 des 7 défauts relevés en v0.25 et allégé le chargement, et le code est sain (364 tests verts). Ce qui reste à trancher :

1. **Corriger l'affichage avant tout (lot 1, ≈ 6 h).** Sur ordinateur, le plateau s'ouvre décalé et ne tient pas sur un portable ; sur téléphone, les boutons font 36 px au lieu de 48.
2. **Rendre le jeu jouable sans lire (lots 2 et 7).** Viser 8 mots à l'écran au lieu de 310, des icônes, un système nouveau par mission, et une mission 1 sur une seule voie, à valider avec ton fils.
3. **Tester sur un vrai téléphone Android en semaine 2 (lot 4).** Cela n'a jamais été fait, et les mesures du cloud ne disent rien de la fluidité réelle.
4. **Monétiser par un seul achat de déblocage à 3,99 € / 4 CHF (lot 8).** Pas de pub, pas de collecte, pas d'objet aléatoire : compatible avec la politique Familles et un PEGI bas. Attente réaliste : rembourser les frais.
5. **Viser une sortie fin décembre.** Compte Google Play dès la semaine 1, test fermé avec 12 testeurs pendant 14 jours dès le 14 décembre, traduction EN, DE, IT pendant le test.

## État des lieux du code (v0.26.0)

Le code est solide : les règles sont séparées du rendu, les 364 tests passent et les sauvegardes se relisent depuis la v1. Trois points freinent une publication : aucune traduction n'est possible en l'état, le fichier de règles fait 1 201 lignes, et l'app Android n'a jamais tourné sur un vrai téléphone.

| Domaine | Constat | Preuve |
| --- | --- | --- |
| Architecture | Règles en TypeScript pur (35 fichiers), rendu Phaser (29 fichiers dans `src/render`), interface HTML/CSS (20 fichiers dans `src/ui`) | arborescence `src/` |
| Tests | 364 tests unitaires, tous verts ; la CI GitHub lance format, tests, audit npm et tests navigateur | relancé ici avec `node --test` ; `.github/workflows/check.yml` |
| Aléatoire | Graine tirée par Web Crypto, 0 `Math.random` dans `src/` | recherche dans le code |
| Sauvegardes | 3 clés `localStorage` (camp, progression, famille) ; formats v1 à v6 relus ; export en fichier | `src/checkpoints.ts:9`, `src/progression.ts:13`, `src/familyPersistence.ts:8` |
| Assets | 8 planches 1024×1024 et 4 fonds 1600×900 en WebP ; chargement par mission depuis la v0.26 ; build total 9,9 Mo | build `vite` |
| Moteur | Phaser complet : 1,48 Mo (340 Ko compressé), le plus gros fichier du build | sortie de `vite build` |
| Android | Capacitor 8.6, minSdk 24, targetSdk 36, paysage verrouillé, versionCode 26 ; identifiant `com.conqueteserpents.famille` marqué « provisoire » ; aucun APK construit ni testé | `android/variables.gradle`, `AndroidManifest.xml`, `docs/ANDROID.md` |
| Vie privée | Aucun appel réseau, aucune mesure d'audience ; CSP `script-src 'self'` | recherche `fetch`/`analytics` : 0 résultat ; `dist/_headers` |
| Textes | Tout est en français écrit en dur : `index.html` (`lang="fr"`) et environ 285 chaînes dans 40 fichiers TS ; aucun système de traduction | recherche dans le code |
| Dette | `game.ts` fait 1 201 lignes ; 49 documents dans `docs/` ; `legacy/` et `prototype-v4.html` sont publiés dans `dist/` | `wc -l`, `ls dist` |
| Provenance des images | Recraft V4 Pro via Magnific : 11 générations, 2 389 crédits, chaque fichier tracé | `public/asset-provenance.md` |

Ce qui compte pour la suite : la traduction en DE, IT et EN demande d'abord de sortir les textes dans des fichiers de langue. C'est le plus gros chantier technique avant une publication en Europe.

## Test réel du jeu

Les sept défauts de la v0.25 sont corrigés, sauf le chargement, seulement amélioré ; les détourages bleus signalés plus tôt restent. Le test fait aussi apparaître deux problèmes sur ordinateur : le plateau s'ouvre décalé et ne tient pas en entier sur un portable courant.

Conditions : la v0.26.0 du zip, compilée ici et pilotée par script dans Chromium. Le site public est encore en v0.25 (non republié, d'après `LIRE-MOI-ZIP.txt`). J'ai joué la mission 1 en entier (3 vagues, victoire), lancé l'aventure classique et testé 1280×800, 1366×768, 1920×1080, 812×375 et 375×812. Aucune erreur JavaScript pendant ces parcours.

### Constats de la v0.25 revérifiés

| Constat v0.25 | État en v0.26 | Preuve |
| --- | --- | --- |
| Double écran de pause | Corrigé : seul « En pause » s'affiche | capture en pause, 1920×1080 |
| Serpents peu visibles | Corrigé : contour orange épais, repérables même sur téléphone | capture en vague, 812×375 |
| Carrés d'herbe entre les ponts | Corrigé : ruisseau continu sous les trois ponts | même capture |
| Plateau trop petit en paysage | Corrigé : 587×331 px, soit 88 % de la hauteur et 72 % de la largeur | mesure à 812×375 |
| Portrait non géré | Corrigé : « Tourne ton téléphone » couvre tout l'écran, accueil compris | 375×812 |
| Tout chargé au démarrage | Amélioré : 3,1 Mo avant l'accueil, 6,7 Mo au début du combat, contre 8,7 Mo d'un bloc avant | octets mesurés par le navigateur |
| Nouveau tirage sur le même terrain | Corrigé : 0 répétition sur 10 tirages | dialogue de préparation |

### Nouveaux constats

| # | Constat | Preuve | Gravité |
| --- | --- | --- | --- |
| 1 | Sur ordinateur, lancer une mission garde le défilement de l'accueil : le HUD et le haut du plateau sont hors écran | défilement après lancement : 422 px (1280×800), 503 px (1366×768), 365 px (1920×1080) | Forte |
| 2 | Même en haut de page, le plateau ne tient pas sur un portable courant : 320 px d'interface au-dessus | 480 px visibles sur 514 (1280×800), 448 sur 563 (1366×768) | Forte |
| 3 | L'enfant lit beaucoup avant de jouer | 352 mots sur l'accueil, 310 sur l'écran de combat avant la 1re vague ; le code « REFUGE-1-FW90-720A-96 » ouvre la préparation | Forte pour 6–7 ans |
| 4 | Le bouton « Déployer » est sous le pli du dialogue de préparation | capture à 1280×800 | Moyenne |
| 5 | La mission 1 se gagne avec 3 étoiles et le cristal à 100 % sans décision : alliés posés aux emplacements suggérés | vagues de 11 à 15 s en ×2, 3 vagues | Moyenne |
| 6 | Les détourages bleu pâle restent derrière les grottes et à droite du refuge | captures 812×375 et 1280×800 | Moyenne |
| 7 | Boutons du HUD sur téléphone trop petits : Pause, Vitesse, Accueil, Renforts et Lancer font 36×36 px | mesure à 812×375 | Moyenne |
| 8 | Le texte de fin d'une mission de 3 vagues dit : « Ton armée et ses pièges ont tenu les douze vagues » | écran de victoire, mission 1 | Faible |
| 9 | Un cadre vide s'affiche à côté du titre du tiroir des renforts | capture du tiroir, 812×375 | Faible |
| 10 | 4 textes de l'accueil sont sous le contraste WCAG AA, dont un à 2,09:1 (titre de la carte des chapitres) | axe-core 4.10 | Faible |

### Mesures

| Mesure | Valeur | Remarque |
| --- | --- | --- |
| Poids téléchargé avant l'accueil | 3,1 Mo |  |
| Poids au début du combat | 6,7 Mo | mission 1 |
| Temps avant de jouer | 0,7 s (accueil) + 2,1 s (chargement de la mission) | serveur local : sous-estime un réseau mobile |
| Images/s pendant une vague | 17 à 20 | GPU logiciel dans le cloud, sans valeur pour un téléphone : à mesurer sur l'appareil |
| Plateau à 812×375 | 587×331 px |  |
| Taille d'un allié à l'écran | ≈ 38 px sur téléphone, ≈ 60 px à 1280×800 | 72 px de jeu (`actorLayout.ts:21`) × échelle du plateau |
| Cibles tactiles sous 48 px | 5 sur 5 dans le HUD paysage, 10 sur 25 avec le tiroir ouvert |  |

**Un enfant de 6 ans qui lit mal peut-il jouer seul ?** Il peut lancer une vague et gagner la mission 1, car les alliés se battent tout seuls. En revanche, il ne peut pas comprendre seul le miel tactique, l'entraînement du héros, les favoris, les équipes ni les codes de départ : tout passe par du texte. Sur ordinateur, il risque même de ne pas voir le haut du plateau.

### Captures

Ordinateur 1280×800, juste après le lancement de la mission 1 : le HUD et le haut du plateau sont hors écran (constat 1).

&#91;image: Plateau décalé à 1280×800 après le lancement d'une mission\]

Téléphone paysage 812×375 pendant la vague 1 : plateau pleine hauteur, serpents cerclés d'orange, ruisseau ; halos bleus derrière les grottes et le refuge.

&#91;image: Vague 1 en paysage téléphone, v0.26.0\]

Tiroir des renforts ouvert : il couvre la zone de pose, et un cadre vide apparaît à côté du titre (constat 9).

&#91;image: Tiroir des renforts en paysage téléphone\]

## Benchmark

Les jeux qui marchent auprès des 6–10 ans commencent très simple, écrivent très peu et ne vendent pas d'objets aléatoires. Le jeu le plus proche du tien, Plants vs. Zombies, ouvre sur une seule voie et une seule plante. Depuis juin 2026, les objets aléatoires payants valent un PEGI 16.

Choix : 4 tower defense qui ont réussi (Kingdom Rush, Bloons TD 6, Plants vs. Zombies 1 et 2) et 3 jeux qui ont réussi auprès des 6–10 ans en Europe (Toca Boca World, Pok Pok, Minecraft). Notes et prix relevés le 7 novembre 2026 sur les stores suisses ; PEGI lu sur les fiches Google Play (pegi.info a refusé l'accès).

| Jeu | Modèle et prix | PEGI | Note Google Play (avis) | Premier niveau | Ce qu'on en retient |
| --- | --- | --- | --- | --- | --- |
| [Kingdom Rush](https://play.google.com/store/apps/details?id=com.ironhidegames.android.kingdomrush&hl=fr&gl=CH) | Gratuit, achats intégrés (3 à 9 CHF) et pub | 7 | 4,8 (854 k) | Un chemin, 4 tours, 3 gobelins ; deux chemins seulement au niveau 3 ([Game Developer](https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design)) | Emplacements fixes ; icônes des ennemis à l'entrée ; appel anticipé de la vague contre de l'or |
| [Bloons TD 6](https://play.google.com/store/apps/details?id=com.ninjakiwi.bloonstd6&hl=fr&gl=CH) | Payant 6,60 CHF, achats intégrés, sans pub | 16 (objets aléatoires) | 4,8 (402 k) | Tutoriel guidé : 2 tours, une manche, une amélioration ([wiki](https://bloons.fandom.com/wiki/Bloons_TD_6)) | Mode Facile qui combine plusieurs leviers ; ×3 à tout moment ; « prix juste, jamais de pub » dans les avis |
| [Plants vs. Zombies](https://play.google.com/store/apps/details?id=com.ea.game.pvzfree_row&hl=fr&gl=CH) | Aujourd'hui gratuit avec pub (achat d'origine) | 7 | 3,2 (5,7 M) | 1 voie, 1 plante ; ennemis après 2 poses ([wiki](https://plantsvszombies.fandom.com/wiki/Level_1-1)) | 8 mots à l'écran au plus ; aides seulement en cas d'erreur ; argent introduit après 10 niveaux ([GDC 2012](https://gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan)) |
| [Plants vs. Zombies 2](https://play.google.com/store/apps/details?id=com.ea.game.pvz2_row&hl=fr&gl=CH) | Gratuit, pub et achats intégrés | 16 (objets aléatoires) | 3,4 (7,41 M) | 1 voie, puis 3 voies | Contre-modèle : avis dominés par la pub et la progression perdue |
| [Toca Boca World](https://play.google.com/store/apps/details?id=com.tocaboca.tocalifeworld&hl=fr&gl=CH) | Gratuit, achats intégrés à prix fixe, pas de pub tierce | 3 | 4,4 (6,87 M) | Pas de texte : « no language and no text » ([Gulf News](https://gulfnews.com/technology/consumer-electronics/toca-boca-glory-game-apps-children-love-even-though-they-cant-win-1.1328450)) | Badge « Teacher Approved » ; recommandé 6–8 ans sur l'App Store |
| [Pok Pok](https://play.google.com/store/apps/details?id=com.playpokpok.pokpok&hl=fr&gl=CH) | Abonnement 7,50 à 12 CHF/mois ou 80 CHF à vie | 3 | 5,0 (8,87 k) | Jeu libre, sans règles | Zone adultes protégée ; pas d'allemand ni d'italien, reproché dans les avis |
| [Minecraft](https://play.google.com/store/apps/details?id=com.mojang.minecraftpe&hl=fr&gl=CH) | Achat 7 CHF, plus achats intégrés | 7 | 4,5 (5,88 M) | Pas de tutoriel intégré | Difficulté changeable à tout moment, mode Paisible sans monstres ([wiki](https://minecraft.wiki/w/Difficulty)) ; jeu préféré des 6–13 ans en Allemagne ([Statista, KIM 2024](https://de.statista.com/statistik/daten/studie/259701/umfrage/beliebteste-computerspiele-von-kindern-in-deutschland)) |

### Enseignements pour ton jeu

1. **Commencer sur une seule voie (Plants vs. Zombies, Kingdom Rush).** Le premier niveau de PvZ a 1 voie et 1 plante ; Kingdom Rush attend le niveau 3 pour un 2e chemin. Ta mission 1 ouvre directement 3 voies, 3 antres et tous les panneaux.
2. **8 mots à l'écran au plus, aides seulement en cas d'erreur (PvZ, GDC 2012).** L'écran de combat de ta mission 1 en affiche 310. Toca Boca va plus loin : pas de texte du tout.
3. **Montrer ce qui arrive à l'entrée de chaque chemin (Kingdom Rush).** Une icône du prochain serpent à la sortie de chaque antre remplace les phrases de briefing, et peut servir à appeler la vague plus tôt.
4. **Un mode Facile qui combine plusieurs leviers (Bloons TD 6, Minecraft).** BTD6 donne plus de vies, des coûts réduits de 15 % et des ennemis plus lents ; Minecraft laisse changer la difficulté en pause. Utile avec deux enfants de 6–7 et 8–10 ans.
5. **Pas d'objets aléatoires, pas de compte à rebours, pas de pub (nouvelles règles PEGI, Toca Boca, PvZ).** Depuis juin 2026, objets aléatoires payants = PEGI 16, offres limitées dans le temps ou pénalités de connexion quotidienne = PEGI 12 ([PocketGamer.biz](https://www.pocketgamer.biz/pegi-expands-age-ratings-to-cover-loot-boxes-and-in-game-spending)). PvZ avec pub tombe à 3,2 ; BTD6 payant sans pub reste à 4,8.

## Analyse financière

Modèle recommandé : une app gratuite sur Google Play, avec **un seul achat de 3,99 € / 4 CHF qui débloque le jeu complet**. L'achat passe par un portail parental ; ni pub, ni monnaie virtuelle, ni collecte de données. Sur PC, une démo gratuite dans le navigateur renvoie vers Google Play. Objectif réaliste : rembourser les frais et apprendre, pas un revenu.

### Ce qui rapporte chez les références

| Acteur | Modèle | Chiffre | Date | Source |
| --- | --- | --- | --- | --- |
| Ninja Kiwi (Bloons) | Jeux payants + achats intégrés | CA brut 337 M SEK (56 M NZD), EBITDA ajusté 168 M SEK | 2020 | [MTG](https://www.mtg.com/press-releases/mtg-acquires-leading-tower-defense-gaming-studio-and-publisher-ninja-kiwi-the-maker-of-bloons/) |
| Bloons TD 6 | Payant 6,99 $ + achats intégrés | Plus de 603 M SEK (100 M NZD) cumulés | mars 2021 | [MTG](https://mtg.com/press-releases/mtg-completes-the-acquisition-of-ninja-kiwi-the-leading-tower-defense-gaming-studio-and-publisher-and-maker-of-bloons) |
| Kingdom Rush (Ironhide) | Premium + extensions ; « tout se finit sans achat » | Plus de 63 M de téléchargements ; le premium serait « less viable each year » | juin 2024 | [PocketGamer.biz](https://www.pocketgamer.biz/ironhide-co-founder-pablo-realini-talks-kingdom-rush-5-and-premiums-place-in-2024) |
| Spin Master Digital Games (Toca Boca, Sago Mini) | Gratuit + achats intégrés, abonnements | 53,4 M$ au 4e trimestre 2025, portés par les achats dans Toca Boca World | mars 2026 | [Spin Master](https://wwww.stockwatch.com/News/Item/Z-C!TOY-3792885/C/TOY) |
| Pok Pok | Abonnement, sans pub | Revenu récurrent mensuel à six chiffres en dollars, plus d'1 M de téléchargements | juin 2024 | [TechCrunch](https://techcrunch.com/2024/06/18/now-a-series-a-startup-kids-app-and-digital-toy-pok-pok-is-coming-to-android) |

Ces chiffres sont ceux de studios installés, avec marque et équipe. Ils montrent quels modèles tiennent, pas ce qu'un premier jeu solo peut espérer.

### Les modèles comparés pour ton cas

| Modèle | Ce que disent les sources | Pour toi |
| --- | --- | --- |
| Gratuit + 1 achat de déblocage | Glyph Quest (gratuit + déblocage) : 200 000 à 250 000 téléchargements, contre 8 000 pour sa suite payante ([PocketGamer.biz](https://www.pocketgamer.biz/indie-mavens-are-paid-apps-dead/), 2016) | **Retenu** : les parents essaient avant de payer |
| Payant au téléchargement | 3,3 % des apps Google Play sont payantes ([AppBrain](https://www.appbrain.com/stats/free-and-paid-android-applications)) ; moins de 3 % des utilisateurs Android paient une app enfant, contre jusqu'à 15 % sur iOS ([Kidscreen](https://kidscreen.com/?p=91087), 2016, source d'un réseau pub) | Écarté : marché payant marginal sur Android |
| Publicité | Politique Familles : SDK autocertifiés seulement, pas de pub ciblée ([Google](https://support.google.com/googleplay/android-developer/answer/9893335)) ; seul cas web chiffré : environ 1,23 € pour 1 000 parties sur CrazyGames (vers 2018) | Écarté : faible revenu, PvZ avec pub noté 3,2 |
| Portails web (Poki, CrazyGames) | CrazyGames rejette les contenus pour enfants ([docs](https://docs.crazygames.com/faq/)) ; Poki exige l'exclusivité sur le web ouvert ([guide](https://developers.poki.com/guide)) | Écarté : incompatible avec ta démo web |
| Google Play Pass | Candidature par formulaire, rémunération algorithmique opaque ([Google](https://google.play/business/programs/googleplaypass/)) ; disponible en FR, DE, IT, AT, BE…, Suisse non confirmée | Bonus gratuit à tenter après la sortie |
| Apple Arcade, Netflix Games | Commandes surtout sous licence ; avances en baisse ([Mobilegamer.biz](https://mobilegamer.biz/inside-apple-arcade-axed-games-declining-payouts-disillusioned-studios-and-an-uncertain-future/)) ; pas de soumission publique chez Netflix | Inaccessible en pratique |

### Ce qui est réaliste en solo

| Repère | Valeur | Source |
| --- | --- | --- |
| Nouvelles apps à abonnement qui atteignent 1 000 $ / 10 000 $ cumulés en 2 ans | environ 20 % / 5 % | [RevenueCat 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/) |
| Jeux Steam sortis en 2025 sous 1 000 $ brut | 65,9 % (estimation Gamalytic) | [OpenCritic](https://opencritic.com/news/22399/only-8-of-steam-games-gross-over-100-thousand-40-make-less-than-steam-listing-fees) |
| Meteorfall: Krumit's Tale, premium 6,99 $, mis en avant par l'App Store | 92 300 $ nets en 2 mois, dont 43 % sur Android | [GameDiscoverCo](https://newsletter.gamediscover.co/p/iosandroid-sales-deep-dive-meteorfall) |
| Postmortem chiffré d'un jeu enfant indépendant récent | non trouvé | — |

### Prix, coûts et seuil

| Élément | Valeur | Source |
| --- | --- | --- |
| Prix proposé | 3,99 € / 4 CHF (fourchette 2,99 à 4,99 €) | sous BTD6 (6,99 $) et Kingdom Rush 5 (7,99 € au lancement) : jugement, pas un chiffre sourcé |
| Commission Google | 15 % en Suisse ; dans l'EEE depuis le 30/06/2026, 10 % + 5 % de frais de facturation sur le premier million de dollars | [Google](https://support.google.com/googleplay/android-developer/answer/112622), [PocketGamer.biz](https://www.pocketgamer.biz/google-play-expands-billing-options-and-lowers-fees-for-developers/) |
| Net par vente (calcul) | environ 3,15 CHF en Suisse (TVA 8,1 %), environ 2,85 € en Allemagne (TVA 19 %) | calcul : prix − TVA − 15 % |
| Compte Google Play | 25 $, une fois ; test fermé de 12 testeurs pendant 14 jours obligatoire | [Google](https://support.google.com/googleplay/android-developer/answer/14151465) |
| Traduction professionnelle | 0,10 à 0,14 € par mot ; 1 500 mots × 3 langues ≈ 450 à 630 € (calcul) | [Allcorrect](https://allcorrectgames.com/localization-pricing/) |
| Images supplémentaires | dans ton abonnement Magnific actuel (voir Assets) | — |

Avec 100 CHF de budget, la traduction professionnelle ne passe pas : traduction par l'agent de code, relue par des proches qui parlent chaque langue. Seuil : environ 8 ventes remboursent le compte Google Play.

## Revues de design

Les images et le plateau sont réussis, mais l'interface autour est faite pour un adulte qui lit : 7 bandeaux encadrent le plateau et chaque système s'explique par une phrase. Le chantier prioritaire est de réduire ce qui entoure le plateau, pas de retoucher le plateau lui-même.

### Critique visuelle

| Écran | Ce qui marche | Ce qui gêne | Gravité |
| --- | --- | --- | --- |
| Accueil | Illustration forte, titre lisible, un bouton principal jaune bien visible | Deux modes parallèles (expéditions et aventure classique), puis chapitres, équipes, fiches, sauvegarde : 352 mots à lire | Moyenne |
| Préparation | Aperçu de la carte, héros et alliés de départ montrés en images | Le code de départ passe en premier ; terrain, attaques et œufs sont décrits en phrases ; le bouton de lancement est sous le pli | Forte |
| Combat (ordinateur) | Contours orange des serpents, ruisseau, refuge bien identifiable | Le regard part vers le panneau de droite ; au-dessus et au-dessous du plateau s'empilent entête, mission, HUD, titre, conseil, état des voies, message, héros, prochaine vague et code | Forte |
| Combat (paysage téléphone) | Plateau à 88 % de la hauteur, HUD réduit à une barre, tiroir de renforts | Boutons de 36 px ; le tiroir couvre la zone de pose ; un cadre vide dans le tiroir | Moyenne |
| Plateau | Le ruisseau et les ponts donnent enfin un sens à la carte | Les raccords en S croisent les voies comme une tresse ; halos bleus derrière les grottes et le refuge | Moyenne |

**Cohérence.** Le même objet porte cinq noms : détachement, armée, équipe, camp, renforts. Le texte mélange aussi « tu » et « vous » : « Choisis un allié » à côté de « Préparez vos premières défenses » (`src/waves.ts:36`) et des objectifs de mission au vouvoiement (`src/missions.ts:28-68`).

### Accessibilité

| # | Constat | Référence | Gravité |
| --- | --- | --- | --- |
| 1 | Boutons du HUD téléphone à 36×36 px | Android recommande au moins 48×48 dp ([Android Developers](https://developer.android.com/guide/topics/ui/accessibility/apps)) | Moyenne |
| 2 | Tout le jeu passe par l'écrit : aucune voix, aucun pictogramme seul pour les règles | public cible de 6–7 ans | Forte |
| 3 | Un titre à 2,09:1 sur fond vert foncé, trois textes entre 4,23 et 4,49:1 | WCAG 1.4.3 (4,5:1), mesuré avec axe-core | Faible |
| 4 | La pose d'un allié se fait seulement à la souris ou au doigt | WCAG 2.1.1 | Faible |
| 5 | Points positifs : styles de focus visibles (`style.css:56`), réglage « mouvement réduit » respecté, aucune image sans texte alternatif détectée | axe-core | — |

### Textes pour un enfant de 6–7 ans

Règle proposée : 1 verbe + 1 objet, toujours « tu », un seul nom par objet (« alliés »), les chiffres seulement quand l'enfant doit compter.

| Endroit | Aujourd'hui | Proposé (FR) |
| --- | --- | --- |
| Bouton principal de l'accueil | Choisir une expédition | Jouer |
| Second mode | Nouvelle aventure classique | La grande aventure |
| Lancement de mission | Déployer ce détachement | C'est parti ! |
| Objectif mission 1 | Protégez le cristal pendant trois vagues. | Protège le cristal ! (3 icônes de vague) |
| Conseil | Les arrivées sont régulières : répartissez les gardiens. | Mets des alliés sur chaque chemin. |
| Fin de mission | Ton armée et ses pièges ont tenu les douze vagues. (`src/ui/coaching.ts:44`) | Bravo ! Le refuge est sauvé. |
| Code de départ | En tête du dialogue | Dans un volet replié « Pour les parents » |
| Miel tactique | Attirer / Ralentir / Haut, Centre, Bas / 1 fois par vague · attaques plus rapides pendant 8 s | Deux grosses icônes (aimant, escargot), puis toucher le chemin sur le plateau |

Notes de traduction : l'allemand rallonge souvent les libellés, donc les boutons doivent s'élargir sans couper le texte. Éviter les jeux de mots (« Le roi a perdu sa couronne »), difficiles à rendre en DE et IT. Faire relire chaque langue par un parent qui la parle, avant la publication.

## Recommandations

Treize recommandations, environ 63 h en tout. Les priorités 1 et 2 (environ 55 h) tiennent dans les 8 semaines ; la priorité 3 vient après la sortie. « Correctif » signale un défaut mesuré qui n'a pas besoin de référence externe.

| # | Recommandation | Constat (preuve) | Référence | Impact pour l'enfant | Effort | Priorité | Lot |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Remettre la page en haut au lancement et faire tenir le plateau sur un portable | Défilement de 422 px ; 480 px visibles sur 514 (test, constats 1 et 2) | Correctif | Voit tout le plateau dès le début | 4 h | 1 | 1 |
| 2 | Boutons tactiles d'au moins 48 px | HUD téléphone à 36 px (mesure) | [Android : 48 dp](https://developer.android.com/guide/topics/ui/accessibility/apps) | Touche le bon bouton du premier coup | 1 h | 1 | 1 |
| 3 | Viser 8 mots à l'écran, remplacer les phrases par des icônes, tutoyer, un seul nom (« alliés ») | 310 mots avant la 1re vague ; tu et vous mélangés (`src/waves.ts:36`) | PvZ, 8 mots au plus ([GDC 2012](https://gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan)) ; Toca Boca sans texte | Joue sans adulte pour lire | 8 h | 1 | 2 |
| 4 | Un système nouveau par mission (miel, encourager, réparer, héros) | Tous les panneaux dès la mission 1 (capture) | PvZ : argent après 10 niveaux, nouveautés très lentes (GDC 2012) | Apprend une chose à la fois | inclus au lot 2 | 1 | 2 |
| 5 | Mission 1 sur une seule voie, avec un seul type d'allié | 3 voies et 3 antres dès la mission 1 | PvZ niveau 1-1 : 1 voie, 1 plante ; Kingdom Rush : 2e chemin au niveau 3 | Comprend la règle avant la difficulté | 4 h | 1 | 7 |
| 6 | Tester sur un vrai téléphone Android et mesurer les images/s | Aucun APK construit ni testé (`docs/ANDROID.md`) | Correctif | Évite un jeu lent sur la tablette familiale | 5 h | 1 | 4 |
| 7 | Sortir les textes et traduire en EN, DE, IT | Tout en français en dur, environ 285 chaînes dans 40 fichiers | Pok Pok critiqué pour l'absence d'allemand et d'italien ([App Store](https://apps.apple.com/ch/app/id1550204730)) | Jouable par les cousins germanophones et italophones | 14 h | 1 | 5 |
| 8 | Icône du prochain serpent à chaque antre, avec appel anticipé de la vague | Briefing de vague en phrases | Kingdom Rush : icônes d'entrée, bonus d'or pour l'appel anticipé ([Game Developer](https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design)) | Voit ce qui arrive sans lire | 3 h | 2 | 7 |
| 9 | Mode Facile combiné, changeable en pause | Deux joueurs de 6–7 et 8–10 ans ; mission 1 gagnée sans décision | BTD6 Easy : plus de vies, coûts −15 %, ennemis plus lents ; Minecraft, difficulté changeable à tout moment | Chaque enfant joue à son niveau | 3 h | 2 | 7 |
| 10 | Gratuit + 1 achat de déblocage à 3,99 € / 4 CHF, portail parental, sans pub ni collecte | Objectif de monétiser ; 0 collecte aujourd'hui | Glyph Quest ; politique Familles ; PEGI 2026 (voir Analyse financière) | Aucune pub, aucune pression d'achat | 6 h | 2 | 8 |
| 11 | Fiche Google Play, politique de confidentialité, test fermé de 12 testeurs pendant 14 jours | Compte personnel soumis au test fermé | [Google](https://support.google.com/googleplay/android-developer/answer/14151465) | — | 3 h + 14 jours | 2 | 9 |
| 12 | Nettoyer les halos bleus et affiner les raccords en S | Captures 812×375 et 1280×800 | Correctif | Plateau plus lisible | 4 h | 2 | 3 |
| 13 | Événements de mission (pluie, nuit, vent) | Variation limitée à terrain, attaques et œufs | Hypothèse (pas de référence trouvée) | Parties plus variées | 8 h | 3 | 6 |

Les recommandations 5, 8 et 9 changent des règles : elles passent d'abord par ton fils, comme le prévoit `GAME_DESIGN.md`.

## Feuille de route

Le calendrier tourne autour d'une contrainte : les 14 jours de test fermé avec 12 testeurs. Pour sortir fin décembre, le test doit démarrer le 14 décembre, avec l'achat et la fiche du store déjà prêts.

&#91;embedded content: feuille de route · 8 semaines, 65 h\]

La traduction se fait pendant le test fermé, car on peut envoyer de nouvelles versions aux testeurs. Les semaines 7 et 8 tombent pendant les fêtes : si elles sont prises, décale toute la suite d'une ou deux semaines. Ouvre le compte Google Play dès la semaine 1, car la vérification d'identité peut prendre du temps.

## Risques et conformité

Ton jeu part avec un gros avantage : il ne collecte rien et n'affiche aucune pub, ce qui simplifie presque toute la conformité. Le seul vrai verrou est le calendrier de Google : 12 testeurs pendant 14 jours avant toute publication.

| Sujet | Règle | Ce que ça demande pour ton jeu | Source |
| --- | --- | --- | --- |
| Public cible Google Play | Les tranches 6–8 et 9–12 ans font appliquer toute la politique Familles | Déclarer 6–8 et 9–12 ; politique de confidentialité, formulaire « Sécurité des données » et questionnaire IARC exacts | [Google](https://support.google.com/googleplay/android-developer/answer/9867159), [Familles](https://support.google.com/googleplay/android-developer/answer/9893335) |
| Données | Pas d'identifiant publicitaire, pas de localisation, pas de SDK non approuvés pour enfants | Déjà le cas : 0 appel réseau, sauvegarde locale. Ne pas ajouter de SDK d'analyse ni de service d'achat tiers | Familles |
| Achats | Ni trompeurs ni manipulateurs, monnaie virtuelle distincte de l'argent réel | Un seul achat, en CHF ou EUR, proposé au parent via un portail ; pas de monnaie virtuelle | Familles ; [lignes directrices DSA art. 28](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:C_202505519) |
| Contrôle parental | Family Link peut exiger l'accord du parent pour chaque achat | Rien à coder : passer par la facturation Google Play | [Google](https://support.google.com/googleplay/answer/7039872) |
| PEGI | Depuis juin 2026 : objets aléatoires payants = PEGI 16 ; offres limitées ou pénalités quotidiennes = PEGI 12 | Aucun des deux. PEGI 7 probable à cause de la violence de dessin animé (estimation, décidé par le questionnaire IARC) | [PocketGamer.biz](https://www.pocketgamer.biz/pegi-expands-age-ratings-to-cover-loot-boxes-and-in-game-spending) |
| RGPD art. 8 | Âge du consentement : FR 15, DE 16, IT 14, BE 13, AT 14 ; aucun âge fixé en Suisse | Ne s'applique qu'à un traitement fondé sur le consentement : sans collecte, rien à gérer | [CNIL](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2), [GDPRLocal](https://gdprlocal.com/digital-age-of-consent-under-the-gdpr/) |
| Compte développeur | 25 $, pièce d'identité, carte de crédit, accès à un appareil Android ; test fermé 12 × 14 jours pour les comptes personnels créés après le 13/11/2023 | Ouvrir le compte dès la semaine 1 (la vérification prend du temps) ; réunir 12 testeurs dans la famille et l'entourage | [Google](https://support.google.com/googleplay/android-developer/answer/6112435), [test fermé](https://support.google.com/googleplay/android-developer/answer/14151465) |
| Teacher Approved | Évaluation automatique des apps Familles ; l'italien n'est pas une langue évaluée | Possible pour FR, DE, EN ; pas un prérequis | [Google](https://support.google.com/googleplay/android-developer/answer/10075896) |

**Questions ouvertes.**

- Statut de « trader » au sens du DSA : un développeur qui vend peut devoir publier une adresse de contact. Page officielle Google non trouvée ; à vérifier dans la Play Console avant de monétiser.
- TVA : Google est le vendeur officiel dans plusieurs pays de l'UE ([Google](https://support.google.com/googleplay/android-developer/answer/7645364)). Pour tes impôts en Suisse, demande à ton fiduciaire comment déclarer ces revenus. Je ne suis ni juriste ni conseiller fiscal.

**Risques projet.**

| Risque | Effet | Parade |
| --- | --- | --- |
| Le jeu n'a jamais tourné sur un vrai téléphone | Lenteur ou bugs découverts tard | Lot 4 en semaine 2 |
| Moins de 12 testeurs actifs pendant 14 jours | Publication bloquée | Recruter 15 personnes, rappeler à J+7 |
| Traductions sans relecture humaine | Textes faux pour un enfant | Une personne par langue relit avant le test fermé |
| Changements de règles sans l'avis de ton fils | Le jeu ne serait plus le sien | Valider les lots 6 et 7 avec lui, comme le prévoit `GAME_DESIGN.md` |

## Assets

Tout ce qui manque tient dans ton abonnement Magnific actuel : environ 1 130 crédits sur les 15 684 disponibles, soit 0 CHF de plus. Mise à jour du 7 novembre, après ton accord : 6 images générées pour 1 050 crédits (solde 14 634). Retenus : le fond « crue » et une icône ; le fond « marais » est à valider ; la bannière générée est écartée au profit d'une capture du jeu.

Méthode : garder Recraft V4 Pro via Magnific, comme pour les assets actuels (`public/asset-provenance.md`). Chaque génération reçoit en référence de style la planche `allies-front`, déjà utilisée pour les autres planches. Le compte Recraft direct (1 004 crédits, plan Basic) reste en réserve.

| Besoin | Méthode | Coût estimé |
| --- | --- | --- |
| Halos bleus derrière grottes et refuge | D'abord un nettoyage local gratuit de la transparence (script Python sur `strongholds.webp`) ; sinon un nouveau détourage Magnific | 0 à 6 crédits |
| Raccords en S plus discrets | Pas d'image : tracer ces chemins plus étroits, en terre battue, dans `src/render/refinedTerrain.ts` | 0 |
| Couleur des serpents | Déjà réglée par le contour orange de la v0.26 | 0 |
| 2 nouveaux lieux pour le tirage (marais, rivière en crue) | 2 fonds 16:9 en Recraft V4 Pro, puis mise au format 1600×900 | 2 × 175 + 2 × 40 = 430 |
| Nuit, pluie, vent | Pas d'image : teinte, particules et sons dans Phaser | 0 |
| Icône du store (512×512) | 3 essais en Recraft V4 Pro, héros et serpent du jeu | 3 × 175 = 525 |
| Bannière Google Play (1024×500) | 1 génération et recadrage | 175 |
| **Total** |  | **≈ 1 130 crédits** |

Tarifs relevés le 7 novembre 2026 avec l'estimateur de Magnific (sans dépenser) : Recraft V4 Pro 175 crédits par image, Recraft V4 60, détourage 3. Les captures d'écran du store se font depuis le jeu, sans génération.

## Prompts par lot

Un prompt = un lot = une version. Donne-les à Codex ou Claude Code dans l'ordre de la feuille de route (1, 4, 3, 2, 7, 8, 9, 5, puis 6 après la sortie ; les numéros de version sont indicatifs) ; les deux lisent `AGENTS.md`, qui rappelle déjà les règles du projet. Teste chaque version avec tes enfants avant de passer à la suivante.

### Lot 1 — Affichage ordinateur et petits défauts (v0.27.0, ≈ 6 h)

```
Lis AGENTS.md et docs/ARCHITECTURE.md. Lot « affichage », un commit par point, npm run build après chaque point.

1. Au lancement d'une mission, d'une reprise ou de l'aventure classique, remettre le défilement de la page en haut. Aujourd'hui le défilement de l'accueil est conservé (422 px à 1280×800) et le HUD est hors écran.
2. Sur ordinateur, le plateau doit tenir en entier sans défiler à 1280×800 et 1366×768 (aujourd'hui 480/514 et 448/563 px visibles). Ramener l'interface au-dessus du plateau à 120 px au plus : fusionner le bandeau de mission avec le titre du panneau, masquer le bandeau de conseil quand il est vide, déplacer état des voies, message, héros et prochaine vague dans le panneau de droite. Partir de la media query existante (min-width: 921px) and (max-height: 760px).
3. Dialogue de préparation de mission : le bouton « Déployer » reste visible sans défiler (pied de dialogue fixe), à 1280×800 et 812×375.
4. HUD en paysage téléphone : Pause, Vitesse, Accueil, Renforts et Lancer passent de 36×36 à au moins 48×48 px.
5. Texte de victoire : src/ui/coaching.ts:44 parle de « douze vagues » même après une mission de 3 vagues. Adapter le texte au mode et au nombre de vagues.
6. Tiroir des renforts : un cadre vide s'affiche à côté du titre « Renforts » en 812×375. Le remplir ou le retirer.
7. Accueil : porter à 4,5:1 minimum le contraste des 4 textes signalés par axe-core (#home-active-team, .eyebrow des deux cartes, #chapter-0 small).

Critères : script Playwright qui vérifie points 1 à 4 à 1280×800, 1366×768, 1920×1080 et 812×375 ; axe-core sans violation de contraste sur l'accueil ; npm run verify vert ; anciennes sauvegardes chargées ; version 0.27.0.
```

### Lot 2 — Lisible sans savoir bien lire (v0.28.0, ≈ 8 h)

```
Lis AGENTS.md. Lot « lisibilité 6–7 ans ». Aucune règle de combat ne change : seulement textes et interface.

1. Un seul nom pour les soldats du joueur : « alliés » (remplacer détachement, armée, équipe, renforts dans les textes visibles). Tutoiement partout (src/waves.ts, src/missions.ts, src/render/presentation.ts…).
2. Accueil : un gros bouton « Jouer » qui ouvre la prochaine mission non terminée. Aventure classique, équipes, fiches et sauvegarde passent dans un menu secondaire.
3. Préparation : terrain, attaques et œufs deviennent 3 cartes illustrées (icône + 3 mots au plus) ; bouton dé « Autre départ » ; le code de départ passe dans un volet replié « Pour les parents ».
4. Introduire un système par mission : mission 1 = recruter et lancer ; le miel tactique apparaît à la mission 2, Encourager à la 3, Réparer à la 4, l'entraînement du héros à la 5. Avant leur mission, ces panneaux sont masqués. L'aventure classique garde tout.
5. Textes : voir le tableau « Textes pour un enfant de 6–7 ans » de l'audit (Jouer, C'est parti !, Protège le cristal !, Bravo ! Le refuge est sauvé.).

Critères : au plus 60 mots visibles sur l'écran de combat de la mission 1 avant la 1re vague (aujourd'hui 310), mesuré par script ; aucun « vous » dans les textes visibles ; npm run verify vert ; version 0.28.0.
```

### Lot 3 — Plateau : raccords et halos (v0.29.0, ≈ 4 h)

```
Lis AGENTS.md. Lot « plateau ». Navigation, positions des ponts et combats inchangés.

1. Les raccords en S entre les voies croisent les chemins comme une tresse. Les dessiner 40 % plus étroits, en terre battue, et sous les voies principales, pour qu'on les lise comme des chemins secondaires (src/render/refinedTerrain.ts).
2. Halos bleu pâle derrière les grottes et à droite du refuge : nettoyer la transparence de la planche strongholds par un script reproductible dans scripts/ (pixels bleu clair semi-transparents en bordure → alpha 0), sans régénérer d'image. Garder l'original à côté.

Critères : captures avant/après à 1280×800 et 812×375 ; plus aucun pixel bleu clair visible autour des grottes et du refuge ; tests de rendu verts ; version 0.29.0.
```

### Lot 4 — Test sur un vrai téléphone Android (≈ 5 h)

```
Lis docs/ANDROID.md. Aide-moi à construire un APK de debug et à mesurer le jeu sur mon téléphone.

1. Liste les étapes Windows : Node 24, Android Studio, npm run android:sync, build de l'APK debug, installation par USB.
2. Ajoute un compteur d'images/s et de mémoire visible seulement avec ?perf=1 ou en mode debug (réutilise src/render/devPerformance.ts).
3. Je joue la mission 6 et la vague 12 classique ; tu analyses mes relevés (images/s médianes et minimales, temps de chargement).

Critères : rapport reports/android-device.json ; si moins de 30 images/s en vague chargée, propose les 3 corrections les plus rentables, mesurées.
```

### Lot 5 — Traduction FR, EN, DE, IT (v0.30.0, ≈ 14 h)

```
Lis AGENTS.md. Lot « langues ».

1. Extraire tous les textes visibles (index.html et environ 285 chaînes dans 40 fichiers TS) dans src/i18n/fr.json, avec une fonction t(clé, variables).
2. Ajouter en.json, de.json, it.json. Marquer chaque traduction « à relire » : un humain validera.
3. Langue choisie d'après navigator.language, modifiable dans l'accueil, mémorisée. Pluriels et nombres via Intl.PluralRules et Intl.NumberFormat.
4. Boutons et cartes s'élargissent sans couper le texte (l'allemand est souvent plus long).

Critères : un script échoue s'il reste du français en dur hors de fr.json ; captures en DE à 812×375 et 1280×800 sans texte coupé ; sauvegardes inchangées ; version 0.30.0.
```

### Lot 6 — Événements de mission (v0.31.0, ≈ 8 h, à valider d'abord avec ton fils)

```
Lis AGENTS.md et docs/CARTES-CODES-0.25.md. Ajouter un 4e axe au tirage de départ : l'événement.

1. Quatre événements : aucun, pluie (serpents plus lents), nuit (portée réduite, lucioles), vent (tirs déviés). Valeurs proposées puis vérifiées avec npm run balance:lab.
2. Tiré avec la graine, annoncé par une carte illustrée dans la préparation. Rendu en code (teinte, particules, son), sans nouvelle image.
3. Codes de départ : nouvelle version de code ; les anciens codes restent lisibles et donnent « aucun événement ».

Critères : même code = même partie ; taux de victoire de chaque mission dans le laboratoire d'équilibrage à ±10 points de l'actuel ; npm run verify vert ; version 0.31.0.
```

### Lot 7 — Première mission, signaux et mode Facile (v0.32.0, ≈ 10 h, à valider d'abord avec ton fils)

```
Lis AGENTS.md et GAME_DESIGN.md. Ces trois points changent des règles : propose les valeurs, attends ma validation avant de coder.

1. Mission 1 sur une seule voie : une seule antre active (les deux autres fermées par un rocher dessiné), un seul type d'allié proposé en plus du héros et des massues. Les 3 voies arrivent à la mission 2. Référence : niveau 1-1 de Plants vs. Zombies (1 voie, 1 plante).
2. À la sortie de chaque antre, une icône montre le prochain serpent de la vague. Toucher l'icône pendant la préparation lance la vague plus tôt et donne un bonus de pièces proportionnel au temps gagné. Référence : Kingdom Rush.
3. Mode Facile, changeable dans le menu pause : cristal plus solide, alliés moins chers, serpents un peu plus lents. Plusieurs leviers combinés, comme le mode Easy de Bloons TD 6. Mémorisé par profil de joueur.

Critères : npm run balance:lab montre l'écart de taux de victoire entre Facile et Normal sur les missions 1 à 6 ; même code de départ = même partie ; anciennes sauvegardes chargées (mode Normal par défaut) ; version 0.32.0.
```

### Lot 8 — Achat de déblocage et portail parental (v0.33.0, ≈ 6 h)

```
Lis AGENTS.md et docs/ANDROID.md. Ajouter un achat unique « Jeu complet » sur Android.

1. Version gratuite : missions 1 à 3 et chapitre 1 de l'aventure classique. L'achat débloque tout le reste et le contenu futur. La version gratuite doit être un jeu complet en elle-même.
2. Google Play Billing via un plugin Capacitor, sans service tiers ni serveur, sans aucune collecte de données. Justifie le choix du plugin et sa compatibilité avec la politique Familles de Google Play.
3. L'offre ne s'affiche qu'après un portail parental (question qu'un enfant de 6–8 ans ne résout pas seul), jamais pendant une partie, sans compte à rebours ni promotion limitée (sinon PEGI 12).
4. Restauration de l'achat après réinstallation. Prix affiché par Google dans la monnaie du pays.
5. Version navigateur : missions 1 à 3, puis un lien vers la fiche Google Play.

Critères : achat testé avec un compte de test Google Play ; aucun appel réseau hors facturation Google ; sauvegardes inchangées ; version 0.33.0.
```

### Lot 9 — Fiche du store et conformité (≈ 3 h)

```
Aide-moi à préparer la publication sur Google Play.

1. Une page statique de politique de confidentialité en FR, EN, DE, IT : aucune donnée collectée, sauvegarde locale sur l'appareil, achat géré par Google.
2. Les réponses à préparer : public cible (6–8 et 9–12 ans), formulaire « Sécurité des données », questionnaire IARC, catégorie.
3. Textes de la fiche (titre, description courte, description longue) dans les 4 langues, sans promesse inventée.
4. Un script Playwright qui produit les captures d'écran du store (téléphone paysage et tablette) depuis le jeu.
5. La marche à suivre pour créer le test fermé et inviter 12 testeurs, avec un message d'invitation prêt à envoyer.

Critères : tout dans docs/publication/ ; je relis chaque texte avant de le coller dans la Play Console.
```

## Maquettes

Les 3 écrans redessinés sont sur un canevas à part, au format téléphone paysage (812×375), avec les vraies images du jeu : [Serpent Defender — 3 écrans redessinés](https://claude.ai/artifact/NeJ71Fck3ZpVEMc2y9kAWD).

| Écran | Ce qui change | Constat et référence |
| --- | --- | --- |
| Accueil | Un gros bouton « Jouer » vers la prochaine mission ; les 6 missions en chemin illustré ; grande aventure, fiches et coin parents en boutons secondaires | 352 mots aujourd'hui ; Toca Boca sans texte |
| Préparation | Terrain, serpents et œufs en 3 cartes illustrées ; « Autre départ » (dé) et « C'est parti ! » toujours visibles ; code dans « Pour les parents » | bouton sous le pli, code en premier ; PvZ montre les ennemis avant le niveau |
| Jeu | HUD de 56 px, plateau pleine hauteur, 4 alliés toujours visibles à droite au lieu du tiroir, 2 miels en icônes, icône du prochain serpent à chaque antre, cercles de pose | boutons de 36 px, tiroir sur la zone de pose ; icônes d'entrée et emplacements fixes de Kingdom Rush |

Le dock de 4 alliés suppose le tirage de renforts proposé dans le premier brief (4 alliés au départ, 1 au choix parmi 3 après chaque vague). Sans lui, il affiche les 4 favoris de l'équipe active.

## Sources

Toutes ouvertes le 7 novembre 2026. Le code et les mesures viennent du zip v0.26.0, compilé et testé ce jour-là.

**Jeux et stores**

- Fiches Google Play (Suisse) : [Kingdom Rush](https://play.google.com/store/apps/details?id=com.ironhidegames.android.kingdomrush&hl=fr&gl=CH), [Bloons TD 6](https://play.google.com/store/apps/details?id=com.ninjakiwi.bloonstd6&hl=fr&gl=CH), [Plants vs. Zombies](https://play.google.com/store/apps/details?id=com.ea.game.pvzfree_row&hl=fr&gl=CH), [Plants vs. Zombies 2](https://play.google.com/store/apps/details?id=com.ea.game.pvz2_row&hl=fr&gl=CH), [Toca Boca World](https://play.google.com/store/apps/details?id=com.tocaboca.tocalifeworld&hl=fr&gl=CH), [Pok Pok](https://play.google.com/store/apps/details?id=com.playpokpok.pokpok&hl=fr&gl=CH), [Minecraft](https://play.google.com/store/apps/details?id=com.mojang.minecraftpe&hl=fr&gl=CH)
- [Pok Pok sur l'App Store suisse](https://apps.apple.com/ch/app/id1550204730) (langues disponibles)
- [Kingdom Rush, conception de la campagne](https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design), Game Developer, 25/10/2013
- [GDC 2012 : 10 conseils de tutoriel de George Fan (PvZ)](https://gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan), Game Developer, 09/03/2012
- [PvZ, niveau 1-1](https://plantsvszombies.fandom.com/wiki/Level_1-1) ; [Bloons TD 6, modes](https://bloons.fandom.com/wiki/Bloons_TD_6) ; [Minecraft, difficulté](https://minecraft.wiki/w/Difficulty)
- [Toca Boca, « no language and no text »](https://gulfnews.com/technology/consumer-electronics/toca-boca-glory-game-apps-children-love-even-though-they-cant-win-1.1328450), The Observer via Gulf News, 2018
- [Jeux préférés des enfants en Allemagne, KIM 2024](https://de.statista.com/statistik/daten/studie/259701/umfrage/beliebteste-computerspiele-von-kindern-in-deutschland), Statista

**Finance**

- MTG : [rachat de Ninja Kiwi](https://www.mtg.com/press-releases/mtg-acquires-leading-tower-defense-gaming-studio-and-publisher-ninja-kiwi-the-maker-of-bloons/) (24/03/2021) et [clôture](https://mtg.com/press-releases/mtg-completes-the-acquisition-of-ninja-kiwi-the-leading-tower-defense-gaming-studio-and-publisher-and-maker-of-bloons) (01/06/2021)
- [Entretien Ironhide sur le premium](https://www.pocketgamer.biz/ironhide-co-founder-pablo-realini-talks-kingdom-rush-5-and-premiums-place-in-2024), PocketGamer.biz, 21/06/2024
- [Spin Master, résultats T4 2025](https://wwww.stockwatch.com/News/Item/Z-C!TOY-3792885/C/TOY), 05/03/2026
- [Pok Pok, série A](https://techcrunch.com/2024/06/18/now-a-series-a-startup-kids-app-and-digital-toy-pok-pok-is-coming-to-android), TechCrunch, 18/06/2024
- [Are paid apps dead?](https://www.pocketgamer.biz/indie-mavens-are-paid-apps-dead/), PocketGamer.biz, 30/08/2016 ; [Kidscreen / KIDOZ](https://kidscreen.com/?p=91087), 20/09/2016 ; [AppBrain, apps payantes](https://www.appbrain.com/stats/free-and-paid-android-applications)
- [RevenueCat, State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/) ; [OpenCritic, revenus Steam 2025](https://opencritic.com/news/22399/only-8-of-steam-games-gross-over-100-thousand-40-make-less-than-steam-listing-fees) ; [GameDiscoverCo, Meteorfall](https://newsletter.gamediscover.co/p/iosandroid-sales-deep-dive-meteorfall)
- [Google Play Pass, programme](https://google.play/business/programs/googleplaypass/) ; [Inside Apple Arcade](https://mobilegamer.biz/inside-apple-arcade-axed-games-declining-payouts-disillusioned-studios-and-an-uncertain-future/), Mobilegamer.biz, 26/02/2024
- [CrazyGames, FAQ développeurs](https://docs.crazygames.com/faq/) ; [Poki, guide développeur](https://developers.poki.com/guide)
- [Allcorrect, tarifs de localisation](https://allcorrectgames.com/localization-pricing/), 05/03/2026

**Conformité et technique**

- Google Play : [politique Familles](https://support.google.com/googleplay/android-developer/answer/9893335), [public cible](https://support.google.com/googleplay/android-developer/answer/9867159), [Teacher Approved](https://support.google.com/googleplay/android-developer/answer/10075896), [test fermé des comptes personnels](https://support.google.com/googleplay/android-developer/answer/14151465), [inscription](https://support.google.com/googleplay/android-developer/answer/6112435), [frais de service](https://support.google.com/googleplay/android-developer/answer/112622), [vendeur officiel](https://support.google.com/googleplay/android-developer/answer/7645364), [approbation des achats](https://support.google.com/googleplay/answer/7039872)
- [Nouveaux frais Google Play](https://www.pocketgamer.biz/google-play-expands-billing-options-and-lowers-fees-for-developers/), PocketGamer.biz, 25/06/2026
- [PEGI : objets aléatoires et dépenses](https://www.pocketgamer.biz/pegi-expands-age-ratings-to-cover-loot-boxes-and-in-game-spending), PocketGamer.biz, 12/03/2026
- [Lignes directrices DSA art. 28](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:C_202505519), Commission européenne, 10/10/2025
- [RGPD art. 8](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2), CNIL ; [âge du consentement par pays](https://gdprlocal.com/digital-age-of-consent-under-the-gdpr/), GDPRLocal, 15/10/2026
- [Accessibilité Android, cibles de 48 dp](https://developer.android.com/guide/topics/ui/accessibility/apps), Android Developers
- Mesures de contraste : axe-core 4.10.2 ; pages non ouvertes faute d'accès : pegi.info, tocaboca.com, disponibilité de Play Pass par pays
