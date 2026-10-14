// "It remembers exactly where you stopped", walked through in three steps (Save → Lose signal → Resume), pinned
// like Themes. The shipped DOM is the last step with every step done; the timeline starts from the first.
// On arrival the ¶ 14 label pulses lamp amber once and the download glyph redraws. Reversible.
// If the pin would not fit the screen, the same steps scrub as the section approaches instead.
import { animate, createDrawable, createTimeline, stagger } from 'animejs';
import type { JSAnimation, Timeline } from 'animejs';
import { approachRange, pinRange } from '../progress';
import { snapshot } from '../snapshot';
import { docTop, fitPin, maxScroll, setPinProgress, type Scene } from './types';

const LAMP = '#C98A3B'; // --color-lamp, the only warm note
const DIM = 0.35; // a step not reached yet

export const module02: Scene = {
  owns: [], // the figure and step labels still rise with the shared entrance; the scene drives only their parts
  mount(section) {
    const q = <T extends Element = HTMLElement>(sel: string): T | null => section.querySelector<T>(sel);
    const steps = [...section.querySelectorAll<HTMLElement>('.steps li')];
    const bar = q('.reader__prog i'), saving = q('.fieldcard__saving'), saved = q('.fieldcard__saved'), nosig = q('.fieldcard__nosig');
    const read = q('.reader__para--read'), here = q('.reader__para--here'), rule = q('.reader__rule'), mark = q('.reader__mark');
    const bars = [...section.querySelectorAll<SVGElement>('.fieldcard__bar')];
    const glyph = q<SVGSVGElement>('.fieldcard__save svg');
    if (steps.length !== 3 || bars.length !== 3 || !bar || !saving || !saved || !nosig || !read || !here || !rule || !mark || !glyph) return null;
    const pinned = fitPin(section);
    const parts = [...steps, bar, saving, saved, nosig, read, here, rule, ...bars];
    const snap = snapshot(parts), markSnap = snapshot([mark]), glyphSnap = snapshot([glyph], { html: true });
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
    // Every tween ends on the CSS rest value (site.css, "Module 02"), so p = 1 and the shipped DOM agree.
    const build = (): Timeline => createTimeline({ autoplay: false })
      .set(steps.slice(1), { opacity: DIM }, 0)
      .set(bar, { scaleX: 0, opacity: 1 }, 0)
      .set(saving, { opacity: 1 }, 0).set([saved, nosig], { opacity: 0 }, 0)
      .set(bars, { opacity: 1 }, 0)
      .set(read, { opacity: 1 }, 0).set(here, { opacity: 0, y: 14 }, 0).set(rule, { scaleY: 0 }, 0)
      // 0–350: save
      .add(bar, { scaleX: 1, duration: 280, ease: 'inOut(2)' }, 20)
      .add(saving, { opacity: 0, duration: 60 }, 290)
      .add(saved, { opacity: 1, duration: 60 }, 300)
      // 350–650: the signal goes
      .add(steps[1]!, { opacity: 1, duration: 60 }, 350)
      .add(bar, { opacity: 0.45, duration: 100 }, 400)
      .add([...bars].reverse(), { opacity: 0.22, duration: 60, delay: stagger(60) }, 420)
      .add(nosig, { opacity: 1, duration: 80 }, 570)
      // 650–1000: back where you stopped
      .add(steps[2]!, { opacity: 1, duration: 60 }, 650)
      .add(read, { opacity: 0.35, duration: 150, ease: 'out(2)' }, 680)
      .add(here, { opacity: 1, y: 0, duration: 200, ease: 'out(3)' }, 720)
      .add(rule, { scaleY: 1, duration: 160, ease: 'inOut(2)' }, 840);
    return {
      range: () => pinned
        ? pinRange({ top: docTop(section), height: section.offsetHeight, vh: innerHeight })
        : approachRange({ top: docTop(section), vh: innerHeight, maxScroll: maxScroll(), from: 1, to: 0.3 }),
      scrub(p, quiet = false) {
        const first = !seen; seen = true;
        if (pinned) setPinProgress(section, p);
        if (p >= 1) {
          const scrubbed = !!tl;
          if (tl) { tl.cancel(); tl = null; snap.restore(); }
          if (quiet) { stopBeat(); arrived = true; return; }
          if (!arrived) { arrived = true; if (scrubbed && !first) arrive(); }
          return;
        }
        if (p < 0.9) arrived = false;
        tl ??= build();
        tl.seek(p * tl.duration);
      },
      destroy() {
        tl?.cancel(); tl = null;
        stopBeat();
        snap.restore();
        setPinProgress(section, null);
        section.removeAttribute('data-pin');
      },
    };
  },
};
