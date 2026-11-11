# Souvenirs et sauvegarde familiale — 0.20

Le parent valide la 0.19, demande la suite en conseil puis sa réalisation en
autonomie. Sa règle supérieure est de préserver l'esprit du jeu de son fils.
L'autonomie explicite dispense des approbations intermédiaires de conception.

## Intention et approche

Le conseil simulé à cinq regards retient deux améliorations complémentaires :
marquer les vrais chapitres accomplis et transporter une aventure entre appareils.
Ajouter encore des alliés/vagues alourdirait le catalogue et l'équilibrage ; de
nouveaux badges, monnaies ou missions quotidiennes ne servent pas ce petit jeu.

Conserver exactement les modules de combat, vagues, IA, RNG, prix et pouvoirs
de la 0.19. Alliés dinos/dragon/mutants/ninjas, ennemis serpents, trois voies,
œufs aléatoires, soldats autonomes et absence de résurrection restent inchangés.
Aucune dépendance nouvelle, serveur de jeu ou synchronisation automatique.

## Bilan de chapitre

Un petit panneau non modal accompagne les frontières accomplies 4/8 et la vraie
victoire 12. Utiliser uniquement les compteurs existants : étoiles de ce passage,
minimum et santé actuelle du cristal, alliés présents, serpents vaincus depuis
le départ de l'aventure. Aucun MVP, dégâts individuels, pertes ou bilan de tués
propre au chapitre sans données. Les noms d'alliés et portraits viennent du catalogue.
Une animation brève accompagne seulement une transition réellement observée de
combat à chapitre terminé ; un camp chargé affiche un bilan statique. Pas de
nouveau focus forcé, dialogue ou cadeau. Respecter les mouvements réduits.

## Fichier familial

Une entrée secondaire au menu ouvre export/import. Format JSON versionné :
`{format:'conquete-serpents-family', version:1, camp:string|null, career:CareerState}`.
Limite enveloppe 500 000 caractères et fichier 1 000 000 octets. Réutiliser les
validateurs métier, canonicaliser les champs ; ne jamais exécuter de contenu.
L'export lit la mémoire courante : dernier camp préparé + carrière vivante,
et non un ancien localStorage. En combat, défaite ou victoire, il reprend ce
dernier camp : pas de sauvegarde de combat ni du plateau de victoire vague 12.

Un import est intégralement validé puis présenté avec vague de reprise, alliés,
or et étoiles. Annuler laisse tout intact. Confirmer écrit d'abord une seule
enveloppe autoritative `conquete-serpents:family:v1`. Si l'écriture échoue,
refuser l'import sans modifier session, mémoire, profil ou anciennes clés.
Après succès seulement : remplacer le camp, les équipes, les étoiles et la
mémoire de reprise, puis revenir au menu. Un camp null remplace explicitement
l'ancienne reprise ; il ne doit pas laisser réapparaître une ancienne armée.

Au démarrage, une enveloppe valide prime sur les deux anciennes clés. En son
absence, lire les sauvegardes historiques. Les anciennes écritures peuvent rester
en miroir de compatibilité, mais l'enveloppe est la source de reprise dès qu'elle
existe. Le chemin de persistance ordinaire écrit l'enveloppe après synchronisation
du camp et de la carrière. Aucun état ancien ne doit réécrire l'import accepté.
Stockage bloqué : jeu et export en mémoire restent utilisables, import refusé avec
un message exact. Le transfert ne prétend pas résoudre les échecs file de 0.19.

## Architecture et contrats

- `progression.ts` exporte `readCareerState(raw)` et permet état initial validé et
  remplacement validé sur le même objet carrière utilisé par les contrôleurs.
- `familyBackup.ts` : types, lecture/écriture bornées, aperçu pur ; camp v1–v4 lu
  par `decodeCheckpoint`, carrière par son décodeur canonique.
- `familyPersistence.ts` : load/sync/import sur une clé, statut véridique, écritures
  inchangées ignorées. Aucun accès DOM ou réseau.
- `campMemory.ts` expose le texte courant et son remplacement validé, y compris null.
- `chapterReport.ts` et `ui/chapterReport.ts` : données dérivées et panneau borné.
- `ui/familyControls.ts` : sélection locale du fichier, aperçu, confirmation,
  téléchargement ; `main.ts` coordonne le remplacement atomique de l'état vivant.

## Vérification et conseil

Tests réels RED→GREEN pour import invalide/annulé, quota, ancien format, copies
défensives et victoire. Tester aller-retour file↔HTTPS avec les mêmes survivants,
PV, or, RNG, choix de cadeaux, équipes, scores et camps de chapitre. La victoire
finale transporte ses étoiles et son dernier camp, jamais un faux plateau won.
Comparer les empreintes des 19 modules moteur à 0.19 et effectuer un contrôle
apparié limité ; les 1 024 campagnes antérieures ne seront pas présentées comme
nouvelles simulations. Vérifier web et portable, clavier, 320 px, paysage,
mouvements réduits et choix des bonus. Conseil après chaque chantier et relecture
indépendante finale. Publier sur le même Site privé après les contrôles.
