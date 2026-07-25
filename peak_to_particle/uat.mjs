import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const ROOT=path.resolve('C:/EPA/US/website_project/peak_to_particle');
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.css':'text/css'};
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const fp=path.join(ROOT,u);
  if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');}
  r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream');fs.createReadStream(fp).pipe(r);});
await new Promise(r=>srv.listen(0,r)); const port=srv.address().port;
const b=await chromium.launch({headless:true});

for (const dev of [{n:'desktop 1440', w:1440, h:900}, {n:'phone 390', w:390, h:844}]){
  const p=await b.newPage({viewport:{width:dev.w,height:dev.h}, deviceScaleFactor:2});
  let bytes=0; const byType={};
  p.on('response', async res=>{ try{
    const h=res.headers(); const len=parseInt(h['content-length']||'0',10);
    const ct=(h['content-type']||'other').split(';')[0];
    if(len){ bytes+=len; byType[ct]=(byType[ct]||0)+len; }
  }catch(e){} });
  const t0=Date.now();
  await p.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load',timeout:90000});
  const loaded=Date.now()-t0;
  await p.waitForTimeout(3500);
  const t1=Date.now();
  await p.waitForLoadState('networkidle',{timeout:60000}).catch(()=>{});
  const idle=Date.now()-t0;
  // FPS while actually scrolling
  const fps = await p.evaluate(async ()=>{
    let n=0; const t0=performance.now();
    const tick=()=>{ n++; if(performance.now()-t0<2000) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const end=performance.now()+2000;
    while(performance.now()<end){ window.scrollBy(0,14); await new Promise(r=>setTimeout(r,16)); }
    return Math.round(n/2);
  });
  console.log(`\n${dev.n}`);
  console.log(`  transfer      ${(bytes/1048576).toFixed(1)} MB`);
  Object.entries(byType).sort((a,b)=>b[1]-a[1]).slice(0,4).forEach(([k,v])=>console.log(`     ${k.padEnd(14)} ${(v/1048576).toFixed(1)} MB`));
  console.log(`  load event    ${loaded} ms`);
  console.log(`  network idle  ${idle} ms`);
  console.log(`  fps scrolling ${fps}`);
  await p.close();
}
await b.close(); srv.close();
