# C-POLAR front page — where it stands

**11 August 2026.** Saved and handed over. Written so this can be picked up cold.

---

## The question that started it

A colleague said the front page resembled a reference site closely enough to carry legal
risk on launch. The real question was never "does it look similar" — it was **how do we
launch without legal risk.**

Two things were tangled together and had to be separated:

- **Design similarity.** A pale palette, a mountain, a scroll-driven camera. Common to a
  great many sites. Largely not protectable, and `legal_provenance_record.md` says so
  plainly along with the harder question — whether the particular *selection and
  arrangement* is protectable as a compilation or functions as trade dress. That one is
  for counsel.
- **File copying.** Real, and now fixed.

---

## What is live

| path | what it is |
|---|---|
| `/cpolar/` | the original. Still serves the reference's 911 KB compiled engine and about twenty of their asset files |
| `/cpolar_v2/` | the hero on its own, our engine |
| `/cpolar_v3/` | abandoned — built backwards, kept only as a record |
| `/cpolar_v4/` | staging step: their page, our hero. Their stylesheet still present |
| **`/cpolar_v5/`** | **the candidate. Nothing of theirs in it** |

https://aldrinor.github.io/nf-bigidea-preview/cpolar_v5/

---

## What was removed, and how it was verified

Everything from the scaffold is gone:

| | |
|---|---|
| compiled 3D engine | 911 KB |
| their JavaScript — index, router, ClientRouter, ChaptersNavigation, visitedNews, their bundled ScrollTrigger | 124 KB |
| their stylesheet | 305 KB, replaced by `cp_base.css` at 27 KB, written for this page |
| their build attributes | 13 ids across 246 places in the markup |
| their models, textures and sound | 9.5 MB, none of it ever requested by the page |

Verified by recording every file the page asks for, from the network rather than the
markup: **27 files, all ours, open-licence fonts, or MIT libraries from a CDN.**

`libs/basis/` is deliberately left in place — Apache 2.0, and not theirs.

**The design did not move while this happened.** `_pixel_guard.mjs` photographs the page at
1850, 1440, 1280 and 390 across twenty scroll positions and compares both the pixels and
the measured box, font and colour of every element against a frozen reference. The
stylesheet swap passed at 28,350 element checks, every one identical, 0.00% of pixels
different.

---

## Still open, and none of it is small

1. **Their files are still in the git history.** The working tree is clean. Every past
   commit still holds them, with our commit history attached. Removing them needs a
   history rewrite, and that is worth doing deliberately rather than in a hurry. It is the
   outstanding item on the legal question and it does not depend on any of the others.
2. **`/cpolar/` is still the live front page** and still serves their engine. Replacing it
   with v5 is a decision, not a task. `/cpolar_v4/` should probably go at the same time —
   it is a staging step that still carries their stylesheet.
3. **Three panels say "copy to come"** — Air, Textiles, Medical Devices. This blocks a
   launch and pre-dates this work.
4. **The copy crosses the mountain during the descent.** "They are full of pollutants."
   sits exactly where the mountain has to grow for the descent to read at all. Four
   framings were built and measured; moving the mountain off the copy cancels the descent,
   keeping the descent puts rock behind the copy. Yin's call: move the copy, or accept a
   softer descent.
5. **On a 390px screen the two statement lines overlap** and "pollutants" runs off the
   right edge. `/cpolar/` does exactly the same at the same scroll positions, so it is
   inherited rather than introduced — but it would not survive a launch.
6. **The live `cpolartechnologies.com`** still carries "The World's Deadliest Infectious
   Diseases Are About to Get Worse" and an MRSA pathogen table. Both were on the May
   takedown list. Unrelated to this page and still outstanding.

---

## How the page reads

One story, two beats, both driven by a single scroll position.

**0 → 1 screen, the approach.** The camera travels forward, down and around. The peak
grows, swings past and is left above you.

**1 → 1.9 screens, the descent.** Down off the summit to where people live, which is where
"Down where we live, they are full of pollutants." lands.

The descent is nearly a pure drop, and the reason is geometry rather than taste. The
terrain runs from y −30 at the valley floor to y +84 at the summit; the approach leaves the
camera at y −4. That is 26 units of headroom. Below it the camera is inside the mesh — the
near plane cuts the surface and the skirt renders as spikes. The descent uses 21 of those
26 units.

**Handover.** Hero copy clears 0.85 → 1.5 screens. The scene clears 1.72 → 2.05 and is
released at 2.10, after the descent lands and before the dust section begins at 2200.

**The header has one owner** — a small script near the bottom of `index.html`, on a
0.30-screen threshold. The engine must not write to it. When both did, coming back up
across 2.10 screens re-showed the header at scroll 1880, on top of the copy.

---

## Where everything is

```
_deploy/cpolar_v5/                 the page
_deploy/handover/cpolar_front_page/ the packaged source, self-contained
peak_to_particle/                  the checks worth running again
peak_to_particle/terrain/          the terrain build pipeline
peak_to_particle/_scratch/         one-off probes and their output, kept for the record
_archive/website_working_files/    including the reference stylesheet extracts
legal_provenance_record.md         the record for counsel
```

**Handover package, for anyone picking this up:**
https://github.com/aldrinor/nf-bigidea-preview/releases/tag/cpolar-front-page-2026-08-11

---

## Four lessons the checking tools exist because of

Each came from something that shipped broken.

- **Hide the canvases before comparing pixels.** The hero and the dust field animate
  continuously and never repeat. Leaving them visible flagged 21 frames as broken when the
  layout underneath was identical.
- **Listen for page errors.** A crash that only happens while the 7.7 MB terrain model is
  still loading passed every local check, because the local server serves it instantly and
  the local script was not listening for errors at all.
- **Scroll back UP as well as down.** Every audit only ever scrolled down. That is how a
  header that reappears over the copy on the way back up reached the live site.
- **Never judge from a contact sheet.** A grey wash across the top of the screen and a
  buried mountain both disappear at a third of size.
