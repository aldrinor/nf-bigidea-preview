# -*- coding: utf-8 -*-
"""Rebuild stop 2 and stop 3 on REAL photographed cloud plates.

Why: painted canvas noise scored 3/10 and 2/10. Screen 1 already taught this lesson —
procedural terrain plateaued, an authored photoreal plate jumped it. Same fix here.
The plate IS the scene; only the charged particles are drawn live.
"""
import io

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
  :root{
    --rail: clamp(50px, 13.7vw, 300px);
    --bg:#edf0f2; --ink:#1f2327; --headline-ink:#1a1a1a; --muted:#8a9095; --accent:#1b7bff;
    --stack:-apple-system, system-ui, 'Inter', 'Space Grotesk', sans-serif;
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%;overflow:hidden;background:var(--bg);
    font-family:var(--stack);-webkit-font-smoothing:antialiased;color:var(--ink)}
  /* the plate IS the scene — real photographed cloud, full bleed, no painted noise */
  #plate{position:fixed;left:-4%;top:-4%;width:108%;height:108%;object-fit:cover;z-index:0;
    __PLATEFX__}
  /* one soft veil only, to seat the copy — never enough to flatten the photograph */
  #veil{position:fixed;inset:0;z-index:1;pointer-events:none;
    background:linear-gradient(100deg, rgba(238,242,246,.92) 0%, rgba(238,242,246,.64) 26%,
      rgba(238,242,246,.10) 48%, rgba(238,242,246,0) 62%);}
  #dust{position:fixed;inset:0;z-index:2;pointer-events:none}
  .chrome{position:fixed;inset:0;z-index:4;padding:clamp(52px,6.4vw,92px) var(--rail)}
  .navshelf{position:absolute;left:0;right:0;top:0;height:clamp(96px,11vw,150px);
    background:linear-gradient(180deg, rgba(240,244,248,.88) 0%, rgba(240,244,248,0) 100%);
    pointer-events:none}
  nav{position:relative;display:flex;align-items:center;gap:clamp(18px,2.4vw,40px);flex-wrap:wrap}
  nav a{font-size:13px;letter-spacing:.075em;text-decoration:none;color:var(--muted);
    padding-bottom:6px;transition:color .2s}
  nav a:hover{color:var(--ink)}
  nav a.on{color:var(--ink);border-bottom:2px solid var(--accent)}
  .lockup{position:absolute;left:var(--rail);top:56%;transform:translateY(-50%);max-width:min(30ch,40vw)}
  h2{font-size:clamp(24px,2.7vw,34px);font-weight:600;line-height:1.32;letter-spacing:-.022em;
    color:var(--headline-ink);margin:0 0 clamp(16px,2vh,24px)}
  h2 em{font-style:normal;color:var(--accent)}
  p{font-size:clamp(16px,1.5vw,19px);line-height:1.55;color:var(--ink);margin:0;max-width:44ch}
  .cue{position:absolute;left:var(--rail);bottom:clamp(52px,6.4vw,92px);
    font-size:11.5px;letter-spacing:.14em;color:var(--muted)}
__EXTRACSS__
  @media (max-width:760px){
    nav{gap:14px} .lockup{max-width:none;right:var(--rail);top:52%}
    #veil{background:linear-gradient(180deg, rgba(238,242,246,.94) 0%, rgba(238,242,246,.55) 46%, rgba(238,242,246,0) 72%)}
  }
  @media (prefers-reduced-motion:reduce){ #dust{display:none} }
</style>
</head>
<body>
<img id="plate" src="__PLATE__" alt="__ALT__">
<div id="veil"></div>
<canvas id="dust"></canvas>
__EXTRAHTML__
<div class="chrome">
  <div class="navshelf"></div>
  <nav aria-label="Applications">
    <a class="on" href="#">C-POLAR</a>
    <a href="#">Air</a><a href="#">Water</a><a href="#">Protective Wear</a>
    <a href="#">Food Packaging</a><a href="#">Medical Devices</a>
  </nav>
  <div class="lockup">
__COPY__
  </div>
  <span class="cue">__CUE__</span>
</div>

<script>
/* Particles only. The cloud is a photograph, not painted noise — painted noise is what
   held screens 2 and 3 at 3/10 and 2/10. */
const dc=document.getElementById('dust'), dx=dc.getContext('2d');
let parts=[];
const SPRITES=(function(){var out=[];
  for(var i=0;i<6;i++){
    var soft=i/5, R=Math.round(10+soft*22), S=R*2;
    var c=document.createElement('canvas'); c.width=c.height=S; var g=c.getContext('2d');
    var grd=g.createRadialGradient(R,R,0,R,R,R);
    grd.addColorStop(0,'rgba(38,52,66,1)');
    grd.addColorStop(Math.max(0.05,0.42-soft*0.36),'rgba(38,52,66,0.92)');
    grd.addColorStop(1,'rgba(38,52,66,0)');
    g.fillStyle=grd; g.beginPath(); g.arc(R,R,R,0,Math.PI*2); g.fill(); out.push(c);
  } return out;})();
function sizeDust(){
  var dpr=Math.min(devicePixelRatio||1,2);
  dc.width=Math.floor(innerWidth*dpr); dc.height=Math.floor(innerHeight*dpr);
  dc.style.width=innerWidth+'px'; dc.style.height=innerHeight+'px';
  dx.setTransform(dpr,0,0,dpr,0,0);
  var n = innerWidth<760 ? __NMOB__ : __NDESK__;
  parts=[]; for(var i=0;i<n;i++) parts.push(spawn(true));
}
__PHYSICS__
sizeDust(); addEventListener('resize', sizeDust);
var t0=performance.now(), last=t0, frames=0, winStart=t0;
function frame(now){
  var t=(now-t0)/1000, dt=Math.min(0.05,(now-last)/1000); last=now;
  dx.clearRect(0,0,innerWidth,innerHeight);
  parts.sort(function(a,b){return a.depth-b.depth;});
__STEP__
  frames++;
  if(now-winStart>=1000){ window.__fps=Math.round(frames*1000/(now-winStart)); frames=0; winStart=now; }
  requestAnimationFrame(frame);
}
if(!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(frame);
window.__ready=true;
</script>
</body>
</html>
"""

DRAW = """
    var sp=SPRITES[Math.min(5,Math.round((1-p.depth)*5))];
    var sz=p.r*(3.0+(1-p.depth)*3.4);
    dx.globalAlpha=p.a; dx.drawImage(sp,p.x-sz/2,p.y-sz/2,sz,sz);
    if(p.depth>0.955 && p.mark){
      var rr=p.r*1.45, gx=p.x+p.r*2.9;
      dx.globalAlpha=p.a*0.80; dx.strokeStyle='rgba(38,52,66,1)';
      dx.lineWidth=Math.max(0.7,p.r*0.20);
      dx.beginPath(); dx.arc(gx,p.y,rr,0,Math.PI*2); dx.stroke();
      dx.beginPath(); dx.moveTo(gx-rr*0.52,p.y); dx.lineTo(gx+rr*0.52,p.y); dx.stroke();
    }
    dx.globalAlpha=1;"""

# ---------------- STOP 2 : drifting in the cloud ----------------
s2_phys = """
function spawn(anywhere){
  var depth=Math.pow(Math.random(),0.7);
  return { x:Math.random()*innerWidth, y: anywhere?Math.random()*innerHeight:-50,
    r:0.35+Math.pow(depth,3.6)*10.0, vy:4+depth*20, drift:(Math.random()-0.5)*16,
    ph:Math.random()*Math.PI*2, jit:0.5+Math.random()*1.6,
    a:0.10+Math.pow(depth,1.8)*0.60, mark:Math.random()<0.22, depth:depth };
}"""
s2_step = """
  for(var i=0;i<parts.length;i++){
    var p=parts[i];
    p.y+=p.vy*dt; p.x+=Math.sin(t*0.22+p.ph)*p.drift*p.jit*dt;
    if(p.y>innerHeight+60){ parts[i]=spawn(false); continue; }""" + DRAW + """
  }"""

s2 = (TEMPLATE
  .replace("__TITLE__", "Peak to Particle - inside the cloud")
  .replace("__PLATE__", "./hero_img/cloud_in.png")
  .replace("__ALT__", "Dense billowing cloud seen from inside it.")
  .replace("__PLATEFX__", "filter:contrast(1.02) brightness(1.02);")
  .replace("__EXTRACSS__", "")
  .replace("__EXTRAHTML__", "")
  .replace("__COPY__", """    <h2>Most pollutants carry <em>a negative charge</em>.</h2>
    <p>The microbes and smoke in the air, the PFAS in water, the biofilm on a surface &mdash;
       completely different problems that mostly share one trait: a negative charge.</p>""")
  .replace("__CUE__", "KEEP DESCENDING")
  .replace("__NMOB__", "34").replace("__NDESK__", "78")
  .replace("__PHYSICS__", s2_phys).replace("__STEP__", s2_step))
io.open("stop2.html", "w", encoding="utf-8").write(s2)

# ---------------- STOP 3 : the capture, into cleared air ----------------
s3_phys = """
/* CAPTURE: each particle is drawn to the material, held on contact, and fades as it is
   taken out of the airstream. The plate already shows the cloud torn open behind it. */
function spawn(anywhere){
  var depth=Math.pow(Math.random(),0.7), x, y;
  if(anywhere){ x=Math.random()*innerWidth; y=Math.random()*innerHeight; }
  else { var s=(Math.random()*4)|0;
    if(s===0){x=Math.random()*innerWidth;y=-60;}
    else if(s===1){x=Math.random()*innerWidth;y=innerHeight+60;}
    else if(s===2){x=-60;y=Math.random()*innerHeight;}
    else {x=innerWidth+60;y=Math.random()*innerHeight;} }
  return { x:x, y:y, r:0.35+Math.pow(depth,3.6)*10.0, vy:3+depth*12,
    drift:(Math.random()-0.5)*14, ph:Math.random()*Math.PI*2, jit:0.5+Math.random()*1.6,
    a:0.10+Math.pow(depth,1.8)*0.60, mark:Math.random()<0.26, held:0, depth:depth };
}"""
s3_step = """
  var CX=innerWidth*0.615, CY=innerHeight*0.50;
  for(var i=0;i<parts.length;i++){
    var p=parts[i];
    var ddx=CX-p.x, ddy=CY-p.y, dist=Math.max(26,Math.sqrt(ddx*ddx+ddy*ddy));
    var pull=(1600/dist)*(0.55+p.depth*0.90);
    p.x+=(ddx/dist)*pull*dt; p.y+=(ddy/dist)*pull*dt;
    var grip=Math.min(1,220/dist);
    p.y+=p.vy*dt*(1-grip)*0.5;
    p.x+=Math.sin(t*0.22+p.ph)*p.drift*p.jit*dt*(1-grip);
    if(dist<40){ p.held+=dt; p.a*=(1-dt*1.8); }
    if(p.held>0.6 || p.y>innerHeight+80 || p.y<-160 || p.x<-160 || p.x>innerWidth+160){
      parts[i]=spawn(false); continue; }""" + DRAW + """
  }"""

s3 = (TEMPLATE
  .replace("__TITLE__", "Peak to Particle - the charge captures them")
  .replace("__PLATE__", "./hero_img/cloud_clear.png")
  .replace("__ALT__", "Cloud torn open around a clearing of pure calm air.")
  .replace("__PLATEFX__", "filter:contrast(1.02) brightness(1.03);")
  .replace("__EXTRACSS__", """  #mark{position:fixed;z-index:3;left:61.5%;top:50%;transform:translate(-50%,-50%);
    width:clamp(200px,23vw,360px);height:auto;opacity:.95;pointer-events:none;
    filter:drop-shadow(0 0 40px rgba(255,255,255,.95))}
  @media (max-width:760px){ #mark{width:56vw;left:50%;top:30%} }""")
  .replace("__EXTRAHTML__", '<img id="mark" src="./brand/nanoflashing_bluegrey.png" alt="NanoFlashing">')
  .replace("__COPY__", """    <h2>A permanent positive charge <em>is what pulls them in</em>.</h2>
    <p>NanoFlashing&trade; is a patented permanent positive polarity (3P) technology,
       engineered into the material. It attracts and captures ultrafine particles, wildfire
       smoke, PFAS, and pollen through a physical mechanism.</p>""")
  .replace("__CUE__", "THE AIR CLEARS")
  .replace("__NMOB__", "46").replace("__NDESK__", "104")
  .replace("__PHYSICS__", s3_phys).replace("__STEP__", s3_step))
io.open("stop3.html", "w", encoding="utf-8").write(s3)

print("  stop2.html + stop3.html rebuilt on real photographed cloud plates")
