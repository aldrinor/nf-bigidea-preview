#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
spec_turntable.py — Blender 4.2 Cycles turntable for SEM-derived specimens.

Renders a 9/10 Dyson-grade 72-frame 360° turntable of a textured 3D specimen
built from a REAL SEM micrograph. Same quality bar as the molecule variant.

usage:
    blender -b -P spec_turntable.py -- <type> <SEM_image_path> <OUT_DIR>

types:
    pollen spore bacteria dust dander virus soot pm microplastic

env:
    SPP     samples per pixel   (default 256)
    FRAMES  override frame count (default 72)
    OUT     override output dir
"""

import bpy
import bmesh
import sys
import os
import math
import random
from mathutils import Vector

# -------------------------------------------------------------------- args
argv = sys.argv
if "--" in argv:
    argv = argv[argv.index("--") + 1:]
else:
    argv = []

if len(argv) < 3:
    print("usage: blender -b -P spec_turntable.py -- <type> <SEM_image_path> <OUT_DIR>")
    sys.exit(1)

SPEC_TYPE   = argv[0].lower()
SEM_PATH    = os.path.abspath(argv[1])
OUT_DIR     = os.path.abspath(argv[2] if len(argv) > 2 else os.environ.get("OUT", "."))
SPP         = int(os.environ.get("SPP", "256"))
FRAMES      = int(os.environ.get("FRAMES", "72"))

VALID = {"pollen","spore","bacteria","dust","dander","virus","soot","pm","microplastic"}
if SPEC_TYPE not in VALID:
    print(f"ERR: unknown specimen type '{SPEC_TYPE}'. valid: {sorted(VALID)}")
    sys.exit(1)
if not os.path.exists(SEM_PATH):
    print(f"ERR: SEM image not found: {SEM_PATH}")
    sys.exit(1)

os.makedirs(OUT_DIR, exist_ok=True)

random.seed(hash(SPEC_TYPE) & 0xffffffff)

# -------------------------------------------------------------------- scene reset
def wipe():
    for c in list(bpy.data.collections):
        for o in c.objects:
            bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.collections.remove(c)
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for b in list(bpy.data.meshes):    bpy.data.meshes.remove(b)
    for m in list(bpy.data.materials): bpy.data.materials.remove(m)
    for t in list(bpy.data.textures):  bpy.data.textures.remove(t)
    for i in list(bpy.data.images):    bpy.data.images.remove(i)
    for l in list(bpy.data.lights):    bpy.data.lights.remove(l)
    for w in list(bpy.data.worlds):    bpy.data.worlds.remove(w)
wipe()

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
scene.cycles.use_denoising = True
try:
    scene.cycles.denoiser = 'OPTIX'
except (TypeError, AttributeError):
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.02
scene.cycles.samples = SPP
scene.cycles.use_caustics = True
scene.cycles.transparent_max_bounces = 16
scene.cycles.volume_bounces = 4
scene.cycles.diffuse_bounces = 4
scene.cycles.glossy_bounces = 4
scene.cycles.transmission_bounces = 12
scene.cycles.ao_bounces = 2
scene.render.film_transparent = False
scene.render.resolution_x = 1280
scene.render.resolution_y = 1280
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'ACES_FILM'
scene.view_settings.look = 'Filmic - Base Contrast'
scene.view_settings.exposure = 0.0
scene.view_settings.gamma = 1.0

# color management: ACES, slightly punchy
scene.sequencer_colorspace_settings.name = 'AgX Base sRGB' if 'AgX Base sRGB' in [
    cs.name for cs in bpy.types.ColorManagementInputColorSpaceSettings.bl_rna.properties['name'].enum_items
] else scene.sequencer_colorspace_settings.name

# -------------------------------------------------------------------- SEM image
sem_img = bpy.data.images.load(SEM_PATH)
sem_img.colorspace_settings.name = 'Non-Color'
sem_img.pack()

# displacement-safe: convert to 16-bit grayscale via image settings if possible
try:
    sem_img.use_alpha = False
except Exception:
    pass

# -------------------------------------------------------------------- helpers
def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (600, 0)
    return m, nt, out

def add_image_texture(nt, image, name='SEM', noncolor=True):
    n = nt.nodes.new('ShaderNodeTexImage')
    n.image = image
    n.label = name
    if noncolor:
        n.image.colorspace_settings.name = 'Non-Color'
    return n

def add_displacement(nt, height_tex, mid=0.5, scale=0.05, normal=1.0):
    """Wire a height texture into displacement output with bump for normals."""
    out = nt.nodes['Material Output']
    # displacement
    disp = nt.nodes.new('ShaderNodeDisplacement')
    disp.inputs['Midlevel'].default_value = mid
    disp.inputs['Scale'].default_value = scale
    nt.links.new(height_tex.outputs['Color'], disp.inputs['Height'])
    nt.links.new(disp.outputs['Displacement'], out.inputs['Displacement'])
    # bump for normal
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = normal
    bump.inputs['Distance'].default_value = 0.02
    nt.links.new(height_tex.outputs['Color'], bump.inputs['Height'])
    return bump

def make_subsurf(obj, levels=3, render_levels=6):
    m = obj.modifiers.new('Subsurf', 'SUBSURF')
    m.levels = levels
    m.render_levels = render_levels
    return m

def make_displace_mod(obj, image, strength=0.05, mid=0.5):
    tex = bpy.data.textures.new('SEMDisp', 'IMAGE')
    tex.image = image
    m = obj.modifiers.new('Displace', 'DISPLACE')
    m.texture = tex
    m.strength = strength
    m.mid_level = mid
    return m

# -------------------------------------------------------------------- base meshes
def mesh_icosphere(subdiv=4, radius=1.0, name='Spec'):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdiv, radius=radius, location=(0,0,0))
    o = bpy.context.active_object
    o.name = name
    return o

def mesh_capsule(length=1.6, radius=0.5, segments=48, rings=24, name='Spec'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segments, radius=radius, depth=length, location=(0,0,0))
    o = bpy.context.active_object
    o.name = name
    # cap ends with hemispheres via bmesh
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(o.data)
    bmesh.ops.inset_individual(bm, faces=[f for f in bm.faces if abs(f.normal.z) > 0.9], thickness=radius*0.4)
    bmesh.update_edit_mesh(o.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    return o

def mesh_flake(name='Spec'):
    bpy.ops.mesh.primitive_cube_add(size=1.6, location=(0,0,0))
    o = bpy.context.active_object
    o.name = name
    o.scale = (1.4, 1.0, 0.18)
    bpy.ops.object.transform_apply(scale=True)
    return o

def mesh_shard(name='Spec'):
    bpy.ops.mesh.primitive_cube_add(size=1.2, location=(0,0,0))
    o = bpy.context.active_object
    o.name = name
    o.scale = (1.6, 0.5, 0.12)
    bpy.ops.object.transform_apply(scale=True)
    # jagged edges
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.subdivide(number_cuts=3)
    bpy.ops.object.mode_set(mode='OBJECT')
    for v in o.data.vertices:
        v.co.x += random.uniform(-0.05, 0.05)
        v.co.y += random.uniform(-0.03, 0.03)
        v.co.z += random.uniform(-0.02, 0.02)
    return o

def mesh_aggregate(count=14, radius=1.0, name='Spec', fractal=True):
    """Fractal cluster of small spheres — for soot/dust/pm."""
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0,0,0))
    parent = bpy.context.active_object
    parent.name = name
    parts = []
    # seed center
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=radius*0.35, location=(0,0,0))
    parts.append(bpy.context.active_object)
    for i in range(count-1):
        # random walk placement
        d = Vector((random.uniform(-1,1), random.uniform(-1,1), random.uniform(-1,1))).normalized()
        dist = radius * (0.35 + random.uniform(0.15, 0.55))
        loc = d * dist
        r = radius * random.uniform(0.12, 0.28)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=r, location=loc)
        p = bpy.context.active_object
        if fractal:
            # jitter vertices
            for v in p.data.vertices:
                v.co += Vector((random.uniform(-1,1), random.uniform(-1,1), random.uniform(-1,1))) * r * 0.08
        parts.append(p)
    # join
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    bpy.data.objects.remove(parent)
    return obj

# -------------------------------------------------------------------- specimen build
def build_specimen():
    t = SPEC_TYPE
    if t == 'pollen':
        obj = mesh_icosphere(subdiv=5, radius=1.0, name='Pollen')
        # echinate spikes via displacement (strong)
        make_subsurf(obj, 2, 4)
        mat, nt, out = new_mat('M_Pollen')
        img = add_image_texture(nt, sem_img, 'SEM')
        # Principled with gold metallic + slight subsurface
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.83, 0.62, 0.20, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.85
        bsdf.inputs['Roughness'].default_value = 0.32
        bsdf.inputs['Specular IOR Level'].default_value = 0.6
        if 'Subsurface Weight' in bsdf.inputs:
            bsdf.inputs['Subsurface Weight'].default_value = 0.15
            bsdf.inputs['Subsurface Radius'].default_value = (0.4, 0.25, 0.1)
        bump = add_displacement(nt, img, mid=0.5, scale=0.18, normal=1.0)
        nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        obj.data.materials.append(mat)
        make_displace_mod(obj, sem_img, strength=0.22, mid=0.5)
        obj.data.materials[0].cyclic = False if hasattr(obj.data.materials[0],'cyclic') else None

    elif t == 'spore':
        obj = mesh_icosphere(subdiv=5, radius=1.0, name='Spore')
        obj.scale = (1.0, 0.85, 1.15)
        bpy.ops.object.transform_apply(scale=True)
        make_subsurf(obj, 2, 4)
        mat, nt, out = new_mat('M_Spore')
        img = add_image_texture(nt, sem_img, 'SEM')
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.32, 0.28, 0.10, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.0
        bsdf.inputs['Roughness'].default_value = 0.78
        if 'Subsurface Weight' in bsdf.inputs:
            bsdf.inputs['Subsurface Weight'].default_value = 0.35
            bsdf.inputs['Subsurface Radius'].default_value = (0.5, 0.4, 0.2)
        bump = add_displacement(nt, img, mid=0.5, scale=0.10, normal=1.2)
        nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        obj.data.materials.append(mat)
        make_displace_mod(obj, sem_img, strength=0.12, mid=0.5)

    elif t == 'bacteria':
        # rod with coccus option baked in via random
        if random.random() < 0.4:
            obj = mesh_icosphere(subdiv=5, radius=0.9, name='Bacteria')
        else:
            obj = mesh_capsule(length=1.6, radius=0.55, name='Bacteria')
        make_subsurf(obj, 2, 4)
        mat, nt, out = new_mat('M_Bacteria')
        img = add_image_texture(nt, sem_img, 'SEM')
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.18, 0.55, 0.22, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.0
        bsdf.inputs['Roughness'].default_value = 0.55
        if 'Subsurface Weight' in bsdf.inputs:
            bsdf.inputs['Subsurface Weight'].default_value = 0.55
            bsdf.inputs['Subsurface Radius'].default_value = (0.6, 0.5, 0.3)
            bsdf.inputs['Subsurface Scale'].default_value = 0.05
        bump = add_displacement(nt, img, mid=0.5, scale=0.06, normal=1.0)
        nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        obj.data.materials.append(mat)
        make_displace_mod(obj, sem_img, strength=0.06, mid=0.5)

    elif t == 'dust':
        obj = mesh_aggregate(count=10, radius=1.0, name='Dust', fractal=True)
        make_subsurf(obj, 1, 3)
        mat, nt, out = new_mat('M_Dust')
        img = add_image_texture(nt, sem_img, 'SEM')
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.42, 0.34, 0.26, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.0
        bsdf.inputs['Roughness'].default_value = 0.92
        bump = add_displacement(nt, img, mid=0.5, scale=0.08, normal=1.3)
        nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        obj.data.materials.append(mat)
        make_displace_mod(obj, sem_img, strength=0.08, mid=0.5)

    elif t == 'dander':
        obj = mesh_flake(name='Dander')
        make_subsurf(obj, 2, 4)
        mat, nt, out = new_mat('M_Dander')
        img = add_image_texture(nt, sem_img, 'SEM')
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.86, 0.78, 0.66, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.0
        bsdf.inputs['Roughness'].default_value = 0.65
        if 'Subsurface Weight' in bsdf.inputs:
            bsdf.inputs['Subsurface Weight'].default_value = 0.45
            bsdf.inputs['Subsurface Radius'].default_value = (0.7, 0.55, 0.4)
        bump = add_displacement(nt, img, mid=0.5, scale=0.04, normal=1.4)
        nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        obj.data.materials.append(mat)
        make_displace_mod(obj, sem_img, strength=0.05, mid=0.5)

    elif t == 'virus':
        obj = mesh_icosphere(subdiv=4, radius=1.0, name='Virus')
        make_subsurf(obj, 1, 3)
        mat, nt, out = new_mat('M_Virus')
        img = add_image_texture(nt, sem_img, 'SEM')
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.78, 0.78, 0.82, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.05
        bsdf.inputs['Roughness'].default_value = 0.38
        if 'Subsurface Weight' in bsdf.inputs:
            bsdf.inputs['Subsurface Weight'].default_value = 0.30
            bsdf.inputs['Subsurface Radius'].default_value = (0.4, 0.4, 0.4)
        # spiky capsid — strong bump + sharp displacement
        bump = add_displacement(nt, img, mid=0.5, scale=0.14, normal=1.5)
        nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        obj.data.materials.append(mat)
        make_displace_mod(obj, sem_img, strength=0.18, mid=0.5)

    elif t == 'soot':
        obj = mesh_aggregate(count=22, radius=1.0, name='Soot', fractal=True)
        make_subsurf(obj, 1, 2)
        mat, nt, out = new_mat('M_Soot')
        img = add_image_texture(nt, sem_img, 'SEM')
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.018, 0.018, 0.020, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.0
        bsdf.inputs['Roughness'].default_value = 0.96
        # slight sheen for carbon
        if 'Coat Weight' in bsdf.inputs:
            bsdf.inputs['Coat Weight'].default_value = 0.05
            bsdf.inputs['Coat Roughness'].default_value = 0.8
        bump = add_displacement(nt, img, mid=0.5, scale=0.05, normal=1.2)
        nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        obj.data.materials.append(mat)
        make_displace_mod(obj, sem_img, strength=0.04, mid=0.5)

    elif t == 'pm':
        obj = mesh_aggregate(count=6, radius=0.9, name='PM', fractal=True)
        make_subsurf(obj, 1, 3)
        mat, nt, out = new_mat('M_PM')
        img = add_image_texture(nt, sem_img, 'SEM')
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.52, 0.50, 0.48, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.05
        bsdf.inputs['Roughness'].default_value = 0.82
        bump = add_displacement(nt, img, mid=0.5, scale=0.06, normal=1.2)
        nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        obj.data.materials.append(mat)
        make_displace_mod(obj, sem_img, strength=0.05, mid=0.5)

    elif t == 'microplastic':
        obj = mesh_shard(name='Microplastic')
        make_subsurf(obj, 2, 4)
        mat, nt, out = new_mat('M_Microplastic')
        img = add_image_texture(nt, sem_img, 'SEM')
        bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.85, 0.88, 0.92, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.0
        bsdf.inputs['Roughness'].default_value = 0.12
        if 'Transmission Weight' in bsdf.inputs:
            bsdf.inputs['Transmission Weight'].default_value = 0.85
            bsdf.inputs['Transmission Roughness'].default_value = 0.08
            bsdf.inputs['IOR'].default_value = 1.49
        elif 'Transmission' in bsdf.inputs:
            bsdf.inputs['Transmission'].default_value = 0.85
        bump = add_displacement(nt, img, mid=0.5, scale=0.02, normal=0.6)
        nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
        nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
        obj.data.materials.append(mat)
        make_displace_mod(obj, sem_img, strength=0.02, mid=0.5)

    # shade smooth + enable displacement on material
    for p in obj.data.polygons: p.use_smooth = True
    if obj.data.materials:
        obj.data.materials[0].displacement_method = 'BOTH' if hasattr(obj.data.materials[0],'displacement_method') else obj.data.materials[0].displacement_method
        try:
            obj.data.materials[0].cyclic = False
        except Exception:
            pass
    return obj

specimen = build_specimen()

# center & frame
bpy.context.view_layer.objects.active = specimen
specimen.select_set(True)
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
specimen.location = (0, 0, 0)

# -------------------------------------------------------------------- red charge aura
# Subtle red volumetric glow hugging the specimen — NOT a backdrop.
# Implementation: a thin spherical shell slightly larger than the specimen,
# with volume scatter + red emission at very low density, plus a small red
# point light at the specimen's center to give the surface a faint red rim.

aura_radius = 1.55  # hugs the specimen (radius ~1.0)

bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=aura_radius, location=(0,0,0))
aura = bpy.context.active_object
aura.name = 'AuraShell'
for p in aura.data.polygons: p.use_smooth = True
# flip normals so we see inside
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.flip_normals()
bpy.ops.object.mode_set(mode='OBJECT')

aura_mat = bpy.data.materials.new('M_Aura')
aura_mat.use_nodes = True
nt = aura_mat.node_tree
for n in list(nt.nodes): nt.nodes.remove(n)
out = nt.nodes.new('ShaderNodeOutputMaterial')
out.location = (400, 0)
# volume scatter (red tint)
vs = nt.nodes.new('ShaderNodeVolumeScatter')
vs.inputs['Density'].default_value = 0.35
vs.inputs['Color'].default_value = (0.85, 0.08, 0.10, 1.0)
# volume absorption (red)
va = nt.nodes.new('ShaderNodeVolumeAbsorption')
va.inputs['Density'].default_value = 0.15
va.inputs['Color'].default_value = (0.95, 0.10, 0.10, 1.0)
# emission (very faint red glow)
ve = nt.nodes.new('ShaderNodeEmission')
ve.inputs['Color'].default_value = (1.0, 0.12, 0.10, 1.0)
ve.inputs['Strength'].default_value = 0.6
mix1 = nt.nodes.new('ShaderNodeMixShader')
mix1.inputs['Fac'].default_value = 0.5
mix2 = nt.nodes.new('ShaderNodeMixShader')
mix2.inputs['Fac'].default_value = 0.25
nt.links.new(vs.outputs['Volume'], mix1.inputs[1])
nt.links.new(va.outputs['Volume'], mix1.inputs[2])
nt.links.new(mix1.outputs['Shader'], mix2.inputs[1])
nt.links.new(ve.outputs['Emission'], mix2.inputs[2])
nt.links.new(mix2.outputs['Shader'], out.inputs['Volume'])
# transparent surface so we see through
ts = nt.nodes.new('ShaderNodeBsdfTransparent')
nt.links.new(ts.outputs['BSDF'], out.inputs['Surface'])
aura_mat.blend_method = 'HASHED'
aura_mat.shadow_method = 'HASHED'
aura.data.materials.append(aura_mat)

# red point light at center — subtle rim charge
light_data = bpy.data.lights.new('ChargeLight', type='POINT')
light_data.energy = 12.0
light_data.color = (1.0, 0.10, 0.08)
light_data.shadow_soft_size = 0.6
charge_light = bpy.data.objects.new('ChargeLight', light_data)
charge_light.location = (0, 0, 0)
bpy.context.collection.objects.link(charge_light)

# -------------------------------------------------------------------- Dyson dark studio
world = bpy.data.worlds.new('DysonStudio')
scene.world = world
world.use_nodes = True
wnt = world.node_tree
for n in list(wnt.nodes): wnt.nodes.remove(n)
wout = wnt.nodes.new('ShaderNodeOutputWorld')
wout.location = (400, 0)
bg = wnt.nodes.new('ShaderNodeBackground')
bg.inputs['Color'].default_value = (0.012, 0.012, 0.014, 1.0)
bg.inputs['Strength'].default_value = 0.6
wnt.links.new(bg.outputs['Background'], wout.inputs['Surface'])

# dark floor for grounding
bpy.ops.mesh.primitive_plane_add(size=40, location=(0,0,-1.8))
floor = bpy.context.active_object
floor.name = 'Floor'
fmat = bpy.data.materials.new('M_Floor')
fmat.use_nodes = True
fnt = fmat.node_tree
for n in list(fnt.nodes): fnt.nodes.remove(n)
fout = fnt.nodes.new('ShaderNodeOutputMaterial')
fbsdf = fnt.nodes.new('ShaderNodeBsdfPrincipled')
fbsdf.inputs['Base Color'].default_value = (0.015, 0.015, 0.018, 1.0)
fbsdf.inputs['Roughness'].default_value = 0.35
fbsdf.inputs['Metallic'].default_value = 0.6
fnt.links.new(fbsdf.outputs['BSDF'], fout.inputs['Surface'])
floor.data.materials.append(fmat)

# key light — soft overhead-right
def add_area(name, loc, rot, size, energy, color=(1,1,1)):
    ld = bpy.data.lights.new(name, type='AREA')
    ld.size = size
    ld.energy = energy
    ld.color = color
    ld.shadow_soft_size = size * 0.5
    o = bpy.data.objects.new(name, ld)
    o.location = loc
    o.rotation_euler = rot
    bpy.context.collection.objects.link(o)
    return o

add_area('Key',  ( 3.5, -3.5, 4.5), (math.radians(45), math.radians(20), math.radians(40)), 3.0, 380, (1.0, 0.97, 0.92))
add_area('Rim',  (-4.0,  2.0, 3.5), (math.radians(60), math.radians(-15), math.radians(-50)), 2.5, 260, (0.85, 0.92, 1.0))
add_area('Fill', (-2.0, -3.0, 1.5), (math.radians(80), math.radians(10), math.radians(-30)), 4.0, 90,  (0.95, 0.95, 1.0))

# -------------------------------------------------------------------- camera
cam_data = bpy.data.cameras.new('Cam')
cam_data.lens = 80
cam_data.sensor_width = 36
cam_data.dof.use_dof = True
cam_data.dof.focus_distance = 4.2
cam_data.dof.aperture_fstop = 8.0
cam = bpy.data.objects.new('Cam', cam_data)
cam.location = (0, -4.2, 0.6)
cam.rotation_euler = (math.radians(88), 0, 0)
bpy.context.collection.objects.link(cam)
scene.camera = cam

# -------------------------------------------------------------------- turntable
# Parent specimen + aura to an empty that rotates.
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0,0,0))
turn = bpy.context.active_object
turn.name = 'Turntable'
specimen.parent = turn
aura.parent = turn
# charge light stays at center (does not need to rotate, but parent for cleanliness)
charge_light.parent = turn

# animation
scene.frame_start = 1
scene.frame_end = FRAMES
scene.render.fps = 24

for f in range(1, FRAMES + 1):
    angle = (f - 1) * (2.0 * math.pi / FRAMES)
    turn.rotation_euler = (0, 0, angle)
    turn.keyframe_insert(data_path='rotation_euler', frame=f)

# -------------------------------------------------------------------- render
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_depth = '16'

for f in range(1, FRAMES + 1):
    scene.frame_set(f)
    out_path = os.path.join(OUT_DIR, f"{SPEC_TYPE}_turntable_{f:03d}.png")
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    print(f"[spec_turntable] frame {f}/{FRAMES} -> {out_path}")

print(f"[spec_turntable] DONE  type={SPEC_TYPE}  spp={SPP}  frames={FRAMES}  out={OUT_DIR}")
