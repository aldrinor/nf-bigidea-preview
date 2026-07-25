/* Volumetric cloud pass — raymarched, depth-aware, half-resolution.
 *
 * Not billboards, not stacked planes. Two passes:
 *   A) march a cloud slab in world space at HALF resolution, writing
 *      vec4(scattered.rgb, transmittance). Cloud is low-frequency, so half-res is
 *      visually free and ~4x cheaper — the difference between 27 fps and 60.
 *   B) composite at full resolution: sceneColour * transmittance + scattered.
 *
 * The march reads the scene depth texture and stops at the terrain, so peaks
 * genuinely occlude cloud. Beer-Lambert absorption, Henyey-Greenstein forward
 * scattering, short light-march toward the sun for self-shadowing.
 */
import * as THREE from 'three';

const FULLSCREEN_VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const MARCH_FRAG = /* glsl */`
precision highp float;
#include <packing>

varying vec2 vUv;
uniform sampler2D tDepth;
uniform float uNear, uFar, uFar2;
uniform vec3  uCamPos, uCamFwd;
uniform mat4  uInvProj, uInvView;
uniform vec3  uSunDir, uSunCol, uSkyCol, uCloudCol;
uniform float uTime, uBottom, uTop, uCover, uDensity, uAnim, uSigma;

float hash(vec3 p){ p = fract(p*0.3183099 + vec3(0.1,0.2,0.3)); p *= 17.0;
  return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                 mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                 mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm4(vec3 p){ float s=0.0,a=0.5;
  for(int i=0;i<4;i++){ s+=a*noise(p); p=p*2.02+vec3(11.3,7.1,5.9); a*=0.5; } return s; }
float fbm2(vec3 p){ float s=0.0,a=0.5;
  for(int i=0;i<2;i++){ s+=a*noise(p); p=p*2.02+vec3(11.3,7.1,5.9); a*=0.5; } return s; }

float heightProfile(float h){
  return smoothstep(0.0, 0.10, h) * (1.0 - smoothstep(0.42, 0.98, h));
}

float density(vec3 p){
  float h = (p.y - uBottom) / max(uTop - uBottom, 1.0);
  if(h < 0.0 || h > 1.0) return 0.0;
  vec3 q = p * 0.00042; q.xz += uTime * uAnim;
  float base  = fbm4(q) * 0.5 + 0.5;
  float macro = fbm2(q * 0.31 + 19.7) * 0.5 + 0.5;
  base = base * (0.55 + 0.75 * smoothstep(0.30, 0.78, macro));
  float d = smoothstep(uCover, uCover + 0.13, base);
  float det = fbm2(q * 5.3 + 3.1) * 0.5 + 0.5;
  d -= (1.0 - d) * det * 0.55;
  d *= 1.0 - 0.45 * smoothstep(0.55, 1.0, h) * det;
  return max(d, 0.0) * heightProfile(h) * uDensity;
}

float densityCheap(vec3 p){
  float h = (p.y - uBottom) / max(uTop - uBottom, 1.0);
  if(h < 0.0 || h > 1.0) return 0.0;
  vec3 q = p * 0.00042; q.xz += uTime * uAnim;
  float base = fbm2(q) * 0.5 + 0.5;
  return max(smoothstep(uCover, uCover + 0.18, base), 0.0) * heightProfile(h) * uDensity;
}

float hg(float c, float g){
  float g2 = g*g;
  return (1.0 - g2) / (4.0 * 3.14159265 * pow(1.0 + g2 - 2.0*g*c, 1.5));
}

void main(){
  vec4 ndc = vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec4 vpos = uInvProj * ndc; vpos /= vpos.w;
  vec3 rd = normalize((uInvView * vec4(vpos.xyz, 0.0)).xyz);
  vec3 ro = uCamPos;

  float dRaw = texture2D(tDepth, vUv).x;
  float sceneDist = 1e9;
  if(dRaw < 1.0){
    float viewZ = perspectiveDepthToViewZ(dRaw, uNear, uFar);
    sceneDist = (-viewZ) / max(dot(rd, uCamFwd), 1e-4);
  }

  float t0, t1;
  if(abs(rd.y) < 1e-5){
    if(ro.y < uBottom || ro.y > uTop){ gl_FragColor = vec4(0.0,0.0,0.0,1.0); return; }
    t0 = 0.0; t1 = uFar2;
  } else {
    float ta = (uBottom - ro.y) / rd.y;
    float tb = (uTop    - ro.y) / rd.y;
    t0 = max(min(ta, tb), 0.0); t1 = max(ta, tb);
  }
  t1 = min(t1, min(sceneDist, uFar2));
  if(t1 <= t0){ gl_FragColor = vec4(0.0,0.0,0.0,1.0); return; }

  const int STEPS = 48;
  float dt = (t1 - t0) / float(STEPS);
  float t = t0 + dt * hash(vec3(gl_FragCoord.xy, uTime*60.0));

  float transmittance = 1.0;
  vec3  scattered = vec3(0.0);
  float cosA  = dot(rd, uSunDir);
  float phase = mix(hg(cosA, 0.72), hg(cosA, -0.22), 0.35);

  for(int i=0;i<STEPS;i++){
    if(transmittance < 0.02 || t > t1) break;
    vec3 p = ro + rd * t;
    float dens = density(p) * (1.0 - smoothstep(16000.0, 38000.0, t));
    if(dens > 0.002){
      float lit = 0.0, lt = 0.0;
      const int LSTEPS = 4;
      float ldt = (uTop - uBottom) / float(LSTEPS) * 1.5;
      for(int j=0;j<LSTEPS;j++){ lt += ldt; lit += densityCheap(p + uSunDir * lt); }
      float sunT   = exp(-lit * ldt * uSigma * 1.6);
      float powder = 1.0 - exp(-dens * 6.0);
      vec3 lightCol = uSunCol * sunT * (0.42 + 2.6 * phase) * powder + uSkyCol * 0.62;
      float tr = exp(-dens * dt * uSigma);
      scattered += transmittance * (1.0 - tr) * lightCol * uCloudCol;
      transmittance *= tr;
    }
    t += dt;
  }
  gl_FragColor = vec4(scattered, transmittance);
}
`;

const COMPOSITE_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tScene, tCloud;
void main(){
  vec3 scene = texture2D(tScene, vUv).rgb;
  vec4 c = texture2D(tCloud, vUv);
  gl_FragColor = vec4(scene * c.a + c.rgb, 1.0);
}
`;

export function makeCloudPass(renderer, opts = {}) {
  const size = new THREE.Vector2();
  renderer.getSize(size);
  const dpr = renderer.getPixelRatio();
  let W = Math.floor(size.x * dpr), H = Math.floor(size.y * dpr);
  const SCALE = opts.scale ?? 0.5;

  const depthTexture = new THREE.DepthTexture(W, H);
  depthTexture.type = THREE.UnsignedIntType;
  const sceneTarget = new THREE.WebGLRenderTarget(W, H, {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType, depthTexture,
  });
  const marchTarget = new THREE.WebGLRenderTarget(Math.floor(W*SCALE), Math.floor(H*SCALE), {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.HalfFloatType,
  });

  const uniforms = {
    tDepth:{value:depthTexture},
    uNear:{value:1}, uFar:{value:1}, uFar2:{value:opts.maxDist ?? 42000},
    uCamPos:{value:new THREE.Vector3()}, uCamFwd:{value:new THREE.Vector3()},
    uInvProj:{value:new THREE.Matrix4()}, uInvView:{value:new THREE.Matrix4()},
    uSunDir:{value:opts.sunDir || new THREE.Vector3(0.6,0.3,-0.7).normalize()},
    uSunCol:{value:new THREE.Color(opts.sunCol || '#fff3e0')},
    uSkyCol:{value:new THREE.Color(opts.skyCol || '#c9d8e6')},
    uCloudCol:{value:new THREE.Color(opts.cloudCol || '#ffffff')},
    uTime:{value:0},
    uBottom:{value:opts.bottom ?? 2250},
    uTop:{value:opts.top ?? 3150},
    uCover:{value:opts.cover ?? 0.46},
    uDensity:{value:opts.density ?? 1.0},
    uAnim:{value:opts.anim ?? 0.0016},
    uSigma:{value:opts.sigma ?? 0.0011},
  };

  const marchMat = new THREE.ShaderMaterial({
    uniforms, vertexShader: FULLSCREEN_VERT, fragmentShader: MARCH_FRAG,
    depthTest:false, depthWrite:false,
  });
  const compMat = new THREE.ShaderMaterial({
    uniforms:{ tScene:{value:sceneTarget.texture}, tCloud:{value:marchTarget.texture} },
    vertexShader: FULLSCREEN_VERT, fragmentShader: COMPOSITE_FRAG,
    depthTest:false, depthWrite:false,
  });

  const quadGeo = new THREE.PlaneGeometry(2,2);
  const marchScene = new THREE.Scene();
  const mq = new THREE.Mesh(quadGeo, marchMat); mq.frustumCulled = false; marchScene.add(mq);
  const compScene = new THREE.Scene();
  const cq = new THREE.Mesh(quadGeo, compMat); cq.frustumCulled = false; compScene.add(cq);
  const flatCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);

  return {
    target: sceneTarget, uniforms, material: marchMat,
    setSize(width, height, pixelRatio){
      W = Math.floor(width*pixelRatio); H = Math.floor(height*pixelRatio);
      sceneTarget.setSize(W,H);
      marchTarget.setSize(Math.floor(W*SCALE), Math.floor(H*SCALE));
    },
    render(r, camera, time){
      uniforms.uTime.value = time;
      uniforms.uNear.value = camera.near;
      uniforms.uFar.value  = camera.far;
      uniforms.uCamPos.value.copy(camera.position);
      camera.getWorldDirection(uniforms.uCamFwd.value);
      uniforms.uInvProj.value.copy(camera.projectionMatrixInverse);
      uniforms.uInvView.value.copy(camera.matrixWorld);
      r.setRenderTarget(marchTarget);
      r.render(marchScene, flatCam);
      r.setRenderTarget(null);
      r.render(compScene, flatCam);
    }
  };
}
