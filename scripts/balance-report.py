"""Optional charts/PDF for the Node balance harness (requires matplotlib)."""
import csv
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages

root = Path(__file__).resolve().parent.parent
out = root / "reports"
data = json.loads((out / "balance-100.json").read_text())
summary, games, routes = data["summary"], data["games"], data["routes"]
assert "sourceHash" in summary, "Run the latest npm run balance first"
assert summary["version"] == "0.9.0", "Historical 0.9 report only; see docs/REFONTE-0.11.md for the current pilot"
paths = json.loads((out / "path-transit.json").read_text())
profiles = summary["profiles"]
wins = sum(p["wins"] for p in profiles)
assert wins == sum(g["status"] == "won" for g in games)

with (out / "parties-100.csv").open("w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["strategie", "graine", "issue", "vague_atteinte", "combat_secondes",
                     "preparation_secondes", "base_restante", "degats_base_cumules",
                     "morts_allies", "pieces_restantes", "reparations"])
    for g in games:
        writer.writerow([g["label"], g["seed"], g["status"], g["wave"],
                         round(g["activeSeconds"], 2), g["prepSeconds"], g["baseEnd"],
                         g["baseDamage"], g["deaths"], g["coinsEnd"], g["repairs"]])

plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10,
                     "axes.spines.top": False, "axes.spines.right": False,
                     "figure.facecolor": "#faf8f2", "axes.facecolor": "#faf8f2"})
fig, axes = plt.subplots(1, 2, figsize=(12, 5), layout="constrained")
labels = [p["label"].replace(" et ", "\net ").replace("Unités lourdes", "Unités\nlourdes").replace("Choix spontanés", "Choix\nspontanés") for p in profiles]
axes[0].bar(range(5), [p["wins"] for p in profiles], color=["#3c8175"] * 5)
axes[0].set(xticks=range(5), xticklabels=labels, ylim=(0, 23),
            ylabel="Victoires sur 20 essais", title="100 campagnes • 20 graines par stratégie")
for i, p in enumerate(profiles):
    axes[0].text(i, p["wins"] + .4, f'{p["wins"]}/20', ha="center", weight="bold")
x = [w["wave"] for w in summary["waves"]]
axes[1].plot(x, [w["medianSeconds"] for w in summary["waves"]], "o-",
             color="#3c8175", label="Fin de vague, médiane")
axes[1].plot(x, [w["medianFirstContact"] for w in summary["waves"]], "o-",
             color="#c17a27", label="Première attaque, médiane")
axes[1].set(xlabel="Vague", ylabel="Secondes de jeu à ×1", xticks=x,
            ylim=(0, 45), title="Le rythme observé")
axes[1].legend(loc="upper left", frameon=False)
fig.suptitle("La Conquête des Serpents • diagnostic 0.9", weight="bold", fontsize=17)
fig.savefig(out / "equilibrage-100.png", dpi=160)

def text_page(pdf, title, blocks):
    page = plt.figure(figsize=(8.27, 11.69))
    page.text(.08, .94, title, fontsize=21, weight="bold", color="#22594f")
    y = .88
    for heading, lines in blocks:
        page.text(.08, y, heading, fontsize=13, weight="bold")
        y -= .035
        for line in lines:
            page.text(.08, y, line, fontsize=10.5)
            y -= .023
        y -= .024
    page.text(.08, .045, "Analyse automatisée, pas un test avec des enfants. Règles du jeu inchangées.",
              fontsize=9, color="#555555")
    pdf.savefig(page)
    plt.close(page)

p95 = summary["performance"]["p95SampledStepMs"]
with PdfPages(out / "bilan-100-parties.pdf") as pdf:
    text_page(pdf, "Les chemins sont assez longs", [
        ("Ce qui a réellement été exécuté", [
            f"100 campagnes : {wins} victoires, {100-wins} défaites, aucun délai maximal atteint.",
            "5 politiques d’achat, chacune sur les mêmes 20 graines initiales.",
            "Moteur TypeScript réel, 30 pas/seconde, sans rendu ni triche économique.",
            "540 traversées isolées en complément pour mesurer les chemins."]),
        ("À la vague 12, sans défenseurs : temps médians jusqu’à la base", [
            "Serpent normal : 24,4 s · Rapide : 16,3 s · Blindé : 33,2 s.",
            "Entrée du camp : 12,6 s · 8,6 s · 17,4 s respectivement.",
            "Trajet médian : environ 1 190 unités du plateau, avec les détours.",
            "Ces traversées de contrôle ne sont pas des campagnes supplémentaires."]),
        ("Le diagnostic", [
            "Conserver les trois voies et leurs jonctions ; ne pas ajouter de longueur.",
            "Vagues médianes de 25 à 38 s ; premières attaques vers 8 à 13 s.",
            "Le jeu donne du temps pour anticiper ; ×2 est déjà disponible.",
            "La stratégie à distance gagne 20/20 fois, avec zéro dégât au camp.",
            "Lourde et spontanée : 18/20 chacune ; équilibrée et mêlée : 20/20."]),
        ("Ce qu’il faut travailler ensuite", [
            "Comparer portée, interception au pont et maintien des trois défenses.",
            "La portée est une piste : presque toutes les victimes de la stratégie",
            "à distance meurent avant leur entrée dans le camp. Cause non isolée.",
            "Vérifier soins et économie avec des comparaisons contrôlées avant nerf.",
            "Préserver un mode famille accueillant ; un défi plus dur reste une option.",
            "Aucun prix, dégât, soin, délai ou trajet n’a été modifié ici."]),
    ])
    text_page(pdf, "Méthode et limites", [
        ("Performance et limites", [
            f"Moteur : moyenne {summary["performance"]["meanStepMs"]:.3f} ms/pas ; 95e percentile {p95:.3f} ms.",
            "Ce résultat cloud exclut Phaser, le GPU et une vraie tablette.",
            "Préparation imposée de 10 s/vague : durée complète estimée 7–9 min.",
            "Bots : achats avant vague, miel en combat, réparation sous 66 PV.",
            "Quatre stratégies prennent des médecins ; ce n’est pas un test",
            "d’une stratégie pure ni la preuve d’une cause unique d’avantage.",
            "Vingt graines par politique restent insuffisantes pour classer finement",
            "les stratégies ou prédire le plaisir et la difficulté pour un enfant."]),
        ("Reproduire et consulter les données", [
            "Node 24 : npm ci puis npm run balance et npm run balance:paths.",
            "Résumé : reports/balance-summary.json ; CSV : parties-100.csv.",
            "Résultats détaillés : balance-100.json et path-transit.json.",
            "Le ZIP conserve les scripts et les sources nécessaires au calcul.",
            "Le rapport complet décrit les politiques dans EQUILIBRAGE-100.md.",
            "Aucun service payant, serveur de jeu ou nouveau dessin nécessaire."]),
        ("Précautions pour les mesures de chemin", [
            "Serpent isolé, voie et variante imposées, sans œufs et sans miel.",
            "Les 540 sondes sont distinctes des 100 campagnes à économie réelle.",
            "Les sondes utilisent trois vagues, trois types et trois voies d’entrée.",
            "Les types rapide et blindé ne sont pas disponibles à la vague 1 :",
            "les sondes de cette vague sont des mesures théoriques uniquement."]),
    ])
    pdf.savefig(fig, bbox_inches="tight")
plt.close(fig)

rows = "\n".join(
    f'| {p["label"]} | {p["wins"]}/20 | {p["meanBaseEnd"]:.1f}/100 | '
    f'{p["meanDeaths"]:.2f} | {p["medianWinIncludingPreparationSeconds"]/60:.2f} min |'
    for p in profiles)
range_kills = [r for r in routes if r["profile"] == "ranged" and r["outcome"] == "killed"]
pre_camp = sum(r["defenseSeconds"] is None for r in range_kills)
doc = f"""# Équilibrage et chemins — 100 campagnes sur la 0.9

Les chemins sont assez longs pour laisser un temps de réaction. Les rallonger ajouterait
de l’attente ; la priorité mesurée est de vérifier l’avantage des armées à distance.
Ce diagnostic ne change aucune règle du jeu.

## Résultat des campagnes

{wins}/100 victoires ; {100-wins} défaites ; aucun blocage jusqu’au délai de 240 secondes par vague.

| Politique | Victoires | Base finale moyenne | Morts alliés moyens | Durée médiane des victoires, préparation comprise |
| --- | --- | --- | --- | --- |
{rows}

Les durées sont des secondes de jeu à ×1. Chaque vague a une préparation fixe de 10 s,
sans temps de lecture ni délai de clic. Les moyennes de base et de morts incluent les défaites.
Les valeurs de durée concernent uniquement les victoires.

## Longueur et rythme

540 traversées de contrôle, hors campagnes : vagues 1/6/12, trois variantes et trois
voies d’entrée, 20 graines. Un seul serpent, aucun défenseur ni œuf, pas de miel.
Le script force le type et la voie d’entrée après le premier spawn ; les choix aux
jonctions, obstacles, vitesses et passage dans la base restent ceux du moteur réel.
Les variantes rapides/blindées des sondes à la vague 1 sont théoriques et ne prétendent
pas décrire les ennemis réellement débloqués à cette vague.

À la vague 12, temps médians depuis le départ à gauche :

| Type | Première jonction | Entrée du camp, x ≥ 600 | Base atteinte, x > 1000 |
| --- | --- | --- | --- |
| Normal | 4,9 s | 12,6 s | 24,4 s |
| Rapide | 3,4 s | 8,6 s | 16,3 s |
| Blindé | 6,9 s | 17,4 s | 33,2 s |

Le chemin médian représente environ 1 190 unités du plateau, avec les détours.
La première attaque médiane des vraies vagues arrive entre 7,8 et 13,3 s ; leur
durée médiane va de 24,6 à 37,8 s. La vitesse ×2 est déjà disponible.
Les médianes de traversée ne sont pas déduites des seuls survivants des campagnes :
ce biais aurait caché les serpents éliminés avant le camp.

## Où se trouve l’avantage à examiner

La politique à distance gagne 20/20 fois, avec zéro dégât au camp et un seul mort allié
sur les vingt campagnes. {pre_camp}/{len(range_kills)} ennemis tués par cette politique meurent
avant x ≥ 600. Les défenseurs à portée longue interceptent en amont ; c’est une piste
à isoler avant d’ajuster portée, dégâts ou prix. Le test ne prouve pas qu’une seule
unité ou règle explique ce résultat.

Les défaites des armées lourdes surviennent aux vagues 6 et 12 sans mort alliée :
survivre ne suffit pas à empêcher les passages. La mobilité et la couverture des voies
méritent donc autant d’attention que les PV. Les choix spontanés perdent aux vagues 8
et 11, avec des achats moins fréquents et davantage d’or conservé.

Suite recommandée : garder le terrain ; comparer les mêmes politiques en isolant
portée, soins et couverture ; proposer les éventuels réglages plus exigeants dans un
défi distinct, après un essai avec l’enfant. Ne pas durcir le jeu familial sur ces seuls bots.

## Méthode et limites

- Moteur de production `src/game.ts`, sans rendu, à 30 Hz ; pas de modification des
  PV, récompenses, coûts, ennemis, œufs ou ressources pour les 100 campagnes.
- 20 graines initiales appariées × 5 politiques ; décisions d’achat avec un générateur
  distinct. Les états et tirages suivants peuvent diverger avec les actions des politiques.
- Les quatre politiques structurées achètent des médecins : les labels indiquent une
  préférence offensive, pas une armée composée exclusivement d’un seul type.
- Achats avant les vagues uniquement, réparation si la base est à 65 PV ou moins,
  miel à 8 s vers la voie la mieux défendue ; politique spontanée : 1–3 achats aléatoires,
  placements légaux aléatoires et miel entre 3 et 11 s sur une voie aléatoire.
- Les médecins peuvent soigner pendant les 10 s de préparation, comme dans le jeu.
  Il faut une comparaison dédiée pour mesurer leur contribution, pas les accuser d’un bug.
- Le signal `attackStateSeconds` compte des états d’attaque observés ; ce n’est pas une
  mesure fiable du temps d’engagement continu ni du plaisir ressenti. Il n’est pas utilisé
  pour déduire un taux d’ennui. Les attaques alliées sont ponctuelles, les attaques ennemies
  peuvent rester actives entre deux coups.
- {summary['totalTicks']:,} pas du moteur ; coût moyen {summary['performance']['meanStepMs']:.3f} ms,
  95e percentile {p95:.3f} ms échantillonné un pas sur 30 sur ce cloud.
  Hors rendu Phaser/GPU, hors téléphone ou tablette physique. Ce n’est pas une garantie FPS.
- 20 graines par politique, pas 100 enfants ; les écarts de 20/20 à 18/20 ne suffisent pas
  à établir un classement statistique définitif. Aucun nouveau niveau de difficulté livré.

## Reproduire

Node 24 et `npm ci`, puis `npm run balance` et `npm run balance:paths`.
`npm run balance` s’arrête en erreur si une campagne reste bloquée ; le résultat est
dans `reports/balance-100.json`, le résumé dans `reports/balance-summary.json`.
Les 540 sondes sont dans `reports/path-transit.json`.
Pour le CSV, le graphique et le PDF : `python scripts/balance-report.py`
(matplotlib requis uniquement pour ce rapport, pas pour jouer ou simuler).

Empreinte SHA-256 des fichiers TypeScript à la racine de `src/` lors de la mesure :
`{summary['sourceHash']}`. Les scripts exacts accompagnent le rapport.
"""
(root / "docs" / "EQUILIBRAGE-100.md").write_text(doc)
print(f"Report generated: {wins}/100 wins; {pre_camp}/{len(range_kills)} ranged kills before camp")
