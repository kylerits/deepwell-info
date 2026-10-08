// POST /api/waitlist → D1 waitlist(email, created_at). Honeypot + per-IP rate limit; no
// third-party JS (no Turnstile without asking Kyle). Stores only the email and a timestamp.
export interface WaitlistDeps { insert(email: string, createdAt: string): Promise<void>; limit(key: string): Promise<boolean>; now(): Date }

const ALLOWED_ORIGINS = new Set(['https://readdeepwell.com', 'https://www.readdeepwell.com', 'http://localhost:4321', 'http://localhost:8787', 'http://127.0.0.1:8787']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const e = raw.trim().toLowerCase();
  return e.length >= 3 && e.length <= 254 && EMAIL.test(e) ? e : null;
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const see = (location: string) => new Response(null, { status: 303, headers: { Location: location, 'Cache-Control': 'no-store' } });

export async function handleWaitlist(req: Request, deps: WaitlistDeps): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  const origin = req.headers.get('Origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) return new Response('Forbidden', { status: 403 });
  const wantsJson = (req.headers.get('Accept') ?? '').includes('application/json');
  const ok = () => (wantsJson ? json(200, { ok: true }) : see('/waitlist/confirmed/'));
  const fail = (status: number, error: string) => (wantsJson ? json(status, { ok: false, error }) : see('/?waitlist=error#start'));

  if (!(await deps.limit(req.headers.get('CF-Connecting-IP') ?? 'unknown'))) return fail(429, 'rate_limited');
  let form: FormData;
  try { form = await req.formData(); } catch { return fail(400, 'bad_request'); }
  if (String(form.get('company') ?? '').trim() !== '') return ok();
  const email = normalizeEmail(form.get('email'));
  if (!email) return fail(400, 'invalid_email');
  try { await deps.insert(email, deps.now().toISOString()); } catch { return fail(500, 'unavailable'); }
  return ok();
}
