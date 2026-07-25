import { chromium } from 'playwright';
const b = await chromium.launch({headless:true});
const p = await b.newPage({viewport:{width:1440,height:900}});
await p.goto('https://mont-fort.com/',{waitUntil:'networkidle',timeout:90000}).catch(()=>{});
await p.waitForTimeout(6000);
const g = await p.evaluate(()=>{
  const pick = (sel) => { const e=document.querySelector(sel); if(!e) return null;
    const cs=getComputedStyle(e), b=e.getBoundingClientRect();
    return { sel, w:Math.round(b.width), cols:cs.gridTemplateColumns.split(' ').length,
             colTpl:cs.gridTemplateColumns.slice(0,60), gap:cs.columnGap, pad:cs.padding,
             margin:cs.margin }; };
  const out = { grids: ['.grid','.container-menu','.hero-inner'].map(pick).filter(Boolean) };
  const h = document.querySelector('header'); const hb=h.getBoundingClientRect();
  out.header = { h:Math.round(hb.height), pad:getComputedStyle(h).padding, pos:getComputedStyle(h).position };
  // what sits in the first content section, and how it is set
  const s = document.querySelectorAll('main section');
  out.sectionHeights = [...s].slice(0,8).map(x=>Math.round(x.getBoundingClientRect().height));
  // text sizes actually used inside the chapters
  const seen = new Map();
  document.querySelectorAll('main p, main h1, main h2, main h3, main span').forEach(e=>{
    const t=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join('').trim();
    if(!t || t.length<3) return;
    const cs=getComputedStyle(e);
    const k=`${Math.round(parseFloat(cs.fontSize))}px w${cs.fontWeight} ${cs.fontFamily.split(',')[0].replace(/"/g,'')}`;
    if(!seen.has(k)) seen.set(k, t.slice(0,42));
  });
  out.type = [...seen.entries()].sort((a,b)=>parseFloat(b[0])-parseFloat(a[0])).slice(0,8);
  return out;
});
console.log('header:', JSON.stringify(g.header));
g.grids.forEach(x=>console.log(`${x.sel.padEnd(18)} w=${x.w} cols=${x.cols} gap=${x.gap} pad=${x.pad}`));
console.log('section heights:', g.sectionHeights.join(', '));
console.log('type in chapters:');
g.type.forEach(([k,v])=>console.log(`  ${k.padEnd(34)} "${v}"`));
await b.close();
