import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
const PAGE='fungi_solution.html', OUTDIR=process.argv[2];
const WIDTHS=[1280,1440,1600,1863];
const ROOT=path.resolve('C:/EPA/US/website_project/_deploy');
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/'+PAGE; const fp=path.join(ROOT,u); if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');} r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream'); fs.createReadStream(fp).pipe(r);});
await new Promise(res=>srv.listen(0,res)); const port=srv.address().port;
const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
for(const W of WIDTHS){
  const p=await b.newPage({viewport:{width:W,height:1007},deviceScaleFactor:1});
  await p.goto(`http://localhost:${port}/${PAGE}`,{waitUntil:'domcontentloaded',timeout:45000}).catch(()=>{});
  await p.waitForTimeout(1500);
  const stack=await p.$('#videoStack');
  // full-panel shot WITH labels (video at t~0.3 clean for slab detection)
  await p.evaluate(()=>{const v=document.querySelector('video'); if(v){v.pause(); v.currentTime=0.3;}});
  await p.waitForTimeout(250);
  // report each label's rect center as fraction of panel, and the panel box
  const data=await p.evaluate(()=>{
    const stack=document.getElementById('videoStack'); const sb=stack.getBoundingClientRect();
    function c(sel){const e=document.querySelector(sel); if(!e) return null; const r=e.getBoundingClientRect(); return ((r.left+r.right)/2 - sb.left)/sb.width*100;}
    return {pw:sb.width, ph:sb.height, nf:c('.anno-lbl-nf'), cv:c('.anno-lbl-cv'), top:c('.anno-top')};
  });
  await stack.screenshot({path:path.join(OUTDIR,`w_${W}.png`)});
  console.log(JSON.stringify({W, ...data}));
  await p.close();
}
await b.close(); srv.close();
