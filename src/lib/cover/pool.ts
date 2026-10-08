import data from '../../data/cover-pool.json';

export interface PoolAcs { clearance: string; containmentClass: string; secondaryClass: string; disruptionClass: string; riskClass: string }
export interface PoolEntry {
  slug: string; title: string; alternateTitle: string | null; authors: string[]; url: string; tags: string[];
  header: { acs: PoolAcs | null; clearance: string | null } | null;
}
export const COVER_POOL: readonly PoolEntry[] = data.entries as PoolEntry[];
export const COVER_SLUGS: readonly string[] = COVER_POOL.map((e) => e.slug);
