import type { AtmosphereLevel } from './atmosphere/level';

// Inline <head> script: runs before first paint so the level, the no-JS fallbacks and the hero
// cover are settled with no flash or layout shift. Mirrors resolveAtmosphere (tested for parity).
export function bootScript(o: { storageKey: string; buildDefault: AtmosphereLevel; slugs: readonly string[] }): string {
  return `(function(d,w){var h=d.documentElement;h.setAttribute('data-js','');var a=null;` +
    `try{a=w.localStorage.getItem(${JSON.stringify(o.storageKey)})}catch(e){}` +
    `if(['full','reduced','off'].indexOf(a)<0){a=(w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches)?'reduced':${JSON.stringify(o.buildDefault)}}` +
    `h.setAttribute('data-atmosphere',a);var s=${JSON.stringify(o.slugs)};` +
    `if(s.length)h.setAttribute('data-cover',s[Math.floor(Math.random()*s.length)])})(document,window);`;
}
