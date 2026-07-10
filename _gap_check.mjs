import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
const PAGE='fungi_solution.html', OUT=process.argv[2], W=parseInt(process.argv[3]||'1863',10);
const ROOT=path.resolve('C:/EPA/US/website_project/_deploy');
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/'+PAGE; const fp=path.join(ROOT,u); if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');} r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream'); fs.createReadStream(fp).pipe(r);});
await new Promise(res=>srv.listen(0,res)); const port=srv.address().port;
const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:W,height:1007},deviceScaleFactor:1});
await p.goto(`http://localhost:${port}/${PAGE}`,{waitUntil:'domcontentloaded',timeout:45000}).catch(()=>{});
await p.waitForTimeout(1400);
const d=await p.evaluate(()=>{
  const stack=document.getElementById('videoStack'); const sb=stack.getBoundingClientRect();
  const top=document.querySelector('.anno-top').getBoundingClientRect();
  return { ph:sb.height, topBottomPct:((top.bottom-sb.top)/sb.height*100).toFixed(1) };
});
await p.$('#videoStack').then(e=>e.screenshot({path:OUT}));
console.log('W='+W+' anno-top bottom at '+d.topBottomPct+'% of panel; slab top centre ~23.8%');
await b.close(); srv.close();
