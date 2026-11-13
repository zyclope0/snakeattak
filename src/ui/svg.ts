const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/**
 * A new SVG element. Its attributes are written in the order given, so a drawing reads the
 * same in the page as in the code; numbers are written as they print.
 */
export function svgNode<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | number> = {},
  ...children: Node[]
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NAMESPACE, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
  node.append(...children);
  return node;
}
