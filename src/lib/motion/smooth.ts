// Smooth scroll at `full` on desktop (motion-scenes spec, Part 3): a heavier, slower descent. It drives window
// scroll, so the field's parallax, the CSS scroll timelines and the scene scrubs read real positions.
// Hand scroll back with the returned destroy function, never stop(): stop() freezes the page.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export const SMOOTH = { lerp: 0.07 } as const;

/** Lenis glides to a same-page anchor but leaves the browser's own fragment jump alone, so the page would flash to
    the target and then be pulled back. Cancel the jump (Lenis still sees the click) and keep the hash for Back. */
function ownAnchorClicks(ev: MouseEvent): void {
  if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
  const a = (ev.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
  const hash = a?.getAttribute('href');
  if (!a || !hash || a.target || a.hasAttribute('download')) return;
  ev.preventDefault();
  if (location.hash !== hash) history.pushState(null, '', hash);
}

export function startSmooth(): () => void {
  const lenis = new Lenis({ lerp: SMOOTH.lerp, smoothWheel: true, syncTouch: false, anchors: true, autoRaf: true, stopInertiaOnNavigate: true });
  document.addEventListener('click', ownAnchorClicks);
  return () => { document.removeEventListener('click', ownAnchorClicks); lenis.destroy(); };
}
