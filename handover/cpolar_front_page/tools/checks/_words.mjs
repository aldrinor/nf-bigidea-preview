// The word sequence, every visible line, no cap. The previous pass kept only the first six
// text items per frame; V1 carries extra ones (the chapter rail) which pushed real lines
// out of the list and made the two pages look out of step when they are not. Text only,
// no screenshots, so it can afford to be exhaustive.
import http from 'http'; import fs from 'fs'; import path from 'path';
import { chromium } from 'playwright';
const ROOT='C:/EPA/US/website_project/_deploy';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp',
 '.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.woff2':'font/woff2',
 '.txt':'text/plain','.mp3':'audio/mpeg','.exr':'application/octet-stream','.wasm':'application/wasm'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
 fs.readFile(path.join(ROOT,p),(e,d)=>{if(e){r.writeHead(404);r.end();return;}
 r.writeHead(200,{'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream'});r.end(d);});});
await new Promise(r=>srv.listen(8238,r));
const STOPS=[]; for(let y=0;y<=3200;y+=100) STOPS.push(y);
const SEE = () => {
  const vh=innerHeight, out=[];
  const eff = e => { let o=1; for(let n=e;n&&n!==document.body;n=n.parentElement)
    o*=parseFloat(getComputedStyle(n).opacity)||0; return o; };
  for (const e of document.querySelectorAll('h1,h2,h3,h4,p,li,a,span,div')) {
    if ([...e.children].some(c=>c.textContent.trim()===e.textContent.trim())) continue;
    const t=e.textContent.replace(/\s+/g,' ').trim();
    if (t.length<5 || t.length>70) continue;
    const r=e.getBoundingClientRect();
    if (r.height<3 || r.bottom<10 || r.top>vh-10) continue;
    if (eff(e) < 0.25) continue;
    out.push(t);
  }
  return [...new Set(out)];
};
const res={};
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const page of ['cpolar','cpolar_v5']) {
  const pg=await b.newPage({viewport:{width:1850,height:1000}});
  await pg.goto(`http://127.0.0.1:8238/${page}/`,{waitUntil:'commit',timeout:60000});
  await pg.waitForTimeout(23000);
  const first={};
  for (const y of STOPS) {
    await pg.evaluate(v=>scrollTo(0,v), y); await pg.waitForTimeout(420);
    for (const t of await pg.evaluate(SEE)) if (first[t]===undefined) first[t]=y;
  }
  res[page]=first; await pg.close(); console.log(page+' swept');
}
await b.close(); srv.close();
const A=res['cpolar'], C=res['cpolar_v5'];
const all=[...new Set([...Object.keys(A),...Object.keys(C)])]
  .sort((x,y)=>(A[x]??C[x]??9e9)-(A[y]??C[y]??9e9));
console.log('\n  V1     ours   diff   line');
for (const t of all) {
  const a=A[t], c=C[t];
  const d = (a!==undefined && c!==undefined) ? (c-a) : null;
  const mark = a===undefined ? 'ours only' : c===undefined ? 'V1 only  ' :
               d===0 ? '   same  ' : (d>0?'+':'')+d+'px';
  console.log(`  ${String(a??'-').padStart(5)}  ${String(c??'-').padStart(5)}  ${mark.padStart(9)}  ${t.slice(0,52)}`);
}
