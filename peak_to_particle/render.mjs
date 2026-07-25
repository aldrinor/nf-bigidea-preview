import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const ROOT=path.resolve('C:/EPA/US/website_project/peak_to_particle');
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm'};
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const fp=path.join(ROOT,u);
  if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');}
  r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream');fs.createReadStream(fp).pipe(r);});
await new Promise(r=>srv.listen(0,r)); const port=srv.address().port;
const b=await chromium.launch({headless:true,args:['--enable-features=Vulkan','--use-angle=default','--ignore-gpu-blocklist','--enable-gpu-rasterization']});
const shots=process.argv.slice(2).length?process.argv.slice(2):['hero'];
for(const s of shots){
  const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1.5});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,120))); p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120))});
  await p.goto(`http://127.0.0.1:${port}/hero_test.html?shot=${s}`,{waitUntil:'load',timeout:60000});
  await p.waitForFunction('window.__ready !== undefined',{timeout:60000}).catch(()=>{});
  await p.waitForTimeout(4000);
  const info=await p.evaluate(()=>({ready:window.__ready,fps:window.__fps,hud:document.getElementById('hud').textContent,
    gpu:(()=>{try{const c=document.createElement('canvas');const gl=c.getContext('webgl2');const d=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(d.UNMASKED_RENDERER_WEBGL).slice(0,58)}catch(e){return '?'}})()}));
  await p.screenshot({path:`shot_${s}.png`});
  console.log(`  ${s.padEnd(6)} ready=${info.ready} fps=${info.fps||'-'} | ${info.hud}`);
  console.log(`         GPU: ${info.gpu}`);
  if(errs.length) console.log(`         ERRORS: ${errs.slice(0,2).join(' | ')}`);
  await p.close();
}
await b.close(); srv.close();
