/**
 * The first screen of the home, « la clairière » (src/ui/homeClearing.css, the mock-up the
 * parent chose on 24 November 2026): the whole screen is the scenery of the game, each way to
 * play is a place with its name on a wooden plaque, and « Jouer » is the biggest thing to
 * touch. The blocks that used to hold the buttons (header, card, bottom row) have no box any
 * more (`display: contents`): what a child must find is measured on the buttons themselves.
 *
 * `clearingState` measures the screen in the page; `checkClearing` states what every size of
 * every grid must hold. The recipes of the home, of the players, of the voyage and of the
 * replay call both, each with its own grid, its own saves and its own system margins.
 */

/** The pictures of the first screen: the game's name, the main button, the three places. */
const PICTURES = {
  logo: 'clairiere-logo-',
  primary: 'clairiere-bouton',
  'home-classic': 'clairiere-antre',
  'home-voyage': 'clairiere-pont',
  'home-expeditions': 'clairiere-chateau',
};
/** The smallest letters a child of six reads on a phone. */
const SMALLEST_TEXT = 13;

/** `insets`: the system margins the recipe simulates, `{ top, right, bottom, left }` or null. */
export const clearingState = (page, insets = null) =>
  page.evaluate(
    async ({ insets, smallestText }) => {
      const safe = {
        left: insets?.left ?? 0,
        top: insets?.top ?? 0,
        right: innerWidth - (insets?.right ?? 0),
        bottom: innerHeight - (insets?.bottom ?? 0),
      };
      const screen = document.querySelector('#home-screen');
      const shown = (node) => !!node && node.getClientRects().length > 0;
      const round = (value) => Math.round(value * 10) / 10;
      const box = (node) => {
        const r = node.getBoundingClientRect();
        return {
          left: round(r.left),
          top: round(r.top),
          right: round(r.right),
          bottom: round(r.bottom),
          width: round(r.width),
          height: round(r.height),
        };
      };
      const name = (node) => node.id || String(node.className) || node.tagName;
      const overlap = (a, b) =>
        a.left < b.right - 1 &&
        b.left < a.right - 1 &&
        a.top < b.bottom - 1 &&
        b.top < a.bottom - 1;
      const inSafeArea = (r) =>
        r.left >= safe.left - 0.5 &&
        r.top >= safe.top - 0.5 &&
        r.right <= safe.right + 0.5 &&
        r.bottom <= safe.bottom + 0.5;
      // Where a finger lands: the middle, the four corners and the four sides. The plaques
      // lean by a few degrees, so the sides are tried a little inside their bounding box.
      const POINTS = [
        [0.5, 0.5],
        [0.15, 0.15],
        [0.85, 0.15],
        [0.15, 0.85],
        [0.85, 0.85],
        [0.5, 0.08],
        [0.5, 0.92],
        [0.08, 0.5],
        [0.92, 0.5],
      ];
      const targets = [...screen.querySelectorAll('button')].filter(shown);
      const boxes = new Map(targets.map((node) => [node, box(node)]));
      const byId = (id) => document.getElementById(id);
      const primary = byId('home-primary');
      const next = byId('home-next-mission');
      const chip = byId('player-chip');

      /** Clipped to nothing: kept in the page for a screen reader, drawn for no one. */
      const clipped = (node) => {
        for (let at = node; at && at !== screen.parentElement; at = at.parentElement)
          if (getComputedStyle(at).clipPath.startsWith('inset(50%')) return true;
        return false;
      };
      /** What a screen reader still says of a node that is not drawn, or null. */
      const spoken = (node) => {
        if (!node) return null;
        for (let at = node; at && at !== document.body; at = at.parentElement) {
          const style = getComputedStyle(at);
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            at.hidden ||
            at.getAttribute('aria-hidden') === 'true'
          )
            return null;
        }
        return node.textContent.trim() || null;
      };
      /** The address of a background picture, and whether the browser can draw it. */
      const address = (image) => /url\("?([^")]+)"?\)/.exec(image)?.[1] ?? null;
      const drawn = async (image) => {
        const source = address(image);
        if (!source) return false;
        const picture = new Image();
        picture.src = source;
        try {
          await picture.decode();
        } catch {
          return false;
        }
        return picture.naturalWidth > 0;
      };
      /**
       * How far the words of a plaque leave its slate and go over its wooden frame, in
       * pixels (0: not at all). The plaque leans: its words are measured turned back.
       */
      const spill = (button) => {
        const angle = (parseFloat(getComputedStyle(button).rotate) || 0) * (Math.PI / 180);
        const cos = Math.cos(angle),
          sin = Math.abs(Math.sin(angle));
        const outer = button.getBoundingClientRect();
        const centre = [outer.left + outer.width / 2, outer.top + outer.height / 2];
        const style = getComputedStyle(button);
        const half = [
          button.offsetWidth / 2 - parseFloat(style.borderLeftWidth),
          button.offsetHeight / 2 - parseFloat(style.borderTopWidth),
        ];
        const words = document.createTreeWalker(button, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) =>
            node.textContent.trim() && !node.parentElement.closest('.voyage-new')
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT,
        });
        let worst = 0;
        while (words.nextNode()) {
          const range = document.createRange();
          range.selectNodeContents(words.currentNode);
          const r = range.getBoundingClientRect();
          // The words' own size, from the bounding box of the leaning words.
          const scale = cos * cos - sin * sin;
          const width = (r.width * cos - r.height * sin) / scale;
          const height = (r.height * cos - r.width * sin) / scale;
          const dx = r.left + r.width / 2 - centre[0];
          const dy = r.top + r.height / 2 - centre[1];
          const x = dx * Math.cos(-angle) - dy * Math.sin(-angle);
          const y = dx * Math.sin(-angle) + dy * Math.cos(-angle);
          worst = Math.max(
            worst,
            Math.abs(x) + width / 2 - half[0],
            Math.abs(y) + height / 2 - half[1],
          );
        }
        return round(worst);
      };

      const small = [],
        outside = [],
        covered = [];
      for (const [node, r] of boxes) {
        if (r.width < 47.99 || r.height < 47.99) small.push(`${name(node)} ${r.width}×${r.height}`);
        if (!inSafeArea(r)) outside.push(`${name(node)} ${JSON.stringify(r)}`);
        for (const [fx, fy] of POINTS) {
          const hit = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
          if (!hit || !node.contains(hit))
            covered.push(
              `${name(node)} at ${fx},${fy}: ${hit ? name(hit.closest('button') ?? hit) : 'nothing'}`,
            );
        }
      }
      const overlapping = targets.flatMap((a, index) =>
        targets
          .slice(index + 1)
          .filter((b) => overlap(boxes.get(a), boxes.get(b)))
          .map((b) => `${name(a)}/${name(b)}`),
      );
      const area = (node) => boxes.get(node).width * boxes.get(node).height;
      const largest = targets.reduce((a, b) => (area(b) > area(a) ? b : a));

      // The sentence of the next thing to play: whole, readable, just above « Jouer ».
      const sentence = box(next);
      const play = boxes.get(primary);
      const letters = document.createRange();
      letters.selectNodeContents(next);
      const nextStyle = getComputedStyle(next);
      const sentenceUnder = [0.1, 0.5, 0.9]
        .map((fx) =>
          document
            .elementFromPoint(
              sentence.left + sentence.width * fx,
              sentence.top + sentence.height / 2,
            )
            ?.closest('button'),
        )
        .filter(Boolean)
        .map(name);

      // The game's name, modelled in clay: a picture, its words still in the page.
      const title = screen.querySelector('.home-intro h1');
      const logo = box(title);
      const titlePicture = getComputedStyle(title).backgroundImage;

      const places = {};
      for (const id of ['home-classic', 'home-voyage', 'home-expeditions']) {
        const button = byId(id);
        const picture = getComputedStyle(button, '::before');
        places[id] = {
          box: boxes.get(button) ?? null,
          picture: address(picture.backgroundImage),
          drawn: await drawn(picture.backgroundImage),
          pictureSize: [round(parseFloat(picture.width)), round(parseFloat(picture.height))],
          frame: round(parseFloat(getComputedStyle(button).borderLeftWidth)),
          words: [...button.childNodes]
            .filter((node) => !(node.nodeType === 1 && node.matches('.voyage-new')))
            .map((node) => node.textContent.trim())
            .join(' ')
            .trim(),
          spill: spill(button),
        };
      }

      // Every word drawn on the first screen, the game's name apart (it is a picture).
      const tooSmall = new Set();
      const words = document.createTreeWalker(screen, NodeFilter.SHOW_TEXT);
      while (words.nextNode()) {
        const parent = words.currentNode.parentElement;
        if (!words.currentNode.textContent.trim() || !shown(parent)) continue;
        if (parent.closest('h1') || clipped(parent)) continue;
        const size = parseFloat(getComputedStyle(parent).fontSize);
        if (size < smallestText - 0.01) tooSmall.add(`${name(parent)} ${size}px`);
      }
      const starsDrawn = getComputedStyle(byId('home-expeditions'), '::after');
      if (parseFloat(starsDrawn.fontSize) < smallestText - 0.01)
        tooSmall.add(`stars of the missions ${starsDrawn.fontSize}`);

      const tag = screen.querySelector('#home-voyage .voyage-new');
      const playerName = chip?.querySelector('.player-name');
      const nameStyle = playerName && getComputedStyle(playerName);
      const top = ['home-parents', 'player-chip', 'home-settings'].map(byId).filter(shown);
      const below = [
        ...['home-classic', 'home-voyage', 'home-expeditions', 'home-primary'].map((id) =>
          boxes.get(byId(id)),
        ),
        sentence,
      ];
      return {
        page: screen.dataset.page,
        scroll: [
          document.documentElement.scrollWidth - innerWidth,
          document.documentElement.scrollHeight - innerHeight,
        ],
        targets: targets.map(name),
        small,
        outside,
        covered,
        overlapping,
        largest: name(largest),
        primaries: [...screen.querySelectorAll('.primary')].filter(shown).map(name),
        primary: {
          box: play,
          words: primary.innerText.trim(),
          picture: address(getComputedStyle(primary).backgroundImage),
          drawn: await drawn(getComputedStyle(primary).backgroundImage),
          cut:
            primary.scrollWidth > primary.clientWidth + 1 ||
            primary.scrollHeight > primary.clientHeight + 1,
        },
        links: [...screen.querySelectorAll('.home-links button')].filter(shown).map(name),
        next: {
          box: sentence,
          words: next.innerText.trim(),
          // Nothing clips it, or what clips it holds every letter; and every letter is in view.
          cut:
            (nextStyle.overflowX !== 'visible' || nextStyle.overflowY !== 'visible') &&
            (next.scrollWidth > next.clientWidth + 1 || next.scrollHeight > next.clientHeight + 1),
          inSafeArea: inSafeArea(sentence) && inSafeArea(letters.getBoundingClientRect()),
          // Above the button, touching it or nearly: the two are read together.
          abovePlay: round(play.top - sentence.bottom),
          besidePlay: [round(sentence.left - play.left), round(play.right - sentence.right)],
          under: sentenceUnder,
          over: targets
            .filter((node) => node !== primary && overlap(sentence, boxes.get(node)))
            .map(name),
        },
        top: {
          names: top.map(name),
          // The lowest of the three, and the highest of what lies under the top row.
          bottom: Math.max(...top.map((node) => boxes.get(node).bottom)),
          clearOf: Math.min(...below.map((r) => r.top)),
        },
        logo: {
          box: logo,
          words: title.textContent.trim(),
          picture: address(titlePicture),
          drawn: await drawn(titlePicture),
          inSafeArea: inSafeArea(logo),
          over: targets.filter((node) => overlap(logo, boxes.get(node))).map(name),
        },
        places,
        stars: {
          plaque: byId('home-expeditions').dataset.stars ?? null,
          drawn: starsDrawn.content,
          total: byId('mission-total').textContent.trim(),
        },
        tag: shown(tag)
          ? {
              box: box(tag),
              inSafeArea: inSafeArea(box(tag)),
              over: targets
                .filter((node) => node.id !== 'home-voyage' && overlap(box(tag), boxes.get(node)))
                .map(name),
            }
          : null,
        chip: chip && {
          box: boxes.get(chip) ?? null,
          name: playerName.textContent,
          nameBox: box(playerName),
          nameInside:
            box(playerName).left >= boxes.get(chip).left - 0.5 &&
            box(playerName).right <= boxes.get(chip).right + 0.5,
          // A nickname too long for its place ends with « … »: it is never cut in mid-letter.
          // No tolerance: one pixel too few and the last letters give way to « … ».
          nameShortened: playerName.scrollWidth > playerName.clientWidth,
          nameEllipsis: nameStyle.textOverflow === 'ellipsis' && nameStyle.overflowX === 'hidden',
          portrait: box(chip.querySelector('.player-avatar')),
          badge: shown(chip.querySelector('.player-chip-badge')),
        },
        // Out of sight on the first screen, still said by a screen reader.
        spoken: {
          stars: spoken(byId('mission-total')),
          chip: spoken(chip?.querySelector('small')),
        },
        // Moved elsewhere by the parent's decision: the name in full letters with the version
        // number, the save line, the « + » badge of the chip.
        leftOvers: ['.home-brand', '.home-footer', '.player-chip-badge'].filter((selector) =>
          shown(screen.querySelector(selector)),
        ),
        tooSmall: [...tooSmall],
      };
    },
    { insets, smallestText: SMALLEST_TEXT },
  );

/**
 * What the first screen holds on every screen of every grid, with and without system
 * margins: nothing scrolls; every button is a whole 48 px target inside the safe area, that a
 * finger reaches wherever it lands on it, and no two of them overlap; « Jouer » is the
 * biggest and the only main action, with its sentence just above it; the game's name and the
 * three places show their pictures; the words are 13 px or more.
 */
export function checkClearing(check, state, where) {
  const say = (value) => JSON.stringify(value);
  check(
    state.page === 'home' && state.scroll.every((value) => value <= 0),
    `${where}: the first screen does not scroll: ${say(state.scroll)}`,
  );
  check(!state.small.length, `${where}: every button is a 48 px target: ${say(state.small)}`);
  check(
    !state.outside.length,
    `${where}: every button is inside the screen and its safe area: ${say(state.outside)}`,
  );
  check(
    !state.covered.length,
    `${where}: a finger on a button reaches that button: ${say(state.covered)}`,
  );
  check(!state.overlapping.length, `${where}: no two buttons overlap: ${say(state.overlapping)}`);
  check(
    state.largest === 'home-primary' && say(state.primaries) === say(['home-primary']),
    `${where}: the main button is the biggest thing to touch and the only main action: ${state.largest} ${say(state.primaries)}`,
  );
  check(
    state.primary.picture?.includes(PICTURES.primary) && state.primary.drawn && !state.primary.cut,
    `${where}: the main button is the clay button, its words whole: ${say(state.primary)}`,
  );
  check(
    state.links.length === 5,
    `${where}: five destinations besides the main button: ${say(state.links)}`,
  );
  const next = state.next;
  check(
    next.words.length > 0 &&
      !next.cut &&
      next.inSafeArea &&
      !next.under.length &&
      !next.over.length,
    `${where}: the sentence of the next thing to play is whole and in view: ${say(next)}`,
  );
  check(
    next.abovePlay >= -2 && next.abovePlay <= 16 && next.besidePlay.every((value) => value >= -2),
    `${where}: that sentence sits just above the main button: ${say(next)}`,
  );
  check(
    state.top.names.length === 3 && state.top.bottom <= state.top.clearOf + 0.5,
    `${where}: parents, player and settings stay above the places and the main button: ${say(state.top)}`,
  );
  const logo = state.logo;
  check(
    logo.picture?.includes(PICTURES.logo) && logo.drawn && logo.words.length > 0,
    `${where}: the game's name is its clay picture, its words still in the page: ${say(logo)}`,
  );
  check(
    logo.inSafeArea && logo.box.width >= 120 && !logo.over.length,
    `${where}: the game's name is whole in the safe area and no button lies on it: ${say(logo)}`,
  );
  for (const [id, place] of Object.entries(state.places)) {
    check(
      place.picture?.includes(PICTURES[id]) &&
        place.drawn &&
        place.pictureSize.every((value) => value >= 48),
      `${where}: ${id} shows its picture: ${say(place)}`,
    );
    // The words may run over the inner part of the wooden frame (the plaque of the missions
    // also carries the stars); they stay clear of its outer edge by a quarter of the frame.
    check(
      place.words.length > 0 && place.spill <= place.frame * 0.75,
      `${where}: ${id} has its name whole on its plaque: ${say(place)}`,
    );
  }
  check(
    state.stars.plaque !== null &&
      state.stars.drawn === `"${state.stars.plaque}"` &&
      state.stars.total.startsWith(state.stars.plaque),
    `${where}: the plaque of the missions shows the stars the game counts: ${say(state.stars)}`,
  );
  check(
    !state.tag || (state.tag.inSafeArea && !state.tag.over.length),
    `${where}: the label of a novelty is in view and on no other button: ${say(state.tag)}`,
  );
  check(
    !state.tooSmall.length,
    `${where}: every word is ${SMALLEST_TEXT} px or more: ${say(state.tooSmall)}`,
  );
  check(
    !!state.spoken.stars && !!state.spoken.chip,
    `${where}: the stars and what the player's button does are still said by a screen reader: ${say(state.spoken)}`,
  );
  check(
    !state.leftOvers.length,
    `${where}: the version, the save line and the badge are not on the first screen: ${say(state.leftOvers)}`,
  );
}
