import { readdirSync, readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { expect, test } from 'vitest';

const w = new Window(); w.document.write(readFileSync('dist-pilot/index.html', 'utf8')); const d = w.document;

test('pilot: hero and final forms post to the Worker without JS, with labelled email fields', () => {
  const forms = [...d.querySelectorAll('form[data-waitlist]')];
  expect(forms).toHaveLength(2);
  for (const f of forms) {
    expect(f.getAttribute('method')).toBe('post'); expect(f.getAttribute('action')).toBe('/api/waitlist');
    const input = f.querySelector('input[type="email"][required]')!;
    expect(d.querySelector(`label[for="${input.id}"]`)!.textContent).toBe('Email address');
  }
  expect(forms.map((f) => f.querySelector('button')!.textContent)).toEqual(['Get early access', 'Join the waitlist']);
  expect(d.body.textContent).toContain('We’ll email you once. When it’s ready.');
});

test('built CSS hides [hidden] elements despite author display rules', () => {
  const css = readdirSync('dist-pilot/_astro').filter((n) => n.endsWith('.css')).map((n) => readFileSync(`dist-pilot/_astro/${n}`, 'utf8')).join('\n')
    + [...readFileSync('dist-pilot/index.html', 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  expect(css).toMatch(/\[hidden\]\s*\{[^}]*display:\s*none\s*!important/);
});
