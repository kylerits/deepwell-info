// The FAQ (landing-page.md §8). Faq.astro renders it and the index page's FAQPage JSON-LD reads it,
// so the two can't drift apart.
export interface FaqItem { q: string; a: string }
export const FAQ: readonly FaqItem[] = [
  { q: 'Is this official?', a: 'No. Deepwell is an unofficial, fan-made reader for the SCP Wiki. It isn’t affiliated with or endorsed by the wiki or its staff.' },
  { q: 'Am I actually a Level 2 agent?', a: 'Only in spirit. The SCP Foundation is collaborative fiction written by the SCP Wiki community. You don’t need to know any of it to start: open any article and read.' },
  { q: 'Is it really free?', a: 'Yes. Reading is free forever: every article, no paywall. A one-time $2.99 unlock adds optional extras (more themes, unlimited offline, sync). You never have to pay to read.' },
  { q: 'Are you selling the SCP stories?', a: 'No, and we never will. The content is free and community-owned under CC BY-SA 3.0. Deepwell only charges for software features, such as themes, offline and sync, which sit outside the content.' },
  { q: 'Do the authors get credit?', a: 'Always. Every article shows its author(s), a link to the original on the wiki, and the CC BY-SA 3.0 license. Authors can contact us to change or remove how their work appears.' },
  { q: 'What devices does it work on?', a: 'Deepwell is a web app you can install on iPhone, Android, and desktop — no app store required. It works offline once installed.' },
  { q: 'Does it track me?', a: 'No ads, no trackers, no account required to read. Your reading stays on your device.' },
  { q: 'Can I read offline?', a: 'Yes. Save articles and read them with no connection: on a plane, underground, anywhere.' },
];
