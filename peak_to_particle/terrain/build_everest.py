# -*- coding: utf-8 -*-
"""Everest DEM + real satellite imagery -> web-ready photogrammetric terrain.

The difference from the Banff build: the satellite imagery is baked onto the mesh
as the base colour. That is what makes a render read as photogrammetry rather than
as a shaded grey mesh.

    python build_everest.py
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

# same frame as fetch_everest.py
W, E, S, N = 86.85, 87.00, 27.93, 28.05
GX, GY = 801, 729          # ~18 m between vertices, both axes
TEX = 4096                 # albedo / normal output edge

lat_mid = (S + N) / 2
span_x = (E - W) * 111320.0 * math.cos(math.radians(lat_mid))
span_y = (N - S) * 111320.0
print("ground: %.1f km x %.1f km" % (span_x / 1000, span_y / 1000))

# ---- 1. DEM, voids filled -------------------------------------------------
dem_full = np.load(os.path.join(OUT, "everest_dem.npy")).astype(np.float32)
void = dem_full < -100
if void.any():
    print("filling %d void pixels (%.3f%%)" % (void.sum(), 100 * void.mean()))
    filled = ndimage.median_filter(dem_full, size=9)
    dem_full[void] = filled[void]
    still = dem_full < -100
    if still.any():
        dem_full[still] = np.median(dem_full[~still])
H, Wpx = dem_full.shape
print("DEM %dx%d   %.0f .. %.0f m" % (Wpx, H, dem_full.min(), dem_full.max()))

# ---- 2. mesh --------------------------------------------------------------
dem = ndimage.zoom(dem_full, (GY / H, GX / Wpx), order=1).astype(np.float32)
gh, gw = dem.shape
xs = np.linspace(-span_x / 2, span_x / 2, gw, dtype=np.float32)
ys = np.linspace(span_y / 2, -span_y / 2, gh, dtype=np.float32)
X, Y = np.meshgrid(xs, ys)
verts = np.stack([X.ravel(), dem.ravel(), -Y.ravel()], axis=1)   # Y up, Z south

idx = np.arange(gh * gw).reshape(gh, gw)
a = idx[:-1, :-1].ravel(); b = idx[:-1, 1:].ravel()
c = idx[1:, 1:].ravel();   d = idx[1:, :-1].ravel()
# winding reversed so faces point up and survive backface culling
faces = np.concatenate([np.stack([a, c, b], 1), np.stack([a, d, c], 1)], 0)
print("mesh: %s vertices  %s triangles" % (f"{len(verts):,}", f"{len(faces):,}"))

u = np.tile(np.linspace(0, 1, gw), gh).astype(np.float32)
v = np.repeat(np.linspace(1, 0, gh), gw).astype(np.float32)
uv = np.stack([u, v], 1)

# ---- 3. the real imagery, as base colour ---------------------------------
alb = Image.open(os.path.join(OUT, "everest_albedo.png")).convert("RGB")
print("albedo source", alb.size)
alb_sq = alb.resize((TEX, TEX), Image.LANCZOS)
alb_path = os.path.join(OUT, "everest_albedo_4k.webp")
alb_sq.save(alb_path, quality=92, method=6)
print("albedo -> %s  %.2f MB" % (os.path.basename(alb_path),
                                 os.path.getsize(alb_path) / 1048576))

mat = trimesh.visual.material.PBRMaterial(
    baseColorTexture=alb_sq,
    metallicFactor=0.0,
    roughnessFactor=0.95,
    name="everest_satellite",
)
mesh = trimesh.Trimesh(vertices=verts, faces=faces, process=False)
mesh.visual = trimesh.visual.TextureVisuals(uv=uv, material=mat)
glb = os.path.join(OUT, "everest_terrain.glb")
mesh.export(glb)
print("exported %s  %.2f MB" % (os.path.basename(glb), os.path.getsize(glb) / 1048576))

# ---- 4. normal map from the FULL-res DEM (keeps ridge detail) -------------
mpp_x, mpp_y = span_x / Wpx, span_y / H
gy, gx = np.gradient(dem_full.astype(np.float64), mpp_y, mpp_x)
nx, ny, nz = -gx, np.ones_like(gx), gy
ln = np.sqrt(nx * nx + ny * ny + nz * nz)
nmap = np.stack([nx / ln, nz / ln, ny / ln], -1)
nmap = ((nmap * 0.5 + 0.5) * 255).clip(0, 255).astype(np.uint8)
np_path = os.path.join(OUT, "everest_normal.webp")
Image.fromarray(nmap).resize((TEX, TEX), Image.LANCZOS).save(np_path, quality=92, method=6)
print("normal -> %s  %.2f MB" % (os.path.basename(np_path),
                                 os.path.getsize(np_path) / 1048576))

# ---- 5. a plain hillshade, to eyeball the geometry on its own -------------
az, alt = math.radians(315), math.radians(45)
slope = np.arctan(np.hypot(gx, gy))
aspect = np.arctan2(-gx, gy)
shade = (np.sin(alt) * np.cos(slope)
         + np.cos(alt) * np.sin(slope) * np.cos(az - aspect))
shade = (shade.clip(0, 1) * 255).astype(np.uint8)
Image.fromarray(shade).resize((1600, 1600), Image.LANCZOS).save(
    os.path.join(OUT, "_everest_hillshade.png"))
print("hillshade -> _everest_hillshade.png")
print("done")
