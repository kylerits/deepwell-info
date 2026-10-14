// @vitest-environment happy-dom
import { expect, test, vi } from 'vitest';
import { createHoldGate, wireHoldSources } from './hold';

const root = () => document.documentElement;

test('reference-counted: attribute set on first hold, cleared on last release, never negative', () => {
  const onChange = vi.fn();
  const g = createHoldGate(root(), onChange);
  g.hold(); g.hold();
  expect(root().hasAttribute('data-atmosphere-held')).toBe(true);
  g.release(); expect(g.isHeld()).toBe(true);
  g.release(); g.release();
  expect(g.isHeld()).toBe(false);
  expect(root().hasAttribute('data-atmosphere-held')).toBe(false);
  expect(onChange.mock.calls).toEqual([[true], [false]]);
});

function fakeDoc() {
  const t = new EventTarget() as EventTarget & { hidden: boolean };
  t.hidden = false;
  return t as unknown as Document & { hidden: boolean };
}
function fakeBattery(charging: boolean, level: number) {
  const t = new EventTarget() as EventTarget & { charging: boolean; level: number };
  t.charging = charging; t.level = level; return t;
}

test('holds while the tab is hidden, releases when visible', () => {
  const g = createHoldGate(root()); const doc = fakeDoc();
  const off = wireHoldSources(g, { doc, nav: {} as Navigator });
  doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange'));
  expect(g.isHeld()).toBe(true);
  doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange'));
  expect(g.isHeld()).toBe(false);
  off();
});

test('battery saver takes exactly one hold across repeated level events', async () => {
  const g = createHoldGate(root()); const b = fakeBattery(false, 0.1);
  const off = wireHoldSources(g, { doc: fakeDoc(), nav: { getBattery: () => Promise.resolve(b) } as unknown as Navigator });
  await Promise.resolve(); await Promise.resolve();
  expect(g.isHeld()).toBe(true);
  b.dispatchEvent(new Event('levelchange')); b.dispatchEvent(new Event('levelchange'));
  b.charging = true; b.dispatchEvent(new Event('chargingchange'));
  expect(g.isHeld()).toBe(false);
  off();
});

test('teardown releases owned holds; a late battery resolution after teardown takes none', async () => {
  const g = createHoldGate(root()); const doc = fakeDoc();
  let resolve!: (b: unknown) => void;
  const off = wireHoldSources(g, { doc, nav: { getBattery: () => new Promise((r) => (resolve = r)) } as unknown as Navigator });
  doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange'));
  off();
  expect(g.isHeld()).toBe(false);
  resolve(fakeBattery(false, 0.05)); await Promise.resolve(); await Promise.resolve();
  expect(g.isHeld()).toBe(false);
});
