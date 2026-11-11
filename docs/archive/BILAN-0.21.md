# Bilan 0.21 — six expéditions et voie Android

Six missions jouables, 19 vagues au total dans cette première région. Un nouveau
héros et deux nouveaux massues à chaque départ, budget fixé, trois terrains
et 18 configurations par mission. L'aventure classique douze vagues est conservée.
Les douze missions suivantes restent un objectif, pas un contenu livré.

## Preuves de simulation

Deux cohortes à graines séparées donnent 648 missions simulées : 528 victoires,
120 défaites, zéro erreur et zéro dépassement de 300 secondes par vague. Les
108 couples mission/configuration sont couverts par trois politiques dans chaque
cohorte. Le contrôle méthodique gagne 216/216. Les novices qui sous-dépensent
échouent souvent sur les dernières missions malgré beaucoup d'or restant.
Aucun budget ou tempo n'a été retouché entre les deux cohortes.

Durées actives mesurées 69–225 secondes, environ 1–4 minutes ; la préparation
s'ajoute. Ces simulations ne prouvent ni le plaisir ni la difficulté pour un enfant.
Les graines, achats, pertes, ressources et sources exactes figurent dans
reports/missions-0.21. La comparaison classique porte sur 21 600 instantanés et
12 checkpoints v4 identiques à la source 0.20 conservée. Elle exclut uniquement
les deux nouvelles métadonnées de mission et ne prétend pas couvrir toutes
les graines. Les anciens hashes boss ne sont pas régénérés.

## Architecture

Le jeu reste local : Phaser/TypeScript, règles séparées de l'affichage et du HTML.
Le contexte de mission est optionnel ; le format de camp v5 et le fichier familial v2
ajoutent la progression sans retirer les formats antérieurs. Simulation et rendu
partagent les mêmes routes. Aucune API ou serveur n'est requis pour une partie.

Capacitor 8.6.0 fournit une enveloppe Android à assets locaux, avec un projet natif
et des scripts de synchronisation. Java 21 est présent, mais pas le SDK/adb/Android
Studio : aucun APK/AAB compilé ou testé. Les icônes, signature et validation sur
appareil réel restent nécessaires avant diffusion. Voir ANDROID.md.

## Revue et limites

La revue indépendante a reproduit deux défauts d'intégration, corrigés avec tests
RED/GREEN : carte non actualisée après import et reprise d'un écran perdu plutôt
que du dernier camp. Le dialogue d'aperçu commence maintenant à son titre.
La version finale des contrôles est tracée dans reports/verification-0.21.json.

Aucun essai physique ou observation d'enfant n'est revendiqué. La sauvegarde
reste locale et l'export familial manuel. Les réserves historiques file restent
explicites : privilégier HTTPS, exporter régulièrement, conserver l'ancien fichier
avant de déplacer une aventure. Aucun nouveau crédit d'image payante consommé.

## Validation finale

Les 289 tests natifs et les 20 contrôles finaux réussissent, dont web/portable,
interface, missions, régressions, cadeaux, transfert file↔HTTPS local, rendu,
synchronisation et diagnostic Capacitor. Les 26 fichiers embarqués Android sont
identiques au build web testé. Le moteur simulé reste à l'empreinte des 648 parties.
Le conseil accepte la livraison de cette première région. Les limites d'appareil
physique, de navigateur authentifié en production et d'APK non compilé restent.

Le service de publication confirme succeeded pour le commit
1001e8db1780920e91861fcc2703dd9d43aaf1ba, à la même adresse privée. Le build
publié correspond aux 26 fichiers testés. L'accès authentifié depuis le navigateur
du propriétaire n'a pas été essayé ; la confirmation porte sur le déploiement.
