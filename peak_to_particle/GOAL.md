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
The deliverable is now `index.html`, one document. Numbers below are the mean of TWO runs
of the blunt critique prompt (`/tmp/gate_prompt2.txt`) on the same strip.

Sequence: **7.0** — separate pages 5.4 → 6.2, first continuous build 6.0, now 7.0.

| # | Screen | Codex | State |
|---|--------|-------|-------|
| 1 | Mountain — C-POLAR + 5 applications | **7.4** | iterating |
| 2 | Down into cloud — charged particle | **6.1** | weakest |
| 3 | NanoFlashing pulls them in | **6.8** | iterating |
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

## NEXT ACTION
Current: sequence 7.0 · S1 7.4 · S2 6.1 · S3 6.8. Bar is 9. Screen 2 is still the weakest.

Do these in order:

1. **Take the circle off the charge mark.** The judge, twice: *"the circled minus looks like
   a carousel control / a zoom-out button... a perfect UI-style badge sitting above the
   imagery."* Its fix: *"represent charge through a subtle field, glow, displacement, or
   particles orbiting the contaminant, then visibly collapsing as capture occurs."*
   So: no badge. A faint field around the particle that collapses into the fibre at capture.

2. **Give each beat a different compositional job.** Right now all three are
   nav / left headline / small paragraph / object right / big empty field.
   Judge's fix: *"start with a centred thesis, let the pollutant interrupt or pass through
   the typography in the second beat, and make the final capture nearly full-frame with the
   copy closer to the interaction."*

3. **Body copy up in size and contrast** — *"currently treated as decorative texture rather
   than information."*

4. **Gate the TRANSITION, not just the three endpoints.** Three stills cannot show a scroll.
   `shot_scroll.mjs` takes any `p` value, so render p = 0, 0.5, 1, 1.5, 2, 2.3 and put the
   mid-transition frames in the strip. Continuity is the thing being built; it has to be the
   thing being judged.

5. Screens 4–10 are still not built. Do not start them until the first three clear 9.

**Do not** act on the judge's repeated request to delete the mountain hero — Yin specified
it (rule 7).

**Pace note, honestly:** screen 3 oscillated for many passes (2,3,4,4,4,5,5,5,6,5,4,4,5)
before real assets moved it. Every gain came from a concept change or a real asset. Every
regression came from over-correcting one parameter per pass.

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
