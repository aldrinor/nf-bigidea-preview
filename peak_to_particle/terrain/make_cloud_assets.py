# -*- coding: utf-8 -*-
"""Turn the two generated cloud plates into engine-ready textures.

Why generated and not procedural: four rounds of hand-written fbm in PIL produced
translucent grey amoebas. Cloud is an image problem, so it was given to the image
generator, and the first plate was right. This script only does the mechanical
part -- keying, repacking, tone-matching -- which is not a taste decision.

  cloudpuff.webp   4 isolated cumulus, RGBA, unpremultiplied, packed 2x2
  cloudsea_rgb.webp  photographic cloud-sea colour for the deck; the deck's
                     coverage still comes from cloudsea.webp's alpha channel

    python make_cloud_assets.py
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
SRC = r"C:\Users\msn\AppData\Local\Temp\claude\C--EPA\cef4a9f6-3b6a-44ff-b67b-ef5aa0a12c86\scratchpad"
CELL = 512

# ---------------------------------------------------------------- 1. puffs
# A bright subject photographed on pure black IS premultiplied alpha, so the
# key is exact rather than a guess: a = luminance, rgb = colour / a.
src = np.asarray(Image.open(os.path.join(SRC, "gen_puffs.png")).convert("RGB"),
                 np.float32) / 255.0
lum = src @ np.array([0.2126, 0.7152, 0.0722], np.float32)
alpha = np.clip((lum - 0.020) / 0.42, 0, 1)          # small toe kills the fringe
alpha = np.clip(alpha ** 0.88, 0, 1)
rgb = src / np.maximum(alpha, 0.10)[..., None]       # unpremultiply
# where alpha is thin the unpremultiply is noisy and leaves a dark fringe, so
# fade those pixels toward the cloud's own white instead of toward black
thin = 1.0 - np.clip(alpha / 0.45, 0, 1)
rgb = rgb + (np.array([0.93, 0.95, 0.98], np.float32) - rgb) * thin[..., None] * 0.85
rgb = np.clip(rgb, 0, 1)

lab, n = ndimage.label(alpha > 0.30)
sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
keep = (np.argsort(sizes)[::-1] + 1)[:4]
print("blobs found %d, keeping the 4 largest: %s" % (n, [int(k) for k in keep]))

atlas = np.zeros((2 * CELL, 2 * CELL, 4), np.float32)
for i, k in enumerate(sorted(keep, key=lambda k: ndimage.center_of_mass(lab == k))):
    ys, xs = np.where(lab == k)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    m = (lab[y0:y1, x0:x1] == k).astype(np.float32)
    a = alpha[y0:y1, x0:x1] * m
    c = rgb[y0:y1, x0:x1]
    h, w = a.shape
    # fit into the cell with a margin so mip-mapping never bleeds across cells
    s = (CELL * 0.90) / max(h, w)
    nh, nw = max(1, int(h * s)), max(1, int(w * s))
    a_i = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((nw, nh), Image.LANCZOS), np.float32) / 255.
    c_i = np.asarray(Image.fromarray((c * 255).astype(np.uint8)).resize((nw, nh), Image.LANCZOS), np.float32) / 255.
    r, cc = divmod(i, 2)
    oy = r * CELL + (CELL - nh) // 2
    ox = cc * CELL + (CELL - nw) // 2
    atlas[oy:oy + nh, ox:ox + nw, :3] = c_i
    atlas[oy:oy + nh, ox:ox + nw, 3] = a_i
    print("  cell %d  source %dx%d -> %dx%d  coverage %.0f%%"
          % (i, w, h, nw, nh, 100 * (a_i > 0.5).mean()))

p = os.path.join(OUT, "cloudpuff.webp")
Image.fromarray((atlas * 255).astype(np.uint8), "RGBA").save(p, quality=92, method=6)
print("cloudpuff.webp  %dx%d  %.2f MB" % (2 * CELL, 2 * CELL, os.path.getsize(p) / 1048576))

# ---------------------------------------------------------------- 2. the deck
sea = Image.open(os.path.join(SRC, "gen_sea.png")).convert("RGB").resize((1024, 1024), Image.LANCZOS)
S = np.asarray(sea, np.float32) / 255.0
# the plate is lit warm and bright; pull it toward the scene's cool daylight so
# it does not sit in front of the terrain as a different photograph
lo, hi = np.percentile(S, 2.0), np.percentile(S, 99.0)
S = np.clip((S - lo) / max(hi - lo, 1e-6), 0, 1)
l = S @ np.array([0.2126, 0.7152, 0.0722], np.float32)
S = S + (1.0 - l)[..., None] * np.array([-0.030, -0.006, 0.045], np.float32)  # cool the shadows
S = np.clip(S, 0, 1) ** 1.04
p2 = os.path.join(OUT, "cloudsea_rgb.webp")
Image.fromarray((S * 255).astype(np.uint8)).save(p2, quality=88, method=6)
print("cloudsea_rgb.webp  1024x1024  %.2f MB  mean %.2f"
      % (os.path.getsize(p2) / 1048576, S.mean()))
