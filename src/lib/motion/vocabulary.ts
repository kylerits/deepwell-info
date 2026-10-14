// The shared vocabulary, "coming into focus from the dark" (motion-scenes spec, Part 1). Each track hides
// its elements when armed, adds its tweens when the entrance plays, and restores the shipped DOM at rest.
import { createDrawable, createTimeline, scrambleText, splitText, stagger, utils } from 'animejs';
import type { Timeline } from 'animejs';
import { snapshot } from './snapshot';

export type Look = 'full' | 'calm';
/** prepare() runs before the timeline is built and may return a promise it must settle first (line splits). */
interface Track { hide(): void; prepare?(): Promise<unknown> | void; add(tl: Timeline, at: number): void; rest(): void }
export interface Entrance { play(onDone: () => void): void; settle(): void }

const EASE = 'out(4)';
const CALM = { duration: 600, ease: 'out(2)' } as const;

/** Calm, and anything small: the elements fade in together, a beat apart. */
function fade(els: HTMLElement[], gap = 60): Track {
  const snap = snapshot(els);
  return {
    hide: () => utils.set(els, { opacity: 0 }),
    add: (tl, at) => { tl.add(els, { opacity: 1, ...CALM, delay: stagger(gap) }, at); },
    rest: () => snap.restore(),
  };
}

/** Elements rise into place. y is the distance in px. */
function rise(els: HTMLElement[], o: { y: number; gap: number; duration?: number }): Track {
  const snap = snapshot(els);
  return {
    hide: () => utils.set(els, { opacity: 0 }),
    add: (tl, at) => {
      utils.set(els, { translateY: o.y });
      tl.add(els, { opacity: 1, translateY: 0, duration: o.duration ?? 1000, ease: EASE, delay: stagger(o.gap) }, at);
    },
    rest: () => snap.restore(),
  };
}

/** Split at play time (fonts are ready by then), so line breaks are the real ones. Only headline words blur.
    splitText measures lines asynchronously (after document.fonts.ready), so a line split is made in prepare()
    and awaited; if the lines never materialise (fonts still loading), the element fades in whole instead. */
function focusSplit(el: HTMLElement, by: 'words' | 'lines'): Track {
  const snap = snapshot([el]);
  let split: ReturnType<typeof splitText> | null = null;
  const undo = (): void => {
    const s = split; split = null;
    if (!s) return;
    s.revert();
    void document.fonts?.ready.then(() => s.revert()); // a split still queued on fonts.ready must not land after rest
  };
  return {
    hide: () => utils.set(el, { opacity: 0 }),
    prepare() {
      if (by !== 'lines' || document.fonts?.status === 'loading') return;
      split = splitText(el, { lines: true });
      return document.fonts?.ready; // registered after splitText's own handler, so it resolves after the split
    },
    add(tl, at) {
      if (by === 'words') {
        split = splitText(el, { words: true });
        utils.set(split.words, { opacity: 0, y: 12, filter: 'blur(6px)' });
        utils.set(el, { opacity: 1 });
        tl.add(split.words, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1100, ease: EASE, delay: stagger(70) }, at);
      } else if (split?.lines.length) {
        utils.set(split.lines, { opacity: 0, y: 8 });
        utils.set(el, { opacity: 1 });
        tl.add(split.lines, { opacity: 1, y: 0, duration: 1000, ease: EASE, delay: stagger(110) }, at);
      } else {
        undo();
        tl.add(el, { opacity: 1, ...CALM }, at);
      }
    },
    rest() { undo(); snap.restore(); },
  };
}

/** Apparatus labels decrypt like a terminal readout; screen readers get the real text throughout. */
function decrypt(el: HTMLElement): Track {
  const snap = snapshot([el], { html: true });
  return {
    hide: () => utils.set(el, { opacity: 0 }),
    add(tl, at) {
      const text = el.textContent ?? '';
      const sr = document.createElement('span'); sr.className = 'dw-sr'; sr.textContent = text;
      const shown = document.createElement('span'); shown.setAttribute('aria-hidden', 'true'); shown.textContent = text;
      el.replaceChildren(sr, shown);
      utils.set(el, { opacity: 1 });
      tl.add(shown, { innerHTML: scrambleText({ chars: 'A-Z0-9', cursor: '_', seed: 7 }), duration: 520, ease: 'linear' }, at);
    },
    rest: () => snap.restore(),
  };
}

/** The reader's lamp warms up a beat after its figure arrives: the cabin switching on. */
function warm(lamps: HTMLElement[]): Track {
  const snap = snapshot(lamps);
  const to = lamps.map((l) => Number(getComputedStyle(l).opacity) || 1);
  return {
    hide: () => utils.set(lamps, { opacity: 0 }),
    add: (tl, at) => { tl.add(lamps, { opacity: (_?: unknown, i = 0) => to[i]!, duration: 1400, ease: 'inOut(2)' }, at); },
    rest: () => snap.restore(),
  };
}

/** Pricing checks draw in sequence. Static SVG, so the markup snapshot is safe. */
function draw(svgs: SVGSVGElement[]): Track {
  const snap = snapshot(svgs, { html: true });
  return {
    hide: () => {},
    add(tl, at) {
      const paths = createDrawable(svgs.flatMap((s) => [...s.querySelectorAll('path')]));
      utils.set(paths, { draw: '0 0' });
      tl.add(paths, { draw: '0 1', duration: 600, ease: 'inOut(3)', delay: stagger(90) }, at);
    },
    rest: () => snap.restore(),
  };
}

/** The plain-language summary: the rule draws, then label and body. No blur; always the last beat. */
function rule(summary: HTMLElement): Track {
  const label = summary.querySelector<HTMLElement>('.summary__label');
  const body = summary.querySelector<HTMLElement>('.summary__body');
  if (!label || !body) return fade([summary]);
  const snap = snapshot([label, body]);
  return {
    hide: () => { utils.set(label, { opacity: 0, '--dw-rule': 0 }); utils.set(body, { opacity: 0 }); },
    add(tl, at) {
      tl.add(label, { opacity: 1, duration: 400, ease: EASE }, at)
        .add(label, { '--dw-rule': 1, duration: 900, ease: EASE }, at)
        .add(body, { opacity: 1, duration: 800, ease: EASE }, at + 300);
    },
    rest: () => snap.restore(),
  };
}

type Beat = { sel: string; at: number | 'end'; full: ((els: HTMLElement[]) => Track[]) | null; calm: boolean };
// Order is the reading order of a section. `.h1` is never selected: the hero headline is never hidden.
// Nothing here may match a .smudge (see the guard in pick()).
const BEATS: Beat[] = [
  { sel: '.eyebrow', at: 0, full: (els) => els.map(decrypt), calm: true },
  { sel: '.h2:not(.eyebrow), .h-deep', at: 150, full: (els) => els.map((e) => focusSplit(e, 'words')), calm: true },
  { sel: '.subtitle', at: 150, full: (els) => [rise(els, { y: 8, gap: 0 })], calm: true },
  { sel: '.narr, .plain-lg, .lic__body', at: 450, full: (els) => els.map((e) => focusSplit(e, 'lines')), calm: true },
  { sel: '.hero__visual > *, .mod__visual > .reader', at: 300, full: (els) => [rise(els, { y: 40, gap: 0, duration: 1300 })], calm: true },
  { sel: '.feat li, .trust li, .faq__item, .price__col, .tcard, .foot > *, [data-launch-slot]', at: 650, full: (els) => [rise(els, { y: 16, gap: 90 })], calm: true },
  { sel: '.lic__small, .micro', at: 750, full: (els) => [rise(els, { y: 8, gap: 80 })], calm: true },
  { sel: '.reader__lamp', at: 1100, full: (els) => [warm(els)], calm: false },
  { sel: '.plist svg', at: 1000, full: (els) => [draw(els as unknown as SVGSVGElement[])], calm: false },
  { sel: '.summary', at: 'end', full: (els) => els.map(rule), calm: true },
];

function pick(section: HTMLElement, sel: string, owned: readonly string[]): HTMLElement[] {
  return [...section.querySelectorAll<HTMLElement>(sel)].filter((el) =>
    !owned.some((o) => el.closest(o)) && !el.matches('.smudge') && !el.querySelector('.smudge'));
}

export function createEntrance(section: HTMLElement, look: Look, owned: readonly string[] = []): Entrance {
  const plan: { track: Track; at: number | 'end' }[] = [];
  for (const b of BEATS) {
    const els = pick(section, b.sel, owned);
    if (!els.length) continue;
    const tracks = look === 'full' ? b.full?.(els) ?? [] : b.calm ? [fade(els)] : [];
    for (const track of tracks) plan.push({ track, at: look === 'calm' && b.at !== 'end' ? Math.min(b.at, 300) : b.at });
  }
  for (const p of plan) p.track.hide();
  let tl: Timeline | null = null;
  let resting = false;
  const settle = (): void => {
    if (resting) return;
    resting = true; tl?.cancel();
    for (const p of plan) p.track.rest();
  };
  return {
    play(onDone) {
      if (resting) { onDone(); return; }
      const pre = plan.map((p) => p.track.prepare?.()).filter((x): x is Promise<unknown> => !!x);
      const start = (): void => {
        if (resting) { onDone(); return; }
        try {
          tl = createTimeline({ autoplay: false, onComplete: () => { settle(); onDone(); } });
          for (const p of plan) if (p.at !== 'end') p.track.add(tl, p.at);
          const end = Math.max(0, tl.duration - 300);
          for (const p of plan) if (p.at === 'end') p.track.add(tl, end);
          tl.play();
        } catch (e) {
          settle(); onDone(); // never leave text hidden
          console.error('[motion] entrance failed', e);
        }
      };
      if (pre.length) Promise.all(pre).then(start, () => { settle(); onDone(); }); else start();
    },
    settle,
  };
}
