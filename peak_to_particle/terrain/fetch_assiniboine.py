# -*- coding: utf-8 -*-
"""Fetch real elevation for Mount Victoria / Lake Louise, Banff, from the public
AWS Terrain Tiles (terrarium PNG). No API key. Decode to a metre heightmap."""
import math, io, os, sys
import numpy as np, requests
from PIL import Image
from concurrent.futures import ThreadPoolExecutor

Z = 14
# bbox covering Mount Assiniboine (50.8683,-115.6506), 3618 m - the horn of the Rockies
W, E, S, N = -115.72, -115.58, 50.82, 50.92

def lon2x(lon, z): return int((lon + 180.0) / 360.0 * (1 << z))
def lat2y(lat, z):
    r = math.radians(lat)
    return int((1.0 - math.log(math.tan(r) + 1/math.cos(r)) / math.pi) / 2.0 * (1 << z))

x0, x1 = lon2x(W, Z), lon2x(E, Z)
y0, y1 = lat2y(N, Z), lat2y(S, Z)          # y grows southward
nx, ny = x1 - x0 + 1, y1 - y0 + 1
print(f"zoom {Z}: tiles x {x0}..{x1} y {y0}..{y1}  = {nx} x {ny} = {nx*ny} tiles")

URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
sess = requests.Session()
sess.headers.update({"User-Agent": "nanoflashing-terrain/1.0"})

def get(args):
    x, y = args
    for attempt in range(4):
        try:
            r = sess.get(URL.format(z=Z, x=x, y=y), timeout=45)
            if r.status_code == 200:
                return (x, y, np.asarray(Image.open(io.BytesIO(r.content)).convert("RGB"), dtype=np.float64))
        except Exception:
            pass
    return (x, y, None)

jobs = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
out = np.zeros((ny * 256, nx * 256), dtype=np.float32)
ok = 0
with ThreadPoolExecutor(max_workers=12) as ex:
    for x, y, arr in ex.map(get, jobs):
        if arr is None:
            print(f"  MISSING tile {x},{y}"); continue
        # terrarium: elevation(m) = (R*256 + G + B/256) - 32768
        elev = (arr[:, :, 0] * 256.0 + arr[:, :, 1] + arr[:, :, 2] / 256.0) - 32768.0
        r0, c0 = (y - y0) * 256, (x - x0) * 256
        out[r0:r0+256, c0:c0+256] = elev.astype(np.float32)
        ok += 1

print(f"tiles ok: {ok}/{len(jobs)}   heightmap: {out.shape}")
np.save("assiniboine_dem.npy", out)
with open("assiniboine_meta.txt", "w") as f:
    f.write(f"Z={Z}\nbbox_WESN={W},{E},{S},{N}\ntiles={nx}x{ny}\nshape={out.shape}\n")
v = out[np.isfinite(out)]
print(f"elevation  min {v.min():.0f} m   max {v.max():.0f} m   mean {v.mean():.0f} m")
print("REALITY CHECK -> Mount Assiniboine summit is 3618 m")
