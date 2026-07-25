import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const ROOT=path.resolve('C:/EPA/US/website_project/peak_to_particle');
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'};
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const fp=path.join(ROOT,u);
  if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');}
  r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream');fs.createReadStream(fp).pipe(r);});
await new Promise(r=>srv.listen(0,r)); const port=srv.address().port;
const b=await chromium.launch({headless:true});
const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,140)));
await p.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'domcontentloaded'});
const probe = ()=>p.evaluate(()=>{
  const ws=[...document.querySelectorAll('#c1 h1 .w > i')];
  if(!ws.length) return 'no words';
  const y = n => { const m=getComputedStyle(ws[n]).transform; if(m==='none') return 0;
                   const v=m.match(/matrix\(([^)]+)\)/); return v?Math.round(parseFloat(v[1].split(',')[5])):0; };
  return {words:ws.length, first:y(0), last:y(ws.length-1)};
});
for (const t of [120, 420, 900, 1900]) { await p.waitForTimeout(t===120?120:t-  (t===420?120:(t===900?420:900)));
  const r = await probe(); console.log(`t≈${t}ms  words=${r.words}  first word offsetY=${r.first}px  last word offsetY=${r.last}px`); }
console.log(errs.length?('ERR: '+errs[0]):'no page errors');
await b.close(); srv.close();
