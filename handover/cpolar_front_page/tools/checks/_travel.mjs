// Which way does the view travel? Measure how much of the frame the TERRAIN fills.
//
// Coming down toward a mountain, it takes up more and more of the frame. Rising above it,
// less and less. That is unambiguous and it does not depend on finding a horizon line,
// which failed twice - first because the drifting dust put texture in every row, then
// because the mountain's own slope reaches the top of the frame on the left.
//
// Terrain is textured; sky is a smooth gradient. So a pixel is terrain if the picture
// changes vertically around it. Dust is hidden, and the copy is a few percent of the frame.
import http from 'http'; import fs from 'fs'; import path from 'path';
import { chromium } from 'playwright'; import { PNG } from 'pngjs';
const ROOT='C:/EPA/US/website_project/_deploy';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp',
 '.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.woff2':'font/woff2',
 '.txt':'text/plain','.mp3':'audio/mpeg','.exr':'application/octet-stream','.wasm':'application/wasm'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
 fs.readFile(path.join(ROOT,p),(e,d)=>{if(e){r.writeHead(404);r.end();return;}
 r.writeHead(200,{'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream'});r.end(d);});});
await new Promise(r=>srv.listen(8247,r));
const OUT='C:/EPA/US/website_project/_cpolar_v2/cmp/travel'; fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const pg=await b.newPage({viewport:{width:1850,height:975}});
const errs=[]; pg.on('pageerror',e=>errs.push(String(e.message).slice(0,80)));
await pg.goto('http://127.0.0.1:8247/cpolar_v5/',{waitUntil:'commit',timeout:60000});
await pg.waitForTimeout(23000);
await pg.addStyleTag({content:'canvas:not(#scene){visibility:hidden !important}'});
const rows=[];
for (let y=900; y<=2000; y+=100) {
  await pg.evaluate(v=>scrollTo(0,v), y); await pg.waitForTimeout(1900);
  const f=`${OUT}/${y}.png`; await pg.screenshot({path:f});
  const png=PNG.sync.read(fs.readFileSync(f));
  const L=(x,yy)=>{const i=(yy*png.width+x)*4;return 0.299*png.data[i]+0.587*png.data[i+1]+0.114*png.data[i+2];};
  let tex=0,n=0;
  for (let py=6; py<png.height-6; py+=3) for (let px=0; px<png.width; px+=3) {
    n++; if (Math.abs(L(px,py)-L(px,py+5)) > 2.2) tex++;
  }
  rows.push([y, +(tex*100/n).toFixed(1)]);
}
console.log('errors:', errs.length?[...new Set(errs)].join(' | '):'none');
console.log('\n scroll | terrain fills | travel');
let prev=null;
for (const [y,pc] of rows) {
  const d = prev===null ? '' : pc>prev+0.6 ? 'DESCENDING - terrain filling more'
          : pc<prev-0.6 ? 'rising - terrain shrinking' : 'holding';
  console.log(`  ${String(y).padStart(4)}  |    ${String(pc).padStart(5)}%    | ${d}`);
  prev=pc;
}
await b.close(); srv.close();
