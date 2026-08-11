// Track the header across the scroll. Two different bits of code write to it - the engine's
// handover and a small standalone script - and they disagree about when it should go.
import http from 'http'; import fs from 'fs'; import path from 'path';
import { chromium } from 'playwright';
const ROOT='C:/EPA/US/website_project/_deploy';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp',
 '.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.woff2':'font/woff2',
 '.txt':'text/plain','.mp3':'audio/mpeg','.exr':'application/octet-stream','.wasm':'application/wasm'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
 fs.readFile(path.join(ROOT,p),(e,d)=>{if(e){r.writeHead(404);r.end();return;}
 r.writeHead(200,{'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream'});r.end(d);});});
await new Promise(r=>srv.listen(8248,r));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const [w,hh] of [[1850,975],[1863,1003]]) {
  const pg=await b.newPage({viewport:{width:w,height:hh}});
  await pg.goto('http://127.0.0.1:8248/cpolar_v5/',{waitUntil:'commit',timeout:60000});
  await pg.waitForTimeout(23000);
  console.log(`\n== viewport ${w}x${hh}`);
  for (const y of [0,400,900,1400,1655,1900,2200]) {
    await pg.evaluate(v=>scrollTo(0,v), y); await pg.waitForTimeout(1500);
    const r = await pg.evaluate(()=>{
      const hd=document.querySelector('header'); if(!hd) return 'no header';
      const s=getComputedStyle(hd), b=hd.getBoundingClientRect();
      const link=[...hd.querySelectorAll('a')].find(a=>a.textContent.trim()==='About');
      const lo = link ? getComputedStyle(link).opacity : '-';
      return `opacity ${s.opacity}  transform ${s.transform.slice(0,28)}  top ${Math.round(b.top)}  link ${lo}`;
    });
    console.log(`  scroll ${String(y).padStart(4)}  ${r}`);
  }
  await pg.close();
}
await b.close(); srv.close();
