import { describe, expect, test, vi } from 'vitest';
import { handleWaitlist, normalizeEmail, type WaitlistDeps } from './waitlist';

const deps = (o: Partial<WaitlistDeps> = {}): WaitlistDeps => ({ insert: vi.fn(async () => {}), limit: vi.fn(async () => true), now: () => new Date('2026-10-08T12:00:00Z'), ...o });
const post = (fields: Record<string, string>, h: Record<string, string> = {}) =>
  new Request('https://readdeepwell.com/api/waitlist', { method: 'POST', body: new URLSearchParams(fields), headers: { Origin: 'https://readdeepwell.com', Accept: 'application/json', 'CF-Connecting-IP': '203.0.113.9', ...h } });

describe('normalizeEmail', () => {
  test('trims and lowercases', () => expect(normalizeEmail('  Agent@Example.COM ')).toBe('agent@example.com'));
  test('rejects junk', () => { for (const v of ['', 'no-at', 'a@b', 'x'.repeat(250) + '@e.com', 42, null]) expect(normalizeEmail(v)).toBeNull(); });
});

test('stores a valid email with an ISO timestamp', async () => {
  const d = deps(); const r = await handleWaitlist(post({ email: 'Agent@Example.com' }), d);
  expect(r.status).toBe(200); expect(await r.json()).toEqual({ ok: true });
  expect(d.insert).toHaveBeenCalledWith('agent@example.com', '2026-10-08T12:00:00.000Z');
});
test('honeypot: looks like success, stores nothing', async () => {
  const d = deps(); const r = await handleWaitlist(post({ email: 'a@b.co', company: 'Spam Inc' }), d);
  expect(r.status).toBe(200); expect(d.insert).not.toHaveBeenCalled();
});
test('rate limited by client IP (Review Focus 3)', async () => {
  const d = deps({ limit: vi.fn(async () => false) }); const r = await handleWaitlist(post({ email: 'a@b.co' }), d);
  expect(r.status).toBe(429); expect(d.limit).toHaveBeenCalledWith('203.0.113.9'); expect(d.insert).not.toHaveBeenCalled();
});
test('invalid email → 400; foreign origin → 403; GET → 405', async () => {
  expect((await handleWaitlist(post({ email: 'nope' }), deps())).status).toBe(400);
  expect((await handleWaitlist(post({ email: 'a@b.co' }, { Origin: 'https://evil.example' }), deps())).status).toBe(403);
  const g = await handleWaitlist(new Request('https://readdeepwell.com/api/waitlist'), deps());
  expect(g.status).toBe(405); expect(g.headers.get('Allow')).toBe('POST');
});
test('no-JS form post: 303 to the confirmation page', async () => {
  const r = await handleWaitlist(post({ email: 'a@b.co' }, { Accept: 'text/html' }), deps());
  expect(r.status).toBe(303); expect(r.headers.get('Location')).toBe('/waitlist/confirmed/');
});
test('a storage failure is a 500, never a false success', async () => {
  const r = await handleWaitlist(post({ email: 'a@b.co' }), deps({ insert: vi.fn(async () => { throw new Error('D1 down'); }) }));
  expect(r.status).toBe(500);
});
