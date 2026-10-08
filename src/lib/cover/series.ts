// PORTED from ~/git_local/deepwell/apps/web/src/lib/reader/provenance.ts (seriesFromSlug) and
// apps/web/src/lib/browse/archive.ts (seriesLabel) on 2026-10-08 (modified: subset).
const SERIES_ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

/** Series 1–9 for an scp-NNNN slug (I: 1–999, II: 1000–1999, … IX: 8000–8999), else null. */
export function seriesFromSlug(slug: string | undefined): number | null {
  if (!slug) return null;
  const m = /^scp-(\d+)$/.exec(slug.trim().toLowerCase());
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 0 || n > 8999) return null;
  return Math.floor(n / 1000) + 1;
}

export function seriesLabel(n: number): string {
  return SERIES_ROMAN[n] ?? String(n);
}
