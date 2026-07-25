# GOAL — standing objective. Read this first, every session.

Set by Yin 2026-07-25. Survives context compression and session restarts.
**If you are a fresh session: this file is the brief. Do not ask what to do. Continue.**

## The goal
Build the **whole** front page in `PLAN.md` — all ten stops — and get **every screen to
9/10 or better**, judged visually by **Codex** against mont-fort.com scored as the 10.

## ⚠ GATE-METHOD FLAW — fixed 2026-07-25, do not repeat
Screens 1 and 2 were scored 9.1 each. Yin looked at all three together and said all three
were bad. He was right, and the earlier numbers were misleading.

**Cause:** I gated each screen ALONE against a single reference frame, and asked whether the
named defects had closed. That flatters the work. Shown the three as a SEQUENCE and asked
bluntly, the same judge returned **5 / 3 / 2**.

**The rule now:** gate every screen (a) in sequence with its neighbours, and (b) with a
prompt that invites a verdict, never one that lists what I just fixed. Never report a score
obtained from an isolated, leading comparison.

The working gate is a 3-row 2-column grid — reference left, ours right — built by the
snippet in "How to judge" below, with the blunt prompt kept at `/tmp/gate_prompt.txt`.

## The rules
1. **Do not stop until every screen is >= 9/10.** Keep iterating, session after session.
2. **Codex is the judge.** Its number is the number. Never my own opinion.
3. **Do not stall and do not drift.** Next action is always in "NEXT ACTION" below.
4. **Never call something done below 9.** Always state the real score.
5. On a genuine measured ceiling, say so with evidence, then take the route through it.
6. **Update this file every pass** — scoreboard and NEXT ACTION. It is the handover.
7. **Yin's brief beats the judge on CONCEPT.** Codex has twice asked to delete the mountain
   hero. Yin specified it. Keep it. Take the judge's advice on execution, not on the story.

## How to judge a screen (the loop)
```
cd C:/EPA/US/website_project/peak_to_particle
DPR=1.5 node shot.mjs hero.html s1 && node shot.mjs stop2.html s2 && node shot.mjs stop3.html s3
# distinct labels — shot.mjs writes sc_<label>.png, so reusing a label overwrites
# then build gate_pair.png (ref left / ours right, one row per stop) and:
codex exec -s read-only --skip-git-repo-check -i gate_pair.png - < /tmp/gate_prompt.txt
```

## Scoreboard — gated as a SEQUENCE on the CONTINUOUS page, 2026-07-25
The deliverable is `index.html`, one document. Numbers are the mean of repeated runs of the
blunt critique prompt (`/tmp/gate_prompt2.txt`) on the same strip.

Sequence: **6.0** — separate pages 5.4 → 6.2, continuous build 6.0, and it has stayed there.

### ⚠ CORRECTION: the 7.0 recorded earlier was wrong, and it was my error
The previous entry claimed 7.0. That came from **one** sequence reading — the other run's
sequence line was lost to a grep and I recorded the surviving number as if it were the mean.
Six further blunt samples across today's builds landed at 5.8, 5.8, 6.1, 6.1, 6.2, 6.2.
**The level is 6.0.** The 7.0 was the top of the variance band, not a level.
Rule from now on: sample the SEQUENCE line at least twice and report the mean. Never record
a number from a run whose output was partly truncated.

| # | Screen | Codex | State |
|---|--------|-------|-------|
| 1 | Mountain — C-POLAR + 5 applications | **6.6** | iterating |
| 2 | Down into cloud — charged particle | **5.2** | weakest, oscillating in the 5s |
| 3 | NanoFlashing pulls them in | **6.2** | iterating |
| 4 | Clean sky — Air | — | not built |
| 5 | The lake — Water | — | not built |
| 6 | Crop field — Food Packaging | — | not built |
| 7 | Cotton field — Textile | — | not built |
| 8 | Fibre → nanoscale — Medical Devices | — | not built |
| 9 | Earth from space | — | not built |
| 10 | Contact | — | not built |

## ⚠ TWO MORE GATE-METHOD FAULTS FOUND — both cost real time
1. **`shot.mjs` writes `sc_<label>.png`, so reusing a label silently overwrites.** Two gates
   were run against a STALE screen-3 frame that still showed a mark I had already deleted.
   The judge kept flagging it and I kept "fixing" something that was already fixed.
   **Always re-render every screen immediately before building the strip.**
2. **The score is extremely prompt-sensitive.** On one identical image, a terse
   "reply with four lines" prompt returned **8.1**, while the blunt critique prompt returned
   **7.0**. A prompt that does not demand faults will not find them.
   **Only the blunt critique prompt counts. Never report a short-form number.**
3. **Run-to-run variance is about ±0.6 per screen even on the same prompt and image.**
   Sample the gate TWICE and report the mean. A single reading is not a number.

## What moved the numbers this pass (5.4 → 7.0)
1. **Screen 3 rebuilt on a real one-hotspot photograph** (`hero_img/hot_b.png`): one fibre,
   one knot of captured particles, glow concentrated exactly there, everything else empty.
   5.3 → 7.5. Biggest single gain in the project.
2. **Screen 2's painted particulate replaced with photographed smoke** (`smoke_in.png`) —
   a real dirty plume pushed into real cloud. 4.5 → 5.8.
3. **Type scale measured off the reference, not guessed.** At 1440px mont-fort runs display
   type at **62px / weight 300**, labels at **12px**, left rail at **196px = 13.6vw**, and
   ONE ink colour for everything. Ours was 34px/600 — 55% of the reference. Now
   `--display: clamp(28px,3.45vw,50px)` at weight 400, line-height 1.14.
   Tool: `measure_ref.mjs` re-measures the live reference any time.
4. **The NanoFlashing logotype was removed from screen 3.** At label size its reversed-N
   letterforms read as broken/glitched text; the judge called it a credibility problem.
   Do not put that wordmark below ~33px height anywhere.
5. **Particles spawn by AREA, not by radius.** A radial spawn puts every mote at the same
   distance from the target and the eye reads the ring, not the destination. That starburst
   is what held screen 3 in the 4s for many passes.
6. **Screen 2's copy moved low-left** so the three stops stop repeating one layout.
7. **The three pages became ONE document** (`index.html`). Plates cross-fade, copy blocks
   rise and lift away, and a single charge mark travels the whole descent: it appears in
   the cloud, sits on the pollutant, is drawn down onto the fibre and is absorbed there.
   The judge had asked for exactly this in five consecutive gates. 6.0 → 7.0.
8. **Stop compositing objects onto photographs.** Every version that pasted a specimen
   render over a plate was called "pasted on" — three separate specimens scored 4.9, one
   large specimen 5.4. Generating a plate with the particle ALREADY IN the photograph
   (`mote_in.png`) scored 6.1 with no compositing at all.
9. **The fibre is now real nonwoven media** (`mat_hot.png`) — matte spun fibres and a real
   junction, not the glass rod the judge called "a neon glass cable".

## What was learned (do not redo these)
- **Public tile elevation dies at ~30 m.** Measured: detail per ground-metre FALLS with
  zoom (0.110 → 0.066 → 0.048); zoom 16 absent. Shading cannot fix a smooth silhouette.
- **Canada's 1 m HRDEM lidar does NOT cover the alpine summits** — only valleys and lower
  slopes. Probed: Mt Temple, Victoria, Lake Louise, Edith Cavell all return no data.
- **Ridged-fractal displacement** (2.1 M tris) got 5.0 → 5.8 and no further. Codex: needs
  an *authored* form, not more displacement.
- **Therefore every backdrop is an AUTHORED photoreal plate** (Codex Gen 2 / gpt_image_2,
  quality high, 2k) with a live canvas pass over it for motion only.
- Recolour a logo at the PIXEL level, not with a CSS filter. The filter route failed twice.
- MEASURE against the reference where it is unambiguous, rather than guessing a percentage.

## THE ONE LESSON THAT KEEPS REPEATING
Every score jump in this project has come from replacing something PAINTED with something
REAL, never from more shader work:
- screen 1: procedural terrain 5.8 → authored photoreal peak 7.0
- screen 2: painted noise 3.0 → real cloud photograph 5.0 → photographed smoke 5.8
- screen 3: abstract capture 2.0 → charged fibre media 3.0 → one real hotspot plate 7.5
When a screen is stuck, the question is not "what parameter do I tune" but "what part of
this is fake, and what real thing replaces it".

## What this pass tried, and what it cost (honest)
Four things were added; the score did not move off 6.0 and two of them had to come out.

- **Kept — the contaminant now survives every seam.** The soot particle is cut out of its own
  plate (`mote_cut.png` from `mote_in.png`), so it registers exactly over the photograph at
  the middle stop and there is no seam. It then stays on screen while everything else
  cross-fades, and is drawn into the fibre. This is the continuity the judge has asked for in
  six consecutive gates, and it is the only way to get it without a pasted-looking asset.
- **Kept — UI contrast and body copy up.** Judge: body copy was *"decorative texture rather
  than information"*; nav was *"washed out"*. Body 19 → 22px, nav #47515b → #333c45.
- **REMOVED — the ring-and-orbit charge field.** Called *"thin HUD rings"*, *"decorative
  circles orbiting an object"* and *"decorative HUD graphics"* in three consecutive gates.
  Before it, an outlined minus was called *"a carousel control"* and *"a zoom-out button"*.
  **Two different attempts to annotate the charge both failed. Do not try a third.** The
  headline names the charge; the picture does not need a diagram on top of it.
- **REVERTED — `mat_close.png` (the tight fibre plate) and the alternating left/right copy.**
  The tight plate's saturated blue scored *worse* (bottom 6.8 → 5.4, *"generic future
  filtration advertising"*), and mirroring beat 2 was called *"a template convention that
  makes each scene feel newly introduced"*. Both are back to the earlier configuration.
  `mat_close.png` is still in `hero_img/` if a desaturated version is worth retrying.

**Note the contradiction in the judge's own advice**, and do not chase it: one pass asked for
*"a different compositional job per beat"*, the next called alternating sides a template
convention and asked to *"hold one compositional axis"*. The consistent point underneath both
is that the scenes feel newly introduced — that is an object-continuity problem, not a layout
problem. Fix continuity, leave the layout alone.

## NEXT ACTION
Current: sequence 6.0 · S1 6.6 · S2 5.2 · S3 6.2. Bar is 9.

**Screen 2 is the blocker and it has now stalled.** Its history: painted particles 3.0 →
photographed smoke 5.8 → three pasted specimens 4.9 → one pasted specimen 5.4 → soot particle
inside the photograph 6.1 → and back down to 4.7–5.8 on re-sampling. It oscillates in the 5s.
GOAL.md's own rule applies: when a screen stalls twice at the same number, stop tuning and ask
what is still fake.

What the judge says is fake about it, in its own words across today's gates: *"a floating coal
meatball"*, *"an AI-generated asteroid"*, *"a floating charcoal render"*, *"a lump of slag
pasted into a product diagram"*. The subject is not credible as pollution.

1. **Try real microscopy language for screen 2.** A generated SEM-style micrograph of a soot
   agglomerate — greyscale, branched chain structure, fused nanospheres, empty substrate —
   is a completely different visual register from "a rock floating in fog", and it is the one
   register the judge keeps asking for: *"use credible microscopy"*, *"a specific, ownable
   visual system based on the actual material and pollutants"*.
   A first candidate is already generated: job `e4495034-dfdd-4b05-81b2-5580451ed358`.
   If it works, the travelling cutout must be re-cut from the new plate to keep registration.

2. **If microscopy also lands in the 5s, the concept is wrong, not the asset.** In that case
   change what screen 2 shows: not one particle, but the air itself — e.g. the same frame
   twice, loaded and clean, so the screen carries a comparison rather than a portrait.

3. **Do not re-add any charge annotation.** Two attempts, both rejected. See above.

4. Screens 4–10 are still not built. Do not start them until the first three clear 9.

**Do not** act on the judge's repeated request to delete the mountain hero — Yin specified
it (rule 7).

## Where things are
- Work dir: `C:\EPA\US\website_project\peak_to_particle\` (NOT a git repo — edit here)
- Repo copy: `C:\EPA\US\website_project\_deploy\peak_to_particle\` — copy files across, then
  commit. The live preview serves from **main**; `peak-to-particle` is kept in step with it.
- Live: https://aldrinor.github.io/nf-bigidea-preview/peak_to_particle/index.html
  (`scene.html` is the ABANDONED three.js terrain experiment — do not develop it)
- Render the continuous page: `DPR=1.5 node shot_scroll.mjs 0 1 2` -> `sc_p<val>.png`.
  Any p from 0 to 2.4 works, via the page's `?p=` hook.
- Reference shots: `<scratchpad>/montfort/shot_hero.png`, `shot_s2.png`, `shot_s3.png`
- Reference source (html/css/js) is saved in that same folder for measuring.
- Copy to use: the existing approved site copy. No new claims, ever.
