# Bilan — voyage, version 2 : King Snake vient avec sa garde (18 novembre 2026)

## Décision

Le fils veut que King Snake arrive avec ses gardes à la dernière étape du voyage, comme dans
la grande aventure. Le parent a lu la mesure ci-dessous et l'a acceptée le 18 novembre.

## Ce qui change

- Un **nouveau voyage** est de version 2 : son code s'écrit `VOYAGE-2-…`. À la dernière
  vague de la dernière étape, le roi prend les quatre dernières places de la vague avec ses
  deux gardes cuirassés et son guérisseur, exactement comme dans l'aventure. La vague n'a
  pas plus de serpents : la garde prend des places, elle ne s'ajoute pas.
- L'aperçu des dangers de cette vague montre le roi, ses gardes et son guérisseur.
- Les quatre premières étapes, les cartes offertes, les bourses et la vie du roi sont les
  mêmes qu'en version 1 (`VERSION_2 = { ...VERSION_1, kingCourt: true }`).
- Un **voyage commencé en version 1**, ou un code `VOYAGE-1-…` partagé, garde le roi seul :
  la version du voyage est écrite dans son état et dans son code.

## Mesure (300 graines, sac « raisonnable », mêmes graines pour les deux versions)

| Joueur   | Voyages finis, v1 | v2   | Dernière étape, v1 | v2   |
| -------- | ----------------- | ---- | ------------------ | ---- |
| expert   | 81 %              | 72 % | 81 %               | 72 % |
| moyen    | 53 %              | 59 % | 54 %               | 60 % |
| apprenti | 26 %              | 22 % | 27 %               | 23 % |
| petit    | 4 %               | 2 %  | 4 %                | 2 %  |

Étapes 1 à 4 : identiques. Sur 300 graines, l'écart dû au hasard est d'environ 5 points ;
seul l'expert perd nettement (9 points). Le joueur moyen gagne un peu : les gardes prennent
la place des derniers serpents de la vague.

La première mesure, montrée au parent, donnait 61 % au joueur moyen : la relecture a trouvé
que la garde ne recevait pas la vie du caprice (« Serpents costauds » la rend 1,75 fois plus
solide). Corrigé, puis mesuré de nouveau : le moyen passe de 61 à 59 %, les autres ne
bougent pas. Commande :
`SEEDS=300 POLICIES=raisonnable TABLE=1|2 npm run balance:voyage` (rapports dans
`artifacts/voyage/`, hors de Git).

## Vérifié

- Deux relectures indépendantes (huit angles). Corrigé : vie du caprice pour la cour, cour
  sans roi refusée, codes du laboratoire dans la version mesurée, documentation. Noté sans
  changer : le message « Le roi arrive avec sa garde » est vite remplacé par celui des œufs,
  comme dans l'aventure.
- Tests unitaires : la cour vient en version 2 et jamais en version 1 (partie jouée sur le
  vrai moteur) ; l'aperçu annonce la cour sans changer le compte de la vague ; codes des deux
  versions ; une étape gagnée en version 2 est bien enregistrée (les règles d'étape gardent
  l'ordre des clés du lecteur, ce que le premier essai cassait).
- Empreintes : les six voyages de référence de version 1 sont inchangés ; six voyages de
  version 2 sont ajoutés (`tests/fixtures/voyage-traces.ts`).

## Pas vérifié

- Rien n'a été joué à la main, sur téléphone, ni avec les enfants. La marche devant le roi
  reste (décision 13) : à regarder quand les enfants jouent au voyage.
