# -*- coding: utf-8 -*-
"""Real Banff DEM -> web-ready terrain mesh (GLB) + a normal map baked from the
FULL-resolution data, so fine ridges survive on a light mesh. This is the same
technique the reference uses: coarse geometry + high-frequency normal detail."""
import numpy as np, math, os
from scipy import ndimage
from PIL import Image
import trimesh

dem_full = np.load("banff_dem.npy").astype(np.float32)
H, W = dem_full.shape
Wl, El, Sl, Nl = -116.36, -116.14, 51.34, 51.46
lat_mid = (Sl + Nl)/2
span_x = (El - Wl) * 111320.0 * math.cos(math.radians(lat_mid))   # metres
span_y = (Nl - Sl) * 111320.0
print(f"real ground size: {span_x/1000:.1f} km x {span_y/1000:.1f} km")

# ---- 1. mesh grid (light) ----
GX, GY = 513, 513
zoom = (GY/H, GX/W)
dem = ndimage.zoom(dem_full, zoom, order=1).astype(np.float32)
gh, gw = dem.shape
xs = np.linspace(-span_x/2, span_x/2, gw, dtype=np.float32)
ys = np.linspace( span_y/2,-span_y/2, gh, dtype=np.float32)
X, Y = np.meshgrid(xs, ys)
verts = np.stack([X.ravel(), dem.ravel(), -Y.ravel()], axis=1)      # Y-up, Z south
idx = np.arange(gh*gw).reshape(gh, gw)
a = idx[:-1,:-1].ravel(); b = idx[:-1,1:].ravel()
c = idx[1:,1:].ravel();   d = idx[1:,:-1].ravel()
# winding reversed so surface normals point UP (front faces survive backface culling)
faces = np.concatenate([np.stack([a,c,b],1), np.stack([a,d,c],1)], 0)
print(f"mesh: {len(verts):,} vertices  {len(faces):,} triangles")

# UVs so the normal map lines up
u = (np.tile(np.linspace(0,1,gw), gh)).astype(np.float32)
v = (np.repeat(np.linspace(1,0,gh), gw)).astype(np.float32)
uv = np.stack([u,v],1)

mesh = trimesh.Trimesh(vertices=verts, faces=faces, process=False)
mesh.visual = trimesh.visual.TextureVisuals(uv=uv)
os.makedirs("out", exist_ok=True)
mesh.export("out/banff_terrain.glb")
print(f"exported out/banff_terrain.glb  ({os.path.getsize('out/banff_terrain.glb')/1048576:.2f} MB)")

# ---- 2. normal map from FULL-res DEM (keeps ridge detail) ----
mpp_x = span_x / W; mpp_y = span_y / H
gy, gx = np.gradient(dem_full.astype(np.float64), mpp_y, mpp_x)
nx, ny, nz = -gx, np.ones_like(gx), gy
ln = np.sqrt(nx*nx+ny*ny+nz*nz)
nmap = np.stack([nx/ln, nz/ln, ny/ln], -1)          # tangent-space-ish
nmap = ((nmap*0.5+0.5)*255).clip(0,255).astype(np.uint8)
Image.fromarray(nmap).resize((2048,2048), Image.LANCZOS).save("out/banff_normal.png", optimize=True)
print(f"exported out/banff_normal.png ({os.path.getsize('out/banff_normal.png')/1048576:.2f} MB)")

# ---- 3. height + snow/rock mask for the shader ----
hmin, hmax = float(dem_full.min()), float(dem_full.max())
hm = ((dem_full-hmin)/(hmax-hmin)*65535).astype(np.uint16)
Image.fromarray(hm).resize((2048,2048), Image.LANCZOS).save("out/banff_height.png")
print(f"exported out/banff_height.png  elevation range {hmin:.0f}-{hmax:.0f} m")
np.save("out/dem_small.npy", dem)
print("done")
