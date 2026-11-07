"""Publication figure from recorded cohorts; no simulation or parameter selection."""
from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

root = Path(__file__).resolve().parent.parent
reports = root / 'reports/balance-0.16'
load = lambda stage: json.loads((reports/stage/'summary.json').read_text())
train, final = load('discovery2'), load('holdout')
baseline = next(c for c in final['configs'] if c['id']=='baseline')
shipped = next(c for c in final['configs'] if c['id']!='baseline')
labels = {'mixed':'Mixte','melee':'Corps à corps','ranged':'À distance','heavy':'Lourds',
          'dinosaurs':'Dinosaures','mutants':'Mutants','casual':'Occasionnel','clustered':'Regroupé'}
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'axes.spines.top':False,
                     'axes.spines.right':False,'figure.facecolor':'#f6f5eb','axes.facecolor':'#f6f5eb'})
fig, (left,right) = plt.subplots(1,2,figsize=(14,6.3),gridspec_kw={'width_ratios':[1,1.5]})
ids=['boss-no-boost','mutant125','mutant150','mutant175']
mutants=[next(p for p in next(c for c in train['configs'] if c['id']==i)['profiles'] if p['profile']=='mutants') for i in ids]
x=np.arange(4)
left.bar(x,[p['winRate']*100 for p in mutants],color=['#a8b8ac','#579a8c','#238575','#125c51'],width=.6)
left.errorbar(x,[p['winRate']*100 for p in mutants],
  yerr=[[100*(p['winRate']-p['winWilson95']['low']) for p in mutants],
        [100*(p['winWilson95']['high']-p['winRate']) for p in mutants]],fmt='none',color='#253d36',capsize=4)
left.set_xticks(x,['×1','×1,25','×1,5','×1,75'])
left.set_ylim(0,106)
left.set_ylabel('Campagnes gagnées (%)')
left.set_xlabel('Facteur des dégâts des deux mutants')
left.set_title('Calibrage ciblé des mutants\n8 graines de développement par variante',loc='left',fontweight='bold',pad=15)
for i,p in enumerate(mutants): left.text(i,p['winRate']*100+3,f"{p['wins']}/{p['games']}",ha='center',fontsize=10)
profiles=[p['profile'] for p in baseline['profiles']]
y=np.arange(len(profiles))
for cfg,offset,color,label in [(baseline,-.15,'#b49765','Référence 0.15'),(shipped,.15,'#167a6c','Version 0.16 livrée')]:
 ps=[next(p for p in cfg['profiles'] if p['profile']==i) for i in profiles]
 rates=np.array([p['winRate']*100 for p in ps])
 right.errorbar(rates,y+offset,xerr=[[100*(p['winRate']-p['winWilson95']['low']) for p in ps],
       [100*(p['winWilson95']['high']-p['winRate']) for p in ps]],fmt='o',color=color,capsize=3,label=label)
right.set_yticks(y,[labels[p] for p in profiles]); right.invert_yaxis()
right.set_xlim(-3,104); right.set_xlabel('Campagnes gagnées (%) · Wilson 95 % par profil')
right.set_title('Validation finale tenue à l’écart du calibrage\n24 graines × 8 profils × 2 versions = 384 campagnes',loc='left',fontweight='bold',pad=15)
right.legend(loc='lower left',frameon=False,fontsize=10)
for ax in (left,right): ax.grid(axis='x' if ax is right else 'y',alpha=.15); ax.set_axisbelow(True)
fig.suptitle('La Conquête des Serpents · équilibrage 0.16',x=.055,ha='left',fontsize=19,fontweight='bold',color='#173f36')
fig.text(.055,.035,'Simulations du moteur de production, budgets réels. Bots déterministes : ces résultats ne mesurent pas le plaisir des enfants.\nLes profils d’une même graine sont corrélés ; les comparaisons globales utilisent un bootstrap par graine entière.',fontsize=10,color='#4b5f56')
fig.subplots_adjust(left=.065,right=.97,top=.78,bottom=.20,wspace=.4)
fig.savefig(root/'artifacts/equilibrage-016.png',dpi=160,facecolor=fig.get_facecolor())
fig.savefig(reports/'equilibrage-016.pdf',facecolor=fig.get_facecolor())
print('Figure generated from discovery2 and reserved final cohort.')
