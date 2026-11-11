"""Optional version comparison charts; requires matplotlib, never used by the game."""
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
root=Path(__file__).resolve().parent.parent
old=json.loads((root/'reports/baseline-0.9/balance-summary.json').read_text())
new=json.loads((root/'reports/final-0.10/balance-summary.json').read_text())
assert new['version']=='0.10.0'
assert sum(p['games'] for p in new['profiles'])==100
rows=[]
for before,after in zip(old['profiles'],new['profiles']):
 assert before['profile']==after['profile']
 rows.append(f"| {after['label']} | {before['wins']}/20 → {after['wins']}/20 | {before['meanBaseEnd']:.1f} → {after['meanBaseEnd']:.1f} | {100*before['meanGuardEdgeFraction']:.1f} % → {100*after['meanGuardEdgeFraction']:.1f} % |")
wins=sum(p['wins'] for p in new['profiles'])
edge_old=sum(p['meanGuardEdgeFraction'] for p in old['profiles'])/5*100
edge_new=sum(p['meanGuardEdgeFraction'] for p in new['profiles'])/5*100
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False})
fig,axes=plt.subplots(1,2,figsize=(12,5),layout='constrained')
names=['Équilibrée','Mêlée\net soins','Distance','Unités\nlourdes','Choix\nspontanés']
for i,(label,color,version) in enumerate([('0.9','#aebbb5',old),('0.10','#357b6d',new)]):
 axes[0].bar([x+(-.18 if i==0 else .18) for x in range(5)],[p['wins'] for p in version['profiles']],width=.35,color=color,label=label)
axes[0].set(xticks=range(5),xticklabels=names,ylabel='Victoires sur 20 graines',ylim=(0,22),title='Campagnes avec achats légaux')
axes[0].legend(frameon=False)
axes[1].bar(['0.9','0.10'],[edge_old,edge_new],color=['#aebbb5','#357b6d'])
axes[1].set(ylabel='Part moyenne des combattants non mobiles (%)',ylim=(0,100),title='Regroupement au bord du camp (x ≤ 636)')
for i,v in enumerate([edge_old,edge_new]):axes[1].text(i,v+2,f'{v:.1f} %',ha='center',weight='bold')
fig.suptitle('Défenses réparties • comparaison automatisée',fontsize=17,weight='bold')
fig.savefig(root/'reports/comparaison-0.10.png',dpi=160)
plt.close(fig)
doc=f'''# Défense vivante 0.10 — bilan mesuré

La ruée collective vers le bord est corrigée : les gardiens et tireurs restent
liés à leur placement ; les ninjas/cavaliers interviennent entre voies et se
répartissent les cibles. Les secours contre un vrai blocage restent limités aux
deux combattants les plus proches si aucun allié n'est déjà capable d'intervenir.
Les soldats reviennent à leur point de défense après l'engagement.

## Résultats comparables

100 campagnes par version : cinq politiques × les mêmes vingt graines initiales,
moteur réel à 30 Hz, mêmes achats automatisés légaux avant vague, préparation fixe
de 10 secondes, miel en bataille. Aucun PV ennemi, ressource ou règle de combat
n'est modifié par les bots. Les paramètres de la 0.10 sont ceux du jeu livré.
Les états et tirages ultérieurs divergent avec les actions et nouvelles règles.

| Politique | Victoires, 0.9 → 0.10 | Base finale moyenne /100 | Part au bord, 0.9 → 0.10 |
| --- | --- | --- | --- |
{chr(10).join(rows)}

**{wins}/100 victoires, {100-wins} défaites, aucun blocage** sur le dernier lot.
La part moyenne au bord passe de **{edge_old:.1f} % à {edge_new:.1f} %**. Elle est
échantillonnée une fois par seconde pendant les batailles : pour chaque relevé,
on compte les combattants non mobiles (ni médecins, ni murs, ni ninjas/cavaliers)
à x ≤ 636, rapportés à l'effectif de ces combattants. Puis on moyenne par partie
et par politique. Ce n'est ni le temps passé à l'écran ni une mesure de plaisir.

Les vagues ont des durées médianes de {min(w['medianSeconds'] for w in new['waves']):.1f}
à {max(w['medianSeconds'] for w in new['waves']):.1f} secondes ; le maximum concerne
le roi. Les premières attaques arrivent en médiane entre
{min(w['medianFirstContact'] for w in new['waves']):.1f} et
{max(w['medianFirstContact'] for w in new['waves']):.1f} secondes. La vitesse ×2 reste disponible.

## Ce qui varie pendant la partie

- Vagues 2/6/10 : arrivées alternées sur les trois voies ; les jonctions restent
  tactiques et le miel peut toujours influencer les départs.
- Vagues 3/9 : ruées par trois, 0,4 seconde entre membres, puis 2 secondes de
  respiration ; proportion de rapides accrue, types toujours débloqués progressivement.
- Vagues 4/8 : couvées décalées (6–9, 12–15 et, si trois œufs, 18–21 secondes),
  sur des voies distinctes. Chaque œuf libère toujours deux petits serpents.
- Les annonces et le guide décrivent ces mécaniques ; aucun pouvoir manuel ajouté.

## Réglages et corrections

- Points de placement réservés même pendant un déplacement, pour éviter les domiciles
  superposés. Repères bleus en préparation, rôle visible dans le guide et pendant le placement.
- Dégâts au contact renforcés : massue 26, héros 36, bouclier 18, batteur 40,
  chevalier 42, dinosaure 54, deux têtes 56 ; ninja 155 PV et 40 dégâts.
- Archer : 150 pièces, 15 dégâts, portée 210 inchangée. Sa sécurité demande un
  investissement ; dragons et tanks gardent leurs pouvoirs d'origine.
- Cracheur : portée 220 dans le camp et priorité aux tireurs exposés à sa portée.
- Progression des dégâts ennemis plus douce : 7 + floor(vague × 0,9) ; roi ×2.
- Les médecins/infirmiers soignent les vivants, pas les palissades en bois. Un soigneur
  peut être mordu mais ne retient pas à lui seul un serpent par auto-guérison.
- Objectifs de déplacement près des rochers projetés vers une case libre.
- Sauvegarde v2, même clé locale ; lecture v1 conservée. L'ancien homeX étant inconnu,
  la position sauvegardée sert d'approximation, corrigée vers un domicile légal voisin
  si nécessaire. Pas de résurrection ni de remise à zéro du camp.

## Validation et limites

Les tests couvrent le retour au placement, les trois secteurs, la mobilité, les secours,
les duels hors portée, le cristal, les domiciles réservés, la migration près d'un rocher,
les soins sur le bois, les tempos, la pause et les œufs.

La stratégie à distance reste la plus sûre dans ce petit échantillon, malgré des pertes
et dégâts réels au camp ; l'équilibre n'est pas certifié. Les stratégies de mêlée et lourdes
sont désormais viables dans ces conditions. Les bots n'achètent pas pendant les vagues,
préparent dix secondes sans réfléchir et ne représentent pas des enfants. La politique
« équilibrée » est un algorithme fixe de rotation d'achats, pas la meilleure composition
possible. Aucun essai sur tablette physique ni test de plaisir avec des enfants.

Le coût CPU exclut Phaser/GPU ; les simulations ne prouvent pas la fluidité d'un appareil.
Aucun compte, serveur, nouvelle dépendance ou génération payante ajouté.

## Reproduire

`npm ci`, puis `BALANCE_OUTPUT=reports/final-0.10 npm run balance` avec Node 24.
Le résumé et chaque campagne sont conservés ; le script refuse une campagne bloquée.
Les valeurs de référence 0.9 sont archivées dans `reports/baseline-0.9`.
Le graphique optionnel se regénère avec `python scripts/compare-balance.py` (matplotlib).

Empreinte SHA-256 des TypeScript racine de src/ : `{new['sourceHash']}`.
'''
(root/'docs/archive/DEFENSE-VIVANTE-0.10.md').write_text(doc)
print(f'Comparison generated: {wins}/100; edge {edge_old:.1f}% -> {edge_new:.1f}%')
