import { expect, test } from 'vitest';
import { parseLaunchState } from './launch';

test('defaults to pilot when unset or empty', () => {
  expect(parseLaunchState(undefined)).toBe('pilot');
  expect(parseLaunchState('')).toBe('pilot');
});
test('accepts exactly pilot and public', () => {
  expect(parseLaunchState('pilot')).toBe('pilot');
  expect(parseLaunchState('public')).toBe('public');
});
test('a typo fails the build instead of silently shipping pilot', () => {
  expect(() => parseLaunchState('Public')).toThrow(/PUBLIC_LAUNCH_STATE/);
});
