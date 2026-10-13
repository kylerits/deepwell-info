// Motion runtime (motion-scenes spec, Part 3): picks the mode, arms each section's entrance and plays it
// when its top crosses 80% of the viewport. Sections already on screen at start are left alone.
import { isLevel, type AtmosphereLevel } from '../atmosphere/level';
import { pageHold } from '../atmosphere/page-hold';
import { motionMode, type MotionMode } from './mode';
import { startSmooth } from './smooth';
import { createEntrance, type Entrance, type Look } from './vocabulary';

const root = document.documentElement;
const readLevel = (): AtmosphereLevel => (isLevel(root.dataset.atmosphere) ? root.dataset.atmosphere : 'full');
const rm = matchMedia('(prefers-reduced-motion: reduce)');
const currentMode = (): MotionMode => motionMode({ level: readLevel(), prefersReducedMotion: rm.matches, width: innerWidth });
const done = (s: HTMLElement): void => s.setAttribute('data-scene-done', '');
const look = (m: MotionMode): Look => (m === 'calm' ? 'calm' : 'full');

let mode: MotionMode = 'none';
let io: IntersectionObserver | null = null;
const pending = new Map<HTMLElement, Entrance>();
const running = new Map<HTMLElement, Entrance>();
const hold = pageHold();
let stopSmooth: (() => void) | null = null;
const endSmooth = (): void => { stopSmooth?.(); stopSmooth = null; };

function trigger(section: HTMLElement, instant: boolean): void {
  const e = pending.get(section);
  if (!e) return;
  pending.delete(section); io?.unobserve(section);
  if (instant || hold.isHeld()) { e.settle(); done(section); return; }
  running.set(section, e);
  e.play(() => { running.delete(section); done(section); });
}

/** A section flung past between two observer callbacks never changes state, so the observer stays silent
    about it: sweep on scroll and settle whatever is wholly above the screen (Review Focus 2). */
function sweep(): void {
  for (const s of [...pending.keys()]) if (s.getBoundingClientRect().bottom <= 0) trigger(s, true);
}

function arm(section: HTMLElement, m: MotionMode): void {
  pending.set(section, createEntrance(section, look(m)));
  io?.observe(section);
}

function build(m: MotionMode, initial: boolean): void {
  const sections = [...document.querySelectorAll<HTMLElement>('[data-scene]')];
  if (m === 'none') { for (const s of sections) done(s); root.removeAttribute('data-motion-arm'); return; }
  io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const s = en.target as HTMLElement;
      if (en.isIntersecting) trigger(s, false);
      else if (en.boundingClientRect.bottom <= 0) trigger(s, true); // flung past before it played
    }
  }, { rootMargin: '0px 0px -20% 0px' });
  for (const s of sections) {
    if (s.hasAttribute('data-scene-done')) continue;
    if (s.dataset.scene === 'hero') {
      const e = createEntrance(s, look(m));        // hides with inline styles first…
      root.removeAttribute('data-motion-arm');     // …so lifting the CSS pre-hide shows nothing
      if (initial && !hold.isHeld()) { running.set(s, e); e.play(() => { running.delete(s); done(s); }); } else { e.settle(); done(s); }
      continue;
    }
    if (initial && s.getBoundingClientRect().top < innerHeight) { done(s); continue; } // on screen, or above it
    arm(s, m);
  }
  if (m === 'full' && !hold.isHeld()) { endSmooth(); stopSmooth = startSmooth(); }
}

function teardown(): void {
  endSmooth();
  io?.disconnect(); io = null;
  for (const [s, e] of running) { e.settle(); done(s); }
  running.clear();
  for (const e of pending.values()) e.settle(); // restore; these sections re-arm in the next mode
  pending.clear();
}

/** A mode change can add or remove height above the reader (the Themes pin, Task 8): keep whatever is at
    the top of the screen where it is, so a deep link or a resize never jumps the page. */
function keepPlace(fn: () => void): void {
  const anchor = [...document.querySelectorAll<HTMLElement>('[data-scene]')].find((s) => s.getBoundingClientRect().bottom > 0);
  const before = anchor?.getBoundingClientRect().top ?? 0;
  fn();
  const shift = (anchor?.getBoundingClientRect().top ?? before) - before;
  if (Math.abs(shift) > 1) scrollBy(0, shift);
}

function rebuild(): void {
  const next = currentMode();
  if (next === mode) return;
  teardown();
  keepPlace(() => { mode = next; root.dataset.motion = mode; build(mode, false); });
}

/** Held (tab hidden, battery saver): finish what is running; due entrances settle in trigger(). */
function onHeld(): void {
  endSmooth();
  for (const [s, e] of running) { e.settle(); done(s); }
  running.clear();
}
/** Released: smoothing comes back at full (scrubs hook in here in Task 7). */
function onReleased(): void { if (mode === 'full' && !stopSmooth) stopSmooth = startSmooth(); }

export function startMotion(): void {
  const fonts = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 800))]);
  void fonts.then(() => {
    keepPlace(() => { mode = currentMode(); root.dataset.motion = mode; build(mode, true); });
    hold.subscribe((held) => (held ? onHeld() : onReleased()));
    addEventListener('focusin', (ev) => {
      const s = (ev.target as Element | null)?.closest<HTMLElement>('[data-scene]');
      if (!s) return;
      trigger(s, true); // focus never lands on hidden text (Review Focus 4)...
      const live = running.get(s); // ...nor on text still fading in (the hero plays from load)
      if (live) { running.delete(s); live.settle(); done(s); }
    });
    addEventListener('scroll', sweep, { passive: true });
    addEventListener('dw:atmosphere', rebuild);
    rm.addEventListener('change', rebuild);
    addEventListener('resize', rebuild);
  });
}
