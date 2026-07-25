import { chromium } from 'playwright';
const b = await chromium.launch({headless:true});
const p = await b.newPage({viewport:{width:1440,height:900}, deviceScaleFactor:1});
await p.goto('https://mont-fort.com/', {waitUntil:'networkidle', timeout:90000}).catch(e=>console.log('nav:',e.message));
await p.waitForTimeout(6000);
const out = await p.evaluate(()=>{
  const seen=[];
  for (const el of document.querySelectorAll('body *')){
    const r = el.getBoundingClientRect();
    if (r.width<=0 || r.height<=0) continue;
    if (r.bottom<0 || r.top>window.innerHeight) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility==='hidden' || cs.opacity==='0' || cs.display==='none') continue;
    // only elements whose own text is a direct child
    const txt = Array.from(el.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ').trim();
    if (!txt) continue;
    seen.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className||'').toString().slice(0,40),
      fs: parseFloat(cs.fontSize),
      fw: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing,
      ff: cs.fontFamily.split(',')[0].replace(/["']/g,''),
      color: cs.color,
      w: Math.round(r.width), x: Math.round(r.left), y: Math.round(r.top),
      t: txt.slice(0,60)
    });
  }
  seen.sort((a,b)=>b.fs-a.fs);
  return {vw: window.innerWidth, root: parseFloat(getComputedStyle(document.documentElement).fontSize), items: seen.slice(0,18)};
});
console.log('viewport', out.vw, 'root font-size', out.root);
for (const i of out.items) console.log(`${String(i.fs).padStart(6)}px  w${String(i.fw).padStart(4)}  lh:${i.lh.padEnd(7)} ls:${i.ls.padEnd(8)} x:${String(i.x).padStart(4)} boxw:${String(i.w).padStart(4)}  ${i.ff.padEnd(18)} ${i.color.padEnd(20)} "${i.t}"`);
await b.close();
