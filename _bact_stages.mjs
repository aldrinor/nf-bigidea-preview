import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
const PAGE='bacteria_solution.html', OUTDIR=process.argv[2], W=parseInt(process.argv[3]||'1440',10);
const ROOT=path.resolve('C:/EPA/US/website_project/_deploy');
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/'+PAGE; const fp=path.join(ROOT,u); if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');} r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream'); fs.createReadStream(fp).pipe(r);});
await new Promise(res=>srv.listen(0,res)); const port=srv.address().port;
const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:W,height:1007},deviceScaleFactor:1});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`http://localhost:${port}/${PAGE}`,{waitUntil:'domcontentloaded',timeout:45000}).catch(()=>{});
await p.waitForTimeout(1000);
const stack=await p.$('#videoStack');
async function snap(tag, seekT){
  await p.evaluate(t=>{const v=document.querySelector('video'); v.pause(); v.currentTime=t;}, seekT);
  await p.waitForTimeout(500);
  await p.evaluate(()=>{ const v=document.querySelector('video'); v.dispatchEvent(new Event('timeupdate')); });
  await p.waitForTimeout(450);
  const d=await p.evaluate(()=>{const s=document.getElementById('videoStack'); const sb=s.getBoundingClientRect(); const c=q=>{const e=document.querySelector(q); if(!e)return null; const r=e.getBoundingClientRect(); return {x:+(((r.left+r.right)/2-sb.left)/sb.width*100).toFixed(1), y:+(((r.top+r.bottom)/2-sb.top)/sb.height*100).toFixed(1)};}; return {test:document.getElementById('annoTest').textContent, nf:c('.anno-lbl-nf'), cv:c('.anno-lbl-cv')};});
  await stack.screenshot({path:path.join(OUTDIR,tag+'.png')});
  console.log(W+' '+tag+' ct='+seekT+' test="'+d.test+'" nf='+JSON.stringify(d.nf)+' cv='+JSON.stringify(d.cv));
}
await snap('dust', 2.5);
await snap('aging', 11);
await snap('water', 19);
console.log('errs='+errs.length);
await b.close(); srv.close();
