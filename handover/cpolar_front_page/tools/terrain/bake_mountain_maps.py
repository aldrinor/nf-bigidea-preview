# -*- coding: utf-8 -*-
"""Bake the colour and normal maps for the C-POLAR hero mountain.

The shading rules are ported from three.js's own TerrainGenerator
(examples/jsm/generators/TerrainGenerator.js) - altitude and slope as the two
drivers, with strata, scree, patchy snow, cavity darkening and two levels of mottle.

Three things were added after the first version read as a smooth grey primitive:

  * FLOW ACCUMULATION. Water runs downhill and carves gullies. This is the single
    biggest thing that makes terrain read as photographed rather than as noise
    dropped on a hill - real mountains are covered in drainage channels and the eye
    knows it even when it cannot name it.
  * CURVATURE. Creases go dark, ridges and buttresses catch light.
  * SNOW WHERE SNOW ACTUALLY SITS. High, flat, and packed into the sheltered
    gullies - not a white cap painted over the summit. The first pass put 4% snow
    on the highest flat ground, which on a pale page was white on white and read as
    no snow at all.
"""
import numpy as np, os
from scipy import ndimage
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = r"C:\EPA\US\website_project\_cpolar_v2\assets"
CROP = dict(r=1135, c=912, size=430)
N = 2048
# These four MUST match build_v2_terrain.py exactly. The snow line, the scree and the
# gullies are all driven by height, so if this surface is not the same shape as the
# mesh the texture lands in the wrong place - snow halfway down a face, bare rock on
# the summit.
FALLOFF, SHARPEN, SPIRE, KNEE, CORE = 0.40, 1.34, 3.00, (0.22, 0.96), 0.80
rng = np.random.default_rng(11)


def noise(shape, scale, octaves=4):
    """Fractal value noise at a given feature scale, matching the three.js idea of
    detail / grain / macro bands."""
    out = np.zeros(shape, np.float32); amp = 1.0; tot = 0.0
    for o in range(octaves):
        c = max(2, int(shape[0] * scale * (2 ** o)))
        g = rng.random((c, c)).astype(np.float32)
        z = ndimage.zoom(g, (shape[0] / c, shape[1] / c), order=3)[:shape[0], :shape[1]]
        out += z * amp; tot += amp; amp *= 0.5
    out /= tot
    return (out - out.min()) / (out.max() - out.min() + 1e-9)


def ridged(shape, scale, octaves=4):
    """Value noise folded about its midline, so instead of soft blobs it produces a
    network of CREASES.

    Caveat, learnt the hard way: the creases this makes are smooth meanders, because
    the midline contour of smooth value noise is itself a smooth curve. Dumped as an
    image it looks like a dendritic root system, and painted dark into the albedo it
    read on screen as dark worms crawling over the rock. Real fracture networks are
    angular - straight-ish segments meeting at corners, which is a Voronoi cell edge,
    not a noise contour. So this is used for relief only, never for colour."""
    n = noise(shape, scale, octaves)
    return (1.0 - np.abs(n * 2.0 - 1.0)) ** 2


def sstep(a, b, x):
    t = np.clip((x - a) / (b - a + 1e-9), 0, 1)
    return t * t * (3 - 2 * t)


def mix(a, b, t):
    t = t[..., None] if (a.ndim == 3 and np.ndim(t) == 2) else t
    return a * (1 - t) + b * t


def shift2(a, dy, dx):
    """np.roll with the wrapped edge zeroed - roll alone would wrap the top of the
    frame onto the bottom and print a seam straight across the mountain."""
    r = np.roll(np.roll(a, dy, 0), dx, 1)
    if dy > 0:   r[:dy, :] = 0
    elif dy < 0: r[dy:, :] = 0
    if dx > 0:   r[:, :dx] = 0
    elif dx < 0: r[:, dx:] = 0
    return r


# ------------------------------------------------------------------ the surface
# Same shape the mesh uses, from erode_terrain.py: skirt, spire profile and half a
# million droplets of erosion, all already applied. Reading the raw survey crop here
# and re-deriving the profile is what used to let the texture and the mesh disagree.
s = np.load(os.path.join(HERE, "eroded_terrain.npy")).astype(np.float32)
s = ndimage.zoom(s, (N / s.shape[0], N / s.shape[1]), order=3).astype(np.float32)
gh, gw = s.shape
yy, xx = np.mgrid[0:gh, 0:gw].astype(np.float32)
cy, cx = (gh - 1) / 2, (gw - 1) / 2
rad = ((np.abs(xx - cx) / cx) ** 4 + (np.abs(yy - cy) / cy) ** 4) ** 0.25

# ------------------------------------------------------------- the two drivers
# Slope is computed in WORLD units, not in whatever range the height field happens to
# arrive in. Twice now a hard-coded slope threshold has silently stopped firing: once
# because it was written by eye against steepness this terrain does not have, and once
# because switching to the eroded file changed the height range from metres to 0-100
# and every mask came out at 0% coverage. Here the height is put into the same world
# units the mesh uses and divided by the world size of a texel, so `steep` is a real
# slope - and the thresholds below are then set from the terrain's own PERCENTILES, so
# they cannot go stale again whatever the input scale.
MOUNTAIN_SPAN, MOUNTAIN_RISE, CORE_FRAC = 370.0, 114.0, 0.80
altitude = (s - s.min()) / (s.max() - s.min() + 1e-9)
s_world = altitude * MOUNTAIN_RISE
texel = MOUNTAIN_SPAN / (N * CORE_FRAC)
gy, gx = (np.asarray(g) / texel for g in np.gradient(s_world))
flatness = 1.0 / np.sqrt(1.0 + gx ** 2 + gy ** 2)            # cosine of the slope
steep = 1.0 - flatness

P = lambda q: float(np.percentile(steep, q))
print("slope: p35 %.3f  p50 %.3f  p75 %.3f  p90 %.3f  p97 %.3f" % (
    P(35), P(50), P(75), P(90), P(97)))

# the reused noise scales, plus a fine one for crenellation
detail = noise((gh, gw), 0.010, 5)
grain = noise((gh, gw), 0.035, 5)
macro = noise((gh, gw), 0.0028, 4)
micro = noise((gh, gw), 0.090, 4)

# ---------------------------------------------------- flow: where water would run
# Multi-direction flow accumulation. Each cell sends its water to its lower
# neighbours in proportion to how far each one drops; iterate and the water piles
# up along the lines where slopes converge. Those lines are the gullies.
# Run at quarter scale - drainage is a large feature and this is 16x cheaper.
# Q=4 computed drainage on a 512 grid and blew it back up to 2048. Cubic upsampling
# turns a channel into a smooth meander, and meanders across a rock face read as
# marbling, not as water. Half the step, four times the cost, sharp channels.
Q = 2
sq = ndimage.gaussian_filter(ndimage.zoom(s, 1.0 / Q, order=1), 1.2)
DIRS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
drops = []
for dy, dx in DIRS:
    nb = shift2(sq, -dy, -dx)                       # height of the neighbour at (dy,dx)
    drops.append(np.clip(sq - nb, 0, None) / np.hypot(dy, dx))
tot = np.sum(drops, 0) + 1e-6
weights = [d / tot for d in drops]

flow = np.ones_like(sq)
for _ in range(90):
    acc = np.ones_like(sq)
    for (dy, dx), wd in zip(DIRS, weights):
        acc += shift2(flow * wd, dy, dx)            # water leaves a cell, lands downhill
    flow = acc
flow = np.log1p(flow)
flow = (flow - flow.min()) / (flow.max() - flow.min() + 1e-9)
flow = ndimage.zoom(flow, (gh / flow.shape[0], gw / flow.shape[1]), order=3)[:gh, :gw]
flow = np.clip(flow, 0, 1)
gully = sstep(0.30, 0.70, flow) * sstep(P(30), P(72), steep)   # channels on any real slope,
# not just the steep faces - the broad lower cone was reading as a bare smooth dome

# -------------------------------------------------- fractures, ledges and scree fans
# Three things a real rock face has that fractal noise alone will never produce, and
# whose absence is exactly why the first passes were called melted clay.

# 1. FRACTURES. Networks of thin sharp cracks at two scales, kept as thin lines rather
#    than a wash by cutting hard near the top of the range.
fracture = np.maximum(ridged((gh, gw), 0.022, 3), ridged((gh, gw), 0.058, 3) * 0.85)
# Every slope gate here is set against the MEASURED distribution of this terrain:
# median steepness is 0.09 and the 90th percentile is 0.31. Gates written at 0.30-0.62
# by eye fired on almost nothing - ledges came out at 0% coverage - while gates written
# against flatness fired on everything and buried the mountain in scree at 79%.
#    Density has to VARY. At one strength everywhere the cracks tile the whole surface
#    at one cell size and read as crazing on pottery, not as rock. Real faces alternate
#    between shattered ground and clean unbroken slabs, so a slow field decides which
#    is which, and a second one varies the cell size across the mountain.
fracDensity = sstep(0.30, 0.78, noise((gh, gw), 0.005, 3))
fracture = np.maximum(fracture, ridged((gh, gw), 0.011, 2) * 0.9)
#    And it must be gated to genuinely STEEP rock. At sstep(0.04, 0.16) it fired on
#    two thirds of the mountain including the shallow lower slopes, where raking light
#    turned the crack network into veining like marble or a leaf.
fracture = sstep(0.66, 0.96, fracture) * sstep(P(45), P(82), steep) * (0.18 + 0.82 * fracDensity)

# 2. LEDGES. Sedimentary rock is bedded, and where a bed outcrops on a steep face it
#    makes a step: a lit lip with a shadow tucked under it. Quantising height into
#    bands and shading the two sides of each boundary differently is what draws them.
ledgeLip = np.zeros_like(steep)      # see the note in the shading block below
ledgeCut = np.zeros_like(steep)

# 3. SCREE FANS. Broken rock spills off the cliffs and piles up wherever the ground
#    eases off below them, so it collects in the drainage lines, not evenly.
#    Band-pass on slope: steep enough to be a slope at all, too shallow to be a cliff.
#    Written against FLATNESS first, which on this terrain is above 0.62 nearly
#    everywhere - so the gate never closed and 79% of the mountain came out as scree.
screeMask = sstep(0.05, 0.13, steep) * sstep(0.42, 0.24, steep) \
          * sstep(0.66, 0.24, altitude) \
          * (sstep(0.25, 0.60, flow) * 0.65 + 0.35) * (grain * 0.5 + 0.5)

# ---------------------------------------------------- curvature: creases vs ridges
lap = ndimage.laplace(ndimage.gaussian_filter(s, 3.0))
lap = lap / (np.abs(lap).max() + 1e-9)
crease = np.clip(-lap * 6.0, 0, 1)      # concave: chimneys, couloirs
ridgey = np.clip(lap * 6.0, 0, 1)       # convex: aretes, buttresses

# ------------------------------------------------- colour: V1's recipe, verbatim
# Lifted from V1's own fragment shader. Two colours and a mask; nothing else touches
# the albedo. Every procedural layer I had here - gully darkening, fracture networks,
# scree fans, strata bands, macro and micro mottle, curvature shading, baked occlusion -
# has been taken OUT of the colour. They all still exist, in the normal map below, where
# they are relief for the light to find rather than paint.
C = lambda hexv: np.array([(hexv >> 16 & 255), (hexv >> 8 & 255), hexv & 255], np.float32) / 255.0

# Measured against V1 frame by frame: 15.3% of my frame was decidedly dark against
# V1's 5.0%, my contrast range was 100 against V1's 83, and my blueness was 10.0
# against V1's 20.5. So the rock is too dark, there is too much of it, and it is too
# neutral. Lifted and shifted blue.
SNOW = np.array([0.945, 0.970, 1.00], np.float32)
ROCK_LO = C(0xA5BAD2)
ROCK_HI = np.array([1.0, 1.0, 1.0], np.float32)      # V1: vec3(1.)

# The one thing that varies the rock is the luminance of a rock texture. V1 samples a
# photograph; this uses the same fine detail that already drives the relief, so rock and
# its own bumps agree instead of disagreeing.
rockLum = np.clip(micro * 0.55 + grain * 0.45, 0, 1)
rockLum = np.clip((rockLum - 0.5) * 0.80 + 0.60, 0.30, 0.95)
rockShade = ROCK_LO + (ROCK_HI - ROCK_LO) * rockLum[..., None]
# V1 multiplies this by 1.3 - but V1 then multiplies the result by a BAKED LIGHTMAP,
# which pulls it back down. That 1.3 is compensation for the lightmap, not part of the
# colour. Applied here with nothing to pull it back, the whole mountain came out between
# 0.88 and 1.00: white on white. The real-time lights do the darkening instead.

# ------------------------------------------------------------------------- snow
# High, and on anything not vertical - plus packed into the sheltered gullies, which is
# what makes a real peak read as striped rather than capped.
snowMask = sstep(0.05, 0.26, altitude + detail * 0.09 + grain * 0.06)
snowMask = np.clip(snowMask + gully * sstep(0.05, 0.30, altitude) * 0.55, 0, 1)
# Erosion left a great deal of the surface steep, so only near-vertical faces are bare.
snowMask *= sstep(0.96, 0.56, steep)
# V1 jitters the mask lookup by 0.002 of a noise field so the boundary is never a clean
# line. Same idea, done here as a blur plus a noise nudge.
snowMask = np.clip(snowMask + (grain - 0.5) * 0.10, 0, 1)
snowMask = ndimage.gaussian_filter(snowMask, 1.4)

surface = mix(rockShade, np.broadcast_to(SNOW, (gh, gw, 3)).copy(), snowMask)
surface = np.clip(surface, 0, 1)

# --- normal: terrain slope, gullies cut in, four octaves of relief, strong on rock -
relief = (noise((gh, gw), 0.06, 3) - 0.5) * 1.00 \
       + (noise((gh, gw), 0.15, 3) - 0.5) * 0.55 \
       + (noise((gh, gw), 0.34, 3) - 0.5) * 0.30 \
       + (noise((gh, gw), 0.70, 2) - 0.5) * 0.16
relief *= (0.30 + 0.55 * steep) * (1 - snowMask * 0.62)     # snow is smooth, rock is not

# The same fractures and ledges have to exist in the SURFACE, not only in the colour.
# A crack painted on a smooth face still lights like a smooth face and the eye is not
# fooled; cut as real relief it catches the key light along one side and goes black on
# the other, which is what sells it as rock.
# 150 was set when the height field was smooth survey data and the normal map had to
# invent all the relief. The eroded field arrives already full of channels, so the same
# gain turns the whole mountain into crunch. The added noise relief comes down for the
# same reason - erosion now supplies the mid scales it used to stand in for.
hs = (ndimage.gaussian_filter(s, 1.6) / (s.max() - s.min() + 1e-9) * 88.0
      + relief * 3.0
      - gully * 0.35                                    # deeper than this and the
                                                        # channels read as dark worms
                                                        # crawling over the rock face
      - fracture * 0.85                                 # cracks cut IN, relief only
      + screeMask * (micro - 0.5) * 1.6)                # scree is granular, not smooth
gy2, gx2 = np.gradient(hs)
nx, ny, nz = -gx2 * 2.8, -gy2 * 2.8, np.ones_like(gx2)
ln = np.sqrt(nx * nx + ny * ny + nz * nz)
nm = np.stack([nx / ln, ny / ln, nz / ln], -1)
Image.fromarray(((nm * 0.5 + 0.5) * 255).clip(0, 255).astype(np.uint8)).save(
    os.path.join(OUT, "mountain_normal.webp"), "WEBP", quality=80, method=6)

# --- roughness: one number across the whole mountain made the dark summit read glossy
# Wet rock in the drainage lines is darker and shinier; snow is smooth; scree and
# broken faces are dead matte. Varying it is most of what stops a surface looking
# moulded out of one material.
rough = np.full((gh, gw), 0.94, np.float32)
rough -= gully * 0.20                       # water-polished channels
rough -= fracture * 0.06
rough -= snowMask * 0.10                    # snow is smoother than broken rock
rough += (grain - 0.5) * 0.05
Image.fromarray((np.clip(rough, 0.45, 1.0) * 255).astype(np.uint8)).save(
    os.path.join(OUT, "mountain_rough.webp"), "WEBP", quality=82, method=6)

kb = lambda f: os.path.getsize(os.path.join(OUT, f)) / 1024
print("albedo %.0f KB   normal %.0f KB   rough %.0f KB" % (
    kb("mountain_albedo.webp"), kb("mountain_normal.webp"), kb("mountain_rough.webp")))
print("snow %.0f%%   gully %.0f%%   fracture %.0f%%" % (
    float((snowMask > 0.4).mean()) * 100, float((gully > 0.4).mean()) * 100,
    float((fracture > 0.3).mean()) * 100))
print("albedo range %.2f-%.2f" % (float(surface.min()), float(surface.max())))
