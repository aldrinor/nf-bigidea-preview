// Capture an EXTERNAL url with cursor motion -> PNG frames. Usage: node capture_ext.mjs <url> <outDir> [nFrames] [ms] [w] [h]
import fs from 'node:fs'; import path from 'node:path';
import { chromium } from 'playwright';
const URL = process.argv[2];
const OUTDIR = process.argv[3];
const N = parseInt(process.argv[4] || '26', 10);
const IV = parseInt(process.argv[5] || '130', 10);
const W = parseInt(process.argv[6] || '1280', 10);
const H = parseInt(process.argv[7] || '800', 10);
fs.mkdirSync(OUTDIR, { recursive: true });
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-sandbox'] });
const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(String(e)));
try { await p.goto(URL, { waitUntil: 'networkidle', timeout: 45000 }); } catch(e){ try{ await p.goto(URL, {waitUntil:'domcontentloaded', timeout:30000}); }catch(e2){} }
await p.waitForTimeout(3500);
const cx = W/2, cy = H/2, R = Math.min(W,H)*0.28;
await p.mouse.move(cx, cy, { steps: 4 });
for (let i = 0; i < N; i++) {
  const a = i * 0.42;
  await p.mouse.move(cx + Math.cos(a)*R, cy + Math.sin(a)*R*0.7, { steps: 4 });
  await p.screenshot({ path: path.join(OUTDIR, 'f'+String(i).padStart(3,'0')+'.png') });
  await p.waitForTimeout(IV);
}
console.log('captured '+N+' frames from '+URL+' errors='+errs.length+(errs.length?' :: '+errs[0].slice(0,100):''));
await b.close();
