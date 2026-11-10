# Relecture et intégration0.18

Deux domaines indépendants ont été implémentés avec contrats explicites : moteur
et sauvegarde ; carrière et équipes. L'intégration menu/rendu et les simulations
ont été réalisées par le principal. Le snapshot0.17 est conservé.

Une relecture indépendante de l'ensemble des changements a confirmé les règles
de dégâts, les réactions de mort2/3, la migration des bonusv3, les maxima d'étoiles,
les copies défensives des équipes et l'absence d'armée inventée pour rejouer.
Aucun défaut critique ou important n'a été trouvé dans le moteur.

Deux points d'intégration ont été renforcés après reproduction :

- Un retry qui dépend uniquement du stockage peut ne rien faire si ce stockage
  est refusé. campMemory conserve maintenant un vrai dernier camp préparé en
  mémoire de session. Il ne remplace pas la sauvegarde persistante après fermeture.
- La portée initiale distingue Contact, Tir, Soin et défense fixe, par texte et
  couleur. Le rayon est lu depuis les données réelles de l'unité.

Les tests navigateur ont aussi révélé qu'un simple refreshPhaser gardait les
anciennes dimensions nulles d'un parent masqué par l'accueil. Le retour au plateau
relit maintenant les limites du parent avant recalcul de l'échelle et des entrées.
Le scénario de menu a été vu échouer puis passer sur les formats ciblés.

Un scénario hors connexion utilisait un drapeau sessionStorage pour resemer son
camp. La disparition de ce drapeau réécrivait la fixture initiale, alors que le
vrai camp enregistré était valide (décodage contrôlé). Le préchargement respecte
maintenant l'existence de la vraie clé du camp. Le test supprime volontairement
le drapeau puis vérifie le renfort consommé après rechargement. Échec rouge puis
succès vert ; l'échec initial reste tracé dans previousFailedChecks du rapport.

## Preuves finales

- 224 tests natifs, types stricts, format et budgets de compilation vérifiés.
- Douze contrôles : verify, portablebuild, jeu web/portable, interface web/portable,
  bonus web/portable, menu/progression web/portable,14scénarios de présentation,
  rendu/restaurationWebGL.
- 640 campagnes, zéroerreur/timeout et empreintes inchangées. Aucune retouche des
  paramètres à partir du lot. Les anciens résultats et snapshots sont conservés.
- Le contrôle sans nouveaux pouvoirs reproduit0.17 sur trois profils à graine42,
  avec actions, économie, santé, vagues et temps de combat identiques.

La relecture ne remplace pas les essais des enfants. Appareils physiques, plaisir
et performance GPU avec des effectifs extraordinaires ne sont pas validés ici.
Les chapitres sans vrai snapshot restent indisponibles pour rejouer ; une ancienne
partie en milieu de chapitre peut continuer sans reconstruction artificielle.
Les intégrités d'archives et liens publics sont vérifiées séparément avant remise.
