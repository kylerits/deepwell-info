import { finalCta } from './final-cta';
import { module02 } from './module02';
import type { Scene } from './types';
export type { Scene, SceneInstance } from './types';
/** Signature scenes by data-scene id (motion-scenes spec, Part 2). They run at `full` only. */
export const SCENES: Record<string, Scene> = { 'module-02': module02, 'final-cta': finalCta };
