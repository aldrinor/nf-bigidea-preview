// Render home_hero.html WITH the cursor active over the surface, to see the charge zone + dust pull.
// Usage: node _render_cursor.mjs <outPath> <waitMs> <mx> <my> [w] [h]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
const OUT = process.argv[2];
const WAIT = parseInt(process.argv[3] || '1500', 10);
const MX = parseInt(process.argv[4] || '1000', 10);
const MY = parseInt(process.argv[5] || '680', 10);
const W = parseInt(process.argv[6] || '1440', 10);
const H = parseInt(process.argv[7] || '900', 10);
const ROOT = path.resolve('C:/EPA/US/website_project/_deploy');
const MIME = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.mjs':'text/javascript'};
const srv = http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/home_hero.html'; const fp=path.join(ROOT,u); if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');} r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream'); fs.createReadStream(fp).pipe(r);});
await new Promise(res=>srv.listen(0,res)); const port=srv.address().port;
const b = await chromium.launch({headless:true, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']});
const p = await b.newPage({viewport:{width:W,height:H}, deviceScaleFactor:2});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`http://localhost:${port}/home_hero.html`,{waitUntil:'domcontentloaded',timeout:45000}).catch(()=>{});
await p.waitForTimeout(1200);
// drag a short path into the target so a comet trail + charge zone build up, then settle on the point
await p.mouse.move(MX-140, MY-60, {steps: 8});
await p.mouse.move(MX, MY, {steps: 14});
await p.waitForTimeout(WAIT);
await p.screenshot({path:OUT, timeout:60000, animations:'disabled', caret:'hide'});
console.log('rendered '+OUT+' cursor=('+MX+','+MY+') errors='+errs.length+(errs.length?' :: '+errs[0].slice(0,120):''));
await b.close(); srv.close();
