// Render ANY local page in _deploy -> PNG. Usage: node _render_page.mjs <page.html> <outPath> <waitMs> [w] [h] [mx] [my]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
const PAGE = process.argv[2];
const OUT = process.argv[3];
const WAIT = parseInt(process.argv[4] || '3000', 10);
const W = parseInt(process.argv[5] || '1440', 10);
const H = parseInt(process.argv[6] || '900', 10);
const MX = process.argv[7] ? parseInt(process.argv[7], 10) : null;
const MY = process.argv[8] ? parseInt(process.argv[8], 10) : null;
const ROOT = path.resolve('C:/EPA/US/website_project/_deploy');
const MIME = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.mjs':'text/javascript','.mp4':'video/mp4','.webm':'video/webm'};
const srv = http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/'+PAGE; const fp=path.join(ROOT,u); if(!fp.startsWith(ROOT)||!fs.existsSync(fp)||fs.statSync(fp).isDirectory()){r.statusCode=404;return r.end('nf');} r.setHeader('Content-Type',MIME[path.extname(fp)]||'application/octet-stream'); fs.createReadStream(fp).pipe(r);});
await new Promise(res=>srv.listen(0,res)); const port=srv.address().port;
const b = await chromium.launch({headless:true, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox','--autoplay-policy=no-user-gesture-required']});
const p = await b.newPage({viewport:{width:W,height:H}, deviceScaleFactor:2});
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(`http://localhost:${port}/${PAGE}`,{waitUntil:'domcontentloaded',timeout:45000}).catch(()=>{});
await p.waitForTimeout(WAIT);
if(MX!==null){ await p.mouse.move(MX-120, MY-40, {steps:8}); await p.mouse.move(MX, MY, {steps:14}); await p.waitForTimeout(700); }
await p.screenshot({path:OUT, timeout:60000, animations:'disabled', caret:'hide'});
console.log('rendered '+PAGE+' -> '+OUT+' errors='+errs.length+(errs.length?' :: '+errs[0].slice(0,140):''));
await b.close(); srv.close();
