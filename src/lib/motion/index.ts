// Motion runtime (motion-scenes spec, Part 3): picks the mode, arms each section's entrance and plays it
// when its top crosses 80% of the viewport. Sections already on screen at start are left alone.
import { isLevel, type AtmosphereLevel } from '../atmosphere/level';
import { pageHold } from '../atmosphere/page-hold';
import { motionMode, type MotionMode } from './mode';
import { rangeProgress } from './progress';
import { SCENES, type Scene, type SceneInstance } from './scenes';
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
let scenes: SceneInstance[] = [];
let raf = 0;

/** Scrubs run at `full` only. Reads every range first, then writes every scrub; a hold jumps all to rest. */
function drive(): void {
  raf = 0;
  const held = hold.isHeld();
  const ranges = scenes.map((s) => s.range());
  scenes.forEach((s, i) => s.scrub(held ? 1 : rangeProgress(scrollY, ranges[i]!), held));
}
const onScroll = (): void => { if (!raf) raf = requestAnimationFrame(drive); };
type Mounted = { scene?: Scene; inst: SceneInstance | null };
function mountScene(s: HTMLElement, m: MotionMode): Mounted {
  const scene = m === 'full' ? SCENES[s.dataset.scene ?? ''] : undefined;
  const inst = scene?.mount(s) ?? null;
  if (inst) scenes.push(inst);
  return { scene, inst };
}

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

function arm(section: HTMLElement, m: MotionMode, { scene, inst }: Mounted): void { // the scene is mounted first: its elements are its own
  pending.set(section, createEntrance(section, look(m), inst && scene ? scene.owns : []));
  io?.observe(section);
}

/** Switch to mode `m`. `keep` re-pins the reader's place: the mode (the Themes pin's height) and the scenes'
    own fit decisions both change the layout, so every "is it on screen" test below waits until it has run. */
function build(m: MotionMode, initial: boolean, keep: () => void): void {
  mode = m; root.dataset.motion = m;
  const sections = [...document.querySelectorAll<HTMLElement>('[data-scene]')];
  if (m === 'none') { for (const s of sections) done(s); root.removeAttribute('data-motion-arm'); keep(); return; }
  const mounted = new Map(sections.map((s) => [s, mountScene(s, m)] as const)); // pass 1: layout settles
  keep();
  io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const s = en.target as HTMLElement;
      if (en.isIntersecting) trigger(s, false);
      else if (en.boundingClientRect.bottom <= 0) trigger(s, true); // flung past before it played
    }
  }, { rootMargin: '0px 0px -20% 0px' });
  for (const s of sections) {
    if (s.hasAttribute('data-scene-done')) continue; // played already: scenes still scrub
    if (s.dataset.scene === 'hero') {
      const e = createEntrance(s, look(m));        // hides with inline styles first…
      root.removeAttribute('data-motion-arm');     // …so lifting the CSS pre-hide shows nothing
      if (initial && !hold.isHeld()) { running.set(s, e); e.play(() => { running.delete(s); done(s); }); } else { e.settle(); done(s); }
      continue;
    }
    if (initial && s.getBoundingClientRect().top < innerHeight) { done(s); continue; } // on screen, or above it
    arm(s, m, mounted.get(s)!);
  }
  if (scenes.length) { addEventListener('scroll', onScroll, { passive: true }); drive(); }
  if (m === 'full' && !hold.isHeld()) { endSmooth(); stopSmooth = startSmooth(); }
  keep();
}

function teardown(): void {
  endSmooth();
  removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); raf = 0;
  for (const sc of scenes) sc.destroy();
  scenes = [];
  for (const s of document.querySelectorAll('[data-pin]')) s.removeAttribute('data-pin'); // a scene that declined to pin leaves its mark
  io?.disconnect(); io = null;
  for (const [s, e] of running) { e.settle(); done(s); }
  running.clear();
  for (const e of pending.values()) e.settle(); // restore; these sections re-arm in the next mode
  pending.clear();
}

/** A mode change can add or remove height above the reader (the Themes pin, Task 8): note what is at the
    top of the screen now; the returned function puts it back, so a deep link or a resize never jumps the page. */
function placeAnchor(): () => void {
  const anchor = [...document.querySelectorAll<HTMLElement>('[data-scene]')].find((s) => s.getBoundingClientRect().bottom > 0);
  const before = anchor?.getBoundingClientRect().top ?? 0;
  return () => {
    const shift = (anchor?.getBoundingClientRect().top ?? before) - before;
    if (Math.abs(shift) > 1) scrollBy(0, shift);
  };
}

function rebuild(): void {
  const next = currentMode();
  if (next === mode) return;
  const keep = placeAnchor();
  teardown();
  build(next, false, keep);
}

/** Held (tab hidden, battery saver): finish what is running; due entrances settle in trigger(). */
function onHeld(): void {
  endSmooth();
  for (const [s, e] of running) { e.settle(); done(s); }
  running.clear();
  drive(); // scrubs jump to rest
}
/** Released: smoothing comes back at full and scrubs resume from the live scroll position. */
function onReleased(): void { if (mode === 'full' && !stopSmooth) stopSmooth = startSmooth(); drive(); }

export function startMotion(): void {
  const fonts = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 800))]);
  void fonts.then(() => {
    build(currentMode(), true, placeAnchor());
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
    addEventListener('resize', () => { const before = mode; rebuild(); if (mode === before) onScroll(); }); // same mode: re-measure ranges
  });
}
