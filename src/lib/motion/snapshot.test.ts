// @vitest-environment happy-dom
import { expect, test } from 'vitest';
import { snapshot } from './snapshot';

test('restores a shipped inline style exactly, and removes a style that was not there', () => {
  document.body.innerHTML = '<i id="a" style="opacity: 0.8"></i><p id="b">x</p>';
  const a = document.getElementById('a')!, b = document.getElementById('b')!;
  const s = snapshot([a, b]);
  a.style.opacity = '0'; a.style.transform = 'translateY(8px)'; b.style.opacity = '0';
  s.restore();
  expect(a.getAttribute('style')).toBe('opacity: 0.8');
  expect(b.hasAttribute('style')).toBe(false);
});
test('html: true restores the markup too, and restore is idempotent', () => {
  document.body.innerHTML = '<p id="e">MODULE 01 · STUDY PROCEDURE</p>';
  const e = document.getElementById('e')!;
  const s = snapshot([e], { html: true });
  e.innerHTML = '<span class="dw-sr">x</span><span aria-hidden="true">#K_</span>';
  s.restore(); s.restore();
  expect(e.outerHTML).toBe('<p id="e">MODULE 01 · STUDY PROCEDURE</p>');
});
