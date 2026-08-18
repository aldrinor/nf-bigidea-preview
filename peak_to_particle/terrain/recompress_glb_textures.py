# -*- coding: utf-8 -*-
"""Re-encode the textures embedded inside a GLB.

trimesh writes them as PNG, which is why the page is 28 MB: 84% of every file is
a lossless picture of a mountain. JPEG is core glTF and needs no extension.
WebP needs EXT_texture_webp, which three.js supports.
"""
import io, json, os, struct, sys
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
Image.MAX_IMAGE_PIXELS = None

def convert(src, dst, fmt="webp", quality=88):
    raw = open(src, "rb").read()
    jlen = struct.unpack("<I", raw[12:16])[0]
    gltf = json.loads(raw[20:20 + jlen])
    bin_off = 20 + jlen + 8
    blob = bytearray(raw[bin_off:])

    if not gltf.get("images"):
        return None
    # rebuild the binary chunk, swapping each image's bytes
    views = gltf["bufferViews"]
    img_views = {im["bufferView"]: i for i, im in enumerate(gltf["images"])}
    pieces, cursor, new_views = [], 0, []
    saved = 0
    for vi, v in enumerate(views):
        off, ln = v.get("byteOffset", 0), v["byteLength"]
        data = bytes(blob[off:off + ln])
        if vi in img_views:
            im = Image.open(io.BytesIO(data)).convert("RGB")
            buf = io.BytesIO()
            if fmt == "webp":
                im.save(buf, "WEBP", quality=quality, method=6)
            else:
                im.save(buf, "JPEG", quality=quality, optimize=True, progressive=True)
            saved += ln - buf.tell()
            data = buf.getvalue()
            gltf["images"][img_views[vi]]["mimeType"] = "image/webp" if fmt == "webp" else "image/jpeg"
        pad = (-len(data)) % 4
        nv = dict(v); nv["byteOffset"] = cursor; nv["byteLength"] = len(data)
        new_views.append(nv)
        pieces.append(data + b"\x00" * pad)
        cursor += len(data) + pad
    gltf["bufferViews"] = new_views
    newbin = b"".join(pieces)
    gltf["buffers"][0]["byteLength"] = len(newbin)

    if fmt == "webp":
        # three.js reads WebP through this extension
        gltf.setdefault("extensionsUsed", [])
        if "EXT_texture_webp" not in gltf["extensionsUsed"]:
            gltf["extensionsUsed"].append("EXT_texture_webp")
        for t in gltf.get("textures", []):
            if "source" in t:
                t.setdefault("extensions", {})["EXT_texture_webp"] = {"source": t.pop("source")}

    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * ((-len(js)) % 4)
    out = (b"glTF" + struct.pack("<II", 2, 12 + 8 + len(js) + 8 + len(newbin))
           + struct.pack("<I", len(js)) + b"JSON" + js
           + struct.pack("<I", len(newbin)) + b"BIN\x00" + newbin)
    open(dst, "wb").write(out)
    return os.path.getsize(src), os.path.getsize(dst)

if __name__ == "__main__":
    # MUST run on the uncompressed GLB, BEFORE meshopt. Run it after and it
    # rewrites the compressed bufferViews and the file comes out bigger --
    # which it did, on the first attempt.
    for f in sys.argv[1:]:
        d = f.replace(".glb", "_webp.glb")
        r = convert(f, d, "webp", quality=88)
        if r:
            print("%-26s %6.2f -> %5.2f MB   %s" % (os.path.basename(f),
                  r[0] / 1048576, r[1] / 1048576, os.path.basename(d)))
