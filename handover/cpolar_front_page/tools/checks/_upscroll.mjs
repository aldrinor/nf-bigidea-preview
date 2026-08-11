// Scroll down past the hero, then come back UP. The header logic is a threshold on scroll
// position, and the engine writes to the header too - if the two disagree on the way back
// up, that is where it shows.
import { chromium } from 'playwright'; import fs from 'fs';
const OUT='C:/EPA/US/website_project/_cpolar_v2/cmp/up'; fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const pg=await b.newPage({viewport:{width:1863,height:1003}});
const errs=[]; pg.on('pageerror',e=>errs.push(String(e.message).slice(0,80)));
await pg.goto('https://aldrinor.github.io/nf-bigidea-preview/cpolar_v5/',{waitUntil:'commit',timeout:90000});
await pg.waitForTimeout(26000);
const read = async () => pg.evaluate(()=>{
  const hd=document.querySelector('header'); const s=getComputedStyle(hd);
  return { y:Math.round(window.scrollY), op:parseFloat(s.opacity),
           top:Math.round(hd.getBoundingClientRect().top) }; });
await pg.evaluate(()=>scrollTo(0,2600)); await pg.waitForTimeout(3000);
console.log('after going down to 2600:', JSON.stringify(await read()));
// now come back up in wheel steps
await pg.mouse.move(930,500);
let seen=null;
for (let k=0;k<40;k++){
  await pg.mouse.wheel(0,-120); await pg.waitForTimeout(200);
  const r=await read();
  if (r.y>500 && r.op>0.05 && (!seen || r.op>seen.op)) { seen=r; await pg.screenshot({path:`${OUT}/up_${r.y}.png`}); }
}
console.log('errors:', errs.length?[...new Set(errs)].join(' | '):'none');
console.log(seen ? `HEADER SHOWS ON THE WAY BACK UP: scrollY ${seen.y}, opacity ${seen.op}, top ${seen.top}`
                 : 'header stayed hidden coming back up too');
await b.close();
