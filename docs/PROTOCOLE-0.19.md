# Protocole avant résultats — 0.19

Les configurations et seuils ci-dessous sont établis avant les simulations.

- Découverte : huit nouvelles graines (offsets 96–103), huit profils, 64 campagnes
  sur chaque moteur 0.18/0.19, soit 128. Mêmes scripts et choix de bonus adaptatifs,
  ni entraînement ni encouragement. Les deux ordres/cadences de vagues seulement
  diffèrent ; comparaison appariée par graine/profil.
- Déclencheur de rejet : plus de deux nouvelles défaites précoces sur un même
  profil de huit parties, ou baisse globale de victoire supérieure à cinq points.
  Une telle régression entraîne l'abandon de la variation responsable, jamais une
  compensation cachée par des PV/pièces. Une correction impose une nouvelle
  cohorte de validation.
- Validation : seize graines distinctes (offsets 104–119), huit profils, six
  politiques sur 0.19 : contrôle, frappe, gardien, encouragement à huit secondes,
  encouragement à la première attaque alliée observée, frappe + premier contact.
  Ajouter le contrôle 0.18 sur les mêmes graines pour juger la variation de vagues.
  768 + 128 = 896 campagnes de validation ; total prévu 1 024 avec découverte.
- Utiliser les commandes publiques, les vrais prix et la survie réelle du héros.
  Les signaux ne modifient pas le moteur. Le laboratoire observe une attaque
  réelle pour le timing contact ; il n'utilise aucun oracle de résultat futur.
- Chaque lot archive configuration, graines, commandes, échecs et empreintes ;
  aucune erreur ni timeout ne peut être masqué. Maximum trois workers au total.
- Comparer victoires, défaites précoces, profils, pertes, durées et décisions.
  Les intervalles rééchantillonnent les graines entières. Aucune retouche après
  validation, aucune promesse de plaisir ou de supériorité universelle.

Les récompenses adaptatives de ce lot diffèrent du protocole 0.18 qui les passait
pour isoler ses nouveaux pouvoirs : ne pas comparer les pourcentages historiques
bruts comme si les deux cohortes et politiques étaient identiques.
