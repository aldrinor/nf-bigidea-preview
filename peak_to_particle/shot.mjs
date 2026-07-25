import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const ROOT=path.resolve('C:/EPA/US/website_project/peak_to_particle');
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm'};
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const fp=path.join(ROOT,u);
  if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');}
  r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream');fs.createReadStream(fp).pipe(r);});
await new Promise(r=>srv.listen(0,r)); const port=srv.address().port;
const page_=process.argv[2]||'scene.html';
const shots=process.argv.slice(3).length?process.argv.slice(3):['hero'];
const b=await chromium.launch({headless:true,args:['--enable-features=Vulkan','--use-angle=default','--ignore-gpu-blocklist','--enable-gpu-rasterization']});
for(const s of shots){
  const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:Number(process.env.DPR||1.5)});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,150))); p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,150))});
  await p.goto(`http://127.0.0.1:${port}/${page_}?shot=${s}`,{waitUntil:'load',timeout:60000});
  await p.waitForFunction('window.__ready!==undefined',{timeout:60000}).catch(()=>{});
  await p.waitForTimeout(4500);
  const i=await p.evaluate(()=>({r:window.__ready,f:window.__fps,h:document.getElementById('hud').textContent}));
  await p.screenshot({path:`sc_${s}.png`});
  console.log(`  ${s.padEnd(6)} ready=${i.r} fps=${i.f||'-'} | ${i.h}`);
  if(errs.length) console.log(`     ERR: ${errs.slice(0,2).join(' || ')}`);
  await p.close();
}
await b.close(); srv.close();
