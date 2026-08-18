# -*- coding: utf-8 -*-
"""Bake the cropped Everest DEM to a height texture, so the cloud shader can tell
where the rock is and fade out against it instead of banding across the face."""
import json
import math
import os

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")

W0, E0, S0, N0 = 86.815, 87.025, 27.920, 28.065
W1, E1, S1, N1 = 86.826, 87.014, 27.929, 28.056
TEX = 1024

dem = np.load(os.path.join(OUT, "everest_dem.npy")).astype(np.float32)
void = dem < -100
if void.any():
    fill = ndimage.median_filter(dem, size=9)
    dem[void] = fill[void]
    dem[dem < -100] = np.median(dem[dem >= -100])

h, w = dem.shape
cl = int(round((W1 - W0) / (E0 - W0) * w))
cr = int(round((E1 - W0) / (E0 - W0) * w))
rt = int(round((N0 - N1) / (N0 - S0) * h))
rb = int(round((N0 - S1) / (N0 - S0) * h))
dem = dem[rt:rb, cl:cr]

# dilate upward a little: the cloud should clear the ridge line, not the pixel
dem = ndimage.maximum_filter(dem, size=5)

hmin, hmax = float(dem.min()), float(dem.max())
img = ((dem - hmin) / (hmax - hmin) * 255).clip(0, 255).astype(np.uint8)
Image.fromarray(img).resize((TEX, TEX), Image.LANCZOS).save(
    os.path.join(OUT, "everest_hero_height.webp"), quality=95, method=6)

lat_mid = (S1 + N1) / 2
meta = {
    "hmin": round(hmin, 1), "hmax": round(hmax, 1),
    "spanX": round((E1 - W1) * 111320.0 * math.cos(math.radians(lat_mid)), 1),
    "spanZ": round((N1 - S1) * 111320.0, 1),
}
with open(os.path.join(OUT, "everest_hero_height.json"), "w") as f:
    json.dump(meta, f)
print("height texture ->", meta,
      "%.2f MB" % (os.path.getsize(os.path.join(OUT, "everest_hero_height.webp")) / 1048576))
