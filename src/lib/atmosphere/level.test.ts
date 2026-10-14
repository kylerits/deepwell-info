// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ATMOSPHERE_STORAGE_KEY, applyAtmosphere, effectiveMotion, getAtmosphere, resolveAtmosphere } from './level';

beforeEach(() => { localStorage.removeItem(ATMOSPHERE_STORAGE_KEY); delete document.documentElement.dataset.atmosphere; });
afterEach(() => vi.restoreAllMocks());

test('a valid stored value always wins', () => {
  expect(resolveAtmosphere({ stored: 'off', prefersReducedMotion: true, buildDefault: 'full' })).toBe('off');
});
test('no store + reduced motion => reduced', () => {
  expect(resolveAtmosphere({ stored: null, prefersReducedMotion: true, buildDefault: 'full' })).toBe('reduced');
});
test('no store, no reduced motion => build default', () => {
  expect(resolveAtmosphere({ stored: null, prefersReducedMotion: false, buildDefault: 'off' })).toBe('off');
});
test('unknown stored value falls through', () => {
  expect(resolveAtmosphere({ stored: 'bogus', prefersReducedMotion: false, buildDefault: 'full' })).toBe('full');
});
test('applyAtmosphere sets the attribute and persists; getAtmosphere reads it back', () => {
  applyAtmosphere('reduced');
  expect(document.documentElement.dataset.atmosphere).toBe('reduced');
  expect(localStorage.getItem(ATMOSPHERE_STORAGE_KEY)).toBe('reduced');
  expect(getAtmosphere()).toBe('reduced');
});
test('storage that throws never breaks resolution or apply (Review Focus 1)', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
  expect(() => getAtmosphere()).not.toThrow();
  expect(() => applyAtmosphere('off')).not.toThrow();
  expect(document.documentElement.dataset.atmosphere).toBe('off');
});
test('effectiveMotion: the OS reduced-motion preference always suppresses motion', () => {
  expect(effectiveMotion('full', true)).toBe('reduced');
  expect(effectiveMotion('full', false)).toBe('full');
  expect(effectiveMotion('reduced', false)).toBe('reduced');
});
