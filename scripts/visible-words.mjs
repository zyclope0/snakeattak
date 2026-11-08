/** Executed inside the browser: count rendered text intersecting the viewport and scroll clips. */
export function visibleWords(selector) {
  const root = document.querySelector(selector);
  if (!root) throw Error('Missing text root: ' + selector);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let count = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el || el.closest('script,style,option,[hidden],.sr-only')) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    let left = Math.max(0, rect.left),
      right = Math.min(innerWidth, rect.right),
      top = Math.max(0, rect.top),
      bottom = Math.min(innerHeight, rect.bottom);
    for (let parent = el; parent; parent = parent.parentElement) {
      const s = getComputedStyle(parent);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) {
        right = left;
        break;
      }
      const p = parent.getBoundingClientRect();
      if (['auto', 'scroll', 'hidden', 'clip'].includes(s.overflowX)) {
        left = Math.max(left, p.left);
        right = Math.min(right, p.right);
      }
      if (['auto', 'scroll', 'hidden', 'clip'].includes(s.overflowY)) {
        top = Math.max(top, p.top);
        bottom = Math.min(bottom, p.bottom);
      }
    }
    if (right > left && bottom > top)
      count += node.textContent.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;
  }
  return count;
}
