/* A real soot aggregate, built in three.js.
   Not a video of a picture: an actual object with actual light on it, so it turns with real
   shading, real occlusion between its own lumps, and real parallax as the camera drifts. That
   is the one criticism that survived every asset pass — "flat", "composited", "looks like
   swapped renders" — and it is not fixable in a flat image.

   Morphology follows how soot actually forms: primary particles stick where they collide and
   never rearrange, which is why real aggregates are ragged open chains rather than tidy balls.
   Each primary is an icosphere pushed around by value noise so it reads as a pitted crust
   rather than a sphere. */
import * as THREE from 'three';

const rnd = (function(seed){                 // deterministic, so every visitor sees the same
  let s = seed >>> 0;
  return function(){ s = (s*1664525 + 1013904223) >>> 0; return s / 4294967296; };
})(20260725);

function noise3(x, y, z){
  const s = Math.sin(x*12.9898 + y*78.233 + z*37.719) * 43758.5453;
  return s - Math.floor(s);
}

/* Ballistic accretion: throw a primary in from a random direction and let it stick to the
   first one it touches. That single rule is what produces the open, branched shape. */
function grow(count){
  const parts = [{ p: new THREE.Vector3(0,0,0), r: 1.0 }];
  for (let i = 1; i < count; i++){
    const r = 0.42 + rnd()*0.78;                     // primaries are NOT all the same size
    const dir = new THREE.Vector3(rnd()*2-1, rnd()*2-1, rnd()*2-1).normalize();
    let best = null, bestD = Infinity;
    for (const q of parts){                          // find where this direction first lands
      const along = q.p.dot(dir);
      const perp2 = q.p.lengthSq() - along*along;
      const reach = (q.r + r) * (q.r + r);
      if (perp2 > reach) continue;
      const d = along + Math.sqrt(reach - perp2);
      if (d < bestD){ bestD = d; best = q; }
    }
    if (!best){ best = parts[(rnd()*parts.length)|0]; bestD = 0; }
    const p = best.p.clone().add(
      new THREE.Vector3(rnd()*2-1, rnd()*2-1, rnd()*2-1).normalize()
        .multiplyScalar((best.r + r) * (0.82 + rnd()*0.14))   // slight overlap = fused, not stacked
    );
    parts.push({ p, r });
  }
  return parts;
}

export function buildAggregate(){
  const parts = grow(46);
  const geoms = [];
  for (const q of parts){
    const g = new THREE.IcosahedronGeometry(q.r, 2);
    const pos = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++){
      v.fromBufferAttribute(pos, i);
      const n = v.clone().normalize();
      // two scales of lumpiness: broad dents, then a fine crust
      const a = noise3(n.x*3.1 + q.p.x, n.y*3.1 + q.p.y, n.z*3.1 + q.p.z) - 0.5;
      const b = noise3(n.x*11.0 + q.p.y, n.y*11.0 + q.p.z, n.z*11.0 + q.p.x) - 0.5;
      v.setLength(q.r * (1 + a*0.26 + b*0.09));
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.translate(q.p.x, q.p.y, q.p.z);
    g.computeVertexNormals();
    geoms.push(g);
  }
  // one merged buffer: 46 draw calls would cost more than the whole rest of the page
  let total = 0;
  for (const g of geoms) total += g.attributes.position.count;
  const position = new Float32Array(total*3), normal = new Float32Array(total*3);
  let o = 0;
  for (const g of geoms){
    position.set(g.attributes.position.array, o*3);
    normal.set(g.attributes.normal.array, o*3);
    o += g.attributes.position.count;
    g.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(position, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  merged.computeBoundingSphere();
  // centre it and normalise to unit radius, so the page can size it in screen terms
  const c = merged.boundingSphere.center.clone(), rad = merged.boundingSphere.radius;
  merged.translate(-c.x, -c.y, -c.z);
  merged.scale(1/rad, 1/rad, 1/rad);
  merged.computeBoundingSphere();
  return merged;
}

export function makeSpecimen(canvas){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const mesh = new THREE.Mesh(
    buildAggregate(),
    new THREE.MeshStandardMaterial({ color:0x3d444b, roughness:0.94, metalness:0.0, flatShading:false })
  );
  scene.add(mesh);

  /* Lit the way an electron image reads: one hard raking source, a cold fill from the other
     side so the shadow side is not dead, and a dim underlight off the substrate. */
  const key = new THREE.DirectionalLight(0xffffff, 2.35); key.position.set(-2.2, 2.6, 3.0);
  const fill = new THREE.DirectionalLight(0xdfe6ee, 0.55); fill.position.set(3.0, -0.4, 1.6);
  const bounce = new THREE.DirectionalLight(0xffffff, 0.30); bounce.position.set(0.2, -2.4, 0.8);
  scene.add(key, fill, bounce, new THREE.AmbientLight(0xeef2f6, 0.42));

  return {
    /* box is the on-screen rectangle the specimen should fill, in CSS pixels */
    render(box, spin, drift){
      const w = Math.max(2, box.w), h = Math.max(2, box.h);
      if (canvas.width !== Math.floor(w*renderer.getPixelRatio()) ||
          canvas.height !== Math.floor(h*renderer.getPixelRatio())){
        renderer.setSize(w, h, false);
        camera.aspect = w/h; camera.updateProjectionMatrix();
      }
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      canvas.style.transform = 'translate(' + box.x.toFixed(1) + 'px,' + box.y.toFixed(1) + 'px)';
      mesh.rotation.y = spin;
      mesh.rotation.x = 0.22 + Math.sin(spin*0.7)*0.06;
      // the camera drifts a little, which is what gives real parallax between the lumps
      camera.position.x = Math.sin(drift)*0.30;
      camera.position.y = Math.cos(drift*0.8)*0.18;
      camera.lookAt(0,0,0);
      renderer.render(scene, camera);
    }
  };
}
