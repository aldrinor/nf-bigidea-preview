# -*- coding: utf-8 -*-
"""Rewrite stop 3's particle system so CAPTURE reads as a legible event.

Codex held this at 3/10: "the particles remain a random overlay... show particles converging
toward, contacting, and accumulating on individual FIBRES, with visibly cleaner space beyond
them."

Three changes:
1. STREAMS, not scatter — particles enter on a few converging lanes and leave visible trails,
   so the eye follows a flow into the material.
2. ANCHORS on the fibre mat — a fixed set of capture points along the surface. Particles land
   ON an anchor and CLUMP there, growing a visible deposit, rather than resting on a flat line.
3. A DENSITY GRADIENT — dense dirty air at the top of frame, thinning as it descends, so the
   before/after reads inside one frame.
"""
import io, re

f = "stop3.html"
s = io.open(f, encoding="utf-8").read()

# ---- replace the whole particle block between the physics marker and window.__ready ----
start = s.index("/* CAPTURE:")
end   = s.index("window.__ready=true;")

new = r"""/* CAPTURE, built to read as an event:
   - particles arrive on a few converging STREAMS and leave short trails
   - they land on fixed ANCHORS in the fibre mat and CLUMP there, building visible deposits
   - the airstream is dense at the top and thins as it descends: clean air is the result */
var SURF, ANCHORS = [], LANES = [];

function buildField(){
  SURF = innerHeight * 0.50;
  // converging lanes: the airstream funnels toward the charged material
  LANES = [];
  var nL = innerWidth < 760 ? 3 : 5;
  for (var i = 0; i < nL; i++){
    var f = (i + 0.5) / nL;
    LANES.push({
      x0: innerWidth * (0.06 + f * 0.88),          // where it enters, up top
      x1: innerWidth * (0.30 + f * 0.42),          // where it meets the material — converged
      w:  innerWidth * (0.030 + Math.random() * 0.035)
    });
  }
  // anchors: real capture points on the mat. Particles clump ON these.
  ANCHORS = [];
  var nA = innerWidth < 760 ? 16 : 34;
  for (var k = 0; k < nA; k++){
    ANCHORS.push({
      x: innerWidth * (0.06 + Math.random() * 0.90),
      y: SURF + Math.random() * innerHeight * 0.30,
      n: 0                                          // how much has accumulated here
    });
  }
}

function spawn(anywhere){
  var depth = Math.pow(Math.random(), 0.7);
  var lane  = LANES[(Math.random() * LANES.length) | 0];
  var jit   = (Math.random() - 0.5) * lane.w;
  // density gradient: most particles are born high, where the air is still dirty
  var y = anywhere ? Math.pow(Math.random(), 1.9) * SURF : -40 - Math.random() * 260;
  var prog = Math.max(0, Math.min(1, y / SURF));
  return {
    lane: lane, jit: jit,
    x: lane.x0 + (lane.x1 - lane.x0) * prog + jit,
    y: y,
    px: 0, py: 0,                                   // previous position, for the trail
    r: 0.9 + Math.pow(depth, 2.4) * 6.2,
    v: 120 + depth * 260,                           // fall speed
    ph: Math.random() * Math.PI * 2,
    a: 0.14 + Math.pow(depth, 1.6) * 0.62,
    mark: Math.random() < 0.16,
    anchor: null, held: 0, depth: depth
  };
}

buildField();
addEventListener('resize', buildField);
"""

# the per-frame step
step = r"""
  // --- deposits already captured: drawn first, they sit IN the mat ---
  for (var k = 0; k < ANCHORS.length; k++){
    var A = ANCHORS[k];
    if (A.n <= 0) continue;
    var cnt = Math.min(A.n, 9);
    for (var q = 0; q < cnt; q++){
      var ang = (q * 2.399 + k), rad = Math.sqrt(q + 0.4) * 3.6;
      var sx = A.x + Math.cos(ang) * rad, sy = A.y + Math.sin(ang) * rad * 0.55;
      var sp2 = SPRITES[1], sz2 = 5.2 + (q % 3) * 1.8;
      dx.globalAlpha = 0.50;
      dx.drawImage(sp2, sx - sz2/2, sy - sz2/2, sz2, sz2);
    }
    dx.globalAlpha = 1;
  }

  for (var i = 0; i < parts.length; i++){
    var p = parts[i];

    if (p.anchor){
      // held on the fibre — it stays put; the deposit is what remains
      p.held += dt;
      if (p.held > 0.30){
        p.anchor.n = Math.min(p.anchor.n + 1, 9);
        parts[i] = spawn(false);
        continue;
      }
    } else {
      p.px = p.x; p.py = p.y;
      // accelerate toward the material as the charge takes hold
      var gap  = Math.max(10, SURF - p.y);
      var pull = 260 / Math.max(0.35, gap / innerHeight * 3.2);
      p.y += (p.v + pull) * dt;
      // follow the converging lane
      var prog = Math.max(0, Math.min(1, p.y / SURF));
      var want = p.lane.x0 + (p.lane.x1 - p.lane.x0) * prog + p.jit;
      p.x += (want - p.x) * Math.min(1, dt * 3.4);
      p.x += Math.sin(t * 0.7 + p.ph) * 6 * dt * (1 - prog);

      if (p.y >= SURF){
        // grab the nearest anchor — capture happens ON a fibre, not on a flat line
        var best = null, bd = 1e9;
        for (var k2 = 0; k2 < ANCHORS.length; k2++){
          var A2 = ANCHORS[k2];
          if (A2.n >= 9) continue;
          var d2 = Math.abs(A2.x - p.x) + Math.abs(A2.y - p.y) * 0.35;
          if (d2 < bd){ bd = d2; best = A2; }
        }
        if (best){ p.anchor = best; p.x = best.x + (Math.random()-0.5)*7; p.y = best.y; }
        else { parts[i] = spawn(false); continue; }
      }
      if (p.x < -160 || p.x > innerWidth + 160){ parts[i] = spawn(false); continue; }

      // TRAIL — this is what turns scattered dots into a visible flow
      if (p.py && p.depth > 0.30){
        dx.globalAlpha = p.a * 0.34;
        dx.strokeStyle = 'rgba(38,52,66,1)';
        dx.lineWidth = Math.max(0.5, p.r * 0.42);
        dx.beginPath(); dx.moveTo(p.px, p.py); dx.lineTo(p.x, p.y); dx.stroke();
      }
    }

    var sp = SPRITES[Math.min(5, Math.round((1 - p.depth) * 5))];
    var sz = p.r * (3.0 + (1 - p.depth) * 3.4);
    dx.globalAlpha = p.a;
    dx.drawImage(sp, p.x - sz/2, p.y - sz/2, sz, sz);
    if (p.depth > 0.955 && p.mark && !p.anchor){
      var rr = p.r * 1.45, gx = p.x + p.r * 2.9;
      dx.globalAlpha = p.a * 0.80; dx.strokeStyle = 'rgba(38,52,66,1)';
      dx.lineWidth = Math.max(0.7, p.r * 0.20);
      dx.beginPath(); dx.arc(gx, p.y, rr, 0, Math.PI*2); dx.stroke();
      dx.beginPath(); dx.moveTo(gx - rr*0.52, p.y); dx.lineTo(gx + rr*0.52, p.y); dx.stroke();
    }
    dx.globalAlpha = 1;
  }
"""

tail = s[end:]
s = s[:start] + new + """
sizeDust(); addEventListener('resize', sizeDust);
var t0=performance.now(), last=t0, frames=0, winStart=t0;
function frame(now){
  var t=(now-t0)/1000, dt=Math.min(0.05,(now-last)/1000); last=now;
  dx.clearRect(0,0,innerWidth,innerHeight);
  parts.sort(function(a,b){return a.depth-b.depth;});
""" + step + """
  frames++;
  if(now-winStart>=1000){ window.__fps=Math.round(frames*1000/(now-winStart)); frames=0; winStart=now; }
  requestAnimationFrame(frame);
}
if(!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(frame);
""" + tail

# drop the old duplicated loop that followed the physics block
s = re.sub(r"sizeDust\(\); addEventListener\('resize', sizeDust\);\s*var t0=performance\.now\(\), last=t0, frames=0, winStart=t0;\s*function frame\(now\)\{\s*var t=\(now-t0\)/1000.*?requestAnimationFrame\(frame\);\s*\}\s*if\(!matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches\) requestAnimationFrame\(frame\);\s*(?=sizeDust\(\); addEventListener)",
           "", s, flags=re.S)

io.open(f, "w", encoding="utf-8").write(s)
print("  stop3 particles rebuilt: converging streams + trails + fibre anchors + deposits")
