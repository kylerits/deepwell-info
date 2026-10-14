import { handleWaitlist } from './waitlist';

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  WAITLIST_LIMITER: { limit(o: { key: string }): Promise<{ success: boolean }> };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (new URL(req.url).pathname === '/api/waitlist') {
      return handleWaitlist(req, {
        insert: async (email, at) => { await env.DB.prepare('INSERT OR IGNORE INTO waitlist (email, created_at) VALUES (?1, ?2)').bind(email, at).run(); },
        limit: async (key) => (await env.WAITLIST_LIMITER.limit({ key })).success,
        now: () => new Date(),
      });
    }
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
