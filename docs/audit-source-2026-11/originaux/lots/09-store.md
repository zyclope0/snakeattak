# Lot 9 — Fiche du store et conformité (≈ 3 h)

Objectif : tout préparer pour la Play Console et lancer le test fermé obligatoire
(12 testeurs pendant 14 jours consécutifs, compte personnel créé après le 13/11/2023).

## Tâches

1. Page statique de politique de confidentialité en FR, EN, DE, IT : aucune donnée collectée,
   sauvegarde locale sur l'appareil, achat géré par Google.
2. Réponses à préparer : public cible (6–8 et 9–12 ans), formulaire « Sécurité des données »
   (aucune donnée collectée ni partagée), questionnaire IARC, catégorie.
3. Textes de la fiche (titre, description courte, description longue) dans les 4 langues, sans promesse inventée.
4. Images du store :
   - Icône 512×512 : `../assets-proposes/icone-512.png` (à télécharger, voir `A-TELECHARGER.md`),
     redimensionnée en PNG 512×512, coins carrés (Google applique son masque).
   - Bannière 1024×500 : partir d'une capture du jeu, pas de l'image générée (ciel blanc, style différent).
     Brouillon : `../assets-proposes/banniere-brouillon-capture-1024x500.png`.
   - Captures : script Playwright qui produit les captures téléphone paysage et tablette depuis le jeu.
5. Marche à suivre pour créer le test fermé et inviter 12 testeurs, avec un message d'invitation prêt à envoyer.

## Critères

- Tout dans `docs/publication/` ; le parent relit chaque texte avant de le coller dans la Play Console.
- Identifiant d'application définitif choisi avant la première publication (aujourd'hui
  `com.conqueteserpents.famille`, marqué provisoire) : il ne pourra plus changer ensuite.
