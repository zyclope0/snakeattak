# Sons et musiques — provenance et licences

Fichiers de `src/assets/audio/`, recompressés en MP3 (bruitages mono 96 kb/s, crête à −2 dB,
silence de tête coupé ; musiques stéréo 128 kb/s). Les sources ne sont pas dans Git.
`nom-1.mp3`, `nom-2.mp3` sont les variantes d'un même signal ; `music-*.mp3` sont les musiques.
Le code qui les joue est `src/audio/samples.ts` ; les moments sont décidés dans
`src/audio/sounds.ts`. Le son reste coupé au départ.

## Choisis par le parent et son fils (Pixabay)

Licence de contenu Pixabay : usage dans un jeu autorisé, y compris commercial, sans crédit
obligatoire ; revente des fichiers seuls interdite.

| Fichier      | Moment                                 | Source                                                                                        | Auteur       |
| ------------ | -------------------------------------- | --------------------------------------------------------------------------------------------- | ------------ |
| `wave-end-1` | fin de vague                           | https://pixabay.com/sound-effects/film-special-effects-level-complete-143022/                 | universfield |
| `lost-1`     | défaite (voix « Game over », voulue)   | https://pixabay.com/sound-effects/film-special-effects-game-over-deep-male-voice-clip-352695/ | universfield |
| `won-1`      | victoire                               | https://pixabay.com/sound-effects/musical-orchestral-win-331233/                              | u_it78ck90s3 |
| `music-king` | arrivée du roi à trois têtes, une fois | https://pixabay.com/sound-effects/musical-intense-trailer-intro-479062/                       | yourtunes    |

## Domaine public (CC0)

| Fichier                                                         | Moment                                              | Source                                                                                                                                                                            |
| --------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `music-epic`                                                    | dernière vague, vagues 8 et suivantes de l'aventure | « Treasure Hunter », Bo Jingles, https://opengameart.org/content/treasure-hunter                                                                                                  |
| `bite-1`, `poison-1`, `hatch-1`, `fire-1`                       | morsure, crachat, éclosion, feu                     | « 80 CC0 creature SFX #2 », https://opengameart.org/content/80-cc0-creture-sfx-2 (`attack_04`, `slime_05`, `slime_03`, `breath_02`)                                               |
| `hit-1..3`, `stomp-1..2`, `block-1..3`, `shell-1`, `arrow-1..2` | coup, dinosaure, bouclier, obus, flèche             | Kenney « Impact Sounds », https://kenney.nl/assets/impact-sounds (`impactPunch_medium`, `impactSoft_heavy`, `impactMetal_medium`, `impactPunch_heavy_001`, `impactGeneric_light`) |
| `heal-1`, `honey-1..2`, `wave-start-1`, `toggle-1`              | soin, miel, début de vague, bouton du son           | Kenney « Interface Sounds », https://kenney.nl/assets/interface-sounds (`glass_001`, `drop_001..002`, `question_001`, `click_001`)                                                |
| `gold-1`                                                        | pièces                                              | Kenney « RPG Audio », https://kenney.nl/assets/rpg-audio (`handleCoins`)                                                                                                          |
| `feast-1`                                                       | festin                                              | Kenney « Music Jingles », https://kenney.nl/assets/music-jingles (`jingles_PIZZI07`)                                                                                              |

## À savoir

- Les bruitages CC0 ont été validés à l'oreille par le parent le 11 novembre 2026, sur une page
  d'écoute comparant trois ou quatre candidats par moment.
- La musique calme (accueil, vagues tranquilles) viendra du pack acheté « Cozy Quest
  Adventures » de Matthew Wiebe ; elle n'est pas encore intégrée.
