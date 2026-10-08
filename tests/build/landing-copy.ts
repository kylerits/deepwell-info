// Pulls the visible copy out of ~/projects/Deepwell/marketing/copy/landing-page.md so the build
// can be diffed against it (handoff §9: "diff it, don't eyeball it").
const FIELDS = new Set(['Eyebrow', 'Heading', 'H1', 'Subtitle (always visible, plain)', 'Plain-language summary',
  'Under-CTA microcopy', 'Under-pricing line', 'Small print line', 'Disclosure line', 'Attribution line', 'Sub (narrator)']);

export const normalizeCopy = (s: string): string =>
  s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

const stripMd = (s: string): string => s.replace(/\*\*/g, '').replace(/\s*\*\([^)]*\)\*\s*$/, '').trim();
const isBreak = (l: string): boolean => l === '' || /^(#|>|- |\*\*|\*\()/.test(l);

export function extractLandingCopy(md: string): Record<number, string[]> {
  const out: Record<number, string[]> = {};
  const lines = md.split('\n');
  let section = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    const h = /^## (\d+)\./.exec(line);
    if (h) { section = Number(h[1]); out[section] = []; continue; }
    if (section < 1 || section > 10) continue;
    const push = (s: string) => out[section]!.push(normalizeCopy(s));
    const continued = (first: string): string => {
      let s = first;
      while (i + 1 < lines.length && !isBreak(lines[i + 1]!.trim())) s += ' ' + lines[++i]!.trim();
      return s;
    };

    const field = /^(?:- )?\*\*([^*]+):\*\*\s*(.*)$/.exec(line);
    if (field) { if (FIELDS.has(field[1]!) && field[2]) push(stripMd(continued(field[2]!))); continue; }
    if (line.startsWith('> ')) {
      let s = line.slice(2);
      while (i + 1 < lines.length && lines[i + 1]!.trim().startsWith('> ')) s += ' ' + lines[++i]!.trim().slice(2);
      push(stripMd(s)); continue;
    }
    const bullet = /^- \*\*([^*]+)\*\*\s*(.*)$/.exec(line);
    if (bullet) { push(`${bullet[1]} ${bullet[2]}`); continue; }
    if (/^- [^*]/.test(line)) { push(line.slice(2)); continue; }
    const whole = /^\*\*([^*]+)\*\*\s*(\*\(([^)]*)\)\*)?$/.exec(line);
    if (whole) {
      if (whole[1] === 'Primary CTA') continue; // a heading for state-specific bullets, not copy
      push(whole[1]!);
      if (whole[3]) push(`(${whole[3]})`);
      if (whole[1]!.endsWith('?') && i + 1 < lines.length && !isBreak(lines[i + 1]!.trim())) push(continued(lines[++i]!.trim()));
      continue;
    }
  }
  return out;
}
