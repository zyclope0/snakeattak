"""Readable report from fixed-policy validation; never selects parameters."""
from pathlib import Path
import json
from collections import Counter
r=Path(__file__).resolve().parent.parent
folder=r/'reports/balance-0.17'
s=json.loads((folder/'validation/summary.json').read_text())
raw=json.loads((folder/'validation/balance-lab.json').read_text())['games']
assert s['games']==768 and s['sourceUnchanged'] and not s['exploratorySubset']
assert all(g['status'] in ['won','lost'] for g in raw)
labels={'baseline':'Sans bonus','reinforcement':'Privilégier le renfort','honey':'Privilégier le miel',
        'crystal':'Privilégier la protection','coins':'Privilégier les pièces','adaptive':'Choix selon le camp'}
profiles={'mixed':'Mixte','melee':'Corps à corps','ranged':'Distance','heavy':'Lourds','dinosaurs':'Dinosaures',
          'mutants':'Mutants','casual':'Occasionnel','clustered':'Regroupé'}
base=next(c for c in s['configs'] if c['id']=='baseline')
old={(g['seed'],g['profile']):g for g in raw if g['id']=='baseline'}
lines=['# Les cadeaux de chapitre — version 0.17','',
'Après les vagues4 et8, le joueur choisit un cadeau parmi trois propositions, ou continue sans bonus. Les combats restent automatiques. Cette passe ajoute deux décisions simples et une variation entre les parties, sans ajouter d’unité, de serveur ou de compte. Les modes de difficulté et l’hébergement direct sont des étapes distinctes.','',
'## Ce qui est jouable','',
'- Toujours un renfort à choisir et deux propositions parmi miel, protection et pièces. Le renfort varie entre Bouclier, Ninja et Vélociraptor, tous déjà débloqués.',
'- **Renfort offert à placer** : prix affiché Offert. Le bon reste disponible après un emplacement refusé et n’est consommé qu’à la réussite du placement normal. Il peut être gardé pour plus tard.',
'- **Miel amélioré** : +4 secondes par pot pour le reste de la partie. Deux bonus au maximum : durée de base14s, puis18s et22s. Le compte à rebours réel et l’interface utilisent la même durée.',
'- **Garde du cristal** : réserve de18points absorbant les passages ordinaires, soit deux impacts de9. Deux choix donnent au plus36points ; elle ne se recharge pas. Le roi l’ignore : son entrée reste fatale.',
'- **Bourse** : +100pièces, une seule fois par choix. Les achats gardent les prix habituels.',
'- Une offre en attente bloque le lancement suivant jusqu’au choix ou au renoncement. Les cartes sont dans le flux de préparation, accessibles au clavier et sur téléphone. Elles ne prennent pas le focus d’un dialogue déjà ouvert.','',
'## Sauvegarde et architecture','',
'Les offres utilisent une graine séparée du RNG de combat. Ouvrir le panneau ou recharger ne refait pas le tirage. Campv3 avec choix, bons consommés et protection restante ; lecturev1/v2 conservée. Une ancienne sauvegarde exactement au jalon4/8 reçoit l’offre correspondante ; pas de cadeau rétroactif pour les étapes passées. Les effets ne sont jamais réappliqués au chargement. Recharger pendant un combat reprend le dernier camp préparé, comme auparavant.',
'',
'Les règles et la validation sont dans src/rewards.ts. Game applique les effets par ses méthodes publiques ; l’interface n’invente aucun recrutement, dégâts ou minuteur. Le cristal conserve100points de vie. Aucun service réseau, bibliothèque ou fichier graphique nouveau ; les portraits et le pot de miel existants sont réutilisés.','',
'## Protocole de comparaison','',
'**768 campagnes complètes** : six politiques × huit profils × seize graines nouvelles, distinctes des64 graines utilisées en0.16. Les valeurs des bonus ont été fixées avant cette série ; aucune sélection ni retouche à partir de ses résultats. Simulation du vrai moteur à30pas/s, prix et budgets normaux. Les seuls cadeaux sont ceux que le joueur peut réellement choisir. Trois workers au maximum. Toutes les défaites, erreurs et limites de temps sont conservées ; limite240s par vague.',
'',
'La référence renonce explicitement aux deux offres par Game.skipReward. Les autres bots privilégient le renfort, le miel, la protection, les pièces ou choisissent selon le camp. Si leur préférence n’est pas offerte, ils prennent le renfort disponible. Les bons sont placés via Game.recruit, avec coût0 enregistré. La composition du profil peut donc recevoir cet allié supplémentaire. Les politiques de miel du bot restent celles de0.16, y compris les scénarios sans utilisation ; un bonus de miel peut être peu utile dans ces scénarios.',
'',
'Le contrôle sans bonus a aussi été comparé directement au snapshot0.16, graine42 pour trois profils (mixte, mutants, distance) : mêmes actions, vagues, santé, ressources, morts, kills et durées. Les nouvelles métadonnées de choix sont naturellement distinctes. Ce contrôle ciblé ne prétend pas prouver l’équivalence sur toute graine.',
'',
'## Résultats','',
'| Politique | Victoires | Défaites avant vague12 | Taux global | Intervalle95% par graines |',
'|---|---:|---:|---:|---:|']
pct=lambda x:f'{100*x:.1f}%'.replace('.',',')
for c in s['configs']:
 ci=c['winClusterBootstrap95'];lines.append(f'| {labels[c["id"]]} | {c["wins"]}/{c["games"]} | {c["earlyLosses"]} | {pct(c["winRate"])} | {pct(ci["low"])} – {pct(ci["high"])} |')
lines+=['',f'Erreurs : **{sum(c["errors"] for c in s["configs"])}** ; dépassements de temps : **{sum(c["timeouts"] for c in s["configs"])}**. Empreintes des sources inchangées sur toute la série.',
'', '| Profil | Sans bonus | Renfort | Miel | Protection | Pièces | Selon le camp |','|---|---:|---:|---:|---:|---:|---:|']
order=['baseline','reinforcement','honey','crystal','coins','adaptive']
for profile,label in profiles.items():
 cells=[next(p for p in next(c for c in s['configs'] if c['id']==id)['profiles'] if p['profile']==profile) for id in order]
 lines.append('| '+label+' | '+' | '.join(f'{p["wins"]}/16' for p in cells)+' |')
lines+=['','Les huit profils d’une même graine sont corrélés. Les intervalles globaux rééchantillonnent donc des graines entières (2000tirages). Le Wilson global conservé dans les JSON est un diagnostic nominal ; les Wilson par profil et les comparaisons appariées sont également disponibles.','',
'| Politique | Gain apparié vs référence | IC95% du gain | Scénarios gagnés / perdus nouvellement |','|---|---:|---:|---:|']
for p in s['paired']:
 d=p['winRateDifferenceClusterBootstrap95'];rows=[g for g in raw if g['id']==p['id']]
 gains=sum(g['status']=='won' and old[g['seed'],g['profile']]['status']!='won' for g in rows)
 reg=sum(g['status']!='won' and old[g['seed'],g['profile']]['status']=='won' for g in rows)
 lines.append(f'| {labels[p["id"]]} | {100*d["difference"]:+.1f}points | [{100*d["low"]:+.1f};{100*d["high"]:+.1f}] | {gains} / {reg} |')
choices=Counter(c['id'] for g in raw for c in g['rewardChoices'])
unused=sum(not c['used'] for g in raw for c in g['rewardChoices'])
free=sum(a['kind']=='recruit' and a['cost']==0 for g in raw for a in g['actions'])
ward=sum(18*sum(c['id']=='cristal' for c in g['rewardChoices'])-g['wardRemaining'] for g in raw)
lines+=['','## Effets réellement employés','',f'Choix et renoncements enregistrés : `{json.dumps(dict(choices),ensure_ascii=False)}`.',
f'Renforts offerts placés : **{free}** ; bons encore inutilisés à la fin : **{unused}**. Dégâts absorbés par la protection sur l’ensemble des campagnes : **{ward:g}**. Ces compteurs distinguent une carte choisie d’un effet réellement utile.',
'',
'## Vérifications et limites','',
'200 tests natifs passent : jalons, offre unique, pause, commandes refusées, RNG indépendant, placement et persistance du bon, absorption réelle, roi entrant fatal, durée du miel, migration et corruption des sauvegardes. Une relecture indépendante du moteur, de la sauvegarde, de l’interface et du laboratoire n’a relevé aucun défaut bloquant. Le contrôle de cohérence du jalon a été renforcé après un test reproduisant une offre effacée ; les anciennes frontières de test sont désormais de vrais campsv2.',
'',
'Les essais navigateur vérifient le dialogue ouvert avant apparition, la stabilité du focus au rafraîchissement, le clavier, pause, rechargements avant/après choix et placement, trois formats1440/390/320px, les prix offerts et les quatre effets. Le jeu et l’interface font aussi l’objet de contrôles web/HTMLautonome. Le test de rendu et de restauration WebGL est effectué hors charge des simulations. Aucun appareil physique ni plaisir d’enfant n’est mesuré ici.',
'',
'Les bonus ne constituent pas une amélioration automatique de toute stratégie : ajouter un allié modifie la couverture des voies, et prolonger le miel change le tempo et les regroupements. Les comparaisons doivent être lues avec leurs pertes nouvelles aussi bien que leurs gains. La possibilité de renoncer est conservée ; aucun bonus n’a été retouché pour masquer un résultat défavorable. Une augmentation du taux de victoire ne prouverait pas le fun ni un équilibrage idéal. Ces bots connaissent les règles et leurs taux de réussite peuvent être élevés. Les écarts entre politiques avec seize graines restent incertains ; on ne désigne pas de meilleur choix universel. Le test familial doit surtout vérifier que les deux décisions sont comprises et donnent envie de recommencer.',
'',
'## Reproduire','',
'Node24, npm ci, puis :','',
'```sh\nnpm run balance:lab -- --stage rewards017 --configs reports/balance-0.17/configs.json --out reports/reproduction-017 --workers 3\nnpm run test:rewards\n```','',
'Les données brutes, campagnes, offres choisies, graines, paramètres, empreintes et résultats appariés sont dans reports/balance-0.17/validation. Les tests de livraison sont consignés dans reports/verification-0.17.json. Le snapshot historique0.16 est inclus pour les replays antérieurs ; un replay doit utiliser ses sources exactes. Les temps CPU/muraux dépendent de la machine et sont exclus des empreintes des résultats.']
(r/'docs/BONUS-0.17.md').write_text('\n'.join(lines)+'\n')
evidence={'version':'0.17.0','games':768,'sourceUnchanged':s['sourceUnchanged'],'resultsHash':s['resultsHash'],
 'sourceHash':s['sourceHash'],'scriptHash':s['scriptHash'],'choices':dict(choices),'freeRecruits':free,
 'unusedVouchers':unused,'wardAbsorbed':ward,'errors':sum(c['errors'] for c in s['configs']),
 'timeouts':sum(c['timeouts'] for c in s['configs'])}
(folder/'evidence.json').write_text(json.dumps(evidence,indent=2)+'\n')
print(json.dumps(evidence))
