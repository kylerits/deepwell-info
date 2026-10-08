// PORTED from ~/git_local/deepwell/apps/web/src/lib/atmosphere/level.ts on 2026-10-08.
// Changes: build default comes from import.meta.env.PUBLIC_ATMOSPHERE_DEFAULT (Astro) instead
// of the app's __ATMOSPHERE_DEFAULT__ define; initAtmosphere dropped (boot.ts does first paint);
// effectiveMotion added.
export type AtmosphereLevel = 'full' | 'reduced' | 'off';
export const ATMOSPHERE_STORAGE_KEY = 'dw-atmosphere';
export const ATMOSPHERE_LEVELS: readonly AtmosphereLevel[] = ['full', 'reduced', 'off'];

export const isLevel = (v: string | null | undefined): v is AtmosphereLevel =>
  v != null && (ATMOSPHERE_LEVELS as readonly string[]).includes(v);

const RAW_DEFAULT = import.meta.env.PUBLIC_ATMOSPHERE_DEFAULT as string | undefined;
export const BUILD_DEFAULT: AtmosphereLevel = isLevel(RAW_DEFAULT) ? RAW_DEFAULT : 'full';

/** Pure resolution: stored choice wins; else reduced-motion => reduced; else build default. */
export function resolveAtmosphere(inputs: { stored: string | null; prefersReducedMotion: boolean; buildDefault: AtmosphereLevel }): AtmosphereLevel {
  if (isLevel(inputs.stored)) return inputs.stored;
  if (inputs.prefersReducedMotion) return 'reduced';
  return inputs.buildDefault;
}

function readStored(): string | null {
  try { return localStorage.getItem(ATMOSPHERE_STORAGE_KEY); } catch { return null; }
}

export function getAtmosphere(): AtmosphereLevel {
  const prefersReducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return resolveAtmosphere({ stored: readStored(), prefersReducedMotion, buildDefault: BUILD_DEFAULT });
}

export function applyAtmosphere(level: AtmosphereLevel): void {
  document.documentElement.dataset.atmosphere = level;
  try { localStorage.setItem(ATMOSPHERE_STORAGE_KEY, level); } catch { /* private mode */ }
}

/** A stored "full" never overrides the OS asking for less motion (CLAUDE.md motion discipline). */
export function effectiveMotion(level: 'full' | 'reduced', prefersReducedMotion: boolean): 'full' | 'reduced' {
  return prefersReducedMotion ? 'reduced' : level;
}
