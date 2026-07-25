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

Sequence: **6.8** — separate pages 5.4 → 6.2, continuous 6.0, micrograph screen 2 6.2,
both micro screens sharing one instrument **6.8**.
There are now TWO instruments, and they measure different things. Report both.

- **3-row strip** (three scroll positions, ref left / ours right) — comparable with every
  earlier number in this file. Current: 6.3, 6.7, 6.8 → **6.6**. It has sat at 6.6–6.8 across
  four builds. Three stills cannot show a transition, so this instrument is blind to the thing
  that was built this pass.
- **7-frame scroll strip** (`gate_scroll.png`, prompt `/tmp/gate_scroll.txt`) — seven
  consecutive frames of the descent, which is the only way to judge continuity. Before this
  pass: **5.0**, and the judge's verdict was *"it reads as separate sticky slides"*. After:
  **5.8, 6.2 → 6.0**, verdict *"continuous: yes"*. That is a full point on the instrument that
  actually measures what was changed.

### ⚠ CORRECTION: the 7.0 recorded earlier was wrong, and it was my error
The previous entry claimed 7.0. That came from **one** sequence reading — the other run's
sequence line was lost to a grep and I recorded the surviving number as if it were the mean.
Six further blunt samples across today's builds landed at 5.8, 5.8, 6.1, 6.1, 6.2, 6.2.
**The level is 6.0.** The 7.0 was the top of the variance band, not a level.
Rule from now on: sample the SEQUENCE line at least twice and report the mean. Never record
a number from a run whose output was partly truncated.

| # | Screen | Codex | State |
|---|--------|-------|-------|
| 1 | Mountain — C-POLAR + 5 applications | **7.0** | copy gave it a job; plate/crop ruled out |
| 2 | Down into cloud — the pollutant | **6.7** | |
| 3 | NanoFlashing pulls them in | **6.9** | |

Scroll continuity (7-frame instrument): **6.0**, up from 5.0 this pass.
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

## SCREEN 2 IS UNSTUCK — real microscopy language was the answer
Screen 2 had been pinned in the 5s across five treatments: painted particles 3.0,
photographed smoke 5.8, three pasted specimens 4.9, one pasted specimen 5.4, a soot particle
inside a fog photograph 4.7–6.1.

Replacing it with a **generated electron-micrograph** — `hero_img/sem_light.png`, a branched
soot agglomerate of fused nanospheres, dark on a bright near-white substrate — took it to
**7.5 in one reading and 6.0–6.2 in others**, its best numbers in the project. The judge on
that frame: *"the strongest frame. Clear contrast, strong object scale, and immediately
understandable copy."*

Two things mattered, and both should be reused on screens 4–10:
- **The visual REGISTER, not just the subject.** "A rock in fog" and "a micrograph of soot"
  are the same object; only one of them is credible. Ask what instrument would really show
  this thing, and generate in that instrument's language.
- **Ask for the specimen DARKER than its ground.** The first micrograph came back on mid-grey
  and fought the light palette. Adding "rendered clearly darker than its background, on a
  bright near-white substrate" fixed it in one shot. Keep that phrasing.

## ONE INSTRUMENT FOR BOTH MICRO SCREENS — this is what moved 6.2 → 6.8
Screen 3 was a soft-focus studio macro of glowing fibres. The judge called it *"a weak
climax — washed out, visually vague — the most important moment has the least impact"* and
*"dirt sitting on fibres rather than a physical mechanism completing"*.

It is now `hero_img/sem_catch_a.png`: **the same electron-microscope language as screen 2** —
a nonwoven mesh of pale fibres with the dark soot agglomerate clamped onto one of them,
visibly moulded at the contact, with finer particles caught along the same fibre. Screen 3
went 6.1 → 7.0 and screen 2 held at 7.0.

Two things did the work, and both generalise to screens 4–10:
- **Two adjacent screens must share ONE instrument.** Same greyscale, same grain, same tonal
  range, same magnification language. The judge's standing complaint was *"three premium
  campaign tropes rather than one world"*; making screens 2 and 3 one instrument answered it.
- **Every drawn overlay is now gone from the page** except the hero's cloud banks. The
  converging dashes on screen 3 came out with the charge field. On an electron image a drawn
  dash is out of register with the instrument and reads as paint. The photograph does it all.

## ⚠ GATE-PROMPT ACCURACY — a fault that cost a whole pass
`/tmp/gate_prompt2.txt` still described the charge field **after I had deleted it**. The judge
went looking for a symbol that was not in the picture, could not find it, and made *"the
travelling minus is effectively invisible"* its number-one problem — a phantom complaint about
a phantom element. **Re-read the gate prompt every time the build changes.** It must describe
what is actually on screen and nothing else.

## THE HERO CROP IS NOT THE PROBLEM EITHER — measured, do not retry
After the plate was ruled out, the second half of that action was tested: a much tighter frame
on the summit (`135%` centred on the peak) so the hero would be about air rather than about a
landscape. Four samples: **6.1, 6.8, 6.8, 6.2 → 6.48**, against **6.75** for the full frame.
Reverted.

What DID help screen 1 was the copy. It now opens with *"Up here the air is as clean as it
gets."*, which gives the mountain a job — it is the clean-air reference the page descends from,
not scenery. The cue names the destination: *"Scroll down — summit to a single particle"*.
Screen 1's own readings went 6.6 → about 7.0. The sequence did not move, but the hero stopped
being the weakest screen.

Also fixed while in there: **the cues were in all caps**, which breaks the house rule and does
not match the reference either — mont-fort sets its own cue in sentence case at 12px. All cues
are now sentence case.

## THE HERO PLATE IS NOT THE PROBLEM — measured, do not retry
The mountain is the weakest screen, so three replacement plates were generated and tested,
all deliberately unlike the reference: a small blade-like summit alone in a vast cold void, an
aerial ridge above cloud, and a tight high-contrast near-monochrome summit. The best of them
(`hero_img/peak_x.png`, the tight monochrome summit) was built into the page and gated four
times: **6.6, 6.3, 6.8, 6.4 → 6.53**, against **6.8** for the existing `peak_d.png` over more
samples. It was reverted.

`peak_x.png` and `peak_y.png` are kept in `hero_img/` but **do not spend another pass
generating alpine plates.** The judge's objection is not that the photograph is bad — it is
*"the mountain has little conceptual connection to charge or particle capture"*. That is a
meaning problem, not a picture problem.

One thing was kept from the experiment: the hero is now desaturated to `saturate(.34)`, which
pulls it into the same near-monochrome tonal range as the two micrographs. Every screen is now
a dark subject on a pale ground in cool neutral grey.

## THE TRANSITION IS NOW PHYSICAL — 5.0 → 6.0 on the scroll instrument
The cross-fades are gone. What happens now:
- the summit **rises past the camera** and scales up as we drop through it;
- the pollutant micrograph **comes up from below** and keeps descending;
- the filter mat **sweeps in from the right and scales down into place** while the pollutant is
  still on screen, so the two scenes overlap for a real distance of scroll;
- **every plate moves for the whole scroll**, not just during its own hand-over. The gate's
  exact complaint was *"the pacing is hold-cut-hold-cut... too much scroll produces almost no
  visible change, followed by major state changes."* No frame pair is identical now.
- the contaminant **accelerates once the mat starts entering** (cubic ease-in, not a symmetric
  ease) and **stops dead at contact** — the *"causal transformation"* the judge kept asking for.
- it **lands on the deposit that is already in the photograph, at that deposit's own size**, so
  the two register as one object. It used to shrink to a dot beside a much larger photographed
  deposit, which read as *"pasted over the mat, then a different-sized deposit"*.

Two implementation notes worth keeping:
- **Every plate is oversized to 112% with a −6% offset.** A full-bleed plate that translates
  shows its own hard edge. All travel is kept inside that 6% margin.
- **A real bug was found and fixed: the copy blocks were overlapping into an unreadable pile**
  during hand-over. The gate saw it twice — *"the duplicated fading text makes it look even
  more like stacked slides"*. An earlier attempt to fix it silently failed to match the line in
  the file; always `grep` the line back after a scripted edit.

## NEXT ACTION
Current: 3-row 6.6 · scroll 6.0 · S1 7.0 · S2 6.7 · S3 6.9. Bar is 9.

The scroll gate now names two specific things, both about the seams:

1. **The collision still is not convincing.** Judge: *"lock one identifiable portion of the
   particle to a continuous motion path... then progressively occlude and compress that same
   geometry into the deposit. The fibre should pass behind some branches and in front of
   others at impact."*
   Concretely: add a second copy of the fibre plate ABOVE the travelling contaminant, masked to
   just the fibre band, and fade it in over the last stretch of the pull. The fibre then passes
   in front of part of the particle while the rest stays behind it, which is what real contact
   looks like. Everything needed is already in `index.html`.

2. **The mountain-to-micrograph handoff has no spatial logic.** Judge: *"a summit disappears
   and a large soot specimen appears against empty white... introduce the particle while the
   final mountain contours are still visible, align its upward movement with the summit's
   trajectory, and use fog/atmosphere as the continuous depth layer. Extend that coexistence
   substantially before the mountain vanishes."*
   Concretely: bring the contaminant on screen earlier (it currently appears at p≈0.55, after
   the summit is mostly gone), move it upward along the same path the summit is taking, and
   hold the mist canvas alive across the seam instead of fading it out at p≈1.0.

3. **Do not** regenerate the hero plate, retry the hero crop, or add a charge symbol. All
   measured dead ends, documented above.

4. Screens 4–10 are still not built. Do not start them until the first three clear 9.

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
