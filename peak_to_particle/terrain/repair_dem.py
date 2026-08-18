# -*- coding: utf-8 -*-
"""Find and inpaint corrupt pixels in a fetched terrarium DEM.

The fetcher pastes nothing when a tile request fails and pastes garbage when one
arrives truncated, and neither shows up as an obvious hole. In the Everest DEM
that left row 1384 sitting at -8149 m, row 1385 four kilometres below its
neighbours, and a twelve-column strip of nonsense running a thousand rows down
the tile. The existing repair only caught values under -100 m, so the 1 047 m
row survived and rendered as a seam straight down the summit.

The test here is against a large median instead of an absolute floor: real
terrain, even a Himalayan wall, cannot move 500 m inside a 150 m window.

    from repair_dem import repair
    dem, n = repair(dem)
"""
import numpy as np
from scipy import ndimage


def repair(dem, window=31, tol=500.0, floor=-100.0, verbose=True):
    """Return (repaired copy, number of pixels replaced)."""
    d = dem.astype(np.float32).copy()
    med = ndimage.median_filter(d, size=window, mode="nearest")
    bad = (d < floor) | (np.abs(d - med) > tol)
    n = int(bad.sum())
    if n:
        # iterative fill from the good neighbourhood, so a strip closes from
        # both sides rather than taking one side's value across the whole width
        d[bad] = np.nan
        for _ in range(12):
            holes = np.isnan(d)
            if not holes.any():
                break
            filled = np.nan_to_num(d, nan=0.0)
            weight = (~holes).astype(np.float32)
            k = np.ones((5, 5), np.float32)
            num = ndimage.convolve(filled, k, mode="nearest")
            den = ndimage.convolve(weight, k, mode="nearest")
            avg = num / np.maximum(den, 1e-6)
            d = np.where(holes & (den > 0), avg, d)
        d = np.where(np.isnan(d), float(np.nanmedian(dem[dem >= floor])), d)
    if verbose:
        print("DEM repair: %s of %s pixels (%.4f%%) replaced  [window %d, tol %.0f m]"
              % (f"{n:,}", f"{dem.size:,}", 100 * n / dem.size, window, tol))
        if n:
            ys, xs = np.where(bad)
            print("            rows %d..%d   cols %d..%d" % (ys.min(), ys.max(), xs.min(), xs.max()))
    return d, n
