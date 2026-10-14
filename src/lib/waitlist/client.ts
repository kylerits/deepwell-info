import { WAITLIST_CONFIRMATION, WAITLIST_ERROR } from './copy';

const inflight = new WeakSet<HTMLFormElement>();

export async function submitWaitlist(form: HTMLFormElement, fetchImpl: typeof fetch = fetch): Promise<'ok' | 'error' | 'busy'> {
  if (inflight.has(form)) return 'busy';
  inflight.add(form);
  const root = form.closest('[data-waitlist-root]') ?? form.parentElement!;
  const status = root.querySelector<HTMLElement>('[data-waitlist-status]');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (button) button.disabled = true;
  try {
    const res = await fetchImpl(form.getAttribute('action') ?? '/api/waitlist', {
      method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(String(res.status));
    form.hidden = true;
    const note = root.querySelector<HTMLElement>('[data-waitlist-note]');
    if (note) note.hidden = true;
    if (status) { status.textContent = WAITLIST_CONFIRMATION; status.focus(); }
    return 'ok';
  } catch {
    if (status) status.textContent = WAITLIST_ERROR;
    if (button) { button.disabled = false; button.focus(); }
    return 'error';
  } finally {
    inflight.delete(form);
  }
}

export function wireWaitlistForms(root: ParentNode): void {
  root.querySelectorAll<HTMLFormElement>('form[data-waitlist]').forEach((form) => {
    form.addEventListener('submit', (e) => { e.preventDefault(); void submitWaitlist(form); });
  });
}
