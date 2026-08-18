/* Volumetric cloud for the Everest hero.
 *
 * Stacked transparent planes failed three ways in a row -- a hard edge slicing
 * the face, eleven bands wrapped round the massif, and a grey saturation wash
 * toward the horizon. All three are the same fault: a plane is a surface, and a
 * cloud is not. This marches the volume instead.
 *
 * The scene is rendered to a target that carries a depth texture. Each cloud ray
 * is clamped to the terrain distance read from that depth, so a ray never
 * accumulates density in front of rock it should be behind.
 */
import * as THREE from 'three';

/* ---------------------------------------------------------------- noise ---
 * One 64^3 RGBA volume: R is perlin-ish fbm for the overall shape, GBA are
 * inverted worley at rising frequencies for the cauliflower edge. Built once at
 * load -- about 1 MB on the GPU, no asset to ship.
 */
function buildNoise(size = 64) {
  const N = size, data = new Uint8Array(N * N * N * 4);
  const hash = (x, y, z) => {
    let h = x * 374761393 + y * 668265263 + z * 2147483647;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const fade = t => t * t * (3 - 2 * t);
  const vnoise = (x, y, z, f) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
    const w = (i, j, k) => hash(((xi + i) % f + f) % f, ((yi + j) % f + f) % f, ((zi + k) % f + f) % f);
    return lerp(
      lerp(lerp(w(0,0,0), w(1,0,0), xf), lerp(w(0,1,0), w(1,1,0), xf), yf),
      lerp(lerp(w(0,0,1), w(1,0,1), xf), lerp(w(0,1,1), w(1,1,1), xf), zf), zf);
  };
  const fbm = (x, y, z, f0, oct) => {
    let v = 0, a = 0.5, f = f0;
    for (let i = 0; i < oct; i++) { v += a * vnoise(x*f, y*f, z*f, f); f *= 2; a *= 0.5; }
    return v;
  };
  // worley: distance to the nearest point of a jittered grid, inverted
  const worley = (x, y, z, cells) => {
    const gx = x * cells, gy = y * cells, gz = z * cells;
    const ix = Math.floor(gx), iy = Math.floor(gy), iz = Math.floor(gz);
    let best = 1e9;
    for (let dz = -1; dz <= 1; dz++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const cx = ((ix+dx)%cells+cells)%cells, cy = ((iy+dy)%cells+cells)%cells,
                cz = ((iz+dz)%cells+cells)%cells;
          const px = ix+dx + hash(cx, cy, cz),
                py = iy+dy + hash(cy, cz, cx),
                pz = iz+dz + hash(cz, cx, cy);
          const d = (px-gx)**2 + (py-gy)**2 + (pz-gz)**2;
          if (d < best) best = d;
        }
    return 1.0 - Math.min(1, Math.sqrt(best));
  };
  let p = 0;
  for (let z = 0; z < N; z++)
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const u = x / N, v = y / N, w = z / N;
        data[p++] = fbm(u, v, w, 4, 5) * 255;
        data[p++] = worley(u, v, w, 4)  * 255;
        data[p++] = worley(u, v, w, 8)  * 255;
        data[p++] = worley(u, v, w, 16) * 255;
      }
  const tex = new THREE.Data3DTexture(data, N, N, N);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

const FRAG = /* glsl */`
precision highp float;
precision highp sampler3D;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D  uScene;
uniform sampler2D  uDepth;
uniform sampler3D  uNoise;
uniform sampler2D  uTerrain;      // baked terrain height, to keep cloud off the rock

uniform mat4  uInvProj, uInvView;
uniform vec3  uCamPos, uSunDir, uSunCol, uSkyCol;
uniform vec2  uRes;
uniform float uNear, uFar, uTime;
uniform float uBase, uTop;        // cloud slab, metres
uniform float uCover, uDensity, uScale;
uniform float uHmin, uHmax, uSpanX, uSpanZ;
uniform float uDebug;

const int   STEPS      = 72;
const int   LIGHT_STEPS = 8;
const float BIG        = 1e9;

float linearDepth(vec2 uv){
  float d = texture(uDepth, uv).x;
  // 1.0 = nothing drawn. 0.0 means the depth texture is not bound -- treat that
  // as open sky too, or every ray gets clamped to the near plane and the volume
  // is never entered at all.
  if (d >= 1.0 || d <= 0.0) return BIG;
  float ndc = d * 2.0 - 1.0;
  return (2.0 * uNear * uFar) / (uFar + uNear - ndc * (uFar - uNear));
}

// terrain height under a world point, so cloud never sits inside the mountain
float terrainAt(vec3 p){
  vec2 uv = vec2(p.x / uSpanX + 0.5, 0.5 - p.z / uSpanZ);
  if (uv.x <= 0.0 || uv.x >= 1.0 || uv.y <= 0.0 || uv.y >= 1.0) return uHmin;
  return uHmin + texture(uTerrain, uv).r * (uHmax - uHmin);
}

float density(vec3 p){
  // height inside the slab, 0 at base 1 at top
  float h = clamp((p.y - uBase) / (uTop - uBase), 0.0, 1.0);
  // classic stratus profile: eaten away at the bottom, domed on top
  float profile = smoothstep(0.0, 0.22, h) * smoothstep(1.0, 0.58, h);

  vec3 q = p / uScale;
  q.xz += uTime * 0.004;                           // the whole deck drifts
  vec4 n = texture(uNoise, q);
  float shape = clamp((n.r - 0.34) / 0.32, 0.0, 1.0);
  // Subtracting a constant gives a soft ramp in every direction -- that is fog.
  // A cloud is either there or it is not, so snap: clear air below the
  // threshold, near-full density just above it. This is what draws the edge.
  float t = 1.0 - uCover;
  float d = smoothstep(t, t + 0.09, shape);
  // worley erosion bites the billows out of that edge
  float erode = n.g * 0.55 + n.b * 0.30 + n.a * 0.15;
  d = clamp(d - erode * 0.42 * (1.0 - h * 0.6), 0.0, 1.0);
  d *= profile;

  // die out against rock -- this is what the plane stack could never do
  d *= smoothstep(0.0, 420.0, p.y - terrainAt(p));
  return d * uDensity;
}

// Henyey-Greenstein: forward scattering, so the sun side glows
float hg(float c, float g){
  float g2 = g * g;
  return (1.0 - g2) / (12.566370614 * pow(1.0 + g2 - 2.0 * g * c, 1.5));
}

// march toward the sun to find how buried this sample is
float lightMarch(vec3 p){
  // march a full slab depth toward the sun, or the base never goes dark and the
  // whole thing reads as a flat filter instead of a solid body
  float step = (uTop - uBase) / float(LIGHT_STEPS) * 1.6;
  float sum = 0.0;
  vec3 q = p;
  for (int i = 0; i < LIGHT_STEPS; i++){
    q += uSunDir * step;
    sum += density(q) * step;
  }
  // Beer with a powder term, so lit edges stay bright instead of going flat
  float beer = exp(-sum * 2.6);
  float powder = 1.0 - exp(-sum * 5.0);
  return beer * mix(1.0, powder * 2.0, 0.45);
}

void main(){
  vec3 scene = texture(uScene, vUv).rgb;

  // rebuild the world ray for this pixel
  vec4 ndc = vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec4 vp  = uInvProj * ndc; vp /= vp.w;
  vec3 dir = normalize((uInvView * vec4(vp.xyz, 0.0)).xyz);

  // how far until this ray hits the terrain
  float sceneDist = linearDepth(vUv);
  if (sceneDist < BIG) {
    vec3 fwd = normalize((uInvView * vec4(0.0, 0.0, -1.0, 0.0)).xyz);
    sceneDist /= max(dot(dir, fwd), 0.15);        // view-z to along-ray distance
  }

  // intersect the cloud slab
  float t0, t1;
  if (abs(dir.y) < 1e-4) { outColor = vec4(scene, 1.0); return; }
  float ta = (uBase - uCamPos.y) / dir.y;
  float tb = (uTop  - uCamPos.y) / dir.y;
  t0 = min(ta, tb); t1 = max(ta, tb);
  t0 = max(t0, 0.0);
  t1 = min(t1, min(sceneDist, 260000.0));  // a cloud SEA lives in near-horizontal rays, tens of km out
  if (t1 <= t0) { outColor = vec4(scene, 1.0); return; }

  // Fixed steps cannot span both a cloud 2 km away and one 80 km away. Grow the
  // step with distance: fine where detail is visible, coarse where it is not.
  float base = max((t1 - t0) / float(STEPS), 45.0);
  float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  float t = t0 + base * jitter;

  float cosA = dot(dir, uSunDir);
  float phase = mix(hg(cosA, 0.72), hg(cosA, -0.24), 0.35) * 12.0;

  vec3  col = vec3(0.0);
  float trans = 1.0;
  float dbgMaxD = 0.0, dbgMaxShape = 0.0, dbgSteps = 0.0;

  for (int i = 0; i < STEPS; i++){
    if (trans < 0.012) break;
    vec3 p = uCamPos + dir * t;
    float d = density(p);
    dbgMaxD = max(dbgMaxD, d); dbgSteps += 1.0;
    {
      float hh = clamp((p.y - uBase)/(uTop-uBase),0.0,1.0);
      vec3 qq = p / uScale; qq.xz += uTime*0.004;
      dbgMaxShape = max(dbgMaxShape, texture(uNoise, qq).r);
    }
    if (d > 0.0){
      float light = lightMarch(p);
      vec3  lit   = uSunCol * light * phase + uSkyCol * 0.55;
      float dt    = d * base * (1.0 + t * 0.00018);
      float a     = 1.0 - exp(-dt);
      col   += lit * a * trans;
      trans *= 1.0 - a;
    }
    float step = base * (1.0 + t * 0.00018);   // widen with distance
    t += step;
    if (t > t1) break;
  }

  // fade the whole thing out with distance, so it never draws a hard far edge
  float far = 1.0 - smoothstep(150000.0, 250000.0, t0);
  float alpha = (1.0 - trans) * far;
  if (uDebug > 0.5) {
    // r: peak density x200   g: peak raw noise   b: slab was entered
    outColor = vec4(clamp(dbgMaxD*200.0,0.0,1.0), dbgMaxShape,
                    dbgSteps > 0.0 ? 1.0 : 0.0, 1.0);
    outColor.a = 1.0;
    return;
  }
  outColor = vec4(mix(scene, col / max(alpha, 1e-4), alpha), 1.0);
}
`;

export function createVolumetricCloud(renderer, opts = {}) {
  const {
    base = 5600, top = 7900, cover = 0.42, density = 0.055, scale = 5200,
    sunDir = new THREE.Vector3(0.72, 0.51, 0.60).normalize(),
    sunCol = new THREE.Color(0xfff0dc), skyCol = new THREE.Color(0xa8c4e0),
    terrain = null, hmin = 0, hmax = 1, spanX = 1, spanZ = 1,
  } = opts;

  const size = new THREE.Vector2();
  renderer.getSize(size);
  const dpr = renderer.getPixelRatio();

  const depth = new THREE.DepthTexture(size.x * dpr, size.y * dpr);
  depth.type = THREE.UnsignedIntType;
  const sceneRT = new THREE.WebGLRenderTarget(size.x * dpr, size.y * dpr, {
    depthTexture: depth, depthBuffer: true,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType,
  });

  const mat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    depthTest: false, depthWrite: false,
    vertexShader: `
      out vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`,
    fragmentShader: FRAG,
    uniforms: {
      uScene:{value:sceneRT.texture}, uDepth:{value:depth},
      uNoise:{value:buildNoise(64)}, uTerrain:{value:terrain},
      uInvProj:{value:new THREE.Matrix4()}, uInvView:{value:new THREE.Matrix4()},
      uCamPos:{value:new THREE.Vector3()}, uSunDir:{value:sunDir},
      uSunCol:{value:sunCol}, uSkyCol:{value:skyCol},
      uRes:{value:new THREE.Vector2()}, uNear:{value:1}, uFar:{value:1},
      uTime:{value:0}, uBase:{value:base}, uTop:{value:top},
      uCover:{value:cover}, uDensity:{value:density}, uScale:{value:scale},
      uHmin:{value:hmin}, uHmax:{value:hmax}, uDebug:{value:0},
      uSpanX:{value:spanX}, uSpanZ:{value:spanZ},
    },
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  const post = new THREE.Scene(); post.add(quad);
  const postCam = new THREE.Camera();

  return {
    material: mat,
    setSize(w, h) {
      const r = renderer.getPixelRatio();
      sceneRT.setSize(w * r, h * r);
    },
    render(scene, camera, time) {
      const u = mat.uniforms;
      u.uTime.value = time;
      u.uNear.value = camera.near;
      u.uFar.value = camera.far;
      u.uCamPos.value.copy(camera.position);
      u.uInvProj.value.copy(camera.projectionMatrixInverse);
      u.uInvView.value.copy(camera.matrixWorld);
      renderer.getSize(u.uRes.value);

      renderer.setRenderTarget(sceneRT);
      renderer.clear();
      renderer.render(scene, camera);

      renderer.setRenderTarget(null);
      renderer.render(post, postCam);
    },
  };
}
