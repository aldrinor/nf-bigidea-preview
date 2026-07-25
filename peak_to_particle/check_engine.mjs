import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const ROOT=path.resolve('C:/EPA/US/website_project/peak_to_particle');
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'};
const srv=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);const fp=path.join(ROOT,u);
  if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');}
  r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream');fs.createReadStream(fp).pipe(r);});
await new Promise(r=>srv.listen(0,r)); const port=srv.address().port;
const b=await chromium.launch({headless:true});
const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,120)));
await p.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'load',timeout:60000});
await p.waitForTimeout(2500);
const engine = await p.evaluate(()=>window.__engine||'none');
console.log('engine:', engine, errs.length?('ERR: '+errs[0]):'');
// one wheel tick, then watch whether the page keeps moving after the input stops
await p.mouse.move(700,450);
await p.mouse.wheel(0,600);
const samples=[];
for(let i=0;i<10;i++){ await p.waitForTimeout(60); samples.push(Math.round(await p.evaluate(()=>scrollY))); }
console.log('scrollY after one wheel tick:', samples.join(' → '));
const glided = samples[samples.length-1] - samples[0];
console.log(glided>0 ? `INERTIA: yes, kept moving ${glided}px after input stopped` : 'INERTIA: no — jumped and stopped');
await p.waitForTimeout(1600);
console.log('settled at scrollY', Math.round(await p.evaluate(()=>scrollY)), '| p =', (await p.evaluate(()=>window.__p||0)).toFixed ? '' : '');
await b.close(); srv.close();
