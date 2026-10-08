<script lang="ts">
  import { onMount } from 'svelte';
  import { createFieldRenderer, type FieldRenderer } from '../lib/field/renderer';
  import { buildFrame } from '../lib/field/frame';
  import { approach, depthAt, normalizeAnchors, type Anchor } from '../lib/field/depth';
  import { timecodeAt } from '../lib/field/field-params';
  import { PRESENCE, initialPresence, presenceProgress, stepPresence, type PresenceState } from '../lib/field/presence';
  import { createHoldGate, wireHoldSources } from '../lib/atmosphere/hold';
  import { effectiveMotion, isLevel, type AtmosphereLevel } from '../lib/atmosphere/level';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const root = document.documentElement;
    const rm = matchMedia('(prefers-reduced-motion: reduce)');
    const readLevel = (): AtmosphereLevel => (isLevel(root.dataset.atmosphere) ? root.dataset.atmosphere : 'full');
    const seen = (): boolean => { try { return sessionStorage.getItem(PRESENCE.storageKey) === '1'; } catch { return false; } };
    const markSeen = (): void => { try { sessionStorage.setItem(PRESENCE.storageKey, '1'); } catch { /* private mode */ } };

    let level = readLevel();
    let renderer: FieldRenderer | null = null;
    let anchors: Anchor[] = [{ y: 0, d: 0 }];
    let d = 0, lastT = performance.now(), raf = 0, settle = 0, lastInputAt = performance.now();
    let presence: PresenceState = initialPresence(seen());
    const osd = document.querySelector<HTMLElement>('[data-osd-time]');
    let osdText = osd?.textContent ?? '';

    const motion = (): 'full' | 'reduced' | 'off' => (level === 'off' ? 'off' : effectiveMotion(level, rm.matches));
    const gate = createHoldGate(root, (held) => { if (!held) schedule(); });
    const unwire = wireHoldSources(gate, { doc: document, nav: navigator });

    function setField(): void { root.dataset.field = renderer ? 'webgl' : 'static'; }
    function ensureRenderer(): void {
      if (motion() === 'off') { renderer?.dispose(); renderer = null; setField(); return; }
      if (!renderer) { renderer = createFieldRenderer(canvas); renderer?.resize(innerWidth, innerHeight, devicePixelRatio); }
      setField();
    }
    function measure(): void {
      const max = Math.max(0, root.scrollHeight - innerHeight);
      const raw = [...document.querySelectorAll<HTMLElement>('[data-depth]')].map((el) => ({
        y: el.getBoundingClientRect().top + scrollY - innerHeight * 0.35, d: Number(el.dataset.depth) }));
      anchors = normalizeAnchors(raw, max);
      renderer?.resize(innerWidth, innerHeight, devicePixelRatio);
    }
    function osdAt(depth: number): void {
      const t = timecodeAt(depth);
      if (osd && t !== osdText) { osdText = t; osd.textContent = t; }
    }
    function stepP(now: number): void {
      const before = presence.phase;
      presence = stepPresence(presence, { now, d, motion: motion(), lastInputAt });
      if (before !== 'running' && presence.phase === 'running') markSeen();
      root.dataset.presence = presence.phase;
    }
    function frame(now: number): void {
      raf = 0;
      const m = motion();
      const target = depthAt(scrollY, anchors);
      d = m === 'full' ? approach(d, target, now - lastT) : target;
      lastT = now;
      osdAt(d);
      stepP(now);
      if (renderer && m !== 'off') {
        renderer.draw(buildFrame({ d, width: innerWidth, height: innerHeight, timeMs: m === 'full' ? now : 0, motion: m, presence: presenceProgress(presence, now) }));
      }
      if (m === 'full' && !gate.isHeld()) schedule();
    }
    function schedule(): void { if (!raf) raf = requestAnimationFrame(frame); }

    const onInput = (): void => {
      lastInputAt = performance.now();
      if (motion() === 'full') { schedule(); return; }
      osdAt(depthAt(scrollY, anchors));
      clearTimeout(settle);
      settle = window.setTimeout(schedule, 150); // reduced: one still frame once scrolling settles
    };
    const onLevel = (e: Event): void => {
      const next = (e as CustomEvent<AtmosphereLevel>).detail;
      if (isLevel(next)) level = next;
      ensureRenderer(); stepP(performance.now()); schedule();
    };
    const onResize = (): void => { measure(); schedule(); };
    const onLost = (e: Event): void => { e.preventDefault(); renderer = null; setField(); };
    const onRestored = (): void => { ensureRenderer(); schedule(); };

    addEventListener('scroll', onInput, { passive: true });
    for (const t of ['pointermove', 'keydown', 'wheel', 'touchstart']) addEventListener(t, onInput, { passive: true });
    addEventListener('resize', onResize);
    addEventListener('dw:atmosphere', onLevel);
    rm.addEventListener('change', onResize);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    const ro = new ResizeObserver(onResize); ro.observe(document.body); // late fonts/layout (Review Focus 5)

    ensureRenderer(); measure(); d = depthAt(scrollY, anchors); schedule();

    return () => {
      cancelAnimationFrame(raf); clearTimeout(settle); ro.disconnect(); unwire();
      removeEventListener('scroll', onInput);
      for (const t of ['pointermove', 'keydown', 'wheel', 'touchstart']) removeEventListener(t, onInput);
      removeEventListener('resize', onResize); removeEventListener('dw:atmosphere', onLevel);
      rm.removeEventListener('change', onResize);
      canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored);
      renderer?.dispose();
    };
  });
</script>

<canvas bind:this={canvas} class="field" aria-hidden="true"></canvas>
