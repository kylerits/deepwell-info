// The one launch switch. Only Hero.astro and FinalCta.astro read LAUNCH_STATE.
export type LaunchState = 'pilot' | 'public';

export function parseLaunchState(raw: string | undefined): LaunchState {
  if (raw === undefined || raw === '') return 'pilot';
  if (raw === 'pilot' || raw === 'public') return raw;
  throw new Error(`PUBLIC_LAUNCH_STATE must be "pilot" or "public", got "${raw}"`);
}

export const LAUNCH_STATE: LaunchState = parseLaunchState(import.meta.env.PUBLIC_LAUNCH_STATE);
