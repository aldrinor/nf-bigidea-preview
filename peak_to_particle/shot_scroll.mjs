import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const ROOT=path.resolve('C:/EPA/US/website_project/peak_to_particle');
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const fp=path.join(ROOT,u);
  if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');}
  r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream');fs.createReadStream(fp).pipe(r);});
await new Promise(r=>srv.listen(0,r)); const port=srv.address().port;
const b=await chromium.launch({headless:true,args:['--enable-features=Vulkan','--use-angle=default','--ignore-gpu-blocklist']});
const stops = process.argv.slice(2).length ? process.argv.slice(2) : ['0','1','2'];
for(const s of stops){
  const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:Number(process.env.DPR||1.5)});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,140)));
  await p.goto(`http://127.0.0.1:${port}/index.html?p=${s}`,{waitUntil:'load',timeout:60000});
  await p.waitForFunction('window.__ready===true',{timeout:60000}).catch(()=>{});
  await p.waitForTimeout(4200);
  const i=await p.evaluate(()=>({f:window.__fps, y:Math.round(scrollY)}));
  await p.screenshot({path:`sc_p${s}.png`});
  console.log(`  p=${s}  fps=${i.f||'-'}  scrollY=${i.y}` + (errs.length?`  ERR: ${errs[0]}`:''));
  await p.close();
}
await b.close(); srv.close();
