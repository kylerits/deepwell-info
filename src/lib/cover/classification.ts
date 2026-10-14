// PORTED from ~/git_local/deepwell/packages/article-doc/src/classification.ts on 2026-10-08 (modified: subset — object class + ACS helpers).

// Order is precedence: a page can carry several class tags (e.g. a reclassified item
// tagged both `keter` and `neutralized`) and the first match below wins. Base classes
// deliberately outrank terminal/reclassification ones. Reordering changes which class a
// multi-tag page resolves to — locked by tests here and in the web acs suite.
export const OBJECT_CLASS_TAGS = [
  'safe',
  'euclid',
  'keter',
  'thaumiel',
  'neutralized',
  'explained',
  'apollyon',
  'archon',
] as const;

/** The canonical lowercase object-class token for a tag array, by precedence, or null. */
export function objectClassOf(tags: string[]): string | null {
  const set = new Set(tags.map((t) => t.trim().toLowerCase()));
  for (const cls of OBJECT_CLASS_TAGS) {
    if (set.has(cls)) return cls;
  }
  return null;
}

// —— Secondary ACS axes (Anomaly Classification System) ——
// Unlike object class (a Wikidot tag), disruption/risk/clearance are free-text values on the
// parsed `acs` block. These canonical vocabularies drive display (icons, labels) only; the
// block schema stays permissive so an unexpected value never fails ingest — callers normalize
// here and fall back to a neutral glyph. Arrays are ordered low → high severity.

export const DISRUPTION_CLASSES = ['dark', 'vlam', 'keneq', 'ekhi', 'amida'] as const;
export type DisruptionClass = (typeof DISRUPTION_CLASSES)[number];

export const RISK_CLASSES = ['notice', 'caution', 'warning', 'danger', 'critical'] as const;
export type RiskClass = (typeof RISK_CLASSES)[number];

/** Canonical disruption token for a raw value, or null if unrecognized. */
export function disruptionClassOf(value: string): DisruptionClass | null {
  const v = value.trim().toLowerCase();
  return (DISRUPTION_CLASSES as readonly string[]).includes(v) ? (v as DisruptionClass) : null;
}

/** Canonical risk token for a raw value, or null if unrecognized. */
export function riskClassOf(value: string): RiskClass | null {
  const v = value.trim().toLowerCase();
  return (RISK_CLASSES as readonly string[]).includes(v) ? (v as RiskClass) : null;
}

/** The clearance level (0–6) embedded in a raw value like "3", "Level 4", "clear-6", or null. */
export function clearanceLevel(value: string): number | null {
  const m = value.match(/[0-6]/);
  return m ? Number(m[0]) : null;
}

/** Disruption severity 1–5 (Dark → Amida), or null if unrecognized. */
export function disruptionLevel(value: string): number | null {
  const c = disruptionClassOf(value);
  return c ? DISRUPTION_CLASSES.indexOf(c) + 1 : null;
}

/** Risk severity 1–5 (Notice → Critical), or null if unrecognized. */
export function riskLevel(value: string): number | null {
  const c = riskClassOf(value);
  return c ? RISK_CLASSES.indexOf(c) + 1 : null;
}

// Canonical ACS clearance names, indexed by level (1–6).
const CLEARANCE_NAMES = ['Unrestricted', 'Restricted', 'Confidential', 'Secret', 'Top Secret', 'Cosmic Top Secret'];

/** The ACS name for a clearance level ("Confidential" for 3), or null outside 1–6. */
export function clearanceName(level: number | null): string | null {
  return level && level >= 1 && level <= 6 ? (CLEARANCE_NAMES[level - 1] ?? null) : null;
}

