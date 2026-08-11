import http from 'http'; import fs from 'fs'; import path from 'path';
import { chromium } from 'playwright';
const ROOT='C:/EPA/US/website_project/_deploy';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp',
 '.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.woff2':'font/woff2',
 '.txt':'text/plain','.mp3':'audio/mpeg','.exr':'application/octet-stream','.wasm':'application/wasm'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
 fs.readFile(path.join(ROOT,p),(e,d)=>{if(e){r.writeHead(404);r.end();return;}
 r.writeHead(200,{'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream'});r.end(d);});});
await new Promise(r=>srv.listen(8246,r));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const pg=await b.newPage({viewport:{width:1850,height:975}});
await pg.goto('http://127.0.0.1:8246/cpolar_v5/',{waitUntil:'commit',timeout:60000});
await pg.waitForTimeout(24000);
for (const y of [0, 1000, 1500, 1900]) {
  await pg.evaluate(v=>scrollTo(0,v), y); await pg.waitForTimeout(1800);
  const r = await pg.evaluate(() => {
    const t = window.__cpTerrain, c = window.__cpCam;
    if (!t || !c) return {err:'not exposed'};
    let lo=Infinity, hi=-Infinity, zlo=Infinity, zhi=-Infinity;
    t.updateWorldMatrix(true,true);
    t.traverse(o => {
      if (!o.isMesh || !o.geometry) return;
      o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
      lo=Math.min(lo,bb.min.y); hi=Math.max(hi,bb.max.y);
      zlo=Math.min(zlo,bb.min.z); zhi=Math.max(zhi,bb.max.z);
    });
    return { terrainY:[Math.round(lo),Math.round(hi)], terrainZ:[Math.round(zlo),Math.round(zhi)],
             groupY: Math.round(t.position.y),
             cam:[Math.round(c.position.x),Math.round(c.position.y),Math.round(c.position.z)] };
  });
  const inside = r.terrainY && r.cam[1] < r.terrainY[1] && r.cam[1] > r.terrainY[0]
    && r.cam[2] > r.terrainZ[0] && r.cam[2] < r.terrainZ[1];
  console.log(`scroll ${String(y).padStart(4)}  camera ${JSON.stringify(r.cam)}  terrain y ${JSON.stringify(r.terrainY)} z ${JSON.stringify(r.terrainZ)}  groupY ${r.groupY}  ${inside?'*** CAMERA IS INSIDE THE MESH ***':'clear'}`);
}
await b.close(); srv.close();
