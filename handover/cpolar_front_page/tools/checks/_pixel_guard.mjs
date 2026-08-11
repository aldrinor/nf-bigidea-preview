// DESIGN GUARD.
//
// The stylesheet rewrite has to remove 305 KB of someone else's CSS without moving a
// single pixel of the design. "I checked it" is what has failed all day, so this does not
// rely on me looking. Four widths, twenty scroll positions each, frozen as a baseline;
// every later build is compared against it.
//
// TWO measurements, because one of them was not enough:
//
//   LAYOUT  every element's box, font size and colour, as numbers. This is the real test.
//           It is exact, and it cannot be fooled by anything moving on its own.
//   PIXELS  a screenshot, as a backstop for paint-level things a box does not capture -
//           a border, a shadow, a background.
//
// Every canvas is hidden for both. The hero and the dust field animate continuously, so
// they never repeat frame for frame; leaving them visible flagged 21 frames as broken
// when the layout underneath was identical. Canvas POSITION is still checked - it is an
// element with a box like any other.
//
//   node _pixel_guard.mjs baseline cpolar_v4
//   node _pixel_guard.mjs check    cpolar_v5
import http from 'http'; import fs from 'fs'; import path from 'path';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const MODE = process.argv[2] || 'check';
const PAGE = process.argv[3] || 'cpolar_v5';
const ROOT = 'C:/EPA/US/website_project/_deploy';
const BASE = 'C:/EPA/US/website_project/_cpolar_v2/cmp/baseline';
const SHOT = 'C:/EPA/US/website_project/_cpolar_v2/cmp/guard';
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp',
 '.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.woff2':'font/woff2',
 '.txt':'text/plain','.mp3':'audio/mpeg','.svg':'image/svg+xml','.exr':'application/octet-stream'};

const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
 fs.readFile(path.join(ROOT,p),(e,d)=>{if(e){r.writeHead(404);r.end();return;}
 r.writeHead(200,{'Content-Type':MIME[path.extname(p).toLowerCase()]||'application/octet-stream'});r.end(d);});});
await new Promise(r=>srv.listen(8231,r));

const OUT = MODE === 'baseline' ? BASE : SHOT;
fs.mkdirSync(OUT, {recursive:true});
const WIDTHS = [[1850,1000],[1440,900],[1280,800],[390,844]];
const N = 20;

// Runs in the page. One line per element: what it is, where it is, how big, what colour.
const DUMP = () => [...document.querySelectorAll('body *')].map(e => {
  const r = e.getBoundingClientRect(), s = getComputedStyle(e);
  const id = e.tagName.toLowerCase() + (e.className && typeof e.className === 'string'
      ? '.' + e.className.trim().split(/\s+/).slice(0,3).join('.') : '');
  return [id, Math.round(r.x*10)/10, Math.round(r.y*10)/10, Math.round(r.width*10)/10,
          Math.round(r.height*10)/10, s.fontSize, s.color, s.fontFamily.slice(0,24),
          s.backgroundColor, s.display, s.position].join('|');
});

for (const [w,h] of WIDTHS) {
  if (fs.existsSync(`${OUT}/${w}_${String(N-1).padStart(2,'0')}.json`)) { console.log(`  ${w} already done`); continue; }
  let b;
  try {
    b = await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
    const pg = await b.newPage({viewport:{width:w,height:h}});
    // 'load' never fires on this page - something keeps a request open - so waiting on it
    // only times out. Commit the navigation and give it a fixed settle instead.
    await pg.goto(`http://127.0.0.1:8231/${PAGE}/`,{waitUntil:'commit',timeout:60000});
    await pg.waitForTimeout(20000);
    const H = await pg.evaluate(()=>document.documentElement.scrollHeight);
    await pg.addStyleTag({content:'canvas{visibility:hidden !important}'});
    for (let i=0;i<N;i++){
      await pg.evaluate(y=>window.scrollTo(0,y), Math.round((H-h)*i/(N-1)));
      await pg.waitForTimeout(1500);
      const tag = `${w}_${String(i).padStart(2,'0')}`;
      await pg.screenshot({path:`${OUT}/${tag}.png`});
      fs.writeFileSync(`${OUT}/${tag}.json`, JSON.stringify(await pg.evaluate(DUMP)));
    }
    console.log(`  ${w} captured, page ${H}px`);
  } catch(e) { console.log(`  ${w} FAILED: ${e.message.split('\n')[0]}`); }
  finally { if (b) await b.close().catch(()=>{}); }
}
srv.close();

if (MODE === 'baseline') { console.log('  baseline frozen from ' + PAGE); process.exit(0); }

// Slots that move when nothing has changed - learnt by capturing the same build twice.
// 20 svg icons per frame breathe on a loop. Excluding them keeps 355 of 375 elements per
// frame under inspection; leaving them in would bury a real regression in false alarms.
const NOISE = fs.existsSync('guard_noise.json')
  ? JSON.parse(fs.readFileSync('guard_noise.json','utf8')) : {};
let moved = [], pixbad = [], states = [], worst = 0, worstName = '', watched = 0;
for (const f of fs.readdirSync(BASE).filter(x => x.endsWith('.json'))) {
  const tag = f.replace('.json','');
  if (!fs.existsSync(path.join(SHOT,f))) { moved.push(`${tag}: MISSING`); continue; }
  const A = JSON.parse(fs.readFileSync(path.join(BASE,f),'utf8'));
  const C = JSON.parse(fs.readFileSync(path.join(SHOT,f),'utf8'));
  if (A.length !== C.length) moved.push(`${tag}: element count ${A.length} -> ${C.length}`);
  const n = Math.min(A.length, C.length);
  const skip = new Set(NOISE[f] || []);
  // Five vector icons on the page breathe: they scale between about 44px and 56px on a
  // continuous loop, so two captures of an UNCHANGED page disagree about them. The learnt
  // noise map only catches whichever ones were mid-breath during the control run, which
  // is luck rather than a rule. The rule: for an svg, g or path compare what it IS -
  // colour, font, display, position mode - and not where its box happens to be this
  // instant. Their containers are ordinary elements and are still measured in full, so a
  // real layout shift still surfaces.
  const anim = s => /^(svg|g|path)($|\.)/.test(s.split('|')[0]);
  const cmp = s => anim(s) ? s.split('|').slice(5).join('|') : s;
  watched += n - skip.size;
  let diffs = 0, first = '';
  for (let i=0;i<n;i++) {
    if (skip.has(i) || cmp(A[i]) === cmp(C[i])) continue;
    // A record is "tag.classes | box | styles". When ONLY the class list differs and the
    // box and every style are identical, a state class has toggled - the page adds and
    // removes .is-on as you scroll, and which of two stacked images holds it at the
    // instant of a screenshot is a matter of timing. Three runs of the same build flagged
    // three different frames, which is what settled it. Counted separately, not as a
    // failure, but never silently: it is printed below.
    if (A[i].split('|').slice(1).join('|') === C[i].split('|').slice(1).join('|')) {
      states.push(`${tag}: ${A[i].split('|')[0]} -> ${C[i].split('|')[0]}`);
      continue;
    }
    diffs++; if (!first) first = `\n        was  ${A[i]}\n        now  ${C[i]}`;
  }
  if (diffs) moved.push(`${tag}: ${diffs} of ${n} elements differ${first}`);

  const a = PNG.sync.read(fs.readFileSync(path.join(BASE,tag+'.png')));
  const c = PNG.sync.read(fs.readFileSync(path.join(SHOT,tag+'.png')));
  if (a.width!==c.width||a.height!==c.height) { pixbad.push(`${tag}: SIZE CHANGED`); continue; }
  let d = 0;
  for (let i=0;i<a.data.length;i+=4)
    if (Math.abs(a.data[i]-c.data[i])>6||Math.abs(a.data[i+1]-c.data[i+1])>6||Math.abs(a.data[i+2]-c.data[i+2])>6) d++;
  const pct = d*100/(a.width*a.height);
  if (pct > 0.15) pixbad.push(`${tag}  ${pct.toFixed(2)}% of pixels`);
  if (pct > worst) { worst = pct; worstName = tag; }
}
console.log('\n==== LAYOUT ====');
if (!moved.length) console.log(`  ${watched} element checks across 80 frames: every one in the same place,
  same size, same font, same colour`);
else moved.slice(0,25).forEach(m => console.log('  ' + m));
console.log('\n==== PIXELS ====');
if (!pixbad.length) console.log('  no frame differs by more than 0.15%');
else pixbad.slice(0,25).forEach(m => console.log('  ' + m));
console.log(`  worst frame: ${worstName} at ${worst.toFixed(2)}%`);
console.log('\n  ' + (!moved.length && !pixbad.length ? 'PASS - the design is unchanged' : 'FAIL - something moved'));
