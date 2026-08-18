# -*- coding: utf-8 -*-
"""Bake a cloud-sea texture: RGB carries lit tops and shadowed bases, A carries
the silhouette. Doing the lighting here, once, is what separates cloud from fog --
a flat alpha mask lit at runtime always reads as a filter.

    python bake_cloudsea.py
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage

N = 2048
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
rng = np.random.default_rng(7)


def value_noise(res):
    g = rng.random((res + 1, res + 1)).astype(np.float32)
    g[-1, :] = g[0, :]
    g[:, -1] = g[:, 0]                       # tileable
    return np.asarray(Image.fromarray((g * 255).astype(np.uint8))
                      .resize((N, N), Image.BICUBIC), dtype=np.float32) / 255.0


def fbm(octaves=7, res0=4, gain=0.5):
    out = np.zeros((N, N), np.float32)
    amp, res, tot = 1.0, res0, 0.0
    for _ in range(octaves):
        out += amp * value_noise(res)
        tot += amp
        amp *= gain
        res *= 2
    return out / tot


# ---- shape -----------------------------------------------------------------
base = fbm(7, 3)
detail = fbm(6, 12)
# warp the field so the edges are ragged rather than round blobs
wx, wy = fbm(4, 6), fbm(4, 6)
yy, xx = np.mgrid[0:N, 0:N]
sx = np.clip(xx + (wx - 0.5) * 190, 0, N - 1).astype(np.int32)
sy = np.clip(yy + (wy - 0.5) * 190, 0, N - 1).astype(np.int32)
shape = base[sy, sx]

# hard threshold: clear air, then cloud. This is the silhouette.
COVER = 0.46
alpha = np.clip((shape - COVER) / 0.13, 0, 1)
alpha *= np.clip((detail - 0.28) / 0.5, 0, 1) * 0.45 + 0.55     # bite out the edge
alpha = ndimage.gaussian_filter(alpha, 0.7)
alpha = np.clip(alpha, 0, 1)

# ---- lighting: this is the part that makes it a body, not a filter ---------
# treat the alpha field as a height field and shade it from the sun side
h = ndimage.gaussian_filter(alpha, 6.0)
gy, gx = np.gradient(h)
sun = np.array([0.62, -0.42, 0.66])
sun /= np.linalg.norm(sun)
nz = np.full_like(gx, 0.03)
nx, ny = -gx, -gy
ln = np.sqrt(nx * nx + ny * ny + nz * nz)
lam = np.clip((nx * sun[0] + ny * sun[1] + nz * sun[2]) / ln, 0, 1)

# thickness below a point -> how buried it is -> how dark the base goes
depth = ndimage.uniform_filter(alpha, 90)
occ = np.clip(1.0 - depth * 0.85, 0.52, 1.0)   # shade the base, do not crush the tops

lit = 0.62 + 0.38 * lam ** 0.6
val = lit * occ
val = np.clip(val, 0, 1)

TOP = np.array([1.00, 0.985, 0.965])       # sunlit top, faintly warm
SHADE = np.array([0.58, 0.645, 0.735])     # base in its own shadow, cool
rgb = SHADE + (TOP - SHADE) * val[..., None]

img = np.concatenate([np.clip(rgb, 0, 1),
                      alpha[..., None]], axis=2)
Image.fromarray((img * 255).astype(np.uint8), mode="RGBA").save(
    os.path.join(OUT, "cloudsea.webp"), quality=90, method=6)
print("cloudsea.webp  %d x %d  coverage %.0f%%  %.2f MB"
      % (N, N, 100 * (alpha > 0.5).mean(),
         os.path.getsize(os.path.join(OUT, "cloudsea.webp")) / 1048576))
