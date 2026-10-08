// PORTED from ~/git_local/deepwell/apps/web/src/lib/atmosphere/Atmosphere.svelte on 2026-10-08:
// the module-level hold()/release() counter and the visibility + battery-saver $effect, lifted
// into plain functions (no Svelte) so the field island and tests share one implementation.
export interface HoldGate { hold(): void; release(): void; isHeld(): boolean }

export function createHoldGate(root: HTMLElement, onChange?: (held: boolean) => void): HoldGate {
  let held = 0;
  return {
    hold() { held += 1; if (held === 1) { root.setAttribute('data-atmosphere-held', ''); onChange?.(true); } },
    release() {
      if (held === 0) return;
      held -= 1;
      if (held === 0) { root.removeAttribute('data-atmosphere-held'); onChange?.(false); }
    },
    isHeld: () => held > 0,
  };
}

type Battery = { charging: boolean; level: number; addEventListener(t: string, cb: () => void): void; removeEventListener(t: string, cb: () => void): void };

export function wireHoldSources(gate: HoldGate, env: { doc: Document; nav: Navigator }): () => void {
  let owned = 0;
  const take = (): void => { owned += 1; gate.hold(); };
  const drop = (): void => { if (owned > 0) { owned -= 1; gate.release(); } };

  let hiddenHeld = false;
  const onVis = (): void => {
    if (env.doc.hidden && !hiddenHeld) { hiddenHeld = true; take(); }
    else if (!env.doc.hidden && hiddenHeld) { hiddenHeld = false; drop(); }
  };
  env.doc.addEventListener('visibilitychange', onVis);
  onVis();

  let disposed = false;
  let saving = false;
  let battery: Battery | undefined;
  let onSave: (() => void) | undefined;
  const nav = env.nav as Navigator & { getBattery?: () => Promise<Battery> };
  if (typeof nav.getBattery === 'function') {
    void nav.getBattery().then((b) => {
      if (disposed) return;
      battery = b;
      onSave = (): void => {
        const now = !b.charging && b.level < 0.2;
        if (now && !saving) { saving = true; take(); } else if (!now && saving) { saving = false; drop(); }
      };
      b.addEventListener('levelchange', onSave);
      b.addEventListener('chargingchange', onSave);
      onSave();
    });
  }

  return () => {
    disposed = true;
    env.doc.removeEventListener('visibilitychange', onVis);
    if (battery && onSave) { battery.removeEventListener('levelchange', onSave); battery.removeEventListener('chargingchange', onSave); }
    while (owned > 0) drop();
  };
}
