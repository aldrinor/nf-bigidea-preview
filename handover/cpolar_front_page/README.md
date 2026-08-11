# C-POLAR front page — source handover

Everything needed to run, rebuild and verify the C-POLAR front page.

**Live:** https://aldrinor.github.io/nf-bigidea-preview/cpolar_v5/

---

## Run it

The page is static. It needs to be served over HTTP rather than opened from disk, because
it loads a 3D model and ES modules.

```
cd site
python -m http.server 8080
```

Then open `http://localhost:8080/`.

Three libraries come from a public CDN at run time — three.js 0.169 (MIT), GSAP 3.13
(free at this version) and Lenis 1.1.13 (MIT) — so the first load needs a network
connection. Everything else is in `site/`.

---

## What is in here

```
site/                the page, exactly as it is served. Deployable as-is.
  index.html         markup, the 3D engine, and the scroll story
  cp_base.css        the base stylesheet - reset, grid, type scale, components
  cp_reveal.js       the word-by-word copy reveal
  cpolar.css         the sections below the hero
  design_tokens.css  colour and type tokens
  assets/            terrain models, baked maps, fonts, photographs

tools/terrain/       how the mountain was made, from public elevation data
tools/checks/        the scripts that verify the page did not break
docs/provenance.md   where every file came from, written for counsel
```

---

## Rebuilding the mountain

The terrain is not hand-modelled. It is built from real elevation data, in this order:

```
fetch_dem.py            Mount Assiniboine, from public AWS Terrain Tiles
erode_terrain.py        hydraulic erosion - 70,000 droplets carve the drainage
build_v2_terrain.py     the mesh the page loads
build_v2_terrain_far.py the distant ridges behind it
bake_mountain_maps.py   colour, normal and roughness maps
make_rock_tile.py       close-range rock detail, made to tile seamlessly
```

`erode_terrain.py` is the single source of the shape. Both the mesh builder and the
texture bake read its output, so the two cannot drift apart. Its resolution constant
decides how big a channel is relative to the mountain, and that is a look decision, not a
quality one: at 1024 a channel is about three pixels on screen and the mountain reads as
crumpled foil.

Needs Python with numpy and scipy.

---

## Checking a change

`tools/checks/` exists because judging this page by eye repeatedly failed. Each script
answers one question with a number.

| script | question |
|---|---|
| `_pixel_guard.mjs` | did anything move? Every element's box, font and colour at four widths and twenty scroll stops, against a frozen reference |
| `_travel.mjs` | which way does the view travel? By how much of the frame the terrain fills |
| `_upscroll.mjs` | does anything break on the way back UP? |
| `_audit_full.mjs` | full-size frames, with page errors reported |
| `_live_audit_full.mjs` | the same, against the public URL |
| `_what_loads.mjs` | every file the page requests, recorded from the network |
| `_words.mjs` | when does each line of copy appear? Swept every 100px |
| `_contrast.mjs` | is the copy readable against what is behind it? |
| `_stack.mjs` | what is actually on top where the copy is drawn? |
| `_bounds.mjs` | where is the camera relative to the terrain's real bounds? |

Needs node with `playwright` and `pngjs`.

```
cd tools/checks
node _pixel_guard.mjs baseline cpolar_v5    # freeze how it looks now
node _pixel_guard.mjs check    cpolar_v5    # compare a change against that
```

The paths inside these scripts point at the working tree they were written in. Change
`ROOT` at the top of each to wherever `site/` sits.

**Four lessons are built into these tools, each from something that shipped broken:**

- **Hide the canvases before comparing pixels.** The hero and the dust field animate
  continuously and never repeat, so leaving them visible flagged 21 frames as broken when
  the layout underneath was identical.
- **Listen for page errors.** A crash that only happens while the 7.7 MB terrain model is
  still loading passed every local check, because the local server serves it instantly and
  the local script was not listening.
- **Scroll back up.** Every audit only ever scrolled down, which is why a header that
  reappeared over the copy on the way back up reached the live site.
- **Do not judge from a contact sheet.** A grey wash across the top of the screen and a
  buried mountain both disappear at a third of size.

---

## How the page reads

The scroll tells one story in two beats, driven by a single scroll position.

**0 to 1 screen — the approach.** The camera travels forward, down and around. The peak
grows, swings past and is left above you. Eased out rather than smoothstepped, so the
scene answers the moment the wheel moves.

**1 to 1.9 screens — the descent.** You come down off the summit to where people live, and
that is where "Down where we live, they are full of pollutants." lands.

The descent is almost a pure drop, and the reason is geometry. The terrain runs from y −30
at the valley floor to y +84 at the summit, and the approach leaves the camera at y −4 —
26 units of headroom. Take the camera below that and it is inside the mesh: the near plane
cuts the surface, the skirt renders as spikes. The descent uses 21 of those 26 units and
gets the rest of its movement from a small forward push.

**Handover.** The hero copy clears from 0.85 to 1.5 screens. The scene clears from 1.72 to
2.05 and is released at 2.10 — after the descent has landed, before "Most harmful
pollutants carry an electric charge." arrives at 2200.

The header has ONE owner: a small script near the bottom of `index.html`, on a 0.30-screen
threshold. The engine must not write to it. When both did, coming back up across 2.10
screens re-showed the header at scroll 1880, on top of the copy.

---

## Known and open

- **"They are full of pollutants." crosses the mountain.** The copy sits right-of-centre,
  which is where the mountain has to grow for the descent to read at all. Moving the
  mountain off the copy cancels the descent; keeping the descent puts rock behind the
  copy. Four framings were tried and measured; the trade is real and unresolved.
- **On a 390px screen the two statement lines overlap** and "pollutants" runs off the
  right edge. The page this was built from does exactly the same at the same scroll
  positions, so it is inherited, not introduced.
- **Three panels say "copy to come"** — Air, Textiles, Medical Devices.

---

## Provenance

`docs/provenance.md` is the full record: what every file is, where it came from, and what
was removed. The short version:

This page began from a site scaffold that was not ours. All of it has been taken out —
911 KB of compiled 3D engine, 124 KB of JavaScript, a 305 KB stylesheet, thirteen build
attributes across 246 places in the markup, and 9.5 MB of models, textures and sound.
Verified by recording every file the page requests: 27 files, all ours, open-licence
fonts, or MIT libraries from a CDN.

The working files used to remove that stylesheet held copies of it, and they are
**deliberately not in this package**.

Fonts are Space Grotesk and Josefin Sans, both SIL Open Font Licence, with the licence
texts alongside them in `site/assets/fonts/`. Elevation data is public terrain tiles. The
close-range rock detail started as a generated photograph; the IP status of generated
images is unsettled and `docs/provenance.md` says so.
