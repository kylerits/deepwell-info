// Smooth scroll at `full` on desktop (motion-scenes spec, Part 3): a heavier, slower descent. It drives window
// scroll, so the field's parallax, the CSS scroll timelines and the scene scrubs read real positions.
// Hand scroll back with the returned destroy function, never stop(): stop() freezes the page.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export const SMOOTH = { lerp: 0.07 } as const;

export function startSmooth(): () => void {
  const lenis = new Lenis({ lerp: SMOOTH.lerp, smoothWheel: true, syncTouch: false, anchors: true, autoRaf: true, stopInertiaOnNavigate: true });
  return () => lenis.destroy();
}
