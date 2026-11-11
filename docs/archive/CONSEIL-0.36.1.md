# Conseil 0.36.1 — essai privé, sans fusion

Le 10 novembre 2026, une revue fraîche de toute la branche a examiné le code,
les parcours croisés et les preuves après les trois revues de lots approuvées.
Elle n’a relevé aucun défaut critique ou important. Son seul mineur concernait
le nom accessible du champ du carnet en anglais ; la correction et sa relecture
ciblée sont conservées avec les preuves de livraison.

Il s’agit de **six perspectives simulées**, pas de six personnes ni de tests
réalisés avec des enfants. [Revue complète](../../reports/interface-0361/final-review.md),
[relecture du correctif](../../reports/interface-0361/final-fix-review.md),
[bilan](BILAN-0.36.1.md) et [preuves](../../reports/interface-0361/README.md).

| Perspective                  | Avis sur cette candidate                                                                                  | À observer pendant l’essai                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Architecture et sauvegardes  | Favorable : règles et modèles gelés, carnets séparés et campagne familiale conservés.                     | Reprendre et importer les vraies données familiales.                                  |
| Android et performance       | Favorable : polices locales, géométrie mobile et association build/APK vérifiées ; motifs SVG locaux.     | Démarrage, clavier, fichier, toucher et fluidité sur le S24 physique.                 |
| UX, accessibilité et langues | Favorable après correction du nom accessible : accès Caprices, contrôles natifs 48 px et résultat unique. | TalkBack, anglais relu par un humain et actions de résultat sous le défilement.       |
| Enfant de 6 ans simulé       | Le bouton Caprices en haut et les motifs distincts facilitent le repérage.                                | Compréhension des étoiles et découverte des actions du bas.                           |
| Enfant de 9 ans simulé       | Mission et réessai sont contextualisés ; les titres français du créateur restent intacts.                 | Clarté des défis composés et du choix de carnet sans aide.                            |
| Enfant de 12 ans simulé      | Carte, chapitres, reprises et tactique sont conservés.                                                    | Difficulté et intérêt des gros alliés, à tester sans déduire leur valeur du seul DPS. |

Les six sujets que la revue ne pouvait pas juger sont maintenus explicitement :
essai physique S24 et technologies d’assistance ; qualité humaine de l’anglais
et expérience réelle des enfants ; décision d’expédier les réglages d’équilibrage ;
reproduction des 44 092 parties de l’audit et valeur globale des achats ; migration
réelle du dépôt ; certification exhaustive d’accessibilité. Le coordinateur les
accepte chacun comme limites de cet essai, sans les déclarer validés.

Les cinq réglages ont uniquement été mesurés sur 1 080 parties appariées. La portée
du bonus de morsure attend clarification et les anciens codes/camps nécessitent
un routage versionné avant toute modification des valeurs. Aucun réglage, prix,
SDK, achat ou génération payante ajouté.

**STOP :** nouvel essai parental sur l’APK attendu. Ni fusion dans
`claude/caprices`/`main`, ni publication du site. L’aide longue, les explications
médicales et le repérage du défilement des résultats restent des observations
séparées ; aucune refonte supplémentaire n’est lancée.
