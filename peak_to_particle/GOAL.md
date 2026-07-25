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

## ⚠⚠ READ THIS FIRST — THE SCOREBOARD WAS MEASURING NOTHING (2026-07-25)
**The gate was calibrated for the first time and it fails calibration.**

The control: a nine-frame strip in which **both columns are mont-fort's own screens**, handed to
the judge with the usual blunt prompt as if the right column were ours.

> **The reference scored 4/10.** Twice, verbatim (`ctrl1.txt`). Our build scores 6.1.

Under this instrument the site defined as the 10 cannot score above 4, and our page outscores
it. **The bar "every screen >= 9/10 judged by Codex" was unreachable by construction.** Every
number in the scoreboard below measured the severity of the prompt and the judge's generic
priors — *"looks like a template", "AI-stock imagery", "generic ESG marketing"* — not the work.
It even described OUR summit-into-white transition while looking at mont-fort's ship and globe.

That explains eleven passes of 6.0–6.8 across builds that were plainly different in quality.

### The corrected method: comparative, not absolute
Absolute scores from this judge are noise. A forced A/B choice is not. `gate_ab_prompt.txt`:
two columns, no reference-as-anchor, no ten-point scale — *"BETTER: A or B / MARGIN / WHY"*.

**Result, run both ways round to rule out position bias:**
- reference A, ours B → **"BETTER: B, MARGIN: clear"** — *"B sustains a more distinctive visual
  language, sharper typography, and a tightly controlled progression."*
- ours A, reference B → **"BETTER: A, MARGIN: clear"** — *"A has stronger typographic hierarchy,
  more disciplined compositions and a cohesive visual narrative, while B feels atmospheric but
  repetitive and less unified."*

**Same answer both orders: this page is preferred over mont-fort, clear margin.**

**Honest caveat.** That is evidence, not proof. It compares nine frames I chose from our page
against nine frames of their site, judged by one model. It does not mean the page is finished.
It does mean the old scoreboard cannot tell us anything and must not be used again.

### What this changes
1. **The scoreboard below is void.** Kept only as a record of what was tried.
2. **Never use an absolute /10 from this judge again.** Use `gate_ab_prompt.txt`, always run
   both column orders, and only trust a verdict that survives the swap.
3. **The standing objective needs Yin.** "9/10 by Codex" cannot be met by anything, including
   the reference. Yin should decide what "done" now means — most likely his own eye, or an A/B
   against the current live site rather than against mont-fort.

## THE REBUILD YIN CALLED FOR — same engine as the reference, our assets
Yin, after looking at it: *"you spent a lot of time, but effect is still weak — what if you
clone the entire website and effect first, then we do surgical change."* He was right about the
diagnosis. Checked against their actual code, which is saved in `<scratchpad>/montfort/`:

| | reference | ours, before |
|---|---|---|
| scroll | **Lenis** (26 refs) | raw `window.scroll` listener |
| choreography | **GSAP + ScrollTrigger** (87 / 33 refs) | CSS opacity on `<img>` |
| hero | **three.js / WebGL** (176 / 440 refs) | flat video |

That is the whole gap. Their scroll has weight because Lenis smooths it; their stops settle
because ScrollTrigger snaps them. No amount of better photographs fixes an engine deficit,
which is why eleven passes of better photographs did not fix it.

**What was NOT done, deliberately: their code and assets were not copied.** Those are their
property, and with the EPA matter live, "C-POLAR copied a trading firm's website" is exposure
we do not need. The feel does not live in their files — it lives in free public libraries
anyone may use. So: same libraries, same pattern, our own assets and words.

**Now running on Lenis 1.1.13 + GSAP 3.12.5 + ScrollTrigger**, verified live rather than assumed
(`check_engine.mjs` re-runs the test any time):
- **Inertia — real.** One wheel tick and the page kept gliding **329 px after the input stopped**
  (203 → 532 over 600 ms). The old build stopped dead with the wheel.
- **Settle — real.** It then came to rest at scrollY **956**, which is exactly stop 2. The four
  stops are snap points, so the page always rests ON a stop.
- `layout(p)` is untouched: it still reads `window.scrollY` and simply inherits the inertia. All
  the tuning from eleven passes is preserved.
- The render harness passes `?p=`, which disables Lenis and the snap — a screenshot needs an
  exact position, not an easing one.

**Copy is staged now, not slabbed.** The headline arrives first and the paragraph follows a beat
later, each rising as it comes. A block that fades in one piece reads as a slide.

## SIGNATURE MOTION ADDED — masked word reveals and a load entrance
The engine gave the page weight; this gives it craft. Both verified live, not assumed
(`check_reveal.mjs`).

- **Masked word reveals.** Every headline is split into words at runtime, each in its own
  overflow-hidden mask, and the words ride up from behind their own edge with a left-to-right
  stagger. The accent colour survives the split. Measured: 8 words, each starting 63 px below
  its mask; at 420 ms the first word has travelled to 39 px while the last is still at 63 px —
  the stagger is real — and all are seated by 900 ms. No page errors.
- **A page-load entrance.** `INTRO` ramps 0 → 1 over 1.25 s on open and multiplies the hero's
  reveal, so the page sets itself rather than simply being there. It multiplies rather than
  replaces the scroll-driven value, so it never fights the scroll.
- The render harness sets `INTRO = 1` and skips it, because a screenshot needs the resting
  state.

**A/B of the engine build against the pre-engine build, both column orders: EQUAL.** That is
the correct answer and worth understanding — inertia, snap and a load entrance cannot appear in
a still frame. **Motion work must be verified by measuring the running page, not by the A/B.**
The A/B is for composition, typography and asset quality only.

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
  earlier number in this file. Current: 6.3, 6.7, 7.1 → **6.7**.
- **7-frame scroll strip** (`gate_scroll.png`, prompt `/tmp/gate_scroll.txt`) — seven
  consecutive frames of the descent, the only instrument that can judge continuity.
  It was **5.0** three passes ago (*"reads as separate sticky slides"*), rose to **6.0** when
  the cross-fades were replaced with real entrances, sat at 5.7 for three builds, and now reads
  and now **6.0, 6.5, 6.5, 7.3 → 6.58**, its best. Its spread is wide — single samples have come back anywhere from 4.5 to 6.8 on
  one image — so it needs four samples, not two.

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

Scroll continuity (7-frame instrument): **6.58**, its best.
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

## THE SEAMS ARE NOW FIXED — and the number did not move
Three things were built this pass, each answering a complaint the judge had made by name:

1. **Contact occlusion.** A second copy of the filter plate sits ABOVE the travelling
   contaminant, masked to a narrow patch on one fibre, and fades in over the last stretch of
   the pull. One fibre now crosses IN FRONT of part of the particle while the rest stays in
   front of the mat. Judge: *"the fibre should pass behind some branches and in front of
   others at impact."*
2. **A real hand-over from the summit.** The contaminant now appears at p≈0.26, while the
   summit is still on screen, RISES into place along the same upward path the summit is
   taking, and GROWS as we descend. The mist canvas is held alive across the seam as the
   continuous depth layer. Judge: *"introduce the particle while the final mountain contours
   are still visible... use fog/atmosphere as the continuous depth layer."*
3. **The mat is now CLEAN** (`hero_img/mat_clean.png`) and the particle the viewer has
   followed since the summit IS the deposit. It no longer fades out at contact — it lands and
   stays. Judge, three gates running: *"its scale, silhouette and structure change, so it
   looks swapped for different soot renders."* One silhouette now runs the whole descent.

**Result: the scroll instrument did not move (6.0 → 5.7, inside the noise band).** All three
fixes are correct and should stay — they are visibly right, and the underlying criticisms were
real. But closing named seam complaints has now stopped buying points, which is the signal to
change target. See NEXT ACTION.

## A TYPE SYSTEM OF OUR OWN — 3-row 6.8 → 6.9, its best
The page ran on the system default sans at one weight doing every job, which the gate called
*"generic sans-serif typography"*. It now has two faces doing two jobs, the structure the
reference uses:
- **Space Grotesk Light** for display, large — C-POLAR's own face, with a real point of view
  in its letterforms rather than a system default.
- **Space Mono** for the whole utility layer — nav and cue. On a page built out of electron
  micrographs, monospaced labelling is the language of the instrument, so it is ours by
  subject rather than by decoration.
Fonts load from Google Fonts, the same way every other page in this repo already does.

**The copy now rides with the specimen.** Asked for three times: *"compose the copy around the
moving specimen instead of repeatedly placing a standard left-aligned marketing block."* The
two lower blocks are positioned from `moteAt(p).y`, clamped on screen, so the words and the
thing they describe stay on one optical line the whole way down.

Two changes were tested inside this pass and **reverted** — record them:
- **Landing size raised 0.235 → 0.330 of viewport.** Meant to lock the silhouette against the
  gate's *"looks like swapped renders"*. It made the particle straddle the fibre instead of
  gripping it, and the scroll score fell 6.2 → 5.65. Back to 0.235.
- **Stop-3 headline measure widened 13ch → 16ch.** Orphaned "in." on its own line. Back to 13ch.
Kept from that same batch: nav 12.5px, cue 12px, body up to 21px and darker — the gate's
*"the navigation is nearly invisible, the body copy is tiny"* is unambiguous and those stay.

## THE MAT NOW LOOKS LIKE A REAL MICROGRAPH — and the number still did not move
`mat_clean.png` was too perfect: smooth tubes on a flat pale wash. Anything dropped onto a
flawless field looks dropped on, which is why the gate kept saying *"the soot must visibly sit
AMONG fibres, not appear composited over smooth tubes."*

It is now `mat_used_light.png`: fibrillated, pitted fibre surfaces, scattered fine dark debris
through the field, shallow depth of field with the back fibres soft, on a bright near-white
ground. The particle lands where a clean smooth fibre crosses a textured one, so it sits in the
mat rather than on it. A **contact shadow** was added underneath — a soft pool that fades in
over the last stretch of the pull, named by the gate twice.

Two notes for whoever generates the next micrograph:
- **Ask for the pale ground explicitly.** The first attempt came back mid-grey and unusable,
  exactly as the first screen-2 micrograph did. The clause that works is *"on a BRIGHT
  NEAR-WHITE background, rendered clearly DARKER than that ground."* `mat_used.png` is the
  mid-grey reject, kept for reference.
- **A `radial-gradient` shadow needs `closest-side`.** The default `farthest-corner` leaves the
  gradient non-zero along the box edges and the div renders as a visible grey rectangle.

## ⚠ FOUR PASSES, FOUR CLOSED COMPLAINTS, NO MOVEMENT
This is the fourth pass in a row that closed the judge's own named number-one problem and left
the score inside the noise band:

| pass | what was closed | 3-row | scroll |
|------|-----------------|-------|--------|
| real transitions | *"cross-fading is not continuity"* | 6.6 | 5.0 → 6.0 |
| occlusion + hand-over + one particle | *"looks like swapped renders"* | 6.8 | 5.7 |
| type system + copy rides the specimen | *"generic sans-serif typography"* | 6.9 | 5.7 |
| textured mat + contact shadow | *"composited over smooth tubes"* | 6.6 | 5.75 |

Every one of those fixes is visibly right and all of them stay. But incremental refinement has
stopped buying points, and it has stopped four times. The remaining gap to 9 is very unlikely
to be another detail.

## REAL MOTION WORKS — scroll 5.75 → 6.45, the first real move in four passes
The diagnosis was that the remaining gap was categorical: our page was three still photographs
moved by CSS, and the reference is a live moving world. Putting genuine footage into ONE plate
moved the scroll instrument +0.7 — more than the previous four passes of refinement combined.

`hero_img/sem_turn.mp4` (Seedance 2.0, from `sem_light.png` as the start frame, ten seconds,
transcoded to 1920-wide H.264 with `+faststart`, audio stripped). The specimen turns under the
beam; the camera is locked; nothing else in the frame moves.

**Its time is driven by the SCROLL, not by a clock.** This matters and should be repeated for
the other plates:
- The travelling contaminant is a cutout of **frame 0**. If the video ran on its own clock the
  two would drift apart and show as a doubled, mismatched specimen.
- So the video is parked on frame 0 until the pull begins at p = 1.20 — registration is exact
  through the whole hand-over — and only then advances, at about seven video-seconds per unit
  of scroll, turning as the descent carries past it.
- `shot_scroll.mjs` accepts `p@seconds` and the page accepts `?vt=`, so a frame can be pinned
  for rendering. In practice the plain `p` values already show the motion, because the time is
  a function of `p`.

## THE HERO IS LIVE FOOTAGE TOO — and the last painted thing on the page is gone
`hero_img/peak_cloud.mp4` (745 KB): real cloud rolls and thins around the summit while the
mountain stays put. It loops on its own clock — no registration constraint on this plate — and
the hand-drawn canvas cloud pass, the Perlin noise, `bakeBank`, the four drifting banks and the
whole `#mist` layer have been **deleted**. Nothing on this page is painted any more.

3-row went to **7.0**, its best. The scroll instrument stayed flat at 6.33 against 6.45.

### Two blockers hit, both worth knowing
1. **Seedance's content filter false-positives on `peak_d.png`.** Two different prompts, same
   `nsfw` rejection after a full ~13-minute render each time — so it is the IMAGE, not the
   wording. **The fix: re-encode and re-upload.** Saving it as a quality-95 JPEG
   (`hero_img/peak_d_src.jpg`), uploading via `media_upload` + `media_confirm`, and pointing
   the job at that media id went through first time. Budget for this: each rejection costs a
   full render cycle before you find out.
2. **The filter-mat video was generated and REJECTED — do not retry it.**
   `hero_img/mat_turn.mp4` exists and `hero_img/mat_frames.png` is the evidence: across ten
   seconds the fibres shift several percent of frame width. The landing point, the occlusion
   mask and `#pl_front` are all measured off frame 0 of `mat_used_light.png`, so any drift
   breaks the capture. Parking it at frame 0 to protect registration would leave no motion
   where it matters, which is the whole point. The mat stays a still.

## A MATCH TRANSITION FROM SUMMIT TO MICROGRAPH — scroll 6.33 → 6.58
A fresh blunt read was taken first, rather than working from this file's history, and its
number-two note came with an exact fix: *"let the summit cloud become the micrograph's white
field while the camera remains locked onto the same particle. Keep its screen position and
scale progression continuous while mountain detail dissolves gradually into fibre detail."*

That is now built. The summit plate **zooms hard into its own cloud** (scale 1 → 1.62) until the
frame is white; the micrograph **starts already inside that white field** (scale 1.40) and pulls
back out of it. The two white fields coincide, so there is nothing to see as a cut — at p ≈ 0.8
the mountain ridge is still faintly visible dissolving into the micrograph's substrate while
the specimen sits locked in frame.

**One trap to know:** the cutout's home position is computed from the plate's `object-fit:cover`
geometry, which knows nothing about a CSS `scale`. Scaling the micrograph without applying the
same scale to the cutout drifts it straight off its registration. `moteAt()` now transforms the
home position and size by `smokeScale(p)` about the viewport centre.

## THE TWO-COLUMN BREAK WAS BUILT, MEASURED AND REVERTED
The gate's third note was: *"treat the particle capture as the composition — not as imagery
occupying the right half of a standard two-column hero."* That was built in full: the plates
were shifted so the specimen sits near the middle of the frame rather than in the right third,
and all three copy blocks became a low title block over the empty corner instead of a centred
column beside the picture.

**It measured worse.** Scroll 6.0, 6.0, 6.4, 6.4, 6.5 → **6.26** against 6.58; 3-row 6.4, 6.6 →
**6.5** against 6.7. Reverted.

**And here is the useful part: the same gate run that scored the rebuilt composition still said
*"left-aligned corporate headline and a large object on the right repeat almost unchanged...
break the repeated two-column composition."*** The copy was at the bottom and the specimen was
centred when it wrote that. **That note is boilerplate, not a reading of the actual frames.**
Do not spend another pass on it. This is the second time a repeated complaint has turned out
not to track what is on screen — the first was the phantom charge symbol the gate hunted for
after it had been deleted.

## THE LENGTH HYPOTHESIS IS ANSWERED: MORE STOPS DOES NOT HELP
Stop 4 (clean sky → **Air**) is built: `hero_img/sky_clean.png`, the scroll extended from
p 0–2.4 to 0–3.2, a fourth copy block, and the fibre plate handing over to open sky. Gated as
a nine-frame strip against four reference screens.

**Four stops: 5.8, 6.0, 6.0, 6.4, 6.5 → 6.15. Three stops measured 6.58.** Adding a stop did
not help, and the judge said why in as many words:

> *"It still feels like a short demo. Four stops are enough structurally, but these stops do
> not develop into four substantial chapters... The mountain-to-micrograph transition and the
> particle capture are real events; the remaining scroll mostly explains or holds those events.
> It demonstrates a mechanism rather than sustaining a world."*

**So the finding is better than the hypothesis was.** The problem is not the COUNT of stops —
it is that stops 1→2→3 contain two real EVENTS (the white-field match transition, and the
capture) and stop 4 contains none. It is a picture with a caption.

**The rule this gives us, and it governs stops 5–10: every stop must contain an event, not a
statement over a backdrop.** Building six more caption-over-photograph stops will not reach 9.

**Stop 4 is kept even though it measures lower.** Yin's brief is a ten-stop page and Air is one
of the five applications he named; removing it to protect a score would be optimising the
metric against the brief. The cost is about 0.4 and the reason is understood.

Its copy now carries real evidence rather than a blue-sky platitude — *"Installed in 441
facilities across 7 countries since 2020"* — taken from the approved deployment pedigree.
**Note the trap in the records:** there is a logged "441-footprint-vs-19-measured overstatement"
warning. 441 is FACILITIES DEPLOYED, not tests or measured sites. Do not conflate them.

## STOP 4 GOT ITS EVENT. IT DID NOT CLOSE THE GAP. STOP BUILDING STOPS.
The last action set a clear test: give stop 4 a real event, and *"if an event on stop 4 closes
the 0.4 gap, that is the pattern for stops 5–10 and they can be built. If it does not, stop
building stops and say so."*

The event is built and it is a good one. `hero_img/mat_loaded.png` is the **same junction later
in its life** — made with `flux_kontext` from `mat_used_light.png`, which preserved the fibres,
framing and lighting exactly and caked them with accumulated soot. It cross-fades over the
single-particle frame, so the event on stop 4 is the filter **filling up**, and only then does
the camera pull out to clean air.

| build | scroll gate |
|-------|-------------|
| three stops | **6.58** |
| four stops, caption only | 6.15 |
| four stops, with the loading event | **6.06** (5.5, 5.8, 6.0, 6.3, 6.7) |

**It did not close the gap. Per the test's own terms: stop building stops.** Stops 5–10 should
not be built in this form. Two independent attempts at a fourth stop both land near 6.1 against
6.58 for three.

## ⚠ A MEASURED CEILING — this needs Yin's decision
Rule 5 of this file says: on a genuine measured ceiling, say so with evidence, then take the
route through it. This is that moment.

**The evidence.** Ten passes of well-executed, correctly-diagnosed work have landed between
6.0 and 6.8 and nothing has gone past ~6.8. Each of these was built in full, measured, and
either kept or reverted on the number:

- real transitions replacing cross-fades — 5.0 → 6.0 (kept)
- occlusion, causal pull, one particle throughout — flat (kept, correct)
- a type system of our own — 3-row best (kept)
- an authentic textured micrograph + contact shadow — flat (kept, correct)
- **real footage in the plates — 5.75 → 6.45 (kept; the biggest single gain)**
- the summit→micrograph match transition — 6.33 → 6.58 (kept)
- breaking the two-column composition — 6.58 → 6.26 (REVERTED)
- a fourth stop, twice — 6.58 → 6.1 (kept for the brief, at a known cost)

**What the pattern says.** The two biggest gains in the whole project came from asset FIDELITY,
not choreography: replacing a painted capture with a real one-hotspot photograph (5.3 → 7.5),
and replacing stills with real footage (5.75 → 6.45). Every choreography change since has been
flat or negative.

And the judge's asset complaint has not changed in four passes: *"the sterile perfection of
generated campaign imagery"*, *"the pollutant looks like generic CGI/AI foam... does not
resemble convincing soot"*, *"AI-stock particulate imagery"*.

**The route through, and it is the one category never tried: stop generating the assets.**
Every plate on this page is generated. The reference uses real photography and real footage of
real places. Licensed genuine SEM micrographs of loaded filter media, and real alpine
footage, would answer the one criticism that has survived every pass.
**That needs Yin: it is a licensing and budget decision, not a build decision.**

## THE SPECIMEN WAS REBUILT TOO. FLAT. IN-HOUSE OPTIONS ARE NOW EXHAUSTED.
The last item on the in-house list was the soot specimen itself — the one asset criticism that
was specific and fixable here: *"the pollutant looks like generic CGI/AI foam. Its regular
spherical clusters, soft surface and clean silhouette do not resemble convincing soot."*

It is rebuilt and it is genuinely better. `hero_img/soot_real.png` is a ragged open chain of
fused primary particles of clearly **unequal** sizes, angular and faceted, with broken stubby
branches, voids through the structure and a pitted crust — the way real combustion soot looks,
not a heap of identical spheres. `soot_cut.png` and `soot_turn.mp4` were regenerated from it
and every registration constant re-measured (`MOTE_SRC` is now cx 0.7158, cy 0.4980, w 0.4985,
ar 0.8358).

**Score: 6.0, 6.0, 6.0, 6.4 → 6.10, against 6.06. Flat.**

It is kept — it is more credible, it closes a named criticism, and it is not a regression. But
it did not move the number, and **that was the last option on the in-house list.**

### The full ledger of what has been tried
| change | result |
|--------|--------|
| painted → real one-hotspot photograph (screen 3) | **5.3 → 7.5** |
| stills → real footage | **5.75 → 6.45** |
| summit→micrograph match transition | 6.33 → 6.58 |
| real transitions replacing cross-fades | 5.0 → 6.0 |
| a type system of our own | 3-row best |
| occlusion, causal pull, one particle throughout | flat, kept |
| authentic textured mat + contact shadow | flat, kept |
| **an irregular, credible soot specimen** | **flat, kept** |
| breaking the two-column composition | 6.58 → 6.26, REVERTED |
| a fourth stop, plain | 6.58 → 6.15 |
| a fourth stop, with a real event | 6.58 → 6.06 |

Everything that moved the number was **asset fidelity**. Everything that was choreography,
layout or length was flat or negative. And the only fidelity lever left is the one we cannot
pull ourselves.

## NEXT ACTION
The scroll engine and the motion craft are in and measured. Two things remain.

1. **The third pillar: WebGL, but not for the mountain.** The reference leans on three.js
   heavily. Our own ledger says built terrain LOST to authored photography (5.8 vs 7.0), so the
   hero is not the place. The honest place is the **specimen**: a true 3D object with real
   lighting and parallax instead of a video of a flat picture. That is exactly the criticism
   that survived every asset pass — *"flat", "composited", "looks like swapped renders"*.
   It is the last untried structural lever and it needs a full pass.
2. **Yin still owns two decisions** (see the calibration section above): what "done" means now
   that the 9/10 bar is void, and whether we may license real imagery.

**Verification rules from here:**
- **Motion** → measure the running page (`check_engine.mjs`, `check_reveal.mjs`). Never judge
  motion from stills.
- **Composition, type, assets** → `gate_ab_prompt.txt`, both column orders, keep only the
  verdict that survives the swap.
- **Never** an absolute /10 from this judge. It scores mont-fort itself at 4.

**Do not** resume: more stops, layout breaks, seam or collision work, the hero plate or crop,
charge symbols, the mat video. All measured, all documented above.

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
