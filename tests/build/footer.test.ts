import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { expect, test } from 'vitest';

// About, Press and Instagram stay absent while their config values are null (plan Decision 2).
for (const out of ['dist-pilot', 'dist-public']) {
  test(`${out}: footer nav links are exactly Read, Pricing, Contact, Privacy, in order`, () => {
    const w = new Window(); w.document.write(readFileSync(`${out}/index.html`, 'utf8'));
    const links = [...w.document.querySelectorAll('footer nav a')].map((a) => [a.textContent!.trim(), a.getAttribute('href')]);
    expect(links).toEqual([
      ['Read', 'https://app.readdeepwell.com'],
      ['Pricing', '#pricing'],
      ['Contact', 'mailto:feedback@readdeepwell.com'],
      ['Privacy', 'https://app.readdeepwell.com/privacy'],
    ]);
  });
}
