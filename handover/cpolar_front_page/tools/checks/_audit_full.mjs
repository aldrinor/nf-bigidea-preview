// FULL SIZE, at Yin's width, at the scroll in his screenshot. No contact sheet, no
// downscaling. The last pass was judged off a shrunken grid and a number that sampled only
// the brightest pixels inside the text band - so a grey wash across the top of the screen
// and a buried mountain never showed up in either. Look at the actual frame.
import http from 'http'; import fs from 'fs'; import path from 'path';
import { chromium } from 'playwright'; import { PNG } from 'pngjs';
const ROOT='C:/EPA/US/website_project/_deploy';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp',
 '.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.woff2':'font/woff2',
 '.txt':'text/plain','.mp3':'audio/mpeg','.exr':'application/octet-stream','.wasm':'application/wasm'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
 fs.readFile(path.join(ROOT,p),(e,d)=>{if(e){r.writeHead(404);r.end();return;}
 r.writeHead(200,{'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream'});r.end(d);});});
await new Promise(r=>srv.listen(8244,r));
const OUT='C:/EPA/US/website_project/_cpolar_v2/cmp/full'; fs.mkdirSync(OUT,{recursive:true});
const lum=(r,g,b)=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
  return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b);};
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const pg=await b.newPage({viewport:{width:1850,height:975}});
// Listen for errors. The local audit did not, so a crash that only happens while a 7.7 MB
// model is still loading passed every local check and went out live.
const errs=[]; pg.on('pageerror',e=>errs.push(String(e.message).slice(0,90)));
pg.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text().slice(0,90));});
await pg.goto('http://127.0.0.1:8244/cpolar_v5/',{waitUntil:'commit',timeout:60000});

await pg.waitForTimeout(23000);
for (const y of [1400,1700,1900,2150]) {
  await pg.evaluate(v=>scrollTo(0,v), y); await pg.waitForTimeout(3000);
  const f=`${OUT}/${y}.png`; await pg.screenshot({path:f});
  const png=PNG.sync.read(fs.readFileSync(f));
  // how much MOUNTAIN is there, and how bright is the top third of the screen
  let dark=0,n=0,topSum=0,topN=0;
  for(let py=0;py<png.height;py+=2) for(let px=0;px<png.width;px+=2){
    const i=(py*png.width+px)*4, L=lum(png.data[i],png.data[i+1],png.data[i+2]);
    n++; if(L<0.62) dark++;
    if(py<png.height/3){ topSum+=L; topN++; }
  }
  console.log(`scroll ${String(y).padStart(4)}  mountain/dark ${(dark*100/n).toFixed(1)}%   top-third brightness ${(topSum/topN).toFixed(3)}`);
}
console.log('page errors:', errs.length ? [...new Set(errs)].join(' | ') : 'none');
await b.close(); srv.close();
