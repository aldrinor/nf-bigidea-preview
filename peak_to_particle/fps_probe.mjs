import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const ROOT=path.resolve('C:/EPA/US/website_project/peak_to_particle');
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp4':'video/mp4'};
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const fp=path.join(ROOT,u);
  if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');}
  r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream');fs.createReadStream(fp).pipe(r);});
await new Promise(r=>srv.listen(0,r)); const port=srv.address().port;
const b=await chromium.launch({headless:true});
async function measure(label, mutate){
  const p=await b.newPage({viewport:{width:1440,height:900}, deviceScaleFactor:Number(process.env.DSF||2)});
  await p.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load',timeout:60000});
  await p.waitForTimeout(2500);
  if(mutate) await p.evaluate(mutate);
  const fps = await p.evaluate(async ()=>{
    let n=0; const t0=performance.now();
    const tick=()=>{ n++; if(performance.now()-t0<2000) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const end=performance.now()+2000;
    while(performance.now()<end){ window.scrollBy(0,14); await new Promise(r=>setTimeout(r,16)); }
    return Math.round(n/2);
  });
  console.log(`${label.padEnd(34)} ${fps} fps`);
  await p.close(); return fps;
}
await measure('as shipped', null);
await measure('front-overlay mask removed', ()=>{ const e=document.getElementById('pl_front'); e.style.maskImage='none'; e.style.webkitMaskImage='none'; });
await measure('front overlay removed entirely', ()=>{ document.getElementById('pl_front').remove(); });
await measure('videos removed', ()=>{ document.querySelectorAll('video').forEach(v=>v.remove()); });
await measure('all plates removed', ()=>{ document.querySelectorAll('#stage img,#stage video').forEach(v=>v.remove()); });
await b.close(); srv.close();
