// Is the copy actually on top? Ask the browser what element occupies the pixels the words
// are drawn at. elementFromPoint returns the topmost thing at that point - if it comes back
// as the text, the text wins the stack; if it comes back as the canvas, it does not.
import http from 'http'; import fs from 'fs'; import path from 'path';
import { chromium } from 'playwright';
const ROOT='C:/EPA/US/website_project/_deploy';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp',
 '.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.woff2':'font/woff2',
 '.txt':'text/plain','.mp3':'audio/mpeg','.exr':'application/octet-stream','.wasm':'application/wasm'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
 fs.readFile(path.join(ROOT,p),(e,d)=>{if(e){r.writeHead(404);r.end();return;}
 r.writeHead(200,{'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream'});r.end(d);});});
await new Promise(r=>srv.listen(8242,r));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const pg=await b.newPage({viewport:{width:1850,height:975}});
await pg.goto('http://127.0.0.1:8242/cpolar_v5/',{waitUntil:'commit',timeout:60000});
await pg.waitForTimeout(23000);
await pg.evaluate(()=>scrollTo(0,1180)); await pg.waitForTimeout(3000);

const r = await pg.evaluate(()=>{
  const name = e => !e ? 'nothing' :
    e.tagName.toLowerCase() + (e.id?'#'+e.id:'') +
    (e.className && typeof e.className==='string' ? '.'+e.className.trim().split(/\s+/).slice(0,2).join('.') : '');
  const info = e => { const s=getComputedStyle(e), b=e.getBoundingClientRect();
    return {box:`${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}`,
            z:s.zIndex, pos:s.position, colour:s.color, op:s.opacity}; };
  const out={};
  for (const [k,sel] of [['line1','[data-animation="Title"]'],['line2','[data-animation="TextBlock"]']]) {
    const e=document.querySelector(sel); if(!e){out[k]='missing';continue;}
    const bb=e.getBoundingClientRect();
    const px=Math.round(bb.x+30), py=Math.round(bb.y+24);
    out[k]={...info(e), probeAt:`${px},${py}`, topmost:name(document.elementFromPoint(px,py))};
  }
  const cv=document.querySelector('canvas#scene');
  out.canvas = cv ? {...info(cv)} : 'none';
  const fd=document.querySelector('.cp-hero-field');
  out.heroField = fd ? {...info(fd)} : 'none';
  // anything clipping the copy?
  const clip=[];
  for (let n=document.querySelector('[data-animation="TextBlock"]'); n && n!==document.body; n=n.parentElement){
    const s=getComputedStyle(n);
    if (s.overflow!=='visible' || s.clipPath!=='none')
      clip.push(`${name(n)} overflow:${s.overflow} height:${Math.round(n.getBoundingClientRect().height)}`);
  }
  out.clippedBy = clip.length?clip:'nothing';
  return out;
});
console.log(JSON.stringify(r,null,1));
await b.close(); srv.close();
