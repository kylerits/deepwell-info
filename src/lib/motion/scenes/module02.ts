// "It remembers exactly where you stopped", shown (motion-scenes spec, Part 2): the progress bar fills with
// scroll; on arrival the ¶ 14 mark pulses lamp amber once and the download glyph redraws. Reversible.
import { animate, createDrawable, createTimeline } from 'animejs';
import type { JSAnimation, Timeline } from 'animejs';
import { approachRange } from '../progress';
import { snapshot } from '../snapshot';
import { docTop, maxScroll, type Scene } from './types';

const LAMP = '#C98A3B'; // --color-lamp, the only warm note

export const module02: Scene = {
  owns: [], // the figure still rises with the shared entrance; the scene drives only its parts
  mount(section) {
    const bar = section.querySelector<HTMLElement>('.reader__prog i');
    const mark = section.querySelector<HTMLElement>('.reader__mark');
    const glyph = section.querySelector<SVGSVGElement>('.reader__meta svg');
    if (!bar || !mark || !glyph) return null;
    const barSnap = snapshot([bar]), markSnap = snapshot([mark]), glyphSnap = snapshot([glyph], { html: true });
    let tl: Timeline | null = null;
    let arrived = false;
    let seen = false; // first scrub: a scene mounted already at rest does not pulse
    let beat: JSAnimation[] = [];
    const stopBeat = (): void => { for (const a of beat) a.cancel(); beat = []; markSnap.restore(); glyphSnap.restore(); };
    const arrive = (): void => {
      stopBeat(); // a quick second arrival must not read a half-amber color as rest, nor leak the old animations
      const rest = getComputedStyle(mark).color;
      const paths = createDrawable(glyph.querySelectorAll('path'));
      beat = [
        animate(mark, { color: [{ to: LAMP, duration: 260 }, { to: rest, duration: 900 }], ease: 'out(2)', onComplete: () => markSnap.restore() }),
        animate(paths, { draw: ['0 0', '0 1'], duration: 700, ease: 'inOut(3)', onComplete: () => glyphSnap.restore() }),
      ];
    };
    return {
      range: () => approachRange({ top: docTop(section), vh: innerHeight, maxScroll: maxScroll(), from: 1, to: 0.3 }),
      scrub(p, quiet = false) {
        const first = !seen; seen = true;
        if (p >= 1) {
          const scrubbed = !!tl;
          if (tl) { tl.cancel(); tl = null; barSnap.restore(); }
          if (quiet) { stopBeat(); arrived = true; return; }
          if (!arrived) { arrived = true; if (scrubbed && !first) arrive(); }
          return;
        }
        if (p < 0.9) arrived = false;
        tl ??= createTimeline({ autoplay: false }).add(bar, { scaleX: [0, 1], duration: 1000, ease: 'inOut(2)' }, 0);
        tl.seek(p * tl.duration);
      },
      destroy() {
        tl?.cancel(); tl = null;
        stopBeat();
        barSnap.restore();
      },
    };
  },
};
