// Rest state = shipped DOM (motion-scenes spec, Part 1 invariants). Everything motion touches is
// snapshotted before it is touched and restored exactly; some elements ship inline styles.
// Use html: true only on static text or SVG, never on anything holding a form or an island:
// restoring innerHTML would replace live nodes.
export interface Snapshot { restore(): void }

export function snapshot(els: Iterable<Element>, o: { html?: boolean } = {}): Snapshot {
  const saved = [...els].map((el) => ({ el, style: el.getAttribute('style'), html: o.html ? el.innerHTML : null }));
  return {
    restore() {
      for (const s of saved) {
        if (s.html !== null && s.el.innerHTML !== s.html) s.el.innerHTML = s.html;
        if (s.style === null) s.el.removeAttribute('style'); else s.el.setAttribute('style', s.style);
      }
    },
  };
}
