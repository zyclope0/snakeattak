export type Language = 'fr' | 'en';
export const LANGUAGE_KEY = 'conquete-serpents:language:v1';
let current: Language = 'fr';
let catalogue: Readonly<Record<string, string>> = {};
let englishLoad: Promise<void> | undefined;
let request = 0;
const listeners = new Set<() => void>();
export const getLanguage = () => current;
export const getCatalogue = () => catalogue;
export function onLanguageChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function selectInitialLanguage(stored: unknown, languages: readonly string[]): Language {
  if (stored === 'fr' || stored === 'en') return stored;
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0];
    if (base === 'fr' || base === 'en') return base;
  }
  return 'fr';
}
export async function setLanguage(next: Language) {
  if (next !== 'fr' && next !== 'en') throw new RangeError('Unsupported language');
  const ticket = ++request;
  if (next === 'en' && !englishLoad) {
    englishLoad = import('./english.ts')
      .then((module) => {
        catalogue = module.english;
      })
      .catch((error) => {
        englishLoad = undefined;
        throw error;
      });
  }
  if (next === 'en') await englishLoad;
  if (ticket !== request) return;
  if (current === next) return;
  current = next;
  for (const listener of listeners) listener();
}
