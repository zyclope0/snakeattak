# Lot 8 — Achat de déblocage et portail parental (v0.31.0, ≈ 6 h)

Objectif : un seul achat « Jeu complet » à 3,99 € / 4 CHF sur Android, compatible avec la politique
Familles de Google Play et un PEGI bas.

## Règles à respecter (sources dans `../AUDIT.md`)

- Politique Familles : achats ni trompeurs ni manipulateurs, pas de monnaie virtuelle, aucun SDK non
  approuvé pour enfants, pas d'identifiant publicitaire.
- PEGI depuis juin 2026 : pas d'objet aléatoire payant (PEGI 16), pas d'offre limitée dans le temps
  ni de pénalité quotidienne (PEGI 12).
- Lignes directrices DSA art. 28 : prix en monnaie nationale, l'achat ne doit pas sembler nécessaire
  pour utiliser le service → la version gratuite est un jeu complet en elle-même.

## Tâches

1. Version gratuite : missions 1 à 3 et chapitre 1 de l'aventure classique. L'achat débloque le reste
   et le contenu futur.
2. Google Play Billing via un plugin Capacitor, sans service tiers ni serveur, sans aucune collecte.
   Justifier le choix du plugin et sa compatibilité avec la politique Familles.
3. L'offre ne s'affiche qu'après un portail parental (question qu'un enfant de 6–8 ans ne résout pas seul),
   jamais pendant une partie, sans compte à rebours ni promotion.
4. Restauration de l'achat après réinstallation. Prix affiché par Google dans la monnaie du pays.
5. Version navigateur : missions 1 à 3, puis un lien vers la fiche Google Play.

## Critères

- Achat testé avec un compte de test Google Play ; restauration testée.
- Aucun appel réseau hors facturation Google (vérifier la CSP et le script d'audit).
- Sauvegardes inchangées ; critères communs du README.
