// Share-preview and structured-data constants. The share card itself is rendered by scripts/gen-og.mjs
// (which reads OG_SLUG from this file); bump OG_VERSION whenever the image changes so platforms re-scrape.
import { APP_URL, CONTACT_EMAIL } from '../../config/site';
import { COVER_POOL } from '../cover/pool';
import { coverModel } from '../cover/cover-model';
import type { FaqItem } from '../../data/faq';

export const OG_SLUG = 'scp-173';
export const OG_VERSION = 1;
export const OG_IMAGE = `/og/deepwell-card.jpg?v=${OG_VERSION}`;

const entry = COVER_POOL.find((e) => e.slug === OG_SLUG);
if (!entry) throw new Error(`OG_SLUG "${OG_SLUG}" is not in the cover pool`);
const card = coverModel(entry);
export const OG_IMAGE_ALT = `The Deepwell logo beside the reader’s cover for ${card.quoted}${card.attributionTail}`;

export function siteJsonLd(site: URL, faq: readonly FaqItem[]): string {
  const url = site.href;
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${url}#website`, name: 'Deepwell', url, publisher: { '@id': `${url}#org` } },
      { '@type': 'Organization', '@id': `${url}#org`, name: 'Deepwell', url, logo: new URL('/icon-512.png', site).href, email: CONTACT_EMAIL },
      {
        '@type': 'WebApplication', name: 'Deepwell', url: APP_URL,
        description: 'An unofficial, typography-first reader for the SCP Wiki. Free to read, offline, no ads, no tracking.',
        applicationCategory: 'ReferenceApplication', operatingSystem: 'Web', isAccessibleForFree: true,
        publisher: { '@id': `${url}#org` },
        offers: [
          { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Deepwell Pro (one-time)', price: '2.99', priceCurrency: 'USD' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    ],
  };
  // Inline in a <script>, so "<" must never appear raw (it could close the tag).
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}
