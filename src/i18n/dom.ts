import { copy } from './copy.ts';
import { onLanguageChange } from './language.ts';

type Binding = {
  text?: string;
  markup?: string;
  attributes?: Map<string, string>;
  ref?: WeakRef<Node>;
};
const bindings = new WeakMap<Node, Binding>();
const live = new Set<WeakRef<Node>>();
const rawSelector = 'script,style,code,pre,textarea,[data-copy-raw]';
const languageAttributes = new Set([
  'title',
  'alt',
  'placeholder',
  'aria-label',
  'aria-description',
  'aria-placeholder',
  'aria-valuetext',
  'aria-roledescription',
]);
let registrations = 0;
function raw(node: Node) {
  const element = node.nodeType === 1 ? (node as Element) : node.parentElement;
  return !!element?.closest(rawSelector);
}
function rawAttribute(node: Element) {
  return !!node.closest('script,style,[data-copy-raw]');
}
function state(node: Node) {
  let binding = bindings.get(node);
  if (!binding) {
    binding = {};
    bindings.set(node, binding);
  }
  return binding;
}
function remember(node: Node, binding: Binding) {
  if (binding.ref) return;
  binding.ref = new WeakRef(node);
  live.add(binding.ref);
  if (++registrations % 64 === 0) for (const ref of live) if (!ref.deref()) live.delete(ref);
}
function linguistic(node: Element, name: string) {
  return (
    languageAttributes.has(name) ||
    (name === 'label' && /^(OPTION|OPTGROUP|TRACK)$/.test(node.tagName)) ||
    (name === 'value' &&
      node.tagName === 'INPUT' &&
      /^(button|submit|reset)$/i.test(node.getAttribute('type') ?? ''))
  );
}
function writeText(node: Node, value: string) {
  if (node.textContent === value) return;
  // Retain the existing leaf, including selections and references to that leaf.
  if (node.nodeType !== 3 && node.childNodes.length === 1 && node.firstChild?.nodeType === 3)
    node.firstChild.nodeValue = value;
  else node.textContent = value;
}
function preserveOptionValue(node: Node) {
  const option =
    node.nodeType === 1 && (node as Element).tagName === 'OPTION'
      ? (node as HTMLOptionElement)
      : node.parentElement?.closest('option');
  // An option without a value derives its command value from its visible text.
  if (option && !option.hasAttribute('value')) option.setAttribute('value', option.value);
}
function project(node: Node, binding: Binding) {
  if (!raw(node) && binding.text !== undefined) {
    preserveOptionValue(node);
    writeText(node, copy(binding.text));
  }
  if (node.nodeType === 1 && !rawAttribute(node as Element))
    for (const [name, source] of binding.attributes ?? []) {
      const value = copy(source),
        element = node as Element;
      if (element.getAttribute(name) !== value) element.setAttribute(name, value);
    }
}
onLanguageChange(() => {
  for (const ref of live) {
    const node = ref.deref();
    if (!node) {
      live.delete(ref);
      continue;
    }
    const binding = bindings.get(node);
    if (binding) project(node, binding);
  }
});

/** Explicit display write. Canonical copy never comes back from translated DOM. */
export function setText(node: Node, source: unknown): string {
  const canonical = source == null ? '' : String(source);
  if (raw(node)) {
    writeText(node, canonical);
    return canonical;
  }
  const binding = state(node);
  binding.text = canonical;
  binding.markup = undefined;
  remember(node, binding);
  project(node, binding);
  return copy(canonical);
}
export function appendText(node: Node, fragment: string): string {
  return setText(node, canonicalText(node) + fragment);
}
function canonicalText(node: Node): string {
  const source = bindings.get(node)?.text;
  if (source !== undefined) return source;
  if (!node.childNodes.length) return node.textContent ?? '';
  return Array.from(node.childNodes).map(canonicalText).join('');
}
export function setMarkup(node: Element, source: string): string {
  if (raw(node)) {
    if (node.innerHTML !== source) node.innerHTML = source;
    return node.innerHTML;
  }
  const binding = state(node);
  const changed = binding.markup !== source || binding.text !== undefined;
  binding.text = undefined;
  if (binding.ref && !binding.attributes?.size) {
    live.delete(binding.ref);
    binding.ref = undefined;
  }
  if (changed) {
    node.innerHTML = source;
    binding.markup = source;
  }
  bindCopyTree(node);
  return node.innerHTML;
}
export function setAttribute(node: Element, name: string, value: string): void {
  const normalized = name.toLowerCase();
  if (rawAttribute(node) || !linguistic(node, normalized)) {
    if (node.getAttribute(name) !== value) node.setAttribute(name, value);
    return;
  }
  name = normalized;
  const binding = state(node);
  (binding.attributes ??= new Map()).set(name, value);
  remember(node, binding);
  const translated = copy(value);
  if (node.getAttribute(name) !== translated) node.setAttribute(name, translated);
}
export function setTitle(node: HTMLElement | Document, source: string): string {
  if (node.nodeType === 9) {
    const document = node as Document;
    let title = document.querySelector('title');
    if (!title) {
      title = document.createElement('title');
      document.head.append(title);
    }
    return setText(title, source);
  }
  setAttribute(node as HTMLElement, 'title', source);
  return (node as HTMLElement).title;
}
export function createTextNode(source: string): Text {
  const node = document.createTextNode('');
  setText(node, source);
  return node;
}
/** Adopt static copy once, preserving canonical bindings when called again. */
export function bindCopyTree(root: Node): void {
  const binding = bindings.get(root);
  if (root.nodeType === 1 && !rawAttribute(root as Element)) {
    const element = root as Element;
    for (const attribute of Array.from(element.attributes))
      if (linguistic(element, attribute.name) && !binding?.attributes?.has(attribute.name))
        setAttribute(element, attribute.name, attribute.value);
  }
  if (raw(root)) return;
  if (binding?.text !== undefined) {
    project(root, binding);
    return;
  }
  if (root.nodeType === 3) {
    if (root.nodeValue?.trim()) setText(root, root.nodeValue);
    return;
  }
  for (const child of Array.from(root.childNodes)) bindCopyTree(child);
}
