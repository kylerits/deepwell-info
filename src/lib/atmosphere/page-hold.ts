// One hold gate per page (motion-scenes spec, Part 3 "Hold"). createHoldGate writes data-atmosphere-held
// on <html>, so two gates would clear each other's attribute; the Field island and the motion module
// share this one. Vite puts this module in one shared chunk, so both get the same instance.
import { createHoldGate, wireHoldSources } from './hold';

export interface PageHold { isHeld(): boolean; subscribe(cb: (held: boolean) => void): () => void }
let current: (PageHold & { dispose(): void }) | null = null;

export function pageHold(env: { doc: Document; nav: Navigator } = { doc: document, nav: navigator }): PageHold {
  if (current) return current;
  const subs = new Set<(held: boolean) => void>();
  const gate = createHoldGate(env.doc.documentElement, (held) => { for (const cb of [...subs]) cb(held); });
  const unwire = wireHoldSources(gate, env);
  current = {
    isHeld: () => gate.isHeld(),
    subscribe(cb) { subs.add(cb); return () => { subs.delete(cb); }; },
    dispose() { unwire(); subs.clear(); current = null; },
  };
  return current;
}

/** Tests only: drop the singleton so the next pageHold() wires fresh sources. */
export function resetPageHold(): void { current?.dispose(); }
