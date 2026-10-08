# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

This is the marketing site for **Deepwell**, served at **readdeepwell.com**. Deepwell is an unofficial, typography-first e-reader for the SCP Wiki. Tagline: *Secure. Contain. Peruse.* Positioning line: *"A terminal into the archive."*

The site introduces Deepwell while keeping an air of mystery. Visually it echoes the app, with the art direction turned up to 11: interactive WebGL scenes built to produce **quiet thalassophobia**.

**Status:** greenfield. No framework, build tooling or package manager has been chosen yet. The repo is on GitHub at `kylerits/deepwell-info` (private). Add commands here once a stack exists, and don't assume any before that.

## The three Deepwell repos

| Repo | Holds |
|---|---|
| `~/projects/Deepwell` | **Canonical** home for brand, design system, marketing copy and strategy, product docs, and specs and plans for every phase. Start with its `CLAUDE.md` and `README.md`. |
| `~/git_local/deepwell` | App code: SvelteKit PWA (`apps/web`) and Cloudflare Worker API (`apps/api`). |
| this repo | Marketing site code only. |

The product repo's convention is that specs and plans live in `~/projects/Deepwell/docs/specs|plans/` (`YYYY-MM-DD-<phase>[-design].md`), and code repos hold code and execution ledgers only. Write design specs for this site there, not here. Don't copy brand assets or copy docs into this repo without marking them as vendored.

Live domains: the app is at `app.readdeepwell.com` (dev `app-dev.`), the API at `api.readdeepwell.com`, and contact is `feedback@readdeepwell.com`. The landing copy's `[APP_URL]` placeholder means `https://app.readdeepwell.com`. The app and API deploy to Cloudflare Workers under the readdeepwell.com Cloudflare account.

## Read before working

- **`~/projects/Deepwell/CREATIVE-DIRECTION.md`**: the emotional target. Read it before any visual work.
- **`~/projects/Deepwell/marketing/copy/landing-page.md`**: section-by-section page copy. Build from it.
- `~/projects/Deepwell/marketing/positioning-and-messaging.md`: audiences, pillars and voice. `docs/product/05-marketing.md` there holds strategy and the messaging bank.
- `~/projects/Deepwell/design/brand/brand-guidelines.md`, plus `tokens.css`, `tokens.json` and `logo/`: canonical colors, type and marks.
- `~/projects/Deepwell/marketing/instagram/visual-system-lit-void.md`: a precise parameter spec for social (the offscreen light model, light shafts and motes, the recede rule, the silhouette, the CRT layer stack, legibility limits). Read `RECONCILIATION.md` in the same folder first, because some of it still conflicts with canon.
- `~/projects/Deepwell/docs/roadmap.md`: launch milestones. The landing page is Linear KYL-18/19 (Readiness) and KYL-37 (goes public with the $2.99 pricing and roadmap page at the r/SCP launch, 2026-10-20). `marketing/copy/roadmap-page.md` is the companion page.

## Creative direction: something vast, past the edge of perception

"Quiet thalassophobia" here means a **feeling, not the sea**: the vague sense that something indescribably big and dangerous lurks somewhere further than we can perceive. **This is not a water look.** No ocean, waves, underwater light, marine particles or creatures. Any scene that turns the feeling into a literal place (an ocean, a cave, outer space) has replaced the dread with scenery. Carry it with scale, distance, darkness, stillness and the limits of what the viewer can see.

This is carried on the brand's Black Lodge field, not in place of it (`RECONCILIATION.md` §1, resolved 2026-10-07).

**The vastness belongs to the *archive*, not the name.** Deepwell is named for the Foundation's Deepwell Servers. It is not a literal well. Never justify or write the imagery as "Deepwell is a well."

The pitch is a **warm cabin against a cold dark**. The reader is the lit interior; the archive outside the glass is vast and indifferent. The coziness only means something if what's outside is genuinely unsettling. The rules, in priority order:

1. **Never show the edge.** No scene or scroll position may resolve the extent of the dark: no far wall, floor or reachable horizon. This cannot be traded away.
2. **The light source is always offscreen and unreachable**, beyond the frame edge. Never a light you could reach.
3. **Text recedes rather than ends.** It fades out past the lit zone.
4. **Dread by implication, not monsters.** Show what the presence does to scale and stillness, not the presence. At most one vague, partial, edge-cropped cue that is never identifiable.
5. **Nothing feels enclosed**: no floors, and no surfaces for things to rest on.
6. **Cold outside, warm inside.** When the product appears, it is the warm exception (lamp amber, the reader's paper) and is never color-matched to the dark around it.

**Failure test:** if a section feels safe, enclosed or resolved, or reads as a place rather than a feeling, it has failed, however correct its measurements are.

### Mystery versus clarity

The landing page runs the **orientation frame** (adopted 2026-10-07; canon exception in `marketing/positioning-and-messaging.md` §7, rules in `marketing/copy/landing-page.md`). The page is an orientation packet for a new Level 2 field agent, spoken by the administrative narrator, and it keeps urging the visitor deeper. Its guardrails are build requirements:

- Every narrative section ends with a **plain-language summary** (Courier Prime label, Inter body, never under atmosphere).
- **Plain voice** covers anything a visitor must understand: pricing, licensing, privacy, the FAQ answers and the unofficial disclosure. Narrator flavor stays in their eyebrows.
- Never imply the Foundation issued or endorses Deepwell. Paying never grants clearance. CTA labels are plain.
- The frame is for this site only. The app and social keep the no-roleplay rule.

Build the mystery from the visuals, pacing and descent, not by obscuring those facts.

The copy defines **two launch states**. *Pre-public (pilot)*: the primary CTA is a waitlist or early-access sign-up. *Public*: the primary CTA is "Start reading — free" linking to the app. Only the hero and final CTA swap between states. Build it so the swap is a single switch.

## Echoes of the app

The app already ships a restrained version of this mood: the "Deep Field" tone treatment (`~/git_local/deepwell/apps/web/src/lib/atmosphere/`). It has drifting scanlines, roll bars, drifting particles, offscreen-light breathing and a tape OSD (an on-screen timecode readout). The site's WebGL should read as the same world pushed further, not a different one.

Mirror its motion discipline:
- Atmosphere has `full` / `reduced` / `off` levels. `prefers-reduced-motion` forces `reduced`.
- Animation is held while the tab is hidden or the device is saving power.
- Reading text never sits under an overlay.

Apply that here as well:
- Pause render loops when the tab is hidden or the canvas is offscreen.
- Give reduced motion a calm, slow or static scene rather than an empty one.
- Keep a non-WebGL fallback so the copy and CTAs never depend on the GPU.
- **Legibility outranks atmosphere.** No grain, chromatic fringe or bloom on body copy, and keep the opacity floors from the lit-void spec.

## Brand constraints (canon wins over the lit-void exploration)

- **Type:** Literata (story voice, headlines) and Courier Prime (apparatus: item numbers, labels, attribution), with Inter for UI. All are OFL; the woff2 files are in `~/git_local/deepwell/apps/web/static/fonts/`. Never Georgia or a generic mono.
- **Color:** vendor tokens from `~/projects/Deepwell/design/brand/tokens.css` and keep a "VENDORED from…" header, the way the app does. Red is bureaucratic (stamps, alerts), teal is dreamy (glow, focus), and lamp amber is the only warm note. **Never use red and teal at equal visual weight in one view.**
- **Object-class colors** are canon (Safe `#4C7D6B`, Euclid `#B8862E`, Keter `#A8332F`, plus the extended set in tokens) and match the reader's ACS treatment, the app's color bars for object class and severity. The lit-void exploration's earlier per-class palettes are withdrawn.
- **The Stack mark:** use `design/brand/logo/` as-is. It is flat, with no masks, gradients or filters. WebGL may *interpret* it, but wherever it appears as the logo it stays canonical. Never redraw it.

## Licensing and community rules

- **Sell the armchair, never the archive.** Never imply Deepwell sells, owns or gates the stories.
- Attribution for any quoted SCP text uses this exact string: `"{Title}" by {author(s)} · SCP Wiki · CC BY-SA 3.0`, plus a link to the original.
- Disclose unofficial status with the subtitle *"An unofficial reader for the SCP Wiki"* and the footer line, never an UNOFFICIAL stamp.
- **Never derive art from the SCP circle-arrows mark** (`scp-mark.svg`, by Aelanna). Share-alike would contaminate any derived work. If it appears at all, it is a secondary badge credited "SCP logo by Aelanna, CC BY-SA 3.0".
- The posture toward the SCP community is "guest, not landlord". The landing copy promises no ads, no tracking and no account to read. Don't add analytics or third-party scripts that contradict that without raising it first.
