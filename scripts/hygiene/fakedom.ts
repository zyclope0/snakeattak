// Un DOM minimal : juste ce que `rewardControls.ts` touche. Un « clic » appelle onclick,
// comme le navigateur, sauf sur un bouton désactivé ou caché.
export class El {
  nodeType = 1;
  tagName: string;
  id = '';
  className = '';
  hidden = false;
  disabled = false;
  inert = false;
  dataset: Record<string, string> = {};
  style: any = { cssText: '' };
  children: El[] = [];
  parentElement: El | null = null;
  attrs = new Map<string, string>();
  onclick: (() => void) | null = null;
  _text = '';
  tabIndex = 0;
  focused = 0;
  classList = {
    add: (...c: string[]) => {
      this.className += ' ' + c.join(' ');
    },
    toggle: () => false,
    contains: () => false,
    remove: () => {},
  };
  constructor(tag: string) {
    this.tagName = tag.toUpperCase();
  }
  get childNodes() {
    return this.children;
  }
  get firstChild() {
    return this.children[0] ?? null;
  }
  get textContent() {
    return this._text + this.children.map((c) => c.textContent).join('');
  }
  set textContent(v: string) {
    this._text = v;
    this.children = [];
  }
  append(...nodes: (El | string)[]) {
    for (const n of nodes)
      if (typeof n === 'string') this._text += n;
      else {
        n.parentElement = this;
        this.children.push(n);
      }
  }
  closest() {
    return null;
  }
  querySelector(sel: string): El | null {
    for (const c of this.children) {
      if (c.tagName === sel.toUpperCase()) return c;
      const d = c.querySelector(sel);
      if (d) return d;
    }
    return null;
  }
  setAttribute(k: string, v: string) {
    this.attrs.set(k, v);
  }
  getAttribute(k: string) {
    return this.attrs.get(k) ?? null;
  }
  hasAttribute(k: string) {
    return this.attrs.has(k);
  }
  focus() {
    this.focused++;
  }
  scrollIntoView() {}
  click() {
    let n: El | null = this;
    while (n) {
      if (n.hidden || n.inert) return;
      n = n.parentElement;
    }
    if (!this.disabled) this.onclick?.();
  }
}
const byId = new Map<string, El>();
export const doc = {
  hidden: false,
  getElementById(id: string) {
    let e = byId.get(id);
    if (!e) {
      e = new El('div');
      e.id = id;
      byId.set(id, e);
    }
    return e;
  },
  createElement: (tag: string) => new El(tag),
  querySelector: () => null,
  documentElement: new El('html'),
};
(globalThis as any).document = doc;
(globalThis as any).matchMedia = () => ({ matches: false });
(globalThis as any).window = globalThis;
