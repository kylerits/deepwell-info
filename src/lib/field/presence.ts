// Spec rule 4: once per session, deep in the page, only if you stop. Shown by what it does to
// the light (the remaining shaft dims as it passes), never by a readable shape.
export const PRESENCE = { minDepth: 0.6, idleMs: 8000, durationMs: 20000, storageKey: 'dw-presence-seen' } as const;
export type PresencePhase = 'armed' | 'running' | 'done';
export interface PresenceState { phase: PresencePhase; startedAt: number | null }

export const initialPresence = (seen: boolean): PresenceState => ({ phase: seen ? 'done' : 'armed', startedAt: null });

export function stepPresence(s: PresenceState, i: { now: number; d: number; motion: 'full' | 'reduced' | 'off'; lastInputAt: number }): PresenceState {
  if (s.phase === 'done') return s;
  if (s.phase === 'running') {
    if (i.motion !== 'full') return { phase: 'done', startedAt: null };
    return i.now - (s.startedAt ?? i.now) >= PRESENCE.durationMs ? { phase: 'done', startedAt: null } : s;
  }
  if (i.motion !== 'full') return s;
  return i.d > PRESENCE.minDepth && i.now - i.lastInputAt >= PRESENCE.idleMs ? { phase: 'running', startedAt: i.now } : s;
}

export function presenceProgress(s: PresenceState, now: number): number {
  if (s.phase !== 'running' || s.startedAt == null) return 0;
  return Math.min(1, Math.max(0, (now - s.startedAt) / PRESENCE.durationMs));
}

export const presenceDim = (p: number): number => Math.sin(Math.PI * p) ** 2;
