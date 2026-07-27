# C-POLAR front page — live demo

A **built copy for demonstration only**: the 53 files the browser actually
fetches, about 14MB. Rebuilt by `make_demo.mjs` in the source folder, which
also rewrites the reference site's root-absolute `/assets/...` paths to
relative ones so it works from a subfolder.

**The source of truth is elsewhere:** private repo `nanoflashing-website`,
branch `cpolar-front-page`, folder `front-page/`. That holds the tests, the
grading script, the design tokens, the lock files and the documentation. Do
not edit here; edit there and redeploy.

The page carries `noindex, nofollow` so it will not appear in search results.
Anyone with the link can open it.

**It contains reference-site assets** — a 3D mountain, a compiled WebGL engine,
textures and fonts that are not ours. Those must be replaced before this is
anything more than a demo link shared with colleagues.
