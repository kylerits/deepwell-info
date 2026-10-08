import type { AtmosphereLevel } from './atmosphere/level';

// Escape for safe embedding in an inline <script>: no `</script>`/`<!--` breakout, no JS line separators.
const js = (v: unknown): string =>
  JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

// Inline <head> script: runs before first paint so the level, the no-JS fallbacks and the hero
// cover are settled with no flash or layout shift. Mirrors resolveAtmosphere (tested for parity).
export function bootScript(o: { storageKey: string; buildDefault: AtmosphereLevel; slugs: readonly string[] }): string {
  return `(function(d,w){var h=d.documentElement;h.setAttribute('data-js','');var a=null;` +
    `try{a=w.localStorage.getItem(${js(o.storageKey)})}catch(e){}` +
    `if(['full','reduced','off'].indexOf(a)<0){a=(w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches)?'reduced':${js(o.buildDefault)}}` +
    `h.setAttribute('data-atmosphere',a);var s=${js(o.slugs)};` +
    `if(s.length)h.setAttribute('data-cover',s[Math.floor(Math.random()*s.length)])})(document,window);`;
}
