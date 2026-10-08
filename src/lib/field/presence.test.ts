import { expect, test } from 'vitest';
import { initialPresence, presenceDim, presenceProgress, stepPresence } from './presence';

const at = (now: number, d: number, motion: 'full' | 'reduced' | 'off' = 'full', lastInputAt = 0) => ({ now, d, motion, lastInputAt });

test('needs depth past 0.6 AND 8s idle', () => {
  const s = initialPresence(false);
  expect(stepPresence(s, at(9000, 0.5)).phase).toBe('armed');
  expect(stepPresence(s, at(7999, 0.7)).phase).toBe('armed');
  expect(stepPresence(s, at(8000, 0.7))).toEqual({ phase: 'running', startedAt: 8000 });
});
test('never in reduced or off', () => {
  const s = initialPresence(false);
  expect(stepPresence(s, at(60000, 0.9, 'reduced')).phase).toBe('armed');
  expect(stepPresence(s, at(60000, 0.9, 'off')).phase).toBe('armed');
});
test('once per session: a seen session starts done', () => {
  expect(stepPresence(initialPresence(true), at(60000, 0.9)).phase).toBe('done');
});
test('completes silently: input while running does not restart or extend it', () => {
  let s = stepPresence(initialPresence(false), at(8000, 0.7));
  s = stepPresence(s, at(15000, 0.2, 'full', 14999));
  expect(s.phase).toBe('running');
  expect(stepPresence(s, at(28000, 0.2, 'full', 27999)).phase).toBe('done');
});
test('switching to reduced while running ends it at once', () => {
  const s = stepPresence(initialPresence(false), at(8000, 0.7));
  expect(stepPresence(s, at(9000, 0.7, 'reduced')).phase).toBe('done');
});
test('progress and dim envelope', () => {
  const s = stepPresence(initialPresence(false), at(8000, 0.7));
  expect(presenceProgress(s, 18000)).toBeCloseTo(0.5);
  expect(presenceProgress(initialPresence(false), 18000)).toBe(0);
  expect(presenceDim(0)).toBeCloseTo(0); expect(presenceDim(0.5)).toBeCloseTo(1); expect(presenceDim(1)).toBeCloseTo(0);
});
