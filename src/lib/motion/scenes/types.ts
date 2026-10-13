import type { Range } from '../progress';
export interface SceneInstance {
  range(): Range;
  /** quiet: the jump to rest comes from a hold or a rebuild, so one-shot beats stay silent. */
  scrub(p: number, quiet?: boolean): void;
  destroy(): void;
}
/** owns: selectors the shared entrance must leave to this scene at `full`. */
export interface Scene { owns: readonly string[]; mount(section: HTMLElement): SceneInstance | null }
export const docTop = (el: Element): number => el.getBoundingClientRect().top + scrollY;
export const maxScroll = (): number => document.documentElement.scrollHeight - innerHeight;
