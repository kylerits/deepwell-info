// The landing's version of the app's page-zero cover (apps/web/src/lib/reader/cover/Cover.svelte +
// ClassPanel.svelte): same derivations, flattened to plain data for an Astro component.
import { APP_URL } from '../../config/site';
import { articleEyebrow, articleName, quotedName } from './article-title';
import { containmentTone, objectClassLabel, type ContainmentTone } from './acs';
import { clearanceLevel, clearanceName, disruptionClassOf, disruptionLevel, riskClassOf, riskLevel } from './classification';
import { coverArt, silhouetteForTags } from './cover-art';
import { seriesFromSlug, seriesLabel } from './series';
import type { PoolEntry } from './pool';

export const ART_COLS = 48;
export const ART_ROWS = 22;

export interface CoverAxis { value: string; level: number | null; token: string | null }
export interface CoverPanel { levelLabel: string | null; levelName: string | null; secondary: string | null; containTone: ContainmentTone; disruption: CoverAxis | null; risk: CoverAxis | null }
export interface CoverModel {
  slug: string; designation: string; name: string; stamp: string | null; tone: ContainmentTone; classLabel: string | null;
  classToken: string | null; seriesLabel: string | null; art: string; authors: string; panel: CoverPanel | null; ariaLabel: string;
  readLabel: string; appHref: string; wikiHref: string; quoted: string; attributionTail: string;
}

export function coverModel(e: PoolEntry, appUrl: string = APP_URL): CoverModel {
  const named = { title: e.title, alternateTitle: e.alternateTitle };
  const name = articleName(named);
  const acs = e.header?.acs ?? null;
  const cls = objectClassLabel(e.tags) ?? (acs ? { label: acs.containmentClass.toUpperCase(), tone: containmentTone(acs.containmentClass) } : null);
  const series = seriesFromSlug(e.slug);
  const art = coverArt({ seed: e.slug, objectClass: cls?.tone ?? null, series, cols: ART_COLS, rows: ART_ROWS, silhouette: silhouetteForTags(e.tags) }).join('\n');
  const authors = e.authors.join(', ');

  let panel: CoverPanel | null = null;
  if (e.header) {
    const level = e.header.clearance ? clearanceLevel(e.header.clearance) : null;
    panel = {
      levelLabel: level != null ? `Level ${level}` : null,
      levelName: clearanceName(level),
      secondary: acs?.secondaryClass && !/^none$/i.test(acs.secondaryClass) ? acs.secondaryClass : null,
      containTone: acs ? containmentTone(acs.containmentClass) : 'neutral',
      disruption: acs ? { value: acs.disruptionClass, level: disruptionLevel(acs.disruptionClass), token: disruptionClassOf(acs.disruptionClass) } : null,
      risk: acs ? { value: acs.riskClass, level: riskLevel(acs.riskClass), token: riskClassOf(acs.riskClass) } : null,
    };
  }

  return {
    slug: e.slug, designation: e.title, name, stamp: articleEyebrow(e.title, named),
    tone: cls?.tone ?? 'neutral', classLabel: cls?.label ?? null, classToken: cls ? cls.label.toLowerCase() : null,
    seriesLabel: series ? seriesLabel(series) : null, art, authors, panel,
    ariaLabel: `Cover — ${name}`, readLabel: `Read ${e.title} in Deepwell`,
    appHref: `${appUrl}/read/${e.slug}`, wikiHref: e.url,
    quoted: quotedName(named), attributionTail: ` by ${authors} · SCP Wiki · CC BY-SA 3.0`,
  };
}
