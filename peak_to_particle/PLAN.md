# Peak to Particle — New Front Page: Concept, Infrastructure, Workflow, Quality Gate

**Status:** concept agreed 2026-07-25. Nothing built yet. This is the plan of record.
**Quality reference:** https://mont-fort.com/ — studied in full (visual + code) on 2026-07-25.
**Content:** the existing approved copy. No new claims are invented anywhere in this build.
**Live site is not touched.** This is a new front page built as its own bundle, on its own branch.

---

# PART 1 — THE CONCEPT

One continuous 3D journey. The whole page is a single zoom **from the biggest thing to the smallest,
then out to the whole planet.**

| # | Where | What it carries |
|---|-------|-----------------|
| 1 | Mountain peak, Banff | C-POLAR logo · what C-POLAR is · the 5 applications |
| 2 | Down into cloud | particles floating; they carry an electric charge |
| 3 | Still in cloud | NanoFlashing pulls the particles in — the cloud clears |
| 4 | Clean cloud, blue sky | **Air** |
| 5 | The lake | **Water** |
| 6 | The crop field | **Food Packaging** |
| 7 | The cotton field | **Textile** |
| 8 | Into the fibre → nanoscale → the material | **Medical Devices** + the charge revealed |
| 9 | Pull all the way out — Earth from space | reach |
| 10 | — | Contact us |

**Why this beats the reference.** Montfort travels sideways to show where their offices are. This
travels down through scale to prove that one tiny property explains everything above it. It proves our
own sentence — *one charge, five applications* — with a picture instead of a claim.

**Continuity rules.**
- Stops 1–5 are one real place (Banff). The camera falls; it never cuts.
- Stop 8 changes the axis from **falling** to **zooming**, so the ending is not a ninth drop.
- Stop 9 reverses everything at once: smallest → largest in one move. This is the payoff.

**The signature moment** (where we spend our boldness): **stop 3 — the cloud clearing.** Everything
else stays disciplined and quiet so this one moment lands. If only one thing is remembered, it is this.

---

# PART 2 — FOUR DECISIONS THAT BLOCK THE BUILD

1. **Which peak.** "Banff" is not one mountain. Candidates: Mount Victoria (Lake Louise beneath it),
   Valley of the Ten Peaks (Moraine Lake beneath it), Mount Rundle (the town view), Mount Assiniboine
   (closest to the Montfort silhouette, but no famous lake beneath).
   *Recommendation: a peak with its lake beneath, so stops 1 and 5 are the same landscape.*
2. **Whose name on the mountain.** *Recommendation: C-POLAR on the peak; NanoFlashing revealed at the
   bottom of the nanoscale dive.* The technology becomes the payoff, not the introduction.
3. **Where Medical Devices sits.** (a) dive to the material, then pull back into a clinical room, so
   all five are evenly weighted; or (b) medical rides with the fibre and the dive is purely the finale.
   *Recommendation: (a).*
4. **Cotton or flax.** Cotton reads as cloth instantly but does not grow in Canada, breaking the
   one-country thread. Flax keeps Canada (world's largest producer) and makes linen.
   *Recommendation: cotton for readability; accept and note the break.*

---

# PART 3 — INFRASTRUCTURE (all verified on this machine 2026-07-25)

## 3.1 Rendering and 3D
| Piece | Choice | Note |
|---|---|---|
| Renderer | **three.js r171+ `WebGPURenderer`** | WebGPU ~95% browser support, **automatic WebGL2 fallback**. One import. |
| Shaders | **TSL (Three Shading Language)** | Written once, compiles to both WGSL and GLSL. |
| Clouds | **WebGPU raymarched volumetric** | Proven open implementations exist (official three.js `webgpu_volume_cloud`; `procedural-clouds-threejs` with Beer–Lambert absorption, Henyey–Greenstein phase, light-marching self-shadowing, WebGL2 fallback). |

## 3.2 Motion
| Piece | Choice | Note |
|---|---|---|
| Scroll animation | **GSAP + ScrollTrigger + SplitText** | 100% free including all premium plugins since the Webflow acquisition. |
| Smooth scroll | **Lenis** | Industry standard. |
| Camera choreography | **Theatre.js** | Records camera moves as **JSON**. The 8-stop camera path becomes tunable data, not hand-typed numbers. |

## 3.3 Where every asset comes from
| Asset | Source | Cost |
|---|---|---|
| Banff terrain (peak + lake basin) | Public elevation data — NASA SRTM / Canada CDEM / OpenTopography | free |
| Terrain → 3D mesh | Python: numpy + scipy + trimesh → GLB (**no Blender needed**) | free |
| Earth from space | NASA Blue Marble imagery | public domain |
| Environment lighting (HDRI) | Poly Haven | CC0 |
| Textures, 2D imagery | **Codex Gen 2** | in-house |
| Small 3D props (cotton boll, device) | **Higgsfield image→3D** | in-house |
| Sky panoramas | **Higgsfield outpaint** from a single image | in-house |
| Video, if a scene needs it | **Seedance 2.0** | in-house |
| Fibre / nanoscale visuals | reuse what we already built for the decks | free |
| Compression | `gltf-transform` — meshopt + Draco geometry, KTX2 textures | free |

## 3.4 Build and delivery
- **Vite** — its own standalone bundle, output dropped into the existing site. The working decks are
  never disturbed.
- **Per-chapter streaming** — each scene downloads only as the viewer approaches it. This is why the
  reference paints in under a second despite 20 MB total. Non-negotiable.
- **GitHub → Pages** for staging and launch. New branch; live site untouched until sign-off.

## 3.5 Test rig (this is what makes the quality claim honest)
| Need | What we have |
|---|---|
| Real GPU speed | **NVIDIA RTX 4070** — drivable from headless Chrome with Vulkan flags. Verified. |
| WebGPU testing | **Real Chrome on a secure page.** Verified working (adapter confirmed). |
| Render + drive the page | Playwright — screenshots, scroll at speed, capture mid-transition |
| Motion capture / analysis | ffmpeg |
| Independent judge | **Codex 5.5** (vision) — a different model, so it is real outside review |

---

# PART 4 — WHO DOES WHAT

**Updated 2026-07-25 at Yin's instruction. This supersedes the old rule that sent code to GLM 5.2 and
gating to GLM 5V.** Yin: GLM 5V is outdated; Opus 5 with the Claude design skills is stronger.

| Role | Who | Job |
|---|---|---|
| Design lead + builder | **Claude (Opus 5)** with the `frontend-design` skill loaded | Aesthetic decisions, WebGL/scroll/shader code, renders it, audits the real pixels |
| Independent gate | **Codex 5.5** | Adversarial audit of every scene. Scores it. Lists defects. |
| Images | **Codex Gen 2** | Textures and 2D imagery only |
| Video | **Seedance** | Only where a scene needs motion we can't render live |
| Human sanity check | **One sighted colleague** | Five minutes before launch. Not a tool — a safety net. |

**Independence rule (survives the change):** Claude must never be the only eye on its own work.
Codex 5.5 + measured numbers + a side-by-side against the real reference replace GLM 5V's job.

---

# PART 5 — THE WORKFLOW

## 5.1 Phases, in order

- **Phase 0 — Decisions and reference pack.** Settle the four decisions. Pull real photographs of the
  chosen peak at the chosen time of day. Extract the actual palette, light direction, and haze from
  those photographs. *We do not invent the look; we derive it from the real place.*
- **Phase 1 — Foundations.** Terrain data → real Banff mesh. Project skeleton (Vite + three.js +
  GSAP + Lenis). Design tokens locked from the reference pack and our existing design system.
- **Phase 2 — THE SPIKE: stops 1–4, at 100%.** Peak → fall into cloud → charged particles →
  NanoFlashing pulls them in → cloud clears → blue sky. **Hard gate. If this does not pass, we stop
  and rethink before spending anything on stops 5–10.** It is also shippable alone as a teaser.
- **Phase 3 — The rails.** Theatre.js camera path across all stops; per-chapter streaming. Built once,
  reused by every later scene.
- **Phase 4 — Remaining scenes, one at a time, each fully gated:** lake → crop → cotton →
  fibre/nanoscale → Earth. No scene starts until the previous one passes.
- **Phase 5 — Content and typography.** Pour in the existing approved copy. Placement and type only —
  no new writing, no new claims.
- **Phase 6 — Finish pass.** Performance, phone, accessibility. This is where we take every gap the
  reference left open.
- **Phase 7 — Human sign-off, then launch.**

## 5.2 The loop for every single scene

1. **Reference** — real photographs of the real place; palette and light extracted from them.
2. **Spec** — camera move, timing, palette, what text appears and when. Written before any code.
3. **Build** — Claude writes it.
4. **Render** — Playwright on the real GPU. Stills, motion, phone, and the real mid-transition.
5. **Self-audit** — Claude looks at the actual pixels, not at the code.
6. **Independent gate** — Codex 5.5 scores it out of 10 and lists specific defects.
7. **Measure** — frame rate, weight, load time, contrast.
8. **Side-by-side** — our scene against the equivalent Montfort moment, same viewport, one image.
9. **Loop** until it clears the bar.
10. **Only then** does Yin see it.

---

# PART 6 — HOW WE GUARANTEE FRONTIER, NOT HALF-BAKED

Six mechanisms. All of them are enforced, not aspirational.

### 1. Build the hardest thing first, at full quality
Never eight scenes at 60%. The spike (stops 1–4) contains the riskiest work and the whole "wow". If it
cannot reach the bar, we find out at the start, not at the end.

### 2. Derive the look from reality, never from taste
The palette, light direction, haze and colour of every scene come from **real photographs of the real
place**, sampled numerically. This is the single biggest difference between frontier and generic:
generic work invents a look; frontier work observes one.

### 3. A number, not an opinion
**Nothing reaches Yin below 9/10 from the independent gate.** Below 9 it goes back with a defect list.
No exceptions, no "good enough for now".

### 4. Measured, not eyeballed — the hard bar
| Metric | Target | Reference for comparison |
|---|---|---|
| Frame rate, desktop | **60 fps** on the RTX 4070 | measured, not assumed |
| Frame rate, mid phone | **≥ 30 fps** | measured |
| First paint | **< 1.5 s** | Montfort: 0.92 s |
| Hero chunk weight | **< 3 MB** | Montfort: 2.57 MB |
| Each later chapter | **< 3 MB** | Montfort's globe alone: 13 MB |
| Whole page, fully scrolled | **< 12 MB** | Montfort: ~20 MB |
| Console errors | **zero** | Montfort: zero |
| Horizontal scroll on phone | **none** | — |
| Text contrast over imagery | **passes** at every stop | Montfort: risky over the forest |

### 5. Independent adversarial review
Codex 5.5 is a **different model**. It is not Opus marking its own homework. Its job is to attack the
work: name what is wrong, not what is nice. Plus the side-by-side against the real reference, which
exposes any drop in restraint instantly.

### 6. One consistent world, not eight nice scenes
Eight scenes that each look good but different is the signature of amateur work. So: **one light
direction logic, one colour grade, one type system, one easing family across the whole journey.**
Checked as a set, not one at a time — all stops rendered side by side in a single strip and reviewed
together at the end of every phase.

### Kill criteria — when we stop instead of pushing through
- The spike cannot reach 9/10 after a fair number of passes → stop, rethink the concept, or bring in a
  3D specialist for that scene. Do not proceed with a flat-looking hero.
- A scene cannot hit 30 fps on a phone → simplify that scene's ambition rather than ship a stutter.
- Any chapter blows its weight budget and cannot be compressed → cut content from that scene, not the
  budget.

---

# PART 7 — WHERE WE DELIBERATELY BEAT THE REFERENCE

The reference is excellent but leaves real gaps. We take all of them.

| Their gap (verified in their code) | Our target |
|---|---|
| **No `<h1>` anywhere on the page** | Proper heading structure |
| **Placeholder shipped live** — `keyword 2, keyword 2` | Clean metadata |
| **810 font rules for 18 real fonts** (45 copies each; 98% waste) | Fonts declared once |
| **No reduced-motion handling in the JavaScript** | A genuine calm path for motion-sensitive users |
| **Canvas has no text description** — a blind visitor gets nothing from the hero | The journey described for screen readers |
| **No skip link** | Skip link present |
| **13 MB globe** (over half their page weight) | Under 3 MB |
| Generic 3D mountain | **The real Banff peak, from real elevation data** |
| WebGL2 | **WebGPU** with automatic fallback |

---

# PART 8 — HONEST RISKS

1. **Clouds — risk now much lower than first assessed.** Originally the biggest unknown. Research on
   2026-07-25 found this is largely solved: WebGPU compute raymarching with proven open
   implementations and a WebGL2 fallback. Still the most demanding scene; still built first.
2. **Scale.** The reference is ~20 screens and was clearly built by a specialist studio. This is a
   real project, not one evening. The phasing and the gate make it achievable; pretending otherwise
   would be dishonest.
3. **Weight discipline.** Eight 3D scenes bloat fast. Every chapter has a byte budget and is measured,
   or we end up at their 20 MB.
4. **Claim safety at the nanoscale.** The material must read as **a charge that is part of the
   fibre** — never a coating, layer, or added substance on the surface. Drawing it as a coating
   contradicts our legal position. Hard rule for whoever renders it.
5. **No sighted person in the daily loop.** Mitigated by Codex 5.5, hard numbers, and the reference
   comparison — plus one human check before launch.

---

# PART 9 — THE NEXT STEP

Settle the four decisions in Part 2. Then Phase 0 and Phase 1 begin, and the spike is built and gated.
Nothing beyond the spike starts until it clears 9/10 and the hard bar.
