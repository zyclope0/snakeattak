// Empreintes produites par le moteur de la 0.37.0 (commit 9558aff), avant le découpage de game.ts.
// Ne les régénère pas pour faire passer un test : une empreinte différente est une partie différente.
// 15 novembre 2026 : le roi s'appelle « King Snake » (nom donné par le fils). Les messages du
// moteur qui le nomment font partie de l'empreinte : trois parties classiques changent de
// hachage, sans rien d'autre (même issue, même vague, mêmes pièces, mêmes pas). Avec les
// trois anciens messages, toutes les empreintes d'avant repassent.
export const expectedTraces: Readonly<Record<string, string>> = Object.freeze({
  'classique r1': 'won w12 b100 g442 k200 s11655 ce7dadc68c0211af17e04fc7',
  'classique r2': 'won w12 b100 g460 k184 s13983 9b41755417b58e00d40b4a9d',
  // Third revision (15 November 2026): the same departure and player as r2. The eggs of the
  // waves that drag on cost 18 points of crystal and 37 seconds; the game is still won.
  'classique r3': 'won w12 b82 g391 k177 s15092 a85967571a3222d9018ae89a',
  // Fourth revision (16 November 2026): the same departure and player again. With the three
  // newcomers in the waves, this player falls before the king.
  'classique r4': 'lost w12 b0 g91 k164 s15221 77b7d6fecda87bab798652cd',
  'classique r5': 'lost w12 b0 g54 k158 s13535 c9fddf06f42f2d9db877e231',
  'classique r6': 'won w12 b55 g427 k190 s16337 e98658da611e0a45c19ce252',
  'classique r7': 'won w12 b100 g374 k186 s13301 168d4dbb07a00f7c5c821c25',
  'classique r7 spinosaure': 'won w12 b91 g434 k191 s16271 360b0d8b8992ed8c991b27a8',
  'classique sans règles tactiques': 'won w12 b100 g567 k200 s13873 3eeda8696186b90a12ead3ce',
  'mission refuge': 'won w3 b100 g323 k25 s1838 ba997879695c6fcf0aa1a91d',
  'défi refuge-moyen r2': 'won w3 b100 g401 k44 s2568 bc0c8fb2412a1402f1b8aae1',
  'défi refuge-createur-moyen r1': 'won w3 b100 g313 k25 s3276 27780a3d968e5a7921f42b10',
  'mission trois-ponts': 'won w3 b100 g344 k31 s2579 4f726e055353dc269382470b',
  'défi trois-ponts-grand r1': 'lost w3 b0 g8 k19 s3022 8573506586257c9d3bcdd7a1',
  'défi trois-ponts-createur-grand r2': 'lost w2 b0 g6 k5 s1545 cce7e58fa7cdf336f13ebc16',
  'mission course': 'won w3 b100 g280 k37 s2478 58966af3a51e0ef587389490',
  'défi course-petit r2': 'won w3 b100 g370 k37 s2032 4691a0fa1a8d48692c1415ff',
  'défi course-createur-petit r1': 'won w3 b100 g635 k37 s2603 c78523acf1038675052e6ae6',
  'mission coquilles': 'won w3 b100 g436 k43 s3113 00ff678ee11aa8710a4289be',
  'défi coquilles-moyen r1': 'won w3 b100 g257 k71 s3931 040d0789b9a5df4919167665',
  'défi coquilles-createur-moyen r2': 'won w3 b100 g284 k42 s4170 c9936ad4725a23d1d19e0588',
  'mission sonnette': 'won w3 b78 g347 k39 s3422 0a9604b47cb2f956311f4193',
  'défi sonnette-grand r2': 'won w3 b94 g278 k37 s3412 4673ae7ecd7b276ef816415e',
  'défi sonnette-createur-grand r1': 'won w3 b55 g315 k38 s3143 8614390bf38d95c4d2bca622',
  'mission carrefour': 'won w4 b55 g359 k58 s5192 9ba78a2231c41bee638ef70e',
  'défi carrefour-petit r1': 'won w4 b100 g372 k62 s5114 eed991e24b2d009f9126136c',
  'défi carrefour-createur-petit r2': 'won w4 b100 g801 k64 s4553 9565c5d568586826fc40990f',
});
