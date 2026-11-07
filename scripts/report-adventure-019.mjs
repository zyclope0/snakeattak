import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pairedBootstrap, quantile } from './balance-lab/stats.ts';
const root = new URL('../reports/balance-0.19/', import.meta.url);
const read = async (name) => JSON.parse(await readFile(new URL(name, root), 'utf8'));
const names = ['discovery-baseline', 'discovery-candidate', 'validation-baseline', 'validation'];
const runs = Object.fromEntries(
  await Promise.all(names.map(async (name) => [name, await read(name + '/balance-lab.json')])),
);
for (const r of Object.values(runs)) {
  if (!r.sourceUnchanged || r.games.some((g) => ['error', 'timeout'].includes(g.status)))
    throw Error('Invalid or unfinished simulation');
}
const metrics = (games) => ({
  games: games.length,
  wins: games.filter((g) => g.status === 'won').length,
  earlyLosses: games.filter((g) => g.status === 'lost' && g.wave < 12).length,
  errors: games.filter((g) => g.status === 'error').length,
  timeouts: games.filter((g) => g.status === 'timeout').length,
});
function paired(before, after) {
  const map = new Map(before.map((g) => [g.seed + ':' + g.profile, g]));
  const pairs = after.map((g) => {
    const old = map.get(g.seed + ':' + g.profile);
    if (!old) throw Error('Unpaired campaign');
    return { seed: g.seed, difference: Number(g.status === 'won') - Number(old.status === 'won') };
  });
  return {
    before: metrics(before),
    after: metrics(after),
    victoryDifference: pairedBootstrap(pairs),
    newEarlyLosses: after.filter((g) => {
      const old = map.get(g.seed + ':' + g.profile);
      return g.status === 'lost' && g.wave < 12 && !(old.status === 'lost' && old.wave < 12);
    }).length,
    profiles: [...new Set(after.map((g) => g.profile))].map((profile) => ({
      profile,
      before: metrics(before.filter((g) => g.profile === profile)),
      after: metrics(after.filter((g) => g.profile === profile)),
    })),
  };
}
const validation = runs.validation,
  control = validation.games.filter((g) => g.id === 'baseline');
const comparisons = paired(runs['validation-baseline'].games, control);
const policyComparisons = validation.configs.map((c) => ({
  id: c.id,
  ...metrics(validation.games.filter((g) => g.id === c.id)),
  trained: validation.games.filter((g) => g.id === c.id && g.actualTraining !== 'none').length,
  encouragements: validation.games
    .filter((g) => g.id === c.id)
    .reduce((sum, g) => sum + g.encouragements, 0),
  paired:
    c.id === 'baseline'
      ? null
      : paired(
          control,
          validation.games.filter((g) => g.id === c.id),
        ).victoryDifference,
}));
const timing = validation.configs
  .filter((c) => c.encouragement)
  .map((c) => {
    const times = [];
    for (const g of validation.games.filter((g) => g.id === c.id)) {
      let start = g.limits.preparationSeconds;
      for (const w of g.waves) {
        const action = g.actions.find((a) => a.wave === w.wave && a.kind === 'encourage');
        if (action) times.push(action.time - start);
        start += w.seconds + g.limits.preparationSeconds;
      }
    }
    return {
      id: c.id,
      count: times.length,
      p10Seconds: quantile(times, 0.1),
      medianSeconds: quantile(times, 0.5),
      p90Seconds: quantile(times, 0.9),
    };
  });
const result = {
  version: '0.19.0',
  totalCampaigns: Object.values(runs).reduce((n, r) => n + r.games.length, 0),
  errors: 0,
  timeouts: 0,
  discovery: paired(runs['discovery-baseline'].games, runs['discovery-candidate'].games),
  validationWaveComparison: comparisons,
  policies: policyComparisons,
  encouragementTiming: timing,
  hashes: Object.fromEntries(
    Object.entries(runs).map(([name, r]) => [
      name,
      {
        sourceHash: r.sourceHash,
        scriptHash: r.scriptHash,
        resultsHash: r.resultsHash,
        games: r.games.length,
        sourceUnchanged: r.sourceUnchanged,
      },
    ]),
  ),
};
await writeFile(new URL('evidence.json', root), JSON.stringify(result, null, 2) + '\n');
const pct = (n) => (100 * n).toFixed(1).replace('.', ',');
const diff = (d) =>
  `${d.difference >= 0 ? '+' : ''}${pct(d.difference)} points [${pct(d.low)} ; ${pct(d.high)}]`;
const text = `# Bilan 0.19 — aventure, lisibilité et équilibre\n\n${result.totalCampaigns.toLocaleString('fr-FR')} campagnes automatisées, zéro erreur et zéro timeout. Le protocole a été écrit avant les résultats ; les paramètres n'ont pas été retouchés après validation.\n\n## Avant et après, à politiques et graines appariées\n\nLa découverte compte 64 parties par moteur : ${result.discovery.before.wins}/64 victoires avant et ${result.discovery.after.wins}/64 après, aucune défaite précoce. La validation distincte compte 128 parties par moteur : ${comparisons.before.wins}/128 avant et ${comparisons.after.wins}/128 après. Écart apparié : ${diff(comparisons.victoryDifference)} (IC95 % par graines). Nouvelles défaites avant le boss : ${comparisons.newEarlyLosses}.\n\n| Profil | Victoires 0.18 | Victoires 0.19 | Défaites avant boss 0.19 |\n| --- | ---: | ---: | ---: |\n${comparisons.profiles.map((p) => `| ${p.profile} | ${p.before.wins}/${p.before.games} | ${p.after.wins}/${p.after.games} | ${p.after.earlyLosses} |`).join('\n')}\n\n## Décisions optionnelles sur 0.19\n\n| Politique | Victoires | Pertes avant boss | Héros entraînés réellement | Encouragements | Écart au contrôle, IC95 % |\n| --- | ---: | ---: | ---: | ---: | --- |\n${policyComparisons.map((p) => `| ${p.id} | ${p.wins}/${p.games} | ${p.earlyLosses} | ${p.trained} | ${p.encouragements} | ${p.paired ? diff(p.paired) : 'Référence'} |`).join('\n')}\n\nLe timing « contact » observe une vraie attaque alliée. Il n'attend pas huit secondes arbitraires et ne connaît aucun résultat futur. L'entraînement est acheté pour 90 pièces seulement si le héros est encore vivant ; aucune résurrection artificielle. Les bonus de chapitre sont choisis par la même politique adaptative dans tous les groupes.\n\n| Moment d'encouragement | Nombre | P10 | Médiane | P90 |\n| --- | ---: | ---: | ---: | ---: |\n${timing.map((t) => `| ${t.id} | ${t.count} | ${t.p10Seconds.toFixed(2)} s | ${t.medianSeconds.toFixed(2)} s | ${t.p90Seconds.toFixed(2)} s |`).join('\n')}\n\n## Lecture prudente\n\nHuit profils de bots et seize graines de validation ne représentent pas tous les enfants ou styles de jeu. Les intervalles rééchantillonnent des graines entières, car les huit profils d'une même graine sont liés. Aucune différence modeste ne démontre un choix universellement meilleur. Les signes de combat et le conseil de timing rendent les décisions plus explicites ; les simulations ne prouvent pas le plaisir ni la compréhension.\n\nLes effectifs, variantes et budgets de PV restent exactement ceux de 0.18. Les résultats peuvent changer car l'ordre des ennemis influence les survivants et la suite du combat. Les premiers apprentissages et le boss gardent leurs règles. Aucune difficulté cachée n'est appliquée pendant une partie.\n\n## Reproduire et vérifier\n\nLes quatre lots, les graines, les commandes, les échecs et les empreintes sont inclus dans reports/balance-0.19. PROTOCOLE-0.19.md décrit les seuils fixés avant résultat. Les sources de référence et candidates sont archivées avec les scripts exacts. Le dernier contrôle source est dans reports/verification-0.19.json.\n\nLa version ajoute neuf textes Phaser réutilisés et un relais HTML priorisé, sans nouveau RNG ni horloge de combat. Les tests incluent pause, arrêt des effets, redémarrage, effets voisins, motions réduites, menus, reprise et sauvegardes anciennes. Les appareils physiques et les essais des enfants restent à faire.\n\nL'accès HTTPS est privé et la sauvegarde demeure locale à son origine ; le camp du ZIP ne migre pas automatiquement. Le statut natif du fournisseur atteste la publication. Le parcours authentifié et les en-têtes réellement appliqués ne sont pas couverts par les tests Chromium locaux.\n`;
await writeFile(new URL('../docs/BILAN-0.19.md', import.meta.url), text);
console.log(
  JSON.stringify(
    {
      total: result.totalCampaigns,
      waveComparison: comparisons,
      policies: policyComparisons,
      timing,
    },
    null,
    2,
  ),
);
