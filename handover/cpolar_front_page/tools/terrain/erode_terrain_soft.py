# -*- coding: utf-8 -*-
"""Run hydraulic erosion on the hero mountain, and write the result for everything else.

Why: survey data resampled and smoothed gives a rounded lump. Every judging round said
the same thing about the outline - "stepped, rounded, exposes the underlying geometry",
"needs irregular erosion, sharper rock outcrops, finer silhouette displacement". No
texture fixes a silhouette. The shape itself has to be cut.

This is the droplet method (Hans Beyer, TU Munich, 2015; the same scheme Sebastian
Lague's terrain work uses). A drop of water is dropped on the surface and followed:

  it accelerates down the slope it is standing on, and carries some of its previous
  direction, so it does not simply follow the steepest line and can cut across;
  the faster it moves and the more water it holds, the more rock it can carry;
  going downhill it picks rock up, and where it slows or runs uphill it puts rock
  down; and it evaporates, so every drop eventually drops what it is carrying.

Run enough drops and the channels find each other. Valleys braid and join downhill, the
ground BETWEEN them is left standing as ridges, and the debris piles up at the foot as
a fan. None of that is drawn - it falls out of the rule, which is why it does not look
authored the way layered noise always does.

Droplets are simulated in parallel batches rather than one at a time: at 400,000 drops
of 34 steps each, a Python loop per drop would be about 14 million iterations. Here
every step is one pass of numpy arithmetic over a whole batch at once.

The output is the single source of shape. build_v2_terrain.py and bake_mountain_maps.py
both read it, so the mesh and the texture cannot drift apart.
"""
import numpy as np, os
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
DEM = os.path.join(HERE, "assiniboine_dem.npy")
OUT = os.path.join(HERE, "eroded_terrain_soft.npy")

CROP = dict(r=1135, c=912, size=430)
# Resolution decides the SIZE of the channels relative to the mountain, and that is
# what decides whether they read as valleys or as noise. At 1024 a channel was about 5
# cells wide, which lands on screen as 3 pixels - fur, competing with the photographic
# rock detail instead of complementing it, and judged "crumpled foil". At 384 the same
# channel is three times bigger in the frame and reads as what it is. Erosion supplies
# the LARGE structure; the photograph supplies the fine.
N = 384
SHARPEN, SPIRE, KNEE = 1.34, 3.00, (0.22, 0.96)
FALLOFF, CORE = 0.40, 0.80

DROPS = 70_000
# BATCH is how many droplets act before the surface is re-read. Too many and they all
# cut the same cell without seeing each other's work, which at a coarse resolution -
# where each step descends further - compounds into a runaway and overflows float32.
BATCH = 5_000
# LIFE is what decides whether the result has a HIERARCHY. At 34 steps a droplet dies
# a few dozen cells from where it landed, so every channel comes out the same small
# size and the surface reads as fur. Long-lived droplets travel far enough to join up,
# and where many paths converge they cut a main valley - which is the feature that
# actually breaks a rounded silhouette.
LIFE = 60
INERTIA = 0.055          # 0 follows the steepest line exactly; higher cuts across
CAPACITY = 6.5           # how much a fast, full droplet can carry
MIN_SLOPE = 0.008
ERODE, DEPOSIT = 0.34, 0.30
EVAPORATE = 0.022
GRAVITY = 5.0

rng = np.random.default_rng(4)


def sstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def bilinear(field, px, py):
    """Height and gradient at fractional positions, from the four cells around each."""
    x0, y0 = np.floor(px).astype(np.int32), np.floor(py).astype(np.int32)
    fx, fy = px - x0, py - y0
    x1, y1 = x0 + 1, y0 + 1
    h00 = field[y0, x0]; h10 = field[y0, x1]
    h01 = field[y1, x0]; h11 = field[y1, x1]
    h = (h00 * (1 - fx) * (1 - fy) + h10 * fx * (1 - fy)
         + h01 * (1 - fx) * fy + h11 * fx * fy)
    gx = (h10 - h00) * (1 - fy) + (h11 - h01) * fy
    gy = (h01 - h00) * (1 - fx) + (h11 - h10) * fx
    return h, gx, gy, x0, y0, fx, fy


# ------------------------------------------------------------------ the start shape
dem = np.load(DEM).astype(np.float32)
h = CROP["size"] // 2
w = dem[CROP["r"] - h:CROP["r"] + h, CROP["c"] - h:CROP["c"] + h]
s = ndimage.zoom(w, (N / w.shape[0], N / w.shape[1]), order=3).astype(np.float32)
s = ndimage.gaussian_filter(s, 0.6)

yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
cy = cx = (N - 1) / 2.0
rad = ((np.abs(xx - cx) / cx) ** 4 + (np.abs(yy - cy) / cy) ** 4) ** 0.25
g16 = rng.random((16, 16)).astype(np.float32)
wob = ndimage.zoom(g16, N / 16, order=3)[:N, :N]
wob = (wob - wob.mean()) / (np.abs(wob - wob.mean()).max() + 1e-9)
skirt = np.clip(1 - np.clip((rad + wob * 0.06 - FALLOFF) / (CORE - FALLOFF), 0, 1), 0, 1)
skirt = skirt * skirt * (3 - 2 * skirt)

base = float(np.percentile(s, 4)); peak0 = float(s.max())
rel = np.clip((s - base) / (peak0 - base), 0, 1)
# the spire profile goes on BEFORE the water, so the drops cut the final shape and the
# curve cannot smooth the channels back out afterwards
rel = rel ** (SHARPEN + (SPIRE - SHARPEN) * sstep(KNEE[0], KNEE[1], rel))
s = base + rel * (peak0 - base)
s = base + (s - base) * skirt

relief0 = float(s.max() - s.min())
s = (s - s.min()) / relief0 * 100.0        # work in a fixed 0..100 range
start = s.copy()

# ------------------------------------------------------------------ the water
flat = s.ravel()
done = 0
for b in range(0, DROPS, BATCH):
    m = min(BATCH, DROPS - b)
    # start them on the mountain, not out on the flat, where they would do nothing
    px = rng.uniform(2, N - 3, m).astype(np.float32)
    py = rng.uniform(2, N - 3, m).astype(np.float32)
    dx = np.zeros(m, np.float32); dy = np.zeros(m, np.float32)
    speed = np.ones(m, np.float32)
    water = np.ones(m, np.float32)
    sed = np.zeros(m, np.float32)
    alive = np.ones(m, bool)

    for _ in range(LIFE):
        if not alive.any():
            break
        i = np.nonzero(alive)[0]
        h0, gx, gy, x0, y0, fx, fy = bilinear(s, px[i], py[i])

        d = np.stack([dx[i] * INERTIA - gx * (1 - INERTIA),
                      dy[i] * INERTIA - gy * (1 - INERTIA)])
        ln = np.sqrt((d ** 2).sum(0)) + 1e-8
        d /= ln
        nx_, ny_ = px[i] + d[0], py[i] + d[1]

        out = (nx_ < 1) | (nx_ > N - 3) | (ny_ < 1) | (ny_ > N - 3) | (ln < 1e-6)
        h1 = np.where(out, h0, bilinear(s, np.clip(nx_, 1, N - 3), np.clip(ny_, 1, N - 3))[0])
        dh = h1 - h0

        cap = np.maximum(-dh * speed[i] * water[i] * CAPACITY, MIN_SLOPE)
        # uphill, or carrying more than it can hold: put rock down where it stands
        drop = np.where(dh > 0, np.minimum(dh, sed[i]), (sed[i] - cap) * DEPOSIT)
        drop = np.where((dh > 0) | (sed[i] > cap), np.maximum(drop, 0.0), 0.0)
        # otherwise it picks rock up, never more than the step it is descending
        take = np.where((dh <= 0) & (sed[i] <= cap),
                        np.minimum((cap - sed[i]) * ERODE, -dh), 0.0)

        # Hard ceiling on what one droplet may move in one step, as a fraction of the
        # 0-100 range. Without it a steep coarse cell lets capacity, then sediment,
        # then the step itself grow without bound.
        MAX_MOVE = 0.30
        drop = np.clip(np.nan_to_num(drop), 0.0, MAX_MOVE)
        take = np.clip(np.nan_to_num(take), 0.0, MAX_MOVE)
        delta = drop - take
        sed[i] = np.clip(sed[i] + take - drop, 0.0, 8.0)

        # scatter back to the four cells, weighted the same way the height was read
        idx = np.stack([y0 * N + x0, y0 * N + x0 + 1, (y0 + 1) * N + x0, (y0 + 1) * N + x0 + 1])
        wgt = np.stack([(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy])
        flat += np.bincount(idx.ravel(), weights=(wgt * delta).ravel(), minlength=N * N)

        speed[i] = np.clip(np.sqrt(np.maximum(np.nan_to_num(speed[i] ** 2 + dh * -GRAVITY), 0.0)), 0.0, 12.0)
        water[i] *= (1 - EVAPORATE)
        dx[i], dy[i] = d[0], d[1]
        px[i], py[i] = np.clip(nx_, 1, N - 3), np.clip(ny_, 1, N - 3)
        alive[i] = ~out & (water[i] > 0.02)

    np.nan_to_num(s, copy=False, nan=0.0, posinf=100.0, neginf=0.0)
    np.clip(s, -25.0, 130.0, out=s)

    done += m
    if (b // BATCH) % 5 == 4:
        cut = float(np.mean(np.abs(s - start)))
        print("  %7d drops   mean change %.3f of a 0-100 range" % (done, cut))

# a whisker of smoothing: the scatter can leave single-cell spikes where many droplets
# landed on the same cell in one batch. Small enough to leave the channels alone.
s = ndimage.gaussian_filter(s, 0.55)

# NO ridge sharpening in this one.
#
# The sharpening is what makes the v2 hero good and it is also what makes V1 stripe:
# V1 paints its mountain with a texture projected straight down, so a near-vertical face
# stretches it into vertical smears. Its own mountain was a smooth massif, which is why
# that never showed. This version keeps everything that is real - the Assiniboine crop,
# the spire profile, half a million droplets of erosion and their drainage - and leaves
# out the one step that creates faces V1's shader cannot paint.

np.save(OUT, s.astype(np.float32))
d = s - start
print("wrote %s  %dx%d  %.1f MB" % (os.path.basename(OUT), N, N,
                                    os.path.getsize(OUT) / 1048576))
print("  cut down to %.2f, built up to %.2f, on a 0-100 range" % (d.min(), d.max()))
print("  %.1f%% of the surface moved by more than 1%% of the relief" % ((np.abs(d) > 1).mean() * 100))
