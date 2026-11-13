import { NO_CAPRICE, type CapriceDefinition, type CapriceRules } from '../caprices.ts';
import { svgNode } from './svg.ts';

/**
 * The modelling-clay stickers, one per caprice name (`src/assets/caprices/`). Outside Vite
 * (unit tests) the list is empty: the line drawing is the fallback.
 */
const stickerUrls: Record<string, string> = import.meta.env
  ? import.meta.glob<string>('../assets/caprices/*.webp', {
      eager: true,
      query: '?url',
      import: 'default',
    })
  : {};

/** The creator's three challenges keep their name in all six missions: one sticker each. */
const CREATOR_STICKERS: Record<string, string> = {
  petit: 'la-tirelire',
  moyen: 'les-carapaces',
  grand: 'la-grande-charge',
};
/** The snakes' caprices, by id; "La tempête" comes back in two missions. */
const SNAKE_STICKERS: Record<string, string> = {
  'refuge-petit': 'serpents-presses',
  'refuge-moyen': 'mega-serpent',
  'refuge-grand': 'la-tempete',
  'trois-ponts-petit': 'bourse-trouee',
  'trois-ponts-moyen': 'blindcrocs',
  'trois-ponts-grand': 'grandes-rafales',
  'course-petit': 'rafales',
  'course-moyen': 'petite-tempete',
  'course-grand': 'roi-invite',
  'coquilles-petit': 'pique-nique-oeufs',
  'coquilles-moyen': 'grosse-fringale',
  'coquilles-grand': 'la-tempete',
  'sonnette-petit': 'deux-copains',
  'sonnette-moyen': 'crocs-pointus',
  'sonnette-grand': 'serpents-costauds',
  'carrefour-petit': 'plus-de-miel',
  'carrefour-moyen': 'un-seul-copain',
  'carrefour-grand': 'roi-fringale',
};
/** The file name of a caprice's sticker, or nothing for a caprice that has none. */
export function capriceStickerName(id: string): string | undefined {
  const creator = /-createur-(petit|moyen|grand)$/.exec(id);
  return creator ? CREATOR_STICKERS[creator[1]!] : SNAKE_STICKERS[id];
}

/** Presentation categories derived only from the canonical challenge flags. */
export function capriceIconType(r: CapriceRules) {
  if (r.reserve) return 'bank';
  if (r.shellEvery) return 'shell';
  if (r.king) return 'king';
  if (r.eggs || r.hatch !== 1) return 'eggs';
  if (r.kinds) return r.kinds === 1 ? 'friend-one' : 'friend-many';
  if (r.noHoney) return 'honey-empty';
  if (r.noHealers) return 'healers';
  if (r.budget !== 1) return 'purse';
  if (r.count > 1 && r.bite > 1 && r.hp > 1) return 'storm';
  if (r.speed > 1 && r.bite > 1 && r.hp > 1) return 'charge';
  if (r.speed !== 1 || r.cadence !== 1) return 'speed';
  if (r.count !== 1) return 'crowd';
  if (r.hp !== 1 && r.bite !== 1) return 'shield-fangs';
  if (r.hp !== 1) return 'shield';
  if (r.bite !== 1) return 'fangs';
  if (r.smart) return 'paths';
  return 'snake';
}
const motifs: Record<ReturnType<typeof capriceIconType>, string> = {
  bank: '<path d="M9 18h22M11 17l9-7 9 7M12 19v10m8-10v10m8-10v10M9 30h22"/>',
  shell: '<path d="M8 27a12 15 0 0 1 24 0ZM12 25l8-12 8 12M20 13v14M10 21h20"/>',
  king: '<path d="m9 15 5 5 6-10 6 10 5-5-3 14H12Z"/><circle cx="20" cy="25" r="2"/>',
  eggs: '<path d="M20 28c-14 5-11-15-6-15 4 0 9 12 6 15ZM22 29c-5-2-3-19 2-19 6 0 13 20-2 19Z"/>',
  'friend-one': '<circle cx="20" cy="15" r="5"/><path d="M11 30v-4a9 9 0 0 1 18 0v4Z"/>',
  'friend-many':
    '<circle cx="14" cy="15" r="4"/><circle cx="26" cy="15" r="4"/><path d="M7 29v-5a7 7 0 0 1 14 0v5m-2-5a7 7 0 0 1 14 0v5"/>',
  'honey-empty': '<path d="M12 14h16v16H12ZM10 11h20M16 24h8M8 32 32 8"/>',
  healers: '<path d="M16 10h8v7h7v8h-7v7h-8v-7H9v-8h7Z"/>',
  purse: '<path d="m15 10 5 3 5-3-2 8c15 15-21 20-6 0ZM14 18h12M17 26h6"/>',
  storm: '<path d="M10 19c-5-6 4-12 9-8 7-5 15 3 10 8ZM22 19l-7 9h6l-3 7 12-13h-8Z"/>',
  charge: '<path d="m10 12 12 8-12 8m10-16 12 8-12 8M7 20h13"/>',
  speed: '<path d="M9 20h21m-8-8 8 8-8 8M9 13h6M7 27h8"/>',
  crowd: '<path d="M10 14c-6 8 10 0 7 10M21 12c-6 8 10 0 7 10M12 26c-6 8 10 0 7 7"/>',
  'shield-fangs':
    '<path d="m20 9 11 5v8c0 6-11 11-11 11S9 28 9 22v-8ZM15 18l3 8 3-8m0 0 3 8 3-8"/>',
  shield: '<path d="m20 9 11 5v8c0 6-11 11-11 11S9 28 9 22v-8ZM20 14v13m-6-7h12"/>',
  fangs: '<path d="M10 13h20l-5 16-5-10-5 10Z"/>',
  paths: '<path d="M10 30V20l10-8 10 8v10M20 12v18m-14-7 4-4 4 4m12 0 4-4 4 4"/>',
  snake: '<path d="M11 25c-5-10 18-13 18-5 0 7-19 1-13-7"/>',
};
type Stickered = Pick<CapriceDefinition, 'id' | 'rules'>;
/**
 * Draws the sticker of a caprice: its modelling-clay picture or, for want of one, the line
 * medallion of its family of rules. Nothing is redrawn while the sticker stays the same.
 */
export function paintSticker(svg: SVGElement, caprice?: Stickered) {
  const type = capriceIconType(caprice?.rules ?? NO_CAPRICE);
  const name = (caprice && capriceStickerName(caprice.id)) ?? '';
  const url = name && stickerUrls[`../assets/caprices/${name}.webp`];
  const sticker = url ? name : '';
  if (svg.dataset.capriceIcon === type && svg.dataset.capriceSticker === sticker) return;
  svg.dataset.capriceIcon = type;
  svg.dataset.capriceSticker = sticker;
  svg.innerHTML = url
    ? `<image href="${url}" width="40" height="40"/>`
    : '<path d="M20 2 25 6 32 5 34 12 39 17 35 23 35 31 28 33 22 39 16 35 8 35 6 28 1 22 5 16 5 8 12 6Z" fill="#e8b95e" stroke="#79613c"/>' +
      `<g fill="none" stroke="#355b48" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${motifs[type]}</g>`;
}
export function stickerGraphic(caprice?: Stickered) {
  const svg = svgNode('svg', { viewBox: '0 0 40 40', 'aria-hidden': 'true' });
  paintSticker(svg, caprice);
  return svg;
}
