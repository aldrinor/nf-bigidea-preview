# -*- coding: utf-8 -*-
"""Hillshade the real DEM so we can visually confirm it is the right mountain."""
import numpy as np
from PIL import Image, ImageDraw
import math

dem = np.load("banff_dem.npy").astype(np.float64)
H, W = dem.shape
Wl, El, Sl, Nl = -116.36, -116.14, 51.34, 51.46

# metres per pixel (x uses cos(lat))
lat_mid = (Sl + Nl) / 2
mpp_y = (Nl - Sl) * 111320.0 / H
mpp_x = (El - Wl) * 111320.0 * math.cos(math.radians(lat_mid)) / W
print(f"resolution: {mpp_x:.1f} m/px east-west, {mpp_y:.1f} m/px north-south")

gy, gx = np.gradient(dem, mpp_y, mpp_x)
slope = np.arctan(np.hypot(gx, gy))
aspect = np.arctan2(-gx, gy)
az, alt = math.radians(315.0), math.radians(45.0)          # classic NW light
shade = (np.sin(alt)*np.cos(slope) + np.cos(alt)*np.sin(slope)*np.cos(az - aspect))
shade = np.clip(shade, 0, 1)

# tint by elevation so snowline reads
e = (dem - dem.min()) / (dem.max() - dem.min())
rgb = np.zeros((H, W, 3), dtype=np.float64)
rgb[..., 0] = 0.42 + 0.58*e
rgb[..., 1] = 0.47 + 0.53*e
rgb[..., 2] = 0.52 + 0.48*e
img = (rgb * (0.30 + 0.70*shade[..., None]) * 255).clip(0, 255).astype(np.uint8)
im = Image.fromarray(img)

def px(lat, lon):
    return (int((lon - Wl)/(El - Wl)*W), int((Nl - lat)/(Nl - Sl)*H))

d = ImageDraw.Draw(im)
for lat, lon, name in [(51.3833,-116.2833,"Mount Victoria 3464m"),
                       (51.4175,-116.2181,"Lake Louise"),
                       (51.3667,-116.3167,"Mount Lefroy 3423m")]:
    x, y = px(lat, lon)
    d.ellipse([x-9,y-9,x+9,y+9], outline=(255,60,60), width=4)
    d.text((x+14, y-8), name, fill=(255,255,255))
    print(f"  {name:24} -> pixel ({x},{y})  elevation there: {dem[min(max(y,0),H-1), min(max(x,0),W-1)]:.0f} m")

im.resize((W//2, H//2), Image.LANCZOS).save("hillshade_check.png")
print("saved hillshade_check.png")
