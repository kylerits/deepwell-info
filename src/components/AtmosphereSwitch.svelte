<script lang="ts">
  import { ATMOSPHERE_LEVELS, applyAtmosphere, isLevel, type AtmosphereLevel } from '../lib/atmosphere/level';
  /** rail: the desktop gutter, beside the OSD. top / foot: the phone placements. Each width shows one place on desktop. */
  let { variant = 'foot' }: { variant?: 'rail' | 'top' | 'foot' } = $props();
  const labels: Record<AtmosphereLevel, string> = { full: 'Full', reduced: 'Reduced', off: 'Off' };
  let current = $state<AtmosphereLevel>('full');
  $effect(() => {
    const v = document.documentElement.dataset.atmosphere; if (isLevel(v)) current = v;
    // Several switches can be on one page: a pick in any of them updates the others.
    const sync = (e: Event): void => { const d = (e as CustomEvent<unknown>).detail; if (typeof d === 'string' && isLevel(d)) current = d; };
    addEventListener('dw:atmosphere', sync);
    return () => removeEventListener('dw:atmosphere', sync);
  });
  function pick(level: AtmosphereLevel): void {
    current = level;
    applyAtmosphere(level);
    window.dispatchEvent(new CustomEvent('dw:atmosphere', { detail: level }));
  }
</script>

<div class="atmo atmo--{variant}" role="group" aria-label="Atmosphere">
  <span class="atmo__label" aria-hidden="true">Atmosphere</span>
  {#each ATMOSPHERE_LEVELS as level (level)}
    <button class="atmo-btn" type="button" aria-pressed={current === level} onclick={() => pick(level)}>{labels[level]}</button>
  {/each}
</div>
