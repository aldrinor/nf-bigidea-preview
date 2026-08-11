# -*- coding: utf-8 -*-
"""Turn the generated rock photograph into a seamlessly tiling colour + normal pair.

The photograph comes from Codex Gen 2 (gpt_image_2). It is the one thing the
procedural route could not produce: fracture that is ANGULAR - straight segments
meeting at corners - because that is a Voronoi cell edge, and folded value noise only
ever makes smooth meanders. Painted into the colour those meanders read on screen as
dark worms crawling over the rock, which is what three rounds of judging kept calling
out.

A generated photograph does not tile. This wraps it, by cross-fading the image against
half-period-shifted copies of itself with a raised-cosine window.

    w(x) = sin(pi*x/N)^2      so that   w(x) + w(x + N/2) = 1

Weighting the four shifted copies by w(x)w(y), w(x+h)w(y), w(x)w(y+h), w(x+h)w(y+h)
makes the weights sum to exactly one everywhere, and every term is periodic, so the
result is periodic by construction. At the old border w(x) is zero, so what shows
there is content from the middle of the frame - which is continuous with itself.

It costs a little sharpness where the fades overlap. On rock that is invisible; a seam
would not be.
"""
import numpy as np, os
from PIL import Image

SRC = r"C:\Users\msn\AppData\Local\Temp\claude\C--EPA\cef4a9f6-3b6a-44ff-b67b-ef5aa0a12c86\scratchpad\rock\a.png"
OUT = r"C:\EPA\US\website_project\_cpolar_v2\assets"
N = 1024


def wrap_seamless(img):
    """img: (N,N,C) float. Returns a version that tiles exactly."""
    n = img.shape[0]
    h = n // 2
    x = np.arange(n, dtype=np.float32)
    w1 = np.sin(np.pi * x / n) ** 2                      # 0 at both borders, 1 mid
    w2 = np.roll(w1, h)                                  # its complement
    assert np.allclose(w1 + w2, 1.0, atol=1e-5), "the window must partition unity"

    out = np.zeros_like(img)
    for dy, wy in ((0, w1), (h, w2)):
        for dx, wx in ((0, w1), (h, w2)):
            shifted = np.roll(np.roll(img, dy, 0), dx, 1)
            out += shifted * (wy[:, None] * wx[None, :])[..., None]
    return out


def seam_ratio(a):
    """How big is the step across the wrap, against a normal step inside the image?
    Comparing the last row to the first row directly is meaningless - neighbouring
    pixels of any texture differ. A ratio near 1 means the join is no more visible
    than anywhere else."""
    g = a.mean(-1) if a.ndim == 3 else a
    ix = np.abs(np.diff(g, axis=1)).mean()
    iy = np.abs(np.diff(g, axis=0)).mean()
    sx = np.abs(g[:, -1] - g[:, 0]).mean()
    sy = np.abs(g[-1, :] - g[0, :]).mean()
    return sx / ix, sy / iy


src = Image.open(SRC).convert("RGB").resize((N, N), Image.LANCZOS)
img = np.asarray(src, np.float32) / 255.0
before = seam_ratio(img)
tile = np.clip(wrap_seamless(img), 0, 1)
after = seam_ratio(tile)

# ---- colour: flattened to a MODULATION, not a paint layer -------------------------
# The mountain's own baked map already decides what colour everything is - rock here,
# scree there, snow above the line. This must not overrule it. Only the local variation
# is kept: divide out the slow average and centre on 1.0, so it multiplies the base
# rather than replacing it. Any large-scale brightness left in would print the
# photograph's own lighting onto the mountain, tile after tile.
# k sets what counts as "slow". A 41-pixel box removes everything larger than about
# 80 pixels - and the fracture cells in this photograph are nearer 200 across, so the
# first attempt high-passed away exactly the angular cracks the photograph was
# generated for, and the mountain came back looking the same as before. This keeps
# every feature up to roughly 400 pixels and only takes out the overall lighting tilt.
lum = tile.mean(-1)
k = 200
pad = np.pad(lum, k, mode="wrap")
cs = np.cumsum(np.cumsum(pad, 0), 1)
box = (cs[2*k:, 2*k:] - cs[:-2*k, 2*k:] - cs[2*k:, :-2*k] + cs[:-2*k, :-2*k]) / (2*k)**2
detail_c = tile / np.clip(box, 1e-3, None)[..., None]
detail_c = detail_c / detail_c.mean()
detail_c = np.clip((detail_c - 1.0) * 1.05 + 1.0, 0.35, 1.6)
Image.fromarray((np.clip(detail_c / 1.6, 0, 1) * 255).astype(np.uint8)).save(
    os.path.join(OUT, "rock_detail_c.webp"), "WEBP", quality=92, method=6)

# ---- normal: from the flattened luminance ----------------------------------------
# Rolled central differences, not np.gradient: gradient uses one-sided differences on
# the first and last row, which breaks exactly the wrap the cross-fade just built.
hgt = detail_c.mean(-1).astype(np.float32)
hgt = (hgt - hgt.mean())
gx = (np.roll(hgt, -1, 1) - np.roll(hgt, 1, 1)) * 0.5
gy = (np.roll(hgt, -1, 0) - np.roll(hgt, 1, 0)) * 0.5
S = 60.0
nx, ny, nz = -gx * S, -gy * S, np.ones_like(gx)
ln = np.sqrt(nx * nx + ny * ny + nz * nz)
nrm = np.stack([nx / ln, ny / ln, nz / ln], -1)
Image.fromarray(((nrm * 0.5 + 0.5) * 255).clip(0, 255).astype(np.uint8)).save(
    os.path.join(OUT, "rock_detail_n.webp"), "WEBP", quality=94, method=6)

kb = lambda f: os.path.getsize(os.path.join(OUT, f)) / 1024
print("source %dx%d -> tile %dx%d" % (src.size[0], src.size[1], N, N))
print("seam step vs interior step   before wrap  x %.1f  y %.1f" % before)
print("                             after  wrap  x %.2f  y %.2f   "
      "(1.0 = invisible, 3+ = a visible line)" % after)
print("rock_detail_c.webp %.0f KB   rock_detail_n.webp %.0f KB" % (
    kb("rock_detail_c.webp"), kb("rock_detail_n.webp")))
print("colour modulation range %.2f..%.2f around 1.0" % (detail_c.min(), detail_c.max()))
