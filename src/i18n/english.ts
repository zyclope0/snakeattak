import { capricesEnglish } from './dictionaries/caprices.en.ts';
import { modelEnglish } from './dictionaries/model.en.ts';
import { uiAEnglish } from './dictionaries/ui-a.en.ts';
import { uiBEnglish } from './dictionaries/ui-b.en.ts';
import { extraEnglish } from './dictionaries/extra.en.ts';
import { supplementEnglish } from './dictionaries/supplement.en.ts';

export const english: Readonly<Record<string, string>> = Object.freeze({
  ...modelEnglish,
  ...uiAEnglish,
  ...uiBEnglish,
  ...extraEnglish,
  ...supplementEnglish,
  ...capricesEnglish,
});
