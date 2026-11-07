"""Generate the release report from fixed-policy production-engine campaigns."""
from pathlib import Path
import json
r=Path(__file__).resolve().parent.parent;folder=r/'reports/balance-0.18'
s=json.loads((folder/'validation/summary.json').read_text());raw=json.loads((folder/'validation/balance-lab.json').read_text())['games']
assert s['games']==640 and s['sourceUnchanged'] and not s['exploratorySubset']
assert all(g['status'] in ['won','lost'] for g in raw)
labels={'baseline':'Sans nouveaux pouvoirs','force':'Frappe du héros','guard':'Héros gardien','encouragement':'Encouragement seul','combined':'Frappe + encouragement'}
lines=['# Validation0.18 — accueil, progression et inspirations','',
'La version ajoute un accueil illustré, trois chapitres avec meilleurs scores, trois équipes de huit favoris, une vraie reprise de chapitre, les portées au placement, un entraînement exclusif du héros et un encouragement de huit secondes. L’analyse par jeu, les sources et les exclusions sont dans INSPIRATIONS-0.18.md.','',
'## Protocole','',
'640 campagnes complètes : cinq politiques × huit profils × seize graines nouvelles (offsets80–95), distinctes des80 graines précédentes. Aucun paramètre choisi ou retouché après ces résultats. Contrôle sans entraînement ni encouragement ; les bonus0.17 sont explicitement passés pour isoler les nouveaux pouvoirs. Les équipes favorites et les étoiles ne créent aucune unité et ne sont pas un bonus caché de simulation.',
'',
'Les bots utilisent le vrai moteur à30pas/s, les prix et placements normaux. Les entraînements sont achetés pour90pièces à partir de la préparation de vague5, seulement si le héros est encore vivant et le budget disponible. Le coût figure dans les actions et les dépenses. Un héros mort n’est pas ressuscité pour rendre le test favorable. Les scénarios d’encouragement l’activent via la commande publique à8secondes de combat, au plus une fois par vague. Limite240s par vague, trois workers maximum, tous les échecs conservés.',
'',
'Les chiffres testent ces politiques de bots, pas la compréhension ni le plaisir des enfants. Les intervalles globaux rééchantillonnent des graines entières car huit profils d’une même graine sont corrélés. Aucune conclusion de meilleur choix universel à partir de seize graines.','',
'## Résultats','',
'| Politique | Victoires | Pertes avant vague12 | Entraînement effectif | Encouragements utilisés |','|---|---:|---:|---:|---:|']
for c in s['configs']:
 rows=[g for g in raw if g['id']==c['id']]
 trained=sum(g['actualTraining']!='none' for g in rows);boost=sum(g['encouragements'] for g in rows)
 lines.append(f'| {labels[c["id"]]} | {c["wins"]}/{c["games"]} | {c["earlyLosses"]} | {trained} | {boost} |')
lines+=['','| Comparaison appariée au contrôle | Écart de victoire | IC95% par graines |','|---|---:|---:|']
for p in s['paired']:
 d=p['winRateDifferenceClusterBootstrap95'];lines.append(f'| {labels[p["id"]]} | {100*d["difference"]:+.1f}points | [{100*d["low"]:+.1f}; {100*d["high"]:+.1f}] |')
errors=sum(c['errors'] for c in s['configs']);timeouts=sum(c['timeouts'] for c in s['configs'])
lines+=['',f'Erreurs : **{errors}** ; limites de temps dépassées : **{timeouts}**. Les empreintes des sources et scripts restent identiques du début à la fin du lot.',
'',
'Le même contrôle a été comparé aux sources exactes0.17 sur trois profils et la graine42 : mêmes actions, or, vies, morts, victimes, vagues, états finaux et temps de combat. Les métadonnées ajoutées de campagne sont naturellement distinctes. Ce contrôle ciblé ne prouve pas l’équivalence pour toute stratégie imaginable.',
'',
'## Contrôles fonctionnels','',
'Le moteur teste le héros vivant, ses deux spécialisations, le vrai coût, les commandes invalides et la pause. La protection ne réduit pas les réactions de mort exactes2/3. L’encouragement n’accélère ni soins ni ennemis et utilise le temps du moteur. Les étoiles suivent le minimum du cristal ; réparer ne gomme pas le passé.',
'',
'Les campsv4 conservent les bonus et lisentv1/v2/v3. Les profils vérifient huit identifiants uniques, des copies défensives et des snapshots de vrais camps. Les meilleures étoiles sont des maxima idempotents, plafonnés à neuf. La reprise de chapitre exige confirmation et restaure survivants et ressources du point choisi. Le retour à l’accueil fige le combat courant et conserve sa pause ; revenir au plateau recalcule taille et coordonnéesPhaser.',
'',
'Une relecture indépendante a vérifié moteur, profil, sauvegardes et intégration. Deux points ont été renforcés : reprise en mémoire quand le navigateur bloque le stockage, et distinction Contact/Tir/Soin pour la portée initiale. Les tests ont reproduit les comportements avant correction. Les résultats de livraison sont dans reports/verification-0.18.json. Aucun appareil physique n’est mesuré ici.',
'',
'## Reproduire','',
'```sh\nnpm ci\nnpm run verify\nnpm run test:journey\nnpm run balance:lab -- --stage campaign018 --configs reports/balance-0.18/configs.json --out reports/reproduction-018 --workers 3\n```','',
'Les données et graines sont incluses dans reports/balance-0.18/validation. Les snapshots historiques permettent les anciens replays avec leurs sources exactes. Les coûts CPU/muraux dépendent du matériel et sont exclus des empreintes de résultats. Aucun service réseau ni nouvel asset payant n’est nécessaire au jeu.']
(r/'docs/BILAN-0.18.md').write_text('\n'.join(lines)+'\n')
evidence={'version':'0.18.0','games':640,'errors':errors,'timeouts':timeouts,'sourceUnchanged':s['sourceUnchanged'],'sourceHash':s['sourceHash'],'scriptHash':s['scriptHash'],'resultsHash':s['resultsHash'],'configs':[{k:c[k] for k in ['id','games','wins','losses','earlyLosses']} for c in s['configs']]}
(folder/'evidence.json').write_text(json.dumps(evidence,indent=2)+'\n');print(json.dumps(evidence))
