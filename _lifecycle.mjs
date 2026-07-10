import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
const PAGE='fungi_solution.html', OUTDIR=process.argv[2];
const ROOT=path.resolve('C:/EPA/US/website_project/_deploy');
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/'+PAGE; const fp=path.join(ROOT,u); if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');} r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream'); fs.createReadStream(fp).pipe(r);});
await new Promise(res=>srv.listen(0,res)); const port=srv.address().port;
const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
await p.goto(`http://localhost:${port}/${PAGE}`,{waitUntil:'domcontentloaded',timeout:45000}).catch(()=>{});
const el=await p.$('#videoStack');
const marks={};
async function snap(tag){ const d=await p.evaluate(()=>({ct:+(document.querySelector('video').currentTime).toFixed(1),ended:document.querySelector('video').ended,spores:document.querySelectorAll('.anno .spore').length})); marks[tag]=d; await el.screenshot({path:path.join(OUTDIR,tag+'.png')}); }
await p.waitForTimeout(2600); await snap('t_fall');   // ~2.5s, falling
await p.waitForTimeout(4200); await snap('t_stop');   // ~6.8s, after biofouling
await p.waitForTimeout(2500); await snap('t_end');    // ~9s, video held
console.log(JSON.stringify(marks));
await b.close(); srv.close();
