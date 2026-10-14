import type { Range } from '../progress';
export interface SceneInstance {
  range(): Range;
  /** quiet: the jump to rest comes from a hold (the driver passes it on that path only), so one-shot beats stay silent. A rebuild is covered by each scene's own first-scrub guard. */
  scrub(p: number, quiet?: boolean): void;
  destroy(): void;
}
/** owns: selectors the shared entrance must leave to this scene at `full`. */
export interface Scene { owns: readonly string[]; mount(section: HTMLElement): SceneInstance | null }
export const docTop = (el: Element): number => el.getBoundingClientRect().top + scrollY;
export const maxScroll = (): number => document.documentElement.scrollHeight - innerHeight;

/** The pin's `padding-block: 48px` top and bottom (motion.css, `.sec--pin > .pin`). Keep the two in step. */
const PIN_PAD = 96;
/** A pin is a screen of sticky content: if its `.wrap` would not fit the screen, the section is marked
    data-pin="off" (motion.css then leaves it a normal section) and this returns false. */
export function fitPin(section: HTMLElement): boolean {
  const wrap = section.querySelector<HTMLElement>('.pin > .wrap');
  section.removeAttribute('data-pin');
  if (!wrap || wrap.getBoundingClientRect().height + PIN_PAD > innerHeight) { section.setAttribute('data-pin', 'off'); return false; }
  return true;
}
/** The right-gutter rail of a pinned section (motion.css `.pin-rail`) reads this. At rest (p ≥ 1, or null on
    destroy) the property is removed, so the section is back to its shipped DOM and the rail reads full. */
export function setPinProgress(section: HTMLElement, p: number | null): void {
  if (p !== null && p < 1) { section.style.setProperty('--pin-p', p.toFixed(4)); return; }
  section.style.removeProperty('--pin-p');
  if (!section.getAttribute('style')) section.removeAttribute('style');
}
