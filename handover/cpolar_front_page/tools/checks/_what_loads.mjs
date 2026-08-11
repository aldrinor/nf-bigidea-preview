// Every file the page actually asks for, recorded from the network rather than guessed
// by reading the markup. A file sitting in the folder unreferenced is a different problem
// from a file being served, and the two need separating.
import http from 'http'; import fs from 'fs'; import path from 'path';
import { chromium } from 'playwright';
const PAGE = process.argv[2] || 'cpolar_v5';
const ROOT='C:/EPA/US/website_project/_deploy';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp',
 '.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.woff2':'font/woff2',
 '.txt':'text/plain','.mp3':'audio/mpeg','.svg':'image/svg+xml','.exr':'application/octet-stream',
 '.wasm':'application/wasm'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
 fs.readFile(path.join(ROOT,p),(e,d)=>{if(e){r.writeHead(404);r.end();return;}
 r.writeHead(200,{'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream'});r.end(d);});});
await new Promise(r=>srv.listen(8232,r));
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const pg=await b.newPage({viewport:{width:1850,height:1000}});
const got=new Map();
pg.on('response', r => got.set(r.url(), r.status()));
await pg.goto(`http://127.0.0.1:8232/${PAGE}/`,{waitUntil:'commit',timeout:60000});
await pg.waitForTimeout(20000);
// scroll the whole page so anything lazy-loaded is pulled in too
const H = await pg.evaluate(()=>document.documentElement.scrollHeight);
for (let i=0;i<24;i++){ await pg.evaluate(y=>scrollTo(0,y), Math.round(H*i/23)); await pg.waitForTimeout(700); }
const local=[...got].filter(([u])=>u.includes('127.0.0.1')).map(([u,s])=>[u.split(`/${PAGE}/`)[1]||'index.html',s]);
const remote=[...got].filter(([u])=>!u.includes('127.0.0.1'));
console.log(`${PAGE}: ${local.length} files from this folder, ${remote.length} from elsewhere\n`);
console.log('FROM THIS FOLDER:');
for (const [f,s] of local.sort()) console.log(`   ${s}  ${f}`);
console.log('\nFROM ELSEWHERE:');
for (const [u,s] of remote.sort()) console.log(`   ${s}  ${u}`);
await b.close(); srv.close();
