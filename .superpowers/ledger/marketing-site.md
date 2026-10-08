# Marketing site — execution ledger

Plan: ~/projects/Deepwell/docs/plans/2026-10-08-marketing-site.md
Branch: feat/marketing-site

| Task | Commit | Tests | Notes |
|---|---|---|---|
| 1 | | build smoke | scaffold |
| 2 | feat: vendored tokens, fonts, logo; base layout; launch switch | launch (3), logo geometry (1), build no-third-party (6) | vendored foundation + launch switch |
| 3 | feat: atmosphere level (ported) and pre-paint boot script | level (7), boot (3); build, check, test:build pass | boot script inlined in Base; coverSlugs prop |
| 4 | feat: atmosphere hold gate (ported visibility + battery hold) | hold (4) | ported hold/release + visibility/battery sources |
| 5 | feat: scroll depth anchors and easing | depth (6) | pure; consumed by field island |
| 6 | feat: Descent field parameters from the round-1 handoff | field-params (8) | handoff §4 numbers verbatim |
| 7 | feat: idle-triggered presence state machine | presence (6) | once per session, idle 8s, depth > 0.6 |
| 8 | feat: port cover art, class and title helpers from the app | cover ports (ported app tests unchanged) + classification (3) + ports drift (4) | unchanged ports drift-tested; classification/acs/series are subsets |
| 9 | feat: hero cover pool generated from the app seed (metadata only) | cover-pool-lib (5) + pool (2) | generated from seed; live-wiki author check: 173 Moto42 ✓, 087 Zaeyde ✓, 096 Dr Dan ✓, 055 CptBellman+qntm ✓ (order differs), 426 Flah ✓, 914 Dr Gears ✓, 2317 DrClef ✓, 3001 OZ Ouroboros ✓, 4999 CadaverCommander ✓, 5000 Tanhony ✓ |
| 10 | feat: cover view model (app cover derivations, canon attribution) | cover-model (5) | mirrors Cover.svelte/ClassPanel.svelte; code and test values from brief matched without edits |
| 11 | feat: hero cover component with no-shift per-visit pick and JS-off default | cover build (4 x 2 builds) | landing.css refs were 1 line earlier than briefed (.reader 240, cover 284-383 ok); copied 239-254 and 284-383 plus the .cover__read focus ring (222-224); temp :root vars in cover.css to delete in Task 12 |
| 12 | feat: site CSS from the round-1 canvas, PlainSummary, copy extractor, contrast floors | 90 unit, 16 build, check clean | body recede floor raised to .66 (Kyle's call; .62 was 4.38:1 on LIT); contrast test parses shipped CSS; reader phone padding in cover.css |
| 13 | feat: hero, trust strip, problem and modules 01–03 | copy build §1–4 x 2 builds (8), 90 unit, check clean | Mark.astro gained optional color prop (default unchanged), Problem passes #EADFC6; no copy diffs vs landing-page.md; pilot CTA slot is placeholder div for Task 16 |
| 14 | feat: themes, pricing, licensing, FAQ, final CTA and footer; launch-switch test | copy build §1–10 x 2 builds, launch (3), footer (2), 90 unit, check clean | copy test now asserts non-empty extracted copy per section; footer links test (About/Press/Instagram absent while null); data-atmo-switch is an empty placeholder for Task 17; final slot pilot = waitlist placeholder for Task 16 |
| 15 | feat: waitlist Worker (D1, honeypot, rate limit, no-JS 303) | waitlist (7 + 2 normalize), 98 unit, tsc -p worker clean, dry-run ok | ratelimits shape accepted by wrangler 4.148.0 unchanged; check script now astro check && tsc -p worker; smoke on port 8799 (8787 held by another workerd): {"ok":true}, row smoke@example.com in local D1; database_id still all-zero until Task 21 |
| 16 | feat: progressive-enhancement waitlist form for the pilot state | client (3), waitlist build (1), 101 unit, 42 build, check clean | WAITLIST_ERROR is plan Decision 3 copy, pending Kyle approval; ids hero-email/final-email; launch test unchanged and green |
| 17 | feat: tube layer, tape OSD, static field, atmosphere levels and switch | legibility build (4), 47 build, 101 unit, check clean | first Svelte island (client:idle, SSR renders 3 aria-pressed buttons); background-attachment dropped; JS gzip 665+527+12833 B = ~14.0 KB; no new external URLs |
| 18 | feat: WebGL Descent field island (shafts, motes, volumes, presence, hold) | frame (6), 107 unit, 47 build, check clean | shaders compiled unchanged in Chromium (Playwright MCP), data-field=webgl, 0 console errors; Off -> static shafts, Full -> webgl; JS gzip 570+13483+525+5599+262 B = ~20.0 KB; hold.ts getBattery().catch added; e2e spec runs in Task 20; failure test: top reads as distant cold light from out of frame, deep field is near-black with no edge, not a place (passes); final thin shaft very faint at Go deeper |
| 18 fix 1 | fix: field resize flash, hold-aware input, honest mote drift test | frame (6), 107 unit, 47 build, check clean | resize no-ops on unchanged buffer + immediate redraw; held/rendererless full = settled depth, frozen time, no presence; mote test RED with flipped drift; failed program cleanup; e2e no-WebGL2 collects console errors; JS gzip ~20.5 KB; Chromium: 0 console errors, Off->Full ok |
