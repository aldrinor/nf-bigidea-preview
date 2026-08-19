# -*- coding: utf-8 -*-
"""A 64x64 blue-noise tile for the cloud raymarch's per-pixel start offset.

Every volumetric cloud implementation worth reading uses blue noise here and I
had used a hash. The difference is not randomness -- both are random -- it is
WHERE the error sits in frequency. White noise spreads its error across all
frequencies including the low ones, and low-frequency error is exactly what the
eye reads as blotches and what an upsample cannot remove. Blue noise puts almost
all of its error high, where the half-resolution upscale filters it away.

Made by rank-order filtering: high-pass white noise, re-rank to a flat
histogram, repeat. Simpler than void-and-cluster and good enough for a
64x64 tile.

    python make_blue_noise.py
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage

N = 64
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
rng = np.random.default_rng(11)

v = rng.random((N, N)).astype(np.float64)
for _ in range(64):
    lp = ndimage.gaussian_filter(v, 1.5, mode="wrap")     # wrap: the tile must tile
    v = v - lp                                            # keep only the high frequencies
    order = np.argsort(v, axis=None)                      # re-rank to a flat histogram
    flat = np.empty(N * N)
    flat[order] = np.linspace(0.0, 1.0, N * N)
    v = flat.reshape(N, N)

# how blue is it? energy above half-Nyquist against energy below
F = np.abs(np.fft.fftshift(np.fft.fft2(v - v.mean())))
yy, xx = np.mgrid[0:N, 0:N]
r = np.hypot(yy - N / 2, xx - N / 2)
lo = F[(r > 0) & (r < N / 4)].mean()
hi = F[r >= N / 4].mean()
print("blue-noise tile %dx%d   high/low frequency energy ratio %.2f  (white noise = 1.0)"
      % (N, N, hi / lo))
print("histogram flatness: min %.3f  max %.3f  mean %.3f" % (v.min(), v.max(), v.mean()))

p = os.path.join(OUT, "bluenoise.webp")
Image.fromarray((v * 255).astype(np.uint8), "L").save(p, lossless=True)
print("-> %s  %d bytes" % (os.path.basename(p), os.path.getsize(p)))
