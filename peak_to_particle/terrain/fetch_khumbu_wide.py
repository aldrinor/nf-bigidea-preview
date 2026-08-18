# -*- coding: utf-8 -*-
"""A wide, low-resolution ring of real Himalaya around the Everest tile.

The high-res tile is 11.8 x 8.9 km and its cut sides are visible from any angle
that looks past them -- hiding them under cloud failed, because the cloud has
gaps. The fix is for there to be no edge: surround it with real terrain out to
the horizon, at a zoom level cheap enough to ship.

    python fetch_khumbu_wide.py
"""
import io
import math
import os
import sys
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import requests
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

# ~120 x 110 km of the Khumbu and Tibet, centred on Everest
W, E, S, N = 86.35, 87.55, 27.45, 28.50
Z = 11                        # ~68 m/px here -- plenty for distant relief

DEM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
IMG = ("https://server.arcgisonline.com/ArcGIS/rest/services/"
       "World_Imagery/MapServer/tile/{z}/{y}/{x}")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

sess = requests.Session()
sess.headers.update({"User-Agent": "nanoflashing-terrain/1.0"})


def lon2x(lon, z):
    return int((lon + 180.0) / 360.0 * (1 << z))


def lat2y(lat, z):
    r = math.radians(lat)
    return int((1.0 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2.0 * (1 << z))


def get(url):
    for _ in range(4):
        try:
            r = sess.get(url, timeout=45)
            if r.status_code == 200 and r.content:
                return Image.open(io.BytesIO(r.content)).convert("RGB")
        except Exception:
            pass
    return None


def mosaic(tmpl, z, label):
    x0, x1 = lon2x(W, z), lon2x(E, z)
    y0, y1 = lat2y(N, z), lat2y(S, z)
    nx, ny = x1 - x0 + 1, y1 - y0 + 1
    print("%s z%d  %d x %d = %d tiles" % (label, z, nx, ny, nx * ny))
    canvas = Image.new("RGB", (nx * 256, ny * 256))
    jobs = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
    ok = 0

    def job(a):
        x, y = a
        return x, y, get(tmpl.format(z=z, x=x, y=y))

    with ThreadPoolExecutor(max_workers=12) as ex:
        for x, y, im in ex.map(job, jobs):
            if im is None:
                continue
            canvas.paste(im, ((x - x0) * 256, (y - y0) * 256))
            ok += 1
    print("   %d/%d fetched" % (ok, len(jobs)))
    return canvas


if __name__ == "__main__":
    d = np.asarray(mosaic(DEM, Z, "DEM"), dtype=np.float64)
    m = (d[..., 0] * 256.0 + d[..., 1] + d[..., 2] / 256.0) - 32768.0
    m = m.astype(np.float32)
    bad = m < -100
    if bad.any():
        m[bad] = np.median(m[~bad])
    np.save(os.path.join(OUT, "khumbu_dem.npy"), m)
    print("elevation %.0f .. %.0f m   shape %s" % (m.min(), m.max(), m.shape))

    img = mosaic(IMG, Z, "IMAGERY")
    img.save(os.path.join(OUT, "khumbu_albedo.png"))
    print("saved khumbu_albedo.png", img.size)
