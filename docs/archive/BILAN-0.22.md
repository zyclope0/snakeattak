# Bilan 0.22 — soins finis, volants et roi escorté

La version réalise trois idées du fils : bandages avec ravitaillement réel,
serpents volants progressifs et roi à trois têtes distinctes accompagné d'un
soigneur et de deux gardes. Les six expéditions et l'aventure classique restent.

## Équilibrage contrôlé

1120 parties finales : 648 missions appariées, 128 classiques appariés en découverte,
puis 128 classiques appariés et 216 nouvelles missions sur des graines séparées.
Ces nombres incluent le témoin 0.21 ; ce ne sont pas 1120 parties du seul candidat.
Zéro erreur ou dépassement de durée. Le contrôle adapté gagne 31/32 classiques
et 216/216 missions. Des compositions aléatoires ou sans contre-aérien restent
plus fragiles, ce qui ne remplace pas une observation réelle des enfants.

Le stock limité produit de vrais retours et recharges. Les tirs visent la tête
cracheuse, la mêlée la gardienne ; chaque tête tombée cesse d'agir, et le soigneur
n'en relève aucune. La cour occupe les derniers emplacements : en vague 12, il
reste un vrai volant (deux aux vagues 9–11). Tous les effectifs sont bornés.

La décision de conserver les paramètres précède le holdout. Les rapports détaillés,
les graines, scripts et instantanés sources sont dans reports/balance-0.22.
L'audit vérifie 1120 résultats, leur appariement, les graines disjointes et les
empreintes exactes. Les explorations séparées ne gonflent pas ce total.

## Sauvegarde et architecture

Le camp v6 conserve les bandages, l'état de ravitaillement et le délai médical.
Les camps 1–5 restent lus. Aucun soin gratuit, résurrection ou remise à plein en
ouvrant le menu. Le fichier familial v2 reste le format d'échange. Les trois
réactions 2 PV/3 PV/impact unique des serpents existants restent conservées.

healing.ts, flying.ts et bossCourt.ts portent les nouveaux modèles purs ; boss.ts
porte les têtes. Les rendus MedicalSignals, FlightSignals et BossSignals ne
modifient pas le combat. Pas de nouveau service réseau ou asset payant.

Le projet Android conserve son enveloppe Capacitor 8.6.0 et sa base TypeScript.
Il sera resynchronisé avec le build web exact. Aucun SDK, APK/AAB compilé ou
appareil physique testé n'est revendiqué. La validation finale et les empreintes
figurent dans reports/verification-0.22.json.

## Validation finale

Les 333 tests natifs et 24 contrôles finaux réussissent : web et portable, interface,
missions, cadeaux, transfert familial, trois états médicaux, vol et cour dans
une scène Phaser, mouvements réduits et écrans 320/390/844/1440. L'audit confirme
1120 parties finales, sources figées et graines de holdout séparées. Les 26 fichiers
web sont identiques à ceux embarqués dans le projet Android après synchronisation.
Le conseil accepte la livraison. Aucun appareil physique ou APK compilé testé.

Le service de publication confirme succeeded pour le build exact, commit
20d5781a09fe0f4f5ddd3d0bfdf3ebbfce4e027d. La même adresse et l'audience privée
propriétaire sont conservées. L'authentification depuis le navigateur du parent
n'a pas été testée ; la confirmation native porte sur la publication.
