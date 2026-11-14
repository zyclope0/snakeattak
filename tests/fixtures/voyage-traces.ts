// Empreintes des voyages de la version 1 (table du 14 novembre 2026, moteur du commit 5b7306c).
// Ne les régénère pas pour faire passer un test : une empreinte différente est un voyage
// différent pour un code déjà partagé. De nouveaux réglages sont une version 2 du voyage.
export const expectedVoyageTraces: Readonly<Record<string, string>> = Object.freeze({
  'graine 2026, joueur 0':
    'VOYAGE-1-01ZA-AV fallen 4/5 [renfort-raptor cristal cristal miel] won w3 b100 g313 k25 s2137 | won w3 b100 g364 k31 s2102 | won w3 b100 g1045 k37 s2313 | won w3 b100 g603 k74 s3506 | lost w4 b0 g221 k71 s4968 43aef585d008e8dc6a52729a',
  'graine 31337, joueur 1':
    'VOYAGE-1-0YK9-AY arrived 5/5 [renfort-bouclier pieces miel renfort-ninja] won w3 b100 g323 k25 s1889 | won w3 b100 g754 k31 s2937 | won w3 b100 g650 k37 s2456 | won w3 b91 g586 k73 s4728 | won w3 b8 g889 k36 s3824 37e4e6f2989cab675f38c489',
  'graine 777, joueur 3':
    'VOYAGE-1-00R9-W4 arrived 5/5 [miel cristal renfort-raptor miel] won w3 b100 g328 k25 s2116 | won w3 b100 g359 k31 s2293 | won w3 b100 g1035 k37 s3260 | won w3 b73 g523 k69 s4576 | won w3 b100 g593 k48 s3552 476693fa084ae523fda7bed1',
  'graine 123456, joueur 4':
    'VOYAGE-1-3RJ0-P2 arrived 5/5 [cristal pieces cristal renfort-ninja] won w3 b100 g298 k25 s1884 | won w3 b100 g744 k31 s2329 | won w3 b100 g744 k42 s3076 | won w3 b100 g457 k44 s6462 | won w4 b100 g1058 k76 s4263 69aa2fa52addb2148ae4a718',
  'graine 1048575, joueur 2':
    'VOYAGE-1-ZZZZ-5X fallen 3/5 [miel renfort-ninja cristal] won w3 b100 g678 k25 s2265 | won w3 b100 g369 k31 s2044 | won w3 b100 g650 k37 s2390 | lost w3 b0 g464 k28 s3416 9fc2d344471b5046d3002424',
  'graine 0, joueur 5':
    'VOYAGE-1-0000-ND arrived 5/5 [renfort-bouclier renfort-bouclier renfort-bouclier cristal] won w3 b100 g744 k31 s2399 | won w3 b100 g385 k37 s2422 | won w3 b100 g463 k49 s2786 | won w3 b82 g854 k45 s4682 | won w4 b100 g616 k75 s3899 1a726b5b2f24d955a60a1531',
});
