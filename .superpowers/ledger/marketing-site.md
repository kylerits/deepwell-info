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
