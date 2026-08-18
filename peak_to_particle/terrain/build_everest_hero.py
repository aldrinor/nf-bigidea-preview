# -*- coding: utf-8 -*-
"""Everest hero asset. Crops out the Esri mosaic seams, puts a real tone curve on
the satellite imagery, and exports a web-weight mesh.

    python build_everest_hero.py
"""
import math
import os

import numpy as np
import trimesh
from PIL import Image
from scipy import ndimage

Image.MAX_IMAGE_PIXELS = None
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")

# full fetched frame
W0, E0, S0, N0 = 86.85, 87.00, 27.93, 28.05
# hero crop: drops the bright band along the north edge and the snow-free
# summer strip along the south edge, both Esri acquisition seams
W1, E1, S1, N1 = 86.865, 86.985, 27.955, 28.035

GX, GY = 641, 449          # web weight; the normal map carries the fine detail
TEX = 2048

# ---------------------------------------------------------------- crop helper
def crop_box(w, h, lon0, lon1, lat0, lat1):
    """pixel box for the hero frame inside the full fetched frame"""
    cl = int(round((W1 - lon0) / (lon1 - lon0) * w))
    cr = int(round((E1 - lon0) / (lon1 - lon0) * w))
    rt = int(round((lat1 - N1) / (lat1 - lat0) * h))
    rb = int(round((lat1 - S1) / (lat1 - lat0) * h))
    return cl, rt, cr, rb


# ---------------------------------------------------------------- 1. DEM
dem = np.load(os.path.join(OUT, "everest_dem.npy")).astype(np.float32)
void = dem < -100
if void.any():
    fill = ndimage.median_filter(dem, size=9)
    dem[void] = fill[void]
    dem[dem < -100] = np.median(dem[dem >= -100])

h, w = dem.shape
cl, rt, cr, rb = crop_box(w, h, W0, E0, S0, N0)
dem = dem[rt:rb, cl:cr]
H, Wpx = dem.shape
print("DEM cropped to %dx%d   %.0f .. %.0f m" % (Wpx, H, dem.min(), dem.max()))

# ---- feather the tile edge onto the wide Khumbu sheet ----------------------
# Without this the tile is a slab floating above the low-res terrain and its cut
# side reads as a cliff from any angle that looks past it.
KH = os.path.join(OUT, "khumbu_dem.npy")
if os.path.exists(KH):
    WW, WE, WS, WN = 86.35, 87.55, 27.45, 28.50
    SINK = 130.0
    wide = np.load(KH).astype(np.float32)
    wh, ww = wide.shape
    # sample the wide sheet across exactly the hero footprint
    cy = np.linspace((WN - N1) / (WN - WS) * (wh - 1),
                     (WN - S1) / (WN - WS) * (wh - 1), dem.shape[0])
    cx = np.linspace((W1 - WW) / (WE - WW) * (ww - 1),
                     (E1 - WW) / (WE - WW) * (ww - 1), dem.shape[1])
    base = ndimage.map_coordinates(
        wide, np.meshgrid(cy, cx, indexing="ij"), order=1).astype(np.float32) - SINK

    # weight: 1 in the middle, 0 at the rim, over the outer 9%
    m = 0.09
    ry = np.clip(np.minimum(np.linspace(0, 1, dem.shape[0]),
                            1 - np.linspace(0, 1, dem.shape[0])) / m, 0, 1)
    rx = np.clip(np.minimum(np.linspace(0, 1, dem.shape[1]),
                            1 - np.linspace(0, 1, dem.shape[1])) / m, 0, 1)
    w2 = np.minimum(ry[:, None], rx[None, :])
    w2 = w2 * w2 * (3 - 2 * w2)                      # smoothstep
    dem = dem * w2 + base * (1 - w2)
    print("edge feathered onto the wide sheet over the outer %.0f%%" % (m * 100))
else:
    print("khumbu_dem.npy not found -- tile edge NOT feathered")

lat_mid = (S1 + N1) / 2
span_x = (E1 - W1) * 111320.0 * math.cos(math.radians(lat_mid))
span_y = (N1 - S1) * 111320.0
print("ground: %.1f km x %.1f km" % (span_x / 1000, span_y / 1000))

# find the summit in the cropped frame, for the camera target
iy, ix = np.unravel_index(np.argmax(dem), dem.shape)
sx = span_x * (ix / Wpx - 0.5)
sz = -(span_y * (0.5 - iy / H))
print("summit at mesh (%.0f, %.0f, %.0f)" % (sx, dem[iy, ix], sz))

# ---------------------------------------------------------------- 2. mesh
g = ndimage.zoom(dem, (GY / H, GX / Wpx), order=1).astype(np.float32)
gh, gw = g.shape
xs = np.linspace(-span_x / 2, span_x / 2, gw, dtype=np.float32)
ys = np.linspace(span_y / 2, -span_y / 2, gh, dtype=np.float32)
X, Y = np.meshgrid(xs, ys)
verts = np.stack([X.ravel(), g.ravel(), -Y.ravel()], axis=1)

idx = np.arange(gh * gw).reshape(gh, gw)
a = idx[:-1, :-1].ravel(); b = idx[:-1, 1:].ravel()
c = idx[1:, 1:].ravel();   d = idx[1:, :-1].ravel()
faces = np.concatenate([np.stack([a, c, b], 1), np.stack([a, d, c], 1)], 0)
u = np.tile(np.linspace(0, 1, gw), gh).astype(np.float32)
v = np.repeat(np.linspace(1, 0, gh), gw).astype(np.float32)
uv = np.stack([u, v], 1)
print("mesh: %s verts  %s tris" % (f"{len(verts):,}", f"{len(faces):,}"))

# ---------------------------------------------------------------- 3. albedo
alb = Image.open(os.path.join(OUT, "everest_albedo.png")).convert("RGB")
aw, ah = alb.size
cl2, rt2, cr2, rb2 = crop_box(aw, ah, W0, E0, S0, N0)
alb = alb.crop((cl2, rt2, cr2, rb2)).resize((TEX, TEX), Image.LANCZOS)
A = np.asarray(alb, dtype=np.float32) / 255.0

# Esri delivers this scene flat and clipped. Pull the whites back off the ceiling,
# open the midtones so the rock bands read, and let the snow shadows go cool.
lo, hi = np.percentile(A, 1.0), np.percentile(A, 99.5)
A = ((A - lo) / max(hi - lo, 1e-6)).clip(0, 1)
A = np.power(A, 1.18)                                   # deepen midtones
lum = A @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
A += (A - lum[..., None]) * 0.35                        # saturation, gently
shadow = (1.0 - lum)[..., None]
A += shadow * np.array([-0.020, 0.000, 0.055], np.float32) * 0.9   # cool the shade
A = A.clip(0, 1)
alb = Image.fromarray((A * 255).astype(np.uint8))
p_alb = os.path.join(OUT, "everest_hero_albedo.webp")
alb.save(p_alb, quality=88, method=6)
print("albedo -> %s  %.2f MB" % (os.path.basename(p_alb),
                                 os.path.getsize(p_alb) / 1048576))

mat = trimesh.visual.material.PBRMaterial(
    baseColorTexture=alb, metallicFactor=0.0, roughnessFactor=0.96,
    name="everest_satellite")
mesh = trimesh.Trimesh(vertices=verts, faces=faces, process=False)
# smooth vertex normals, or the GLB ships without a NORMAL attribute and every
# renderer falls back to flat per-face shading -- which reads as low-poly
mesh.vertex_normals  # force computation
print("vertex normals:", mesh.vertex_normals.shape)
mesh.visual = trimesh.visual.TextureVisuals(uv=uv, material=mat)
p_glb = os.path.join(OUT, "everest_hero.glb")
mesh.export(p_glb)
print("mesh   -> %s  %.2f MB" % (os.path.basename(p_glb),
                                 os.path.getsize(p_glb) / 1048576))

# ---------------------------------------------------------------- 4. normals
mpp_x, mpp_y = span_x / Wpx, span_y / H
gy_, gx_ = np.gradient(dem.astype(np.float64), mpp_y, mpp_x)
nx, ny, nz = -gx_, np.ones_like(gx_), gy_
ln = np.sqrt(nx * nx + ny * ny + nz * nz)
nmap = np.stack([nx / ln, nz / ln, ny / ln], -1)
nmap = ((nmap * 0.5 + 0.5) * 255).clip(0, 255).astype(np.uint8)
p_nrm = os.path.join(OUT, "everest_hero_normal.webp")
Image.fromarray(nmap).resize((TEX, TEX), Image.LANCZOS).save(p_nrm, quality=88, method=6)
print("normal -> %s  %.2f MB" % (os.path.basename(p_nrm),
                                 os.path.getsize(p_nrm) / 1048576))

with open(os.path.join(OUT, "everest_hero.json"), "w") as f:
    f.write('{"summit":[%.1f,%.1f,%.1f],"span":[%.1f,%.1f],"maxAlt":%.1f}'
            % (sx, float(dem[iy, ix]), sz, span_x, span_y, float(dem.max())))
print("done")
