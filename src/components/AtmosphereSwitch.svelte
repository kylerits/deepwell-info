<script lang="ts">
  import { ATMOSPHERE_LEVELS, applyAtmosphere, isLevel, type AtmosphereLevel } from '../lib/atmosphere/level';
  const labels: Record<AtmosphereLevel, string> = { full: 'Full', reduced: 'Reduced', off: 'Off' };
  let current = $state<AtmosphereLevel>('full');
  $effect(() => { const v = document.documentElement.dataset.atmosphere; if (isLevel(v)) current = v; });
  function pick(level: AtmosphereLevel): void {
    current = level;
    applyAtmosphere(level);
    window.dispatchEvent(new CustomEvent('dw:atmosphere', { detail: level }));
  }
</script>

<div class="atmo" role="group" aria-label="Atmosphere">
  <span class="atmo__label" aria-hidden="true">Atmosphere</span>
  {#each ATMOSPHERE_LEVELS as level (level)}
    <button class="atmo-btn" type="button" aria-pressed={current === level} onclick={() => pick(level)}>{labels[level]}</button>
  {/each}
</div>
