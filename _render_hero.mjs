// Reusable REAL render of home_hero.html -> PNG. Usage: node _render_hero.mjs <outPath> [waitMs] [w] [h]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
const OUT = process.argv[2] || 'C:/Users/msn/AppData/Local/Temp/claude/C--EPA/f3bbf90a-c1cd-4e2b-8d8c-3f6ec97a4d6a/scratchpad/hero_render.png';
const WAIT = parseInt(process.argv[3] || '5000', 10);
const W = parseInt(process.argv[4] || '1440', 10);
const H = parseInt(process.argv[5] || '900', 10);
const ROOT = path.resolve('C:/EPA/US/website_project/_deploy');
const MIME = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.mjs':'text/javascript'};
const srv = http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/home_hero.html'; const fp=path.join(ROOT,u); if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');} r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream'); fs.createReadStream(fp).pipe(r);});
await new Promise(res=>srv.listen(0,res)); const port=srv.address().port;
const b = await chromium.launch({headless:true, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox']});
const p = await b.newPage({viewport:{width:W,height:H}, deviceScaleFactor:2});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`http://localhost:${port}/home_hero.html`,{waitUntil:'load'});
await p.waitForTimeout(WAIT);
await p.screenshot({path:OUT});
console.log('rendered '+OUT+' errors='+errs.length+(errs.length?' :: '+errs[0].slice(0,120):''));
await b.close(); srv.close();
