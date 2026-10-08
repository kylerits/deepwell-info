// @vitest-environment happy-dom
import { beforeEach, expect, test, vi } from 'vitest';
import { submitWaitlist } from './client';
import { WAITLIST_CONFIRMATION, WAITLIST_ERROR } from './copy';

function mount() {
  document.body.innerHTML = `<div data-waitlist-root>
    <form data-waitlist action="/api/waitlist" method="post"><input name="email" type="email" value="a@b.co"><input name="company" value=""><button type="submit">Get early access</button></form>
    <p class="micro" data-waitlist-note>We’ll email you once.</p><p role="status" tabindex="-1" data-waitlist-status></p></div>`;
  return document.querySelector('form')!;
}
beforeEach(() => vi.restoreAllMocks());

test('success: posts JSON-accepting, hides form and note, announces the confirmation', async () => {
  const form = mount();
  const f = vi.fn(async () => new Response('{"ok":true}', { status: 200 }));
  expect(await submitWaitlist(form, f)).toBe('ok');
  const [url, init] = f.mock.calls[0]! as unknown as [string, RequestInit];
  expect(url).toBe('/api/waitlist'); expect((init.headers as Record<string, string>).Accept).toBe('application/json');
  expect(form.hidden).toBe(true);
  expect((document.querySelector('[data-waitlist-note]') as HTMLElement).hidden).toBe(true);
  expect(document.querySelector('[data-waitlist-status]')!.textContent).toBe(WAITLIST_CONFIRMATION);
  expect(document.activeElement).toBe(document.querySelector('[data-waitlist-status]'));
});
test('network failure or 429: plain error, button re-enabled, form kept (Review Focus 3)', async () => {
  for (const f of [vi.fn(async () => { throw new TypeError('offline'); }), vi.fn(async () => new Response('{}', { status: 429 }))]) {
    const form = mount();
    expect(await submitWaitlist(form, f)).toBe('error');
    expect(form.hidden).toBe(false);
    expect(form.querySelector('button')!.disabled).toBe(false);
    expect(document.querySelector('[data-waitlist-status]')!.textContent).toBe(WAITLIST_ERROR);
    expect(document.activeElement).toBe(form.querySelector('button'));
  }
});
test('double submit while in flight sends one request', async () => {
  const form = mount();
  let release!: (r: Response) => void;
  const f = vi.fn(() => new Promise<Response>((r) => (release = r)));
  const first = submitWaitlist(form, f);
  expect(await submitWaitlist(form, f)).toBe('busy');
  release(new Response('{"ok":true}'));
  expect(await first).toBe('ok');
  expect(f).toHaveBeenCalledTimes(1);
});
