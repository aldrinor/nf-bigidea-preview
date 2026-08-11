// The words are on top. So why do they read as sunk? Measure the contrast: sample the
// backdrop immediately around each line and compare it with the ink, on our page and on V1.
import http from 'http'; import fs from 'fs'; import path from 'path';
import { chromium } from 'playwright'; import { PNG } from 'pngjs';
const ROOT='C:/EPA/US/website_project/_deploy';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp',
 '.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.woff2':'font/woff2',
 '.txt':'text/plain','.mp3':'audio/mpeg','.exr':'application/octet-stream','.wasm':'application/wasm'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
 fs.readFile(path.join(ROOT,p),(e,d)=>{if(e){r.writeHead(404);r.end();return;}
 r.writeHead(200,{'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream'});r.end(d);});});
await new Promise(r=>srv.listen(8243,r));
const lum = (r,g,b) => { const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
  return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
const ratio = (a,b) => { const L1=Math.max(a,b), L2=Math.min(a,b); return (L1+0.05)/(L2+0.05); };
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const page of ['cpolar','cpolar_v5']) {
  const pg=await b.newPage({viewport:{width:1850,height:975}});
  await pg.goto(`http://127.0.0.1:8243/${page}/`,{waitUntil:'commit',timeout:60000});
  await pg.waitForTimeout(23000);
  await pg.evaluate(()=>scrollTo(0,1180)); await pg.waitForTimeout(3000);
  const boxes = await pg.evaluate(()=>{
    const o={}; for(const [k,s] of [['line1','[data-animation="Title"]'],['line2','[data-animation="TextBlock"]']]){
      const e=document.querySelector(s); const r=e.getBoundingClientRect();
      o[k]={x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
            colour:getComputedStyle(e).color}; }
    return o; });
  const f=`C:/Users/msn/AppData/Local/Temp/claude/C--EPA/cef4a9f6-3b6a-44ff-b67b-ef5aa0a12c86/scratchpad/${page}_c.png`;
  await pg.screenshot({path:f});
  const png=PNG.sync.read(fs.readFileSync(f));
  console.log('== ' + (page==='cpolar'?'V1':'OURS'));
  for (const k of ['line1','line2']) {
    const B=boxes[k];
    // the brightest pixels inside the text band are the backdrop showing between letters
    let best=0, n=0, sum=0;
    for (let y=B.y+6; y<B.y+B.h-6; y+=2) for (let x=B.x; x<B.x+B.w; x+=2) {
      if (x<0||y<0||x>=png.width||y>=png.height) continue;
      const i=(y*png.width+x)*4, L=lum(png.data[i],png.data[i+1],png.data[i+2]);
      if (L>best) best=L; sum+=L; n++;
    }
    const m=B.colour.match(/\d+/g).map(Number);
    const ink=lum(m[0],m[1],m[2]);
    console.log(`   ${k}  ink ${B.colour}  backdrop L ${best.toFixed(3)}  contrast ${ratio(ink,best).toFixed(2)}:1`);
  }
  await pg.close();
}
await b.close(); srv.close();
