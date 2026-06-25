#!/usr/bin/env python3
"""
turntable_render.py — 9/10 Dyson-grade path-traced turntable for a molecule (CID).

Usage:
    blender -b -P turntable_render.py -- <CID> <OUT_DIR>

Env overrides:
    SPP     (default 2048)   samples per pixel
    LOW     (default 0)      if set, overrides SPP (use 256 for fast dev)
    FRAMES  (default 72)     turntable frame count (full 360)
    RES     (default 1600)   square render resolution

Pipeline: Cycles / OptiX / OpenImageDenoise / caustics / AgX / 4-light cinematic rig /
real PubChem 3D ball-and-stick with glossy dielectric CPK atoms / SUBTLE red Principled-Volume
charge aura hugging the specimen / object-centered turntable.

Specimen plug-in pattern: build_specimen(cid) -> (root, center, radius). Swap for other
specimen types later.
"""

import bpy
import os
import sys
import math
import urllib.request
import tempfile
from mathutils import Vector

# ============================================================
# CONFIG / ENV
# ============================================================
def env_int(name, default):
    v = os.environ.get(name)
    try:
        return int(v) if v is not None else default
    except ValueError:
        return default

SPP    = env_int('SPP', 2048)
LOW    = env_int('LOW', 0)
FRAMES = env_int('FRAMES', 72)
RES    = env_int('RES', 1600)
EFFECTIVE_SPP = LOW if LOW else SPP

# ============================================================
# CPK TABLES  (color, van-der-Waals radius in Å)
# ============================================================
CPK = {
    'H':  ((1.000, 1.000, 1.000), 0.31),
    'C':  ((0.180, 0.180, 0.180), 0.70),
    'N':  ((0.188, 0.310, 0.965), 0.66),
    'O':  ((1.000, 0.051, 0.051), 0.60),
    'F':  ((0.564, 0.929, 0.564), 0.50),
    'P':  ((1.000, 0.502, 0.000), 1.00),
    'S':  ((1.000, 0.784, 0.196), 1.04),
    'Cl': ((0.118, 0.620, 0.118), 1.00),
    'Br': ((0.650, 0.196, 0.196), 1.15),
    'I':  ((0.580, 0.000, 0.580), 1.33),
    'B':  ((1.000, 0.710, 0.710), 0.84),
    'Si': ((0.871, 0.471, 0.431), 1.11),
    'Na': ((0.671, 0.361, 0.949), 1.54),
    'K':  ((0.431, 0.180, 0.690), 2.03),
    'Mg': ((0.541, 1.000, 0.000), 1.36),
    'Ca': ((0.239, 1.000, 0.000), 1.74),
    'Fe': ((1.000, 0.647, 0.000), 1.32),
    'Zn': ((0.490, 0.502, 0.690), 1.22),
}
DEFAULT_CPK = ((0.78, 0.45, 0.85), 0.70)
BOND_COLOR  = (0.78, 0.80, 0.84)

# ============================================================
# SDF FETCH + PARSE
# ============================================================
def fetch_sdf(cid):
    url = (f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/"
           f"cid/{cid}/SDF?record_type=3d")
    tmp = os.path.join(tempfile.gettempdir(), f"mol_{cid}.sdf")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r, open(tmp, 'wb') as f:
        f.write(r.read())
    return tmp


def parse_sdf(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.read().splitlines()
    counts_idx = None
    for i, l in enumerate(lines):
        s = l.strip()
        if s.endswith('V2000') or s.endswith('V3000'):
            counts_idx = i
            break
    if counts_idx is None:
        raise RuntimeError("No V2000/V3000 counts line in SDF")
    if lines[counts_idx].strip().endswith('V3000'):
        return _parse_v3000(lines)
    return _parse_v2000(lines, counts_idx)

def _parse_v2000(lines, counts_idx):
    parts = lines[counts_idx].split()
    na, nb = int(parts[0]), int(parts[1])
    atoms, bonds = [], []
    for i in range(na):
        p = lines[counts_idx + 1 + i].split()
        atoms.append((p[3], float(p[0]), float(p[1]), float(p[2])))
    for i in range(nb):
        p = lines[counts_idx + 1 + na + i].split()
        bonds.append((int(p[0]), int(p[1]), int(p[2])))
    return atoms, bonds

def _parse_v3000(lines):
    atoms, bonds = [], []
    i = 0
    while i < len(lines):
        s = lines[i].strip()
        if s.startswith('BEGIN ATOM'):
            i += 1
            while not lines[i].strip().startswith('END ATOM'):
                p = lines[i].split()
                atoms.append((p[1], float(p[2]), float(p[3]), float(p[4])))
                i += 1
        elif s.startswith('BEGIN BOND'):
            i += 1
            while not lines[i].strip().startswith('END BOND'):
                p = lines[i].split()
                bonds.append((int(p[2]), int(p[3]), int(p[1])))
                i += 1
        i += 1
    return atoms, bonds

# ============================================================
# MATERIALS
# ============================================================
def _clear_nodes(mat):
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    return nt

def make_atom_material(name, color):
    mat = bpy.data.materials.new(name)
    nt = _clear_nodes(mat)
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Metallic'].default_value   = 0.0
    bsdf.inputs['Roughness'].default_value  = 0.08
    bsdf.inputs['IOR'].default_value        = 1.5
    if 'Specular IOR Level' in bsdf.inputs:
        bsdf.inputs['Specular IOR Level'].default_value = 1.0
    if 'Coat Weight' in bsdf.inputs:
        bsdf.inputs['Coat Weight'].default_value      = 1.0
        bsdf.inputs['Coat Roughness'].default_value   = 0.04
        bsdf.inputs['Coat IOR'].default_value         = 1.5
    if 'Subsurface Weight' in bsdf.inputs:
        bsdf.inputs['Subsurface Weight'].default_value = 0.08
        bsdf.inputs['Subsurface Radius'].default_value = (0.08, 0.08, 0.08)
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat

def make_bond_material():
    mat = bpy.data.materials.new("BondMat")
    nt = _clear_nodes(mat)
    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (*BOND_COLOR, 1.0)
    bsdf.inputs['Metallic'].default_value   = 0.55
    bsdf.inputs['Roughness'].default_value  = 0.18
    if 'Coat Weight' in bsdf.inputs:
        bsdf.inputs['Coat Weight'].default_value    = 0.6
        bsdf.inputs['Coat Roughness'].default_value = 0.1
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat

def make_aura_material():
    """SUBTLE red Principled Volume: very low density, faint red emission,
    noise-modulated, with a tight shell-hugging falloff so the molecule
    reads crisp in front while a gentle red haze rims it."""
    mat = bpy.data.materials.new("ChargeAura")
    nt = _clear_nodes(mat)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    vol = nt.nodes.new('ShaderNodeVolumePrincipled')

    # Volume scattering color: deep red, but very low density so it stays subtle.
    vol.inputs['Color'].default_value             = (0.45, 0.03, 0.03, 1.0)
    vol.inputs['Density'].default_value           = 0.0   # driven
    vol.inputs['Anisotropy'].default_value        = 0.0
    # Faint red emission — just enough to read as a charge glow, not a fireball.
    vol.inputs['Emission Color'].default_value    = (1.0, 0.10, 0.06, 1.0)
    vol.inputs['Emission Strength'].default_value = 0.10

    # noise for organic wisps (subtle modulation only)
    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value    = 3.5
    noise.inputs['Detail'].default_value   = 6.0
    noise.inputs['Roughness'].default_value = 0.55

    # spherical gradient: 0 at center, 1 at shell boundary
    grad = nt.nodes.new('ShaderNodeTexGradient')
    grad.gradient_type = 'SPHERICAL'

    # Falloff profile (rim-hugging haze, NOT a solid ball):
    #   - near-zero in the inner 55% (so atoms stay crisp)
    #   - gentle rise to a soft peak around 0.80
    #   - fast falloff to 0 by 0.95 (no hard shell edge, no bright cloud)
    cr = nt.nodes.new('ShaderNodeValToRGB')
    cr.color_ramp.interpolation = 'LINEAR'
    elems = cr.color_ramp.elements
    elems[0].position = 0.0
    elems[0].color = (0.0, 0.0, 0.0, 1.0)
    e1 = elems.new(0.55); e1.color = (0.0, 0.0, 0.0, 1.0)
    e2 = elems.new(0.80); e2.color = (1.0, 1.0, 1.0, 1.0)
    e3 = elems.new(0.95); e3.color = (0.0, 0.0, 0.0, 1.0)
    elems[-1].position = 1.0
    elems[-1].color = (0.0, 0.0, 0.0, 1.0)

    # multiply gradient falloff * noise (noise only modulates the existing
    # falloff envelope, so it never re-brightens the core)
    mix = nt.nodes.new('ShaderNodeMixRGB')
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Fac'].default_value = 1.0
    nt.links.new(grad.outputs['Color'], cr.inputs['Fac'])
    nt.links.new(cr.outputs['Color'], mix.inputs['Color1'])
    nt.links.new(noise.outputs['Fac'], mix.inputs['Color2'])

    # scale to base density — ~30x lower than before (was 0.55, now 0.018)
    mul = nt.nodes.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = 0.018
    nt.links.new(mix.outputs['Color'], mul.inputs[0])
    nt.links.new(mul.outputs[0], vol.inputs['Density'])

    nt.links.new(vol.outputs['Volume'], out.inputs['Volume'])
    return mat

# ============================================================
# SCENE BUILD
# ============================================================
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene

def build_molecule(cid):
    """Specimen plug-in: molecule from PubChem CID.
    Returns (root_empty, center_vec, radius) — root is what we rotate."""
    sdf_path = fetch_sdf(cid)
    atoms, bonds = parse_sdf(sdf_path)
    if not atoms:
        raise RuntimeError(f"No atoms parsed for CID {cid}")

    # centroid
    cx = sum(a[1] for a in atoms) / len(atoms)
    cy = sum(a[2] for a in atoms) / len(atoms)
    cz = sum(a[3] for a in atoms) / len(atoms)

    # root empty (turntable pivot)
    root = bpy.data.objects.new("Molecule", None)
    bpy.context.scene.collection.objects.link(root)
    root.empty_display_size = 0.3
    root.empty_display_type = 'PLAIN_AXES'

    atom_mats = {}
    bond_mat  = make_bond_material()
    BOND_R = 0.085

    # atoms
    for i, (sym, x, y, z) in enumerate(atoms):
        col, r = CPK.get(sym, DEFAULT_CPK)
        if sym not in atom_mats:
            atom_mats[sym] = make_atom_material(f"Atom_{sym}", col)
        bpy.ops.mesh.primitive_uv_sphere_add(
            radius=r * 0.5, segments=48, ring_count=24,
            location=(x - cx, y - cy, z - cz))
        a = bpy.context.active_object
        a.name = f"Atom_{i:03d}_{sym}"
        a.data.materials.append(atom_mats[sym])
        bpy.ops.object.shade_smooth()
        a.parent = root

    # bonds
    for j, (a1, a2, btype) in enumerate(bonds):
        if a1 < 1 or a2 < 1 or a1 > len(atoms) or a2 > len(atoms):
            continue
        p1 = Vector((atoms[a1 - 1][1] - cx, atoms[a1 - 1][2] - cy, atoms[a1 - 1][3] - cz))
        p2 = Vector((atoms[a2 - 1][1] - cx, atoms[a2 - 1][2] - cy, atoms[a2 - 1][3] - cz))
        mid = (p1 + p2) * 0.5
        d   = p2 - p1
        length = d.length
        if length < 1e-6:
            continue
        bpy.ops.mesh.primitive_cylinder_add(
            radius=BOND_R, depth=length, vertices=24, location=mid)
        b = bpy.context.active_object
        b.name = f"Bond_{j:03d}"
        b.data.materials.append(bond_mat)
        b.rotation_mode = 'QUATERNION'
        b.rotation_quaternion = d.to_track_quat('Z', 'Y')
        bpy.ops.object.shade_smooth()
        b.parent = root

    # bounding radius (in Å, centered)
    max_r = 0.0
    for (sym, x, y, z) in atoms:
        r = CPK.get(sym, DEFAULT_CPK)[1] * 0.5
        v = Vector((x - cx, y - cy, z - cz))
        max_r = max(max_r, v.length + r)
    max_r += 0.35  # padding

    # normalize molecule to a comfortable scene size
    SCALE = 3.0 / max(0.6, max_r)
    root.scale = (SCALE, SCALE, SCALE)

    return root, Vector((0.0, 0.0, 0.0)), max_r * SCALE

def setup_world():
    w = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputWorld')
    bg  = nt.nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value   = (0.0, 0.0, 0.0, 1.0)
    bg.inputs['Strength'].default_value = 0.02
    nt.links.new(bg.outputs['Background'], out.inputs['Surface'])

def setup_lights(center, radius):
    """Dyson cinematic studio: warm soft key, strong cool rim, low fill, subtle bounce."""
    def add_area(name, color, energy, size, loc, rot_deg):
        L = bpy.data.lights.new(name, type='AREA')
        L.color = color
        L.energy = energy
        L.size = size
        o = bpy.data.objects.new(name, L)
        bpy.context.scene.collection.objects.link(o)
        o.location = center + Vector(loc)
        o.rotation_euler = tuple(math.radians(a) for a in rot_deg)
        return o

    # Key — warm, large, soft, front-top-left
    add_area("Key", (1.0, 0.95, 0.88),
             radius * radius * 1400, radius * 4.0,
             (radius * 2.5, -radius * 3.5, radius * 3.0),
             (55, 15, 35))

    # Rim — strong cool, back-right
    add_area("Rim", (0.55, 0.72, 1.0),
             radius * radius * 2600, radius * 3.0,
             (-radius * 2.0, radius * 3.0, radius * 2.2),
             (70, -10, -150))

    # Fill — low, cool, opposite key
    add_area("Fill", (0.85, 0.90, 1.0),
             radius * radius * 280, radius * 5.0,
             (-radius * 3.0, -radius * 2.0, radius * 0.5),
             (80, 0, 150))

    # Bounce — subtle, from below
    add_area("Bounce", (0.7, 0.75, 0.85),
             radius * radius * 140, radius * 4.0,
             (0, 0, -radius * 2.5),
             (180, 0, 0))

def setup_camera(center, radius):
    cam_data = bpy.data.cameras.new("TurnCam")
    cam_data.lens = 80
    cam_data.sensor_width = 36
    cam_data.sensor_height = 36
    cam_data.dof.use_dof = True
    dist = radius * 4.6
    cam_data.dof.focus_distance = dist
    cam_data.dof.aperture_fstop = 4.0
    cam = bpy.data.objects.new("TurnCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = center + Vector((0, -dist, radius * 0.30))
    direction = center - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = cam
    return cam

def setup_aura(center, radius, root):
    """Red charge aura: tight icosphere shell with subtle Principled Volume.
    Shell hugs the molecule closely; density is concentrated in a thin rim
    band near the shell boundary so the molecule stays crisp in front."""
    shell_r = radius * 1.06  # tighter than before (was 1.18)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5, radius=shell_r, location=center)
    shell = bpy.context.active_object
    shell.name = "AuraShell"
    shell.data.materials.append(make_aura_material())
    # parent to root so the haze rotates with the specimen
    shell.parent = root
    # keep shell at world center (parent inverse)
    shell.matrix_parent_inverse = root.matrix_world.inverted()
    return shell

def setup_render(scn):
    scn.render.engine = 'CYCLES'

    # OptiX
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = (d.type == 'OPTIX')
    scn.cycles.device = 'GPU'

    # sampling
    scn.cycles.samples = EFFECTIVE_SPP
    scn.cycles.use_denoising = True
    scn.cycles.denoiser = 'OPENIMAGEDENOISE'
    scn.cycles.use_adaptive_sampling = True
    scn.cycles.adaptive_threshold = 0.01
    scn.cycles.adaptive_min_samples = max(16, EFFECTIVE_SPP // 16)

    # caustics (Dyson look needs refractive + reflective)
    scn.cycles.use_caustics = True

    # bounces
    scn.cycles.max_bounces = 14
    scn.cycles.diffuse_bounces = 6
    scn.cycles.glossy_bounces = 6
    scn.cycles.transmission_bounces = 8
    scn.cycles.volume_bounces = 6
    scn.cycles.transparency_bounces = 8
    scn.cycles.blur_glossy = 0.1

    # film / tone mapping — AgX premium dark
    scn.view_settings.view_transform = 'AgX'
    scn.view_settings.look = 'AgX - High Contrast'
    scn.view_settings.exposure = 0.25
    scn.view_settings.gamma = 1.0
    scn.view_settings.use_curve_mapping = False

    # output
    scn.render.resolution_x = RES
    scn.render.resolution_y = RES
    scn.render.resolution_percentage = 100
    scn.render.film_transparent = False
    scn.render.image_settings.file_format = 'PNG'
    scn.render.image_settings.color_mode = 'RGBA'
    scn.render.image_settings.color_depth = '16'
    scn.render.image_settings.compression = 15
    scn.render.use_sequencer = False
    scn.render.use_compositing = False

    # pixel filter
    scn.render.filter_size = 1.5

# ============================================================
# MAIN
# ============================================================
def main():
    argv = sys.argv
    rest = argv[argv.index('--') + 1:] if '--' in argv else []
    if len(rest) < 2:
        print("Usage: blender -b -P turntable_render.py -- <CID> <OUT_DIR>")
        sys.exit(1)
    cid     = rest[0]
    out_dir = os.path.abspath(rest[1])
    os.makedirs(out_dir, exist_ok=True)

    print(f"[turntable] CID={cid} OUT={out_dir} "
          f"SPP={EFFECTIVE_SPP} FRAMES={FRAMES} RES={RES}")

    scn = reset_scene()
    root, center, radius = build_molecule(cid)
    setup_world()
    setup_lights(center, radius)
    setup_aura(center, radius, root)
    setup_camera(center, radius)
    setup_render(scn)

    # turntable — rotate the specimen, camera + lights fixed
    for i in range(FRAMES):
        ang = 2.0 * math.pi * i / FRAMES
        root.rotation_euler = (0.0, 0.0, ang)
        bpy.context.view_layer.update()
        out_path = os.path.join(out_dir, f"frame_{i:03d}.png")
        scn.render.filepath = out_path
        print(f"[turntable] frame {i + 1}/{FRAMES} "
              f"angle={math.degrees(ang):.1f}° -> {out_path}")
        bpy.ops.render.render(write_still=True)

    print(f"[turntable] DONE — {FRAMES} frames in {out_dir}")

if __name__ == "__main__":
    main()
