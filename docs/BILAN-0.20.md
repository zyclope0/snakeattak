# Bilan 0.20 — souvenirs et sauvegarde familiale

La version ajoute un bilan repliable de chapitre et un transfert de fichier local.
Elle conserve les règles, la DA et le catalogue des enfants.

## Combat conservé

Les 19 modules moteur correspondent exactement à leurs empreintes 0.19. Quatre
graines nouvelles et huit profils donnent 32 comparaisons appariées, soit 64
exécutions. Toutes les métriques hors mesure CPU/murale sont identiques, y compris
l'horloge du jeu ; 29/32 victoires dans les deux groupes, zéro erreur ou timeout.
Les résultats complets sont dans reports/control-0.20/evidence.json. Les 1 024
campagnes 0.19 ne sont pas présentées comme de nouvelles simulations.

## Données et parcours

L'export lit le camp préparé en mémoire et la carrière courante. Le test réel
transporte file → HTTPS local → file, compare survivants, PV, or, RNG, cadeaux
déjà utilisés, étoiles, équipes et camps de chapitre, puis recharge le navigateur.
Un combat suspendu est remplacé seulement après confirmation ; l'export pendant
combat garde son point de reprise. Un profil seul ne réintroduit pas l'ancienne
armée. Les fichiers invalides, le quota et les lectures tardives sont traités sans
annonce mensongère de réussite. La clé unique rend le remplacement persistant
atomique avant la modification de la session.

Les bilans montrent les données existantes, avec le total de victimes explicitement
cumulé depuis le début. L'ancien minimum synthétique n'est pas inventé comme
statistique historique. Une reprise reste statique ; seules les vraies transitions
observées ont une animation, désactivée avec les mouvements réduits.

## Validation et limites

La validation finale est tracée dans reports/verification-0.20.json. Les tests
couvrent anciens formats, cadeaux, tableaux creux et cycles, tailles, copies,
clavier, annulation, origine HTTPS locale et formats 320/390/844/1440 px. Le
certificat local est temporaire et n'est pas une vérification de l'authentification
privée de production. Les mesures de persistance sont dans
reports/family-performance-0.20.json et ne garantissent pas les performances GPU.

Aucun essai d'enfant ou d'appareil physique n'est revendiqué. La sauvegarde reste
locale ; le fichier n'est pas une synchronisation automatique. La victoire finale
transporte ses étoiles et le dernier camp préparé, pas un faux plateau de combat.
Les deux échecs de rechargement file 0.19 restent inexpliqués ; ce nouveau transfert
n'est pas déclaré comme leur correction. Pour jouer, privilégier le lien HTTPS.

Les fichiers JSON ne contiennent aucun nom de joueur ou secret nécessaire au jeu.
Aucune nouvelle image payante ni dépendance réseau de gameplay n'est ajoutée.

## Livraison vérifiée

Les 268 tests natifs et les 14 contrôles finaux réussissent. Le build exact a été
publié avec le commit dbcab87ef649e734fad6e1c0ff2015f919763f2f ; le service de
publication confirme succeeded, à la même adresse privée. Aucun changement
d’audience. L’accès authentifié depuis le navigateur propriétaire et les
appareils physiques restent à vérifier par la famille.
