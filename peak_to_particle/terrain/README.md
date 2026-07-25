# Terrain — real Banff elevation

Not sculpted. Built from public elevation data (AWS Terrain Tiles, terrarium format, no API key).

    python fetch_dem.py     # 110 tiles @ zoom 14 -> banff_dem.npy   (~5 m/pixel)
    python summits.py       # find the real summits in the data
    python build_mesh.py    # -> out/banff_terrain.glb + normal + height maps
    npx @gltf-transform/cli optimize out/banff_terrain.glb out/banff_opt.glb --compress meshopt --simplify false

**Verified against reality:** Lake Louise reads 1742 m (true 1750 m). Mount Victoria reads 3459 m
(true 3464 m). Mount Lefroy reads 3435 m (true 3423 m). The georeferencing is correct.

**Frame:** 15.3 km x 13.4 km, covering Mount Victoria, Mount Lefroy and Lake Louise.

**Gotcha that cost an hour:** the grid triangle winding must be reversed (`[a,c,b]`, `[a,d,c]`) or every
face points down, gets backface-culled, and the terrain renders as torn ribbons. Fixed in build_mesh.py.

Hero chunk: `banff_opt.glb` 1.55 MB + `banff_normal_q95.webp` 0.91 MB = **2.38 MB** (budget 3 MB).
