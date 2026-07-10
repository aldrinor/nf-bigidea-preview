import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
const PAGE='fungi_solution.html', OUTDIR=process.argv[2];
const ROOT=path.resolve('C:/EPA/US/website_project/_deploy');
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/'+PAGE; const fp=path.join(ROOT,u); if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');} r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream'); fs.createReadStream(fp).pipe(r);});
await new Promise(res=>srv.listen(0,res)); const port=srv.address().port;
const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`http://localhost:${port}/${PAGE}`,{waitUntil:'domcontentloaded',timeout:45000}).catch(()=>{});
await p.waitForTimeout(900);
const el=await p.$('#videoStack');
for(let i=0;i<12;i++){
  await p.waitForTimeout(320);
  const info=await p.evaluate(()=>document.querySelectorAll('.anno .spore').length);
  await el.screenshot({path:path.join(OUTDIR,`s_${String(i).padStart(2,'0')}.png`)});
  process.stdout.write(i+':'+info+' ');
}
console.log('\nerrs='+errs.length);
await b.close(); srv.close();
