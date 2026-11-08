/** Display copy only. Legacy messages and deterministic snapshots keep their original data. */
const words: Record<string, string> = {
  retenez: 'retiens',
  surveillez: 'surveille',
  achetez: 'achète',
  utilisez: 'utilise',
  protégez: 'protège',
  gardez: 'garde',
  interceptez: 'intercepte',
  résistez: 'résiste',
  surmontez: 'surmonte',
  tenez: 'tiens',
  préparez: 'prépare',
  choisissez: 'choisis',
  touchez: 'touche',
  consultez: 'consulte',
  répartissez: 'répartis',
  renforcez: 'renforce',
  réparez: 'répare',
  observez: 'observe',
  combinez: 'combine',
  rechargez: 'recharges',
  pouvez: 'peux',
  commencez: 'commence',
  votre: 'ton',
  vos: 'tes',
  vous: 'tu',
};
const formal = new RegExp('\\b(' + Object.keys(words).join('|') + ')\\b', 'gi');
export function childCopy(text: string): string {
  if (text === 'Deux massues et votre héros sont prêts. Renforcez le camp !')
    return 'Choisis un allié.';
  return text
    .replaceAll('À vous de', 'À toi de')
    .replaceAll('votre armée prête', 'tes alliés prêts')
    .replaceAll('votre armée', 'tes alliés')
    .replaceAll('vos soldats', 'tes alliés')
    .replace(formal, (word) => {
      const result = words[word.toLowerCase()];
      return word[0] === word[0].toUpperCase() ? result[0].toUpperCase() + result.slice(1) : result;
    });
}
