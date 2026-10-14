// Builds the hero-cover pool from the app's Crom-sourced seed (handoff §6). Metadata only.
import { DatabaseSync } from 'node:sqlite';

export const POOL_SLUGS = ['scp-173', 'scp-087', 'scp-096', 'scp-055', 'scp-426', 'scp-914', 'scp-2317', 'scp-3001', 'scp-4999', 'scp-5000'];
export const EXCLUDED = {
  'scp-049': 'the seed lists an author twice',
  'scp-3008': 'a real brand name in the title',
  'scp-5001': 'teal class tone would break teal-is-focus-only in the hero',
  'scp-6820': 'teal class tone would break teal-is-focus-only in the hero',
};

export function loadSeed(sqlText) {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE articles (slug TEXT PRIMARY KEY, title TEXT, alternate_title TEXT, authors TEXT, source_url TEXT,
    rating INTEGER, tags TEXT, series INTEGER, reading_minutes INTEGER, content_hash TEXT, doc TEXT, ingested_at TEXT,
    primary_class TEXT, item_type TEXT, year INTEGER, variants TEXT);
    CREATE TABLE article_fts (slug TEXT, title TEXT, tags TEXT);`);
  db.exec(sqlText);
  return db;
}

// PORTED from ~/git_local/deepwell/apps/web/src/lib/reader/cover/cover-header.ts (coverHeader) on
// 2026-10-08 (modified: no body index — the landing cover never renders the body).
const GATE_WINDOW = 4;
export function coverHeaderOf(doc) {
  const blocks = doc?.blocks ?? [];
  const bar = blocks.find((b) => b.type === 'acs');
  if (bar) {
    const { clearance, containmentClass, secondaryClass, disruptionClass, riskClass } = bar;
    return { acs: { clearance, containmentClass, secondaryClass, disruptionClass, riskClass }, clearance: clearance ?? null };
  }
  const gate = blocks.slice(0, GATE_WINDOW).find((b) => b.type === 'gate');
  const clearance = gate?.notice?.clearance;
  return clearance ? { acs: null, clearance } : null;
}

const isMeta = (t) => t.startsWith('_') || t.includes(':');

export function poolEntry(row) {
  return {
    slug: row.slug,
    title: row.title,
    alternateTitle: row.alternate_title ?? null,
    authors: JSON.parse(row.authors),
    url: row.source_url,
    tags: JSON.parse(row.tags).filter((t) => !isMeta(t)),
    header: coverHeaderOf(JSON.parse(row.doc)),
  };
}

export function buildPool(db) {
  const get = db.prepare('SELECT slug, title, alternate_title, authors, source_url, tags, doc FROM articles WHERE slug = ?');
  return POOL_SLUGS.map((slug) => {
    const row = get.get(slug);
    if (!row) throw new Error(`cover pool: ${slug} is not in the seed`);
    return poolEntry(row);
  });
}
