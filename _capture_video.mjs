// Capture a short clip of home_hero.html (WebGL) into PNG frames. Usage: node _capture_video.mjs <outDir> <nFrames> <intervalMs> [w] [h] [mx] [my]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
const OUTDIR = process.argv[2];
const N = parseInt(process.argv[3] || '24', 10);
const IV = parseInt(process.argv[4] || '130', 10);
const W = parseInt(process.argv[5] || '1280', 10);
const H = parseInt(process.argv[6] || '800', 10);
const MX = process.argv[7] ? parseInt(process.argv[7],10) : null;
const MY = process.argv[8] ? parseInt(process.argv[8],10) : null;
fs.mkdirSync(OUTDIR, {recursive:true});
const ROOT = path.resolve('C:/EPA/US/website_project/_deploy');
const MIME = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.mjs':'text/javascript'};
const srv = http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/home_hero.html'; const fp=path.join(ROOT,u); if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');} r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream'); fs.createReadStream(fp).pipe(r);});
await new Promise(res=>srv.listen(0,res)); const port=srv.address().port;
const b = await chromium.launch({headless:true, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']});
const p = await b.newPage({viewport:{width:W,height:H}, deviceScaleFactor:1});
await p.goto(`http://localhost:${port}/home_hero.html`,{waitUntil:'domcontentloaded',timeout:45000}).catch(()=>{});
await p.waitForTimeout(1500);
if(MX!==null){ await p.mouse.move(MX-160, MY-40, {steps:6}); await p.mouse.move(MX, MY, {steps:12}); }
for(let i=0;i<N;i++){
  if(MX!==null){ const ang=i*0.5; await p.mouse.move(MX+Math.cos(ang)*120, MY+Math.sin(ang)*50, {steps:3}); }
  await p.screenshot({path:path.join(OUTDIR, 'f'+String(i).padStart(3,'0')+'.png'), animations:'disabled', caret:'hide'});
  await p.waitForTimeout(IV);
}
console.log('captured '+N+' frames to '+OUTDIR);
await b.close(); srv.close();
