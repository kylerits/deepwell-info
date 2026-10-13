// Three ways to read in the dark (motion-scenes spec, Part 2). Pinned: the faces sit stacked in the first
// slot while the lighting changes Microfilm → Black Lodge → Cold Case, then they deal out into the row.
// Only .tcard elements move or fade; they are children of .themes.smudge, never the smudge itself.
import { createTimeline, stagger } from 'animejs';
import type { Timeline } from 'animejs';
import { pinRange } from '../progress';
import { snapshot } from '../snapshot';
import { docTop, type Scene } from './types';

export const themes: Scene = {
  owns: ['.tcard'],
  mount(section) {
    const pin = section.querySelector<HTMLElement>('.pin');
    const wrap = pin?.querySelector<HTMLElement>('.wrap');
    const cards = [...section.querySelectorAll<HTMLElement>('.tcard')];
    const captions = cards.map((c) => c.querySelector<HTMLElement>('.tcard__label'));
    if (!pin || !wrap || cards.length !== 3 || captions.some((c) => !c)) return null;
    section.removeAttribute('data-pin');
    // The pin is a screen of sticky content: if it would not fit, leave the section as a normal one.
    if (wrap.getBoundingClientRect().height + 96 > innerHeight) { section.setAttribute('data-pin', 'off'); return null; }
    const snap = snapshot([...cards, ...(captions as HTMLElement[])]);
    let tl: Timeline | null = null;
    const build = (): Timeline => { // measured at rest: the row is the real layout
      const r0 = cards[0]!.getBoundingClientRect();
      const off = cards.map((c) => { const r = c.getBoundingClientRect(); return { x: r0.left - r.left, y: r0.top - r.top }; });
      const [c0, c1] = captions as HTMLElement[];
      const tl = createTimeline({ autoplay: false });
      cards.forEach((c, i) => tl.set(c, { x: off[i]!.x, y: off[i]!.y }, 0));
      return tl
        .set(cards.slice(1), { opacity: 0 }, 0)
        // 0–650: the lighting changes
        .add(cards[1]!, { opacity: 1, duration: 150, ease: 'inOut(2)' }, 200)
        .add(c0!, { opacity: 0, duration: 150 }, 200)
        .add(cards[2]!, { opacity: 1, duration: 150, ease: 'inOut(2)' }, 450)
        .add(c1!, { opacity: 0, duration: 150 }, 450)
        // 650–1000: dealt into the row
        .add(cards, { x: 0, y: 0, duration: 350, ease: 'inOut(3)', delay: stagger(40) }, 650)
        .add([c0!, c1!], { opacity: 1, duration: 200 }, 800);
    };
    return {
      range: () => pinRange({ top: docTop(section), height: section.offsetHeight, vh: innerHeight }),
      scrub(p) {
        if (p >= 1) { if (tl) { tl.cancel(); tl = null; snap.restore(); } return; }
        tl ??= build();
        tl.seek(p * tl.duration);
      },
      destroy() { tl?.cancel(); tl = null; snap.restore(); section.removeAttribute('data-pin'); },
    };
  },
};
