// "Go deeper." pulls into focus from far off as the descent ends (motion-scenes spec, Part 2). Only this
// display headline ever blurs. The range ends at min(section top at 40%, max scroll), so it always resolves.
import { createTimeline } from 'animejs';
import type { Timeline } from 'animejs';
import { approachRange } from '../progress';
import { snapshot } from '../snapshot';
import { docTop, maxScroll, type Scene } from './types';

export const finalCta: Scene = {
  owns: ['.h-deep'],
  mount(section) {
    const h = section.querySelector<HTMLElement>('.h-deep');
    if (!h) return null;
    const snap = snapshot([h]);
    let tl: Timeline | null = null;
    const build = (): Timeline => {
      const cs = getComputedStyle(h);
      const ls = parseFloat(cs.letterSpacing) || 0, fs = parseFloat(cs.fontSize);
      return createTimeline({ autoplay: false }).add(h, {
        scale: [0.7, 1], opacity: [0.3, 1], filter: ['blur(8px)', 'blur(0px)'],
        letterSpacing: [`${ls + 0.08 * fs}px`, `${ls}px`], duration: 1000, ease: 'out(3)',
      }, 0);
    };
    return {
      range: () => approachRange({ top: docTop(section), vh: innerHeight, maxScroll: maxScroll(), from: 1, to: 0.4 }),
      scrub(p) {
        if (p >= 1) { if (tl) { tl.cancel(); tl = null; snap.restore(); } return; }
        tl ??= build();
        tl.seek(p * tl.duration);
      },
      destroy() { tl?.cancel(); tl = null; snap.restore(); },
    };
  },
};
