// Empreintes des voyages de la version 1 (table du 14 novembre 2026 après le second passage
// d'équilibrage : bourse du roi réduite de 300 pièces ; moteur du commit 5b7306c).
// La version 1 n'était pas publiée quand ces empreintes ont été refaites. Une fois publiée,
// ne les régénère pas pour faire passer un test : une empreinte différente est un voyage
// différent pour un code déjà partagé. De nouveaux réglages sont une version 2 du voyage.
// 15 novembre 2026 : le roi s'appelle « King Snake ». Un voyage change de hachage parce que
// son dernier message nomme le roi ; son code, ses bonus et chaque étape sont les mêmes.
export const expectedVoyageTraces: Readonly<Record<string, string>> = Object.freeze({
  'graine 2026, joueur 0':
    'fallen 4/5 [renfort-raptor cristal cristal miel] won w3 b100 g313 k25 s2137 | won w3 b100 g364 k31 s2102 | won w3 b100 g1045 k37 s2313 | won w3 b100 g603 k74 s3506 | lost w4 b0 g258 k63 s6381 5582550b41f155d4f34ea3d1',
  'graine 31337, joueur 1':
    'fallen 4/5 [renfort-bouclier pieces miel renfort-ninja] won w3 b100 g323 k25 s1889 | won w3 b100 g754 k31 s2937 | won w3 b100 g650 k37 s2456 | won w3 b91 g586 k73 s4728 | lost w3 b0 g460 k26 s3520 3ed66d6fb2c127ba8d80d077',
  'graine 777, joueur 3':
    'fallen 4/5 [miel cristal renfort-raptor miel] won w3 b100 g328 k25 s2116 | won w3 b100 g359 k31 s2293 | won w3 b100 g1035 k37 s3260 | won w3 b73 g523 k69 s4576 | lost w3 b0 g53 k30 s3318 89dd92fa36d9e96186925a8f',
  'graine 123456, joueur 4':
    'arrived 5/5 [cristal pieces cristal renfort-ninja] won w3 b100 g298 k25 s1884 | won w3 b100 g744 k31 s2329 | won w3 b100 g744 k42 s3076 | won w3 b100 g457 k44 s6462 | won w4 b100 g1053 k76 s4255 d68ae4f219ecd256da2a2cf8',
  'graine 1048575, joueur 2':
    'fallen 3/5 [miel renfort-ninja cristal] won w3 b100 g678 k25 s2265 | won w3 b100 g369 k31 s2044 | won w3 b100 g650 k37 s2390 | lost w3 b0 g464 k28 s3416 a30b2de03c07e092f3c64814',
  'graine 0, joueur 5':
    'arrived 5/5 [renfort-bouclier renfort-bouclier renfort-bouclier cristal] won w3 b100 g744 k31 s2399 | won w3 b100 g385 k37 s2422 | won w3 b100 g463 k49 s2786 | won w3 b82 g854 k45 s4682 | won w4 b91 g654 k74 s4147 3f30d4496a336d8f50ae82c4',
  // Version 2 (18 novembre 2026, souhait du fils accepté par le parent) : King Snake vient
  // avec ses deux gardes et son guérisseur. Les quatre premières étapes sont les mêmes.
  'graine 2026, joueur 0, version 2':
    'fallen 4/5 [renfort-raptor cristal cristal miel] won w3 b100 g313 k25 s2137 | won w3 b100 g364 k31 s2102 | won w3 b100 g1045 k37 s2313 | won w3 b100 g603 k74 s3506 | lost w4 b0 g84 k55 s5308 b4188319cda747922c28e9c3',
  'graine 31337, joueur 1, version 2':
    'fallen 4/5 [renfort-bouclier pieces miel renfort-ninja] won w3 b100 g323 k25 s1889 | won w3 b100 g754 k31 s2937 | won w3 b100 g650 k37 s2456 | won w3 b91 g586 k73 s4728 | lost w3 b0 g472 k27 s3571 c4bd8afa515ef042487f21e1',
  'graine 777, joueur 3, version 2':
    'fallen 4/5 [miel cristal renfort-raptor miel] won w3 b100 g328 k25 s2116 | won w3 b100 g359 k31 s2293 | won w3 b100 g1035 k37 s3260 | won w3 b73 g523 k69 s4576 | lost w3 b0 g65 k31 s3422 f02dcf9ea159e2aa0669a07e',
  'graine 123456, joueur 4, version 2':
    'arrived 5/5 [cristal pieces cristal renfort-ninja] won w3 b100 g298 k25 s1884 | won w3 b100 g744 k31 s2329 | won w3 b100 g744 k42 s3076 | won w3 b100 g457 k44 s6462 | won w4 b100 g1101 k80 s4982 059476054e4ab9572c6c1c42',
  'graine 1048575, joueur 2, version 2':
    'fallen 3/5 [miel renfort-ninja cristal] won w3 b100 g678 k25 s2265 | won w3 b100 g369 k31 s2044 | won w3 b100 g650 k37 s2390 | lost w3 b0 g464 k28 s3416 10d3be3d14c2ba0e1fd2b5bf',
  'graine 0, joueur 5, version 2':
    'arrived 5/5 [renfort-bouclier renfort-bouclier renfort-bouclier cristal] won w3 b100 g744 k31 s2399 | won w3 b100 g385 k37 s2422 | won w3 b100 g463 k49 s2786 | won w3 b82 g854 k45 s4682 | won w4 b100 g690 k77 s4548 b5274e59a26681c02bdcf27a',
});
