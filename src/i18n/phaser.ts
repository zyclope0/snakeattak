import type Phaser from 'phaser';
import { copy } from './copy.ts';
import { onLanguageChange } from './language.ts';

type CanvasText = Phaser.GameObjects.Text;
type Source = string | string[];
type Binding = { source: Source; ref: WeakRef<CanvasText> };
const bindings = new WeakMap<CanvasText, Binding>();
const live = new Set<WeakRef<CanvasText>>();
let registrations = 0;
function project(node: CanvasText, source: Source) {
  const value = Array.isArray(source) ? source.map(copy) : copy(source);
  if (node.text !== (Array.isArray(value) ? value.join('\n') : value)) node.setText(value);
}
onLanguageChange(() => {
  for (const ref of live) {
    const node = ref.deref();
    if (!node) {
      live.delete(ref);
      continue;
    }
    const binding = bindings.get(node);
    if (binding) project(node, binding.source);
  }
});
/** Refresh cached canvas text without changing the canonical game or its clock. */
export function setCanvasText<T extends CanvasText>(node: T, source: Source): T {
  let binding = bindings.get(node);
  if (!binding) {
    const ref = new WeakRef(node);
    binding = { source: '', ref };
    bindings.set(node, binding);
    live.add(ref);
    node.once('destroy', () => {
      live.delete(ref);
      const text = ref.deref();
      if (text) bindings.delete(text);
    });
    if (++registrations % 64 === 0) for (const item of live) if (!item.deref()) live.delete(item);
  }
  binding.source = Array.isArray(source) ? [...source] : source;
  project(node, binding.source);
  return node;
}
export function addCanvasText(
  factory: Phaser.GameObjects.GameObjectFactory,
  x: number,
  y: number,
  source: Source,
  style?: Phaser.Types.GameObjects.Text.TextStyle,
): CanvasText {
  return setCanvasText(factory.text(x, y, '', style), source);
}
