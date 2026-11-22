// Un petit faux DOM, assez pour rendre les vues de l'expédition hors navigateur : ce qu'une vue
// construit devient une donnée simple (`dump`), que `expedition-views.mjs` contrôle.
class Text {
  constructor(v) {
    this.nodeType = 3;
    this.nodeValue = v;
    this.parentElement = null;
  }
  get textContent() {
    return this.nodeValue;
  }
}
export class El {
  constructor(tag, ns) {
    this.nodeType = 1;
    this.tagName = ns ? tag : tag.toUpperCase();
    this.ns = !!ns;
    this.props = {};
    this.dataset = {};
    this.attrs = new Map();
    this.childNodes = [];
    this.parentElement = null;
    this.styleProps = {};
    this._class = '';
    const self = this;
    this.style = {
      setProperty(k, v) {
        self.styleProps[k] = v;
      },
    };
    this.classList = {
      add: (...c) => {
        self._class = [self._class, ...c].filter(Boolean).join(' ');
      },
    };
    return new Proxy(this, {
      set(t, k, v) {
        if (
          k in t ||
          typeof k === 'symbol' ||
          ['className', 'textContent', 'innerHTML'].includes(k)
        ) {
          t[k] = v;
        } else {
          t.props[k] = v;
        }
        return true;
      },
      get(t, k, r) {
        if (k in t) return Reflect.get(t, k, r);
        if (typeof k === 'string' && k in t.props) return t.props[k];
        return undefined;
      },
    });
  }
  get className() {
    return this._class;
  }
  set className(v) {
    this._class = v;
  }
  get children() {
    return this.childNodes.filter((n) => n.nodeType === 1);
  }
  get childElementCount() {
    return this.children.length;
  }
  get lastElementChild() {
    return this.children.at(-1) ?? null;
  }
  get firstChild() {
    return this.childNodes[0] ?? null;
  }
  get textContent() {
    return this.childNodes.map((c) => c.textContent).join('');
  }
  set textContent(v) {
    this.childNodes = v === '' ? [] : [new Text(String(v))];
  }
  set innerHTML(v) {
    this.childNodes = [];
    this.props.innerHTML = v;
  }
  get innerHTML() {
    return this.props.innerHTML ?? '';
  }
  append(...nodes) {
    for (const n of nodes) {
      const node = typeof n === 'string' ? new Text(n) : n;
      if (node == null) throw new Error('append null');
      node.parentElement = this;
      this.childNodes.push(node);
    }
  }
  setAttribute(k, v) {
    this.attrs.set(k, String(v));
  }
  getAttribute(k) {
    return this.attrs.get(k) ?? null;
  }
  hasAttribute(k) {
    return this.attrs.has(k);
  }
  closest(sel) {
    let n = this;
    while (n) {
      if ('copyRaw' in n.dataset || /^(SCRIPT|STYLE|CODE|PRE|TEXTAREA)$/.test(n.tagName)) return n;
      n = n.parentElement;
    }
    return null;
  }
}
export function install() {
  globalThis.document = {
    createElement: (t) => new El(t),
    createElementNS: (_ns, t) => new El(t, true),
    querySelector: () => null,
  };
}
/** A node as plain data: everything a child sees or a recipe reads. */
export function dump(node) {
  if (node.nodeType === 3) return node.nodeValue;
  const props = {};
  for (const [k, v] of Object.entries(node.props)) props[k] = typeof v === 'function' ? 'fn' : v;
  return {
    tag: node.tagName,
    cls: node.className || undefined,
    attrs: node.attrs.size ? Object.fromEntries([...node.attrs].sort()) : undefined,
    data: Object.keys(node.dataset).length ? { ...node.dataset } : undefined,
    style: Object.keys(node.styleProps).length ? node.styleProps : undefined,
    props: Object.keys(props).length ? props : undefined,
    kids: node.childNodes.length ? node.childNodes.map(dump) : undefined,
  };
}
