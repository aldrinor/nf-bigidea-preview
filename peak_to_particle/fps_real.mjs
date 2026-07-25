import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const ROOT=path.resolve('C:/EPA/US/website_project/peak_to_particle');
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.mp4':'video/mp4'};
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const fp=path.join(ROOT,u);
  if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');}
  r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream');fs.createReadStream(fp).pipe(r);});
await new Promise(r=>srv.listen(0,r)); const port=srv.address().port;
const b=await chromium.launch({headless:true,args:['--enable-gpu-rasterization','--ignore-gpu-blocklist']});

async function run(label, dsf, mutate){
  const p=await b.newPage({viewport:{width:1440,height:900}, deviceScaleFactor:dsf});
  await p.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load',timeout:60000});
  await p.waitForTimeout(2600);
  if(mutate) await p.evaluate(mutate);
  await p.evaluate(()=>{ window.__f=0; const t=()=>{ window.__f++; requestAnimationFrame(t); }; requestAnimationFrame(t); });
  await p.mouse.move(700,450);
  const t0=Date.now();
  // real wheel input, the way a person scrolls — Lenis owns the animation, we do not fight it
  for(let i=0;i<14;i++){ await p.mouse.wheel(0,220); await p.waitForTimeout(140); }
  const secs=(Date.now()-t0)/1000;
  const frames=await p.evaluate(()=>window.__f);
  const y=await p.evaluate(()=>Math.round(scrollY));
  console.log(`${label.padEnd(30)} dsf${dsf}  ${Math.round(frames/secs)} fps   (scrolled to ${y}px)`);
  await p.close();
}
await run('as shipped', 1, null);
await run('as shipped', 2, null);
await run('videos removed', 2, ()=>{ document.querySelectorAll('video').forEach(v=>v.remove()); });
await run('hidden video display:none', 2, ()=>{
  const s=document.createElement('style');
  s.textContent='#stage video[style*="visibility: hidden"]{display:none!important}';
  document.head.appendChild(s);
});
await run('hero video: no scale', 2, ()=>{
  const v=document.getElementById('pl_peak');
  const set=v.style.setProperty.bind(v.style);
  Object.defineProperty(v.style,'transform',{set(){ set('transform','none'); },get(){return 'none';}});
});
await run('hero video: 854px source', 2, ()=>{
  document.getElementById('pl_peak').querySelector('source').src='./hero_img/peak_cloud_sm.mp4';
  document.getElementById('pl_peak').load();
});
await b.close(); srv.close();
