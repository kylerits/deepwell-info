// Motion mode (motion-scenes spec, Part 3). Hold is a runtime flag, not a mode.
import { effectiveMotion, type AtmosphereLevel } from '../atmosphere/level';

export type MotionMode = 'full' | 'full-narrow' | 'calm' | 'none';
export const NARROW_MAX = 900;

export function motionMode(i: { level: AtmosphereLevel; prefersReducedMotion: boolean; width: number }): MotionMode {
  if (i.level === 'off') return 'none';
  if (effectiveMotion(i.level, i.prefersReducedMotion) === 'reduced') return 'calm';
  return i.width > NARROW_MAX ? 'full' : 'full-narrow';
}
