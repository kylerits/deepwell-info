// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vitest';
import { pageHold, resetPageHold } from './page-hold';

function fakeDoc() {
  const t = new EventTarget() as EventTarget & { hidden: boolean; documentElement: HTMLElement };
  t.hidden = false; t.documentElement = document.documentElement;
  return t as unknown as Document & { hidden: boolean };
}
const env = (doc = fakeDoc()) => ({ doc, nav: {} as Navigator });
afterEach(() => resetPageHold());

test('one instance per page', () => {
  const e = env();
  expect(pageHold(e)).toBe(pageHold(e));
});
test('every subscriber hears a hold and a release; the attribute toggles once', () => {
  const doc = fakeDoc(); const h = pageHold(env(doc));
  const a = vi.fn(), b = vi.fn(); h.subscribe(a); h.subscribe(b);
  doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange'));
  expect(h.isHeld()).toBe(true);
  expect(document.documentElement.hasAttribute('data-atmosphere-held')).toBe(true);
  doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange'));
  expect(a.mock.calls).toEqual([[true], [false]]);
  expect(b.mock.calls).toEqual([[true], [false]]);
  expect(document.documentElement.hasAttribute('data-atmosphere-held')).toBe(false);
});
test('unsubscribe stops notifications; reset gives a fresh instance', () => {
  const doc = fakeDoc(); const h = pageHold(env(doc));
  const a = vi.fn(); const off = h.subscribe(a); off();
  doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange'));
  expect(a).not.toHaveBeenCalled();
  resetPageHold();
  expect(pageHold(env())).not.toBe(h);
});
