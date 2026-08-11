# -*- coding: utf-8 -*-
"""Find the real summits in the DEM (local maxima), and report their lat/lon."""
import numpy as np
from scipy import ndimage
dem = np.load("banff_dem.npy").astype(np.float32)
H, W = dem.shape
Wl, El, Sl, Nl = -116.36, -116.14, 51.34, 51.46

# local maxima on a coarse window = distinct peaks
mx = ndimage.maximum_filter(dem, size=140)
peaks = (dem == mx) & (dem > 2800)
ys, xs = np.where(peaks)
order = np.argsort(-dem[ys, xs])
print("  the real summits in this frame, highest first:")
seen = []
for i in order:
    y, x = ys[i], xs[i]
    if any((y-py)**2 + (x-px)**2 < 200**2 for py, px in seen):   # dedupe
        continue
    seen.append((y, x))
    lat = Nl - (y / H) * (Nl - Sl)
    lon = Wl + (x / W) * (El - Wl)
    print(f"    {dem[y,x]:7.0f} m   lat {lat:.4f}  lon {lon:.4f}   pixel ({x},{y})")
    if len(seen) >= 8: break
print()
print(f"  frame is {W}x{H} px  ({(El-Wl)*111.32*0.623:.1f} km wide x {(Nl-Sl)*111.32:.1f} km tall)")
