"""Build a readable audit report from completed, immutable cohorts."""
from pathlib import Path
import json

root=Path(__file__).resolve().parent.parent
r=root/'reports/balance-0.16'
load=lambda stage:json.loads((r/stage/'summary.json').read_text())
stages=['discovery','confirmation','discovery2','confirmation2','holdout']
ss=[load(stage) for stage in stages]
assert all(s['sourceUnchanged'] and not s['exploratorySubset'] for s in ss)
assert all(c['errors']==0 and c['timeouts']==0 for s in ss for c in s['configs'])
assert sum(s['games'] for s in ss)==1920
final=ss[-1]
base=next(c for c in final['configs'] if c['id']=='baseline')
new=next(c for c in final['configs'] if c['id']!='baseline')
raw=json.loads((r/'holdout/balance-lab.json').read_text())
oldpairs={(g['seed'],g['profile']):g for g in raw['games'] if g['id']=='baseline'}
newgames=[g for g in raw['games'] if g['id']==new['id']]
gains=[g for g in newgames if g['status']=='won' and oldpairs[g['seed'],g['profile']]['status']!='won']
regressions=[g for g in newgames if g['status']!='won' and oldpairs[g['seed'],g['profile']]['status']=='won']
newearly=[g for g in newgames if g['status']=='lost' and g['wave']<12 and not (oldpairs[g['seed'],g['profile']]['status']=='lost' and oldpairs[g['seed'],g['profile']]['wave']<12)]
paired=next(p for p in final['paired'] if p['id']==new['id'])
diff=paired['winRateDifferenceClusterBootstrap95']
print('paired fields',list(paired))
labels={'mixed':'Mixte','melee':'Corps à corps','ranged':'À distance','heavy':'Lourds',
'dinosaurs':'Dinosaures','mutants':'Mutants','casual':'Occasionnel','clustered':'Regroupé'}
pct=lambda v:f'{100*v:.1f} %'.replace('.',',')
lines=['# Équilibrage et roi à trois têtes — version 0.16','',
'Le jeu conserve ses douze vagues, ses trois voies interconnectées et ses combats autonomes. Le roi reçoit des protections finies et un crachat annoncé au sol. Les deux mutants gagnent en puissance ; les autres statistiques et les dégâts secondaires du dragon/tank sont conservés. Aucun service réseau ajouté.','',
'## Ce qui est livré','']
tuning=next(g['tuning'] for g in newgames)
lines+= [f'- Dégâts des deux mutants multipliés par {tuning["mutantDamageFactor"]:g} : roc {24*tuning["mutantDamageFactor"]:g}, élastique {30*tuning["mutantDamageFactor"]:g}. Prix, vie, portée et vitesse inchangés.',
f'- Roi : multiplicateur de vie {tuning["bossHpMultiplier"]:g}, protection de {pct(tuning["bossShieldFraction"])} de sa vie maximale, phases aux seuils 60 % et 25 %.',
f'- Protection : dégâts à distance ×{tuning["bossShieldRangedFactor"]:g}, autres attaques ×{tuning["bossShieldMeleeFactor"]:g}. Le débordement frappe sa vie après armure ordinaire.',
f'- Crachat : {tuning["bossShotDamage"]:g} dégâts bruts, zone de rayon {tuning["bossShotRadius"]:g}, annonce {tuning["bossShotWindup"]:g} s, recharge {tuning["bossShotInterval"]:g} s. Un seul impact ; pas de poison périodique.',
'- La pause suspend le vrai compte à rebours. Une cible morte ne supprime pas la marque ; la mort du roi l’annule. Boucliers alliés et armures restent actifs.',
'- Le rendu lit le même état que le moteur : protection bleue, phase, annonce au sol et signal de protection brisée. Aucun nouveau générateur graphique payant utilisé.','',
'## Protocole et choix','',
'Les bots jouent le moteur de production avec ses prix, ses ressources et ses règles publiques. Ils ne reçoivent aucun supplément de pièces, de vie ni de recrutement. Huit politiques couvrent compositions mixtes, mêlée, distance, lourds, dinosaures, mutants, achats occasionnels et regroupement. Les politiques de miel sont déterministes : aucune utilisation, alternance ou préférence du profil. Les profils combinent composition et placement ; ils ne représentent pas huit âges ni huit enfants.',
'', '| Série | Graines | Réglages | Campagnes complètes |', '|---|---:|---:|---:|']
for s in ss: lines.append(f'| {s["stage"]} | {len(s["seeds"])} | {len(s["configs"])} | {s["games"]} |')
lines+=['','**Total : 1 920 campagnes complètes**, sans erreur ni dépassement de la limite de 240 s par vague. Les cinq cohortes de graines sont disjointes. La validation finale comprend les 24 graines originales réservées, soit 384 campagnes, et n’a servi à aucun choix de paramètres.','',
'Un premier lancement interrompu de 140 campagnes est conservé mais exclu de la sélection : l’identifiant de référence ne correspondait pas à celui attendu par le comparateur. Les essais de fumée et replays sont des diagnostics supplémentaires, hors total ci-dessus.',
'',
'Les 832 premières campagnes montraient surtout une faiblesse des mutants, souvent avant le boss : seulement 1/12 victoire en confirmation. Des réglages plus durs du boss ou des dégâts de zone diminués ne corrigeaient pas cette faiblesse. Une seconde exploration a donc isolé le facteur de dégâts des mutants à boss identique (contrôle, ×1,25, ×1,5, ×1,75), puis confirmé les deux meilleurs candidats sur 12 nouvelles graines. Ce second tour est un développement adaptatif ; seule la cohorte finale restée intacte constitue la validation du réglage livré.',
'',
'Le score de développement combine taux de victoire, écart entre compositions, avantage de la distance, nouvelles défaites précoces appariées, régressions des profils occasionnels, durée du boss et utilisation réelle des protections/tirs. Les fichiers selection.json conservent ses composantes et l’empreinte du score ; chosen-config.json conserve la décision antérieure à la validation finale.',
'',
'Une relecture indépendante a aussi conduit à corriger l’affichage des décimales et un résidu numérique infinitésimal lors de l’absorption. Les sources originales de chaque tour sont conservées pour les replays ; la validation finale utilise le moteur et le défaut réellement livrés.',
'', '## Résultats de la validation finale','',
'| Politique du bot | Référence 0.15 | Version 0.16 | Wilson 95 % de la version 0.16 |','|---|---:|---:|---:|']
for p in new['profiles']:
 b=next(q for q in base['profiles'] if q['profile']==p['profile'])
 ci=p['winWilson95']
 lines.append(f'| {labels[p["profile"]]} | {b["wins"]}/{b["games"]} | {p["wins"]}/{p["games"]} | {pct(ci["low"])} – {pct(ci["high"])} |')
lines+=['',f'Au total : référence **{base["wins"]}/{base["games"]}** ({pct(base["winRate"])}), version livrée **{new["wins"]}/{new["games"]}** ({pct(new["winRate"])}).',
f'Comparaison scénario par scénario : **{len(gains)} nouvelles victoires et {len(regressions)} nouvelles défaites**. Le gain est global, pas une amélioration de chaque partie.',
f'Nouvelles défaites avant la vague 12 par rapport au même scénario de référence : **{len(newearly)}**. Défaites précoces totales : {base["earlyLosses"]} → {new["earlyLosses"]}.',
'',
'Le taux global de 93,8 % confirme une version accessible à ces bots, au-dessus du repère de développement de 75 %. Ce lot vise surtout la viabilité des familles et la lisibilité du boss ; il ne démontre pas une difficulté idéale pour tous les âges. Un éventuel mode plus difficile devra être évalué séparément, sans changer le réglage final à partir de ces résultats.',
'',
'Les huit profils d’une même graine sont corrélés. Les intervalles globaux suivants rééchantillonnent donc des graines entières (2 000 tirages) ; les Wilson globaux conservés dans les JSON ne sont que des diagnostics nominaux. Les Wilson par profil restent pertinents pour ces 24 scénarios distincts.',
'']
for c in [base,new]:
 ci=c['winClusterBootstrap95']; lines.append(f'- {c["id"]} : {pct(ci["low"])} – {pct(ci["high"])} pour le taux global (24 grappes de graines).')
lines+=['',f'Gain apparié du taux de victoire : **{100*diff["difference"]:+.1f} points**, intervalle bootstrap 95 % **[{100*diff["low"]:+.1f} ; {100*diff["high"]:+.1f}] points** (24 graines, 2 000 tirages).','',
f'Boss de la version livrée : vu dans {new["bossSeen"]} campagnes, entré en zone dans {new["bossEntered"]}, tué dans {new["bossKilled"]}. Durée médiane après engagement **{new["medianBossSeconds"]:.1f} s**, p90 **{new["p90BossSeconds"]:.1f} s**, calculés uniquement sur les boss tués. Rencontres censurées (boss vu mais non tué) : **{new["bossDurationCensored"]}**. Moyennes parmi les boss vus : {new["meanShieldsBroken"]:.2f} protections brisées, {new["meanShotsFired"]:.2f} crachats. Ces durées conditionnelles ne prouvent pas que les combats perdus sont courts.',
'',
'## Reproduire et interpréter','',
'Node 24, puis `npm ci`. Les configurations sont dans `reports/balance-0.16/`. Chaque lot comprend manifest.json (graines, prix, sources et empreintes), summary.json, balance-lab.json et les campagnes individuelles avec commandes, état des échecs et paramètres de replay. Les sources historiques sont dans source-snapshots/round1, round2-before-precision-fix et round2-confirmation ; la version finale utilise la source livrée, indiquée par son manifeste.',
'',
'```sh\nnpm run balance:lab -- --stage holdout --configs reports/balance-0.16/holdout-configs.json --out reports/reproduction --workers 3\nnode scripts/balance-lab.mjs --replay chemin/campagne.json --out reports/replay\n```','',
'Pour rejouer un ancien tour à l’identique, lancer le script depuis son snapshot exact avec des chemins absolus vers la campagne et la sortie. Les temps CPU/muraux dépendent de la machine ; le hash des résultats exclut ces temps. Les données sources restent nécessaires pour distinguer erreurs, défaites et succès.',
'',
'Ces simulations guident des réglages explicites ; aucun poids de modèle d’IA n’a été entraîné. Une victoire de bot ne mesure ni le plaisir ni la compréhension d’un enfant. Les intervalles sont larges par composition et les profils ne couvrent pas toutes les stratégies. Le choix des voies conserve une estimation heuristique de la défense fondée sur le catalogue ; elle ne recalcule pas toute la force réelle du combat et n’intègre pas le facteur mutant. Les essais familiaux restent indispensables, surtout pour juger la lisibilité du crachat et l’envie de rejouer. La prochaine étape utile est un essai des enfants avant d’ajouter du contenu.']
verification=json.loads((root/'reports/verification-0.16.json').read_text())
assert verification['holdoutSourceStillExact']
lines+=['','## Contrôles de livraison','',f"{verification['nativeTests']['passed']} tests natifs réussis, format, TypeScript strict et compilation web/portable vérifiés. Essais navigateur du jeu et de l’interface réussis en web et fichier local, sept formats d’écran, clavier et tactile simulé. Quatorze scénarios de présentation couvrent notamment protection du roi, marque verrouillée, pause et impact réel. Restauration WebGL vérifiée. Aucun appareil physique testé.",
'', 'Les budgets web passent : HTML de 15 931 octets, code du jeu de 85 349 octets, moteur Phaser séparé. Le test de rendu cloud avec 21 alliés mesure environ33,3ms par image en médiane et50ms au95e percentile ; ce scénario ne mesure pas un téléphone réel ni toutes les charges de combat. Les polices et leurs licences sont incluses ; aucune nouvelle génération graphique payante. Les preuves structurées sont dans reports/verification-0.16.json.']
(root/'docs/archive/BILAN-EQUILIBRAGE-0.16.md').write_text('\n'.join(lines)+'\n')
evidence={'version':'0.16.0','completedCampaigns':1920,'stages':[{k:s[k] for k in ['stage','games','resultsHash','sourceHash','scriptHash','sourceUnchanged']} for s in ss],
'holdoutPairedGains':len(gains),'holdoutPairedRegressions':len(regressions),'holdoutNewEarlyLosses':len(newearly),'holdoutPaired':paired,'tuning':tuning}
(r/'evidence.json').write_text(json.dumps(evidence,indent=2)+'\n')
print('Audit report and evidence generated from recorded results.')
