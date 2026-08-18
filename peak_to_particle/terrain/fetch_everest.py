# -*- coding: utf-8 -*-
"""Everest: real elevation (AWS Terrain Tiles, terrarium) + real satellite imagery
(Esri World Imagery). Both are plain XYZ tile schemes, no API key.

The imagery is the half the Banff build never had, and it is the reason a render
reads as photogrammetry rather than as a shaded mesh.

    python fetch_everest.py dem
    python fetch_everest.py img
    python fetch_everest.py probe      # one tile of each, to check the endpoints
"""
import io
import math
import os
import sys
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import requests
from PIL import Image

# Everest 27.9881 86.9250 | Lhotse 27.9617 86.9330 | Nuptse 27.9678 86.8969
# Changtse 28.0189 86.9111 | Khumbu icefall runs SW off the Western Cwm
# The sharp tile was 11.8 x 8.9 km, and from the pivot the camera leaves it at
# 3.9 km on the worst bearing -- so ANY distant framing puts the 73 m/vertex
# surround in the foreground, which rendered as a blank white cone. Isolating
# the meshes proved it, twice: the cheap terrain keeps ending up in front.
# 21 x 16 km covers every camera position the orbit can reach.
W, E, S, N = 86.815, 87.025, 27.920, 28.065

Z_DEM = 15          # ~4.2 m/px at this latitude
Z_IMG = 16          # ~2.1 m/px

DEM_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
IMG_URL = ("https://server.arcgisonline.com/ArcGIS/rest/services/"
           "World_Imagery/MapServer/tile/{z}/{y}/{x}")

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
os.makedirs(OUT, exist_ok=True)


def lon2x(lon, z):
    return int((lon + 180.0) / 360.0 * (1 << z))


def lat2y(lat, z):
    r = math.radians(lat)
    return int((1.0 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2.0 * (1 << z))


def tile_range(z):
    x0, x1 = lon2x(W, z), lon2x(E, z)
    y0, y1 = lat2y(N, z), lat2y(S, z)          # y grows southward
    return x0, x1, y0, y1


sess = requests.Session()
sess.headers.update({"User-Agent": "nanoflashing-terrain/1.0"})


def get(url, tries=4):
    for _ in range(tries):
        try:
            r = sess.get(url, timeout=45)
            if r.status_code == 200 and r.content:
                return Image.open(io.BytesIO(r.content))
        except Exception:
            pass
    return None


def mosaic(z, url_tmpl, mode, label):
    x0, x1, y0, y1 = tile_range(z)
    nx, ny = x1 - x0 + 1, y1 - y0 + 1
    print("%s  zoom %d : x %d..%d  y %d..%d  = %d x %d = %d tiles"
          % (label, z, x0, x1, y0, y1, nx, ny, nx * ny))
    canvas = Image.new(mode, (nx * 256, ny * 256))
    ok = 0

    def job(args):
        x, y = args
        return x, y, get(url_tmpl.format(z=z, x=x, y=y))

    jobs = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
    with ThreadPoolExecutor(max_workers=12) as ex:
        for i, (x, y, im) in enumerate(ex.map(job, jobs)):
            if im is None:
                print("   MISSING tile", x, y)
                continue
            canvas.paste(im.convert(mode), ((x - x0) * 256, (y - y0) * 256))
            ok += 1
            if (i + 1) % 40 == 0:
                print("   %d/%d" % (i + 1, len(jobs)))
    print("   %d/%d tiles fetched" % (ok, len(jobs)))
    return canvas, (x0, x1, y0, y1)


def terrarium_to_metres(rgb):
    a = np.asarray(rgb, dtype=np.float64)
    return (a[..., 0] * 256.0 + a[..., 1] + a[..., 2] / 256.0) - 32768.0


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "probe"

    if cmd == "probe":
        for z, tmpl, name in [(Z_DEM, DEM_URL, "terrarium DEM"),
                              (Z_IMG, IMG_URL, "Esri World Imagery")]:
            x0, x1, y0, y1 = tile_range(z)
            xm, ym = (x0 + x1) // 2, (y0 + y1) // 2
            im = get(tmpl.format(z=z, x=xm, y=ym))
            if im is None:
                print("FAIL  %-20s  z%d x%d y%d" % (name, z, xm, ym))
            else:
                extra = ""
                if "terrarium" in name:
                    m = terrarium_to_metres(im.convert("RGB"))
                    extra = "  elevation %.0f..%.0f m" % (m.min(), m.max())
                print("OK    %-20s  z%d x%d y%d  %s %s%s"
                      % (name, z, xm, ym, im.size, im.mode, extra))
            print("      tiles needed: %d" % ((x1 - x0 + 1) * (y1 - y0 + 1)))

    elif cmd == "dem":
        canvas, _ = mosaic(Z_DEM, DEM_URL, "RGB", "DEM")
        m = terrarium_to_metres(canvas).astype(np.float32)
        np.save(os.path.join(OUT, "everest_dem.npy"), m)
        print("elevation range: %.0f .. %.0f m" % (m.min(), m.max()))
        print("saved", os.path.join(OUT, "everest_dem.npy"), m.shape)

    elif cmd == "img":
        canvas, _ = mosaic(Z_IMG, IMG_URL, "RGB", "IMAGERY")
        p = os.path.join(OUT, "everest_albedo.png")
        canvas.save(p)
        print("saved", p, canvas.size)
