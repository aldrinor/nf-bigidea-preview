import { chromium } from 'playwright';
const b = await chromium.launch({headless:true});
const p = await b.newPage({viewport:{width:1440,height:900}});
await p.goto('https://mont-fort.com/',{waitUntil:'networkidle',timeout:90000}).catch(e=>console.log('nav',e.message));
await p.waitForTimeout(6000);
const out = await p.evaluate(()=>{
  const r = {};
  r.bodyH = document.body.scrollHeight;
  r.vh = innerHeight;
  // top-level structure
  const walk = (el, d=0) => {
    if (d > 3) return null;
    const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (b.width < 40 || b.height < 20) return null;
    return {
      tag: el.tagName.toLowerCase(),
      cls: (el.className||'').toString().slice(0,44),
      w: Math.round(b.width), h: Math.round(b.height),
      pos: cs.position, disp: cs.display,
      kids: [...el.children].map(c=>walk(c,d+1)).filter(Boolean).slice(0,8)
    };
  };
  r.tree = [...document.body.children].map(c=>walk(c)).filter(Boolean);
  // section rhythm
  r.sections = [...document.querySelectorAll('section,[class*=section],[class*=Section]')]
    .map(s=>{ const b=s.getBoundingClientRect(); const cs=getComputedStyle(s);
      return { cls:(s.className||'').toString().slice(0,40), h:Math.round(b.height),
               pos:cs.position, pad:cs.padding }; }).slice(0,14);
  return r;
});
console.log('page height', out.bodyH, '=', (out.bodyH/out.vh).toFixed(1), 'viewports');
const show = (n, d=0) => { console.log('  '.repeat(d) + `${n.tag}.${n.cls} ${n.w}x${n.h} ${n.pos}/${n.disp}`);
  (n.kids||[]).forEach(k=>show(k,d+1)); };
out.tree.forEach(n=>show(n));
console.log('\nsections:');
out.sections.forEach(s=>console.log(`  ${s.cls.padEnd(40)} h=${s.h} ${s.pos}`));
await b.close();
