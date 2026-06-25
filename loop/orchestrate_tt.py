# Autonomous turntable loop (runs ON each box). Handles BOTH specimen types:
#   type=mol  -> turntable_render.py  -- <cid> <out>     (real PubChem molecule)
#   type=spec -> spec_turntable.py    -- <stype> <sem> <out>  (SEM-textured organism/particle)
# GLM-5.2 builds/fixes the per-specimen script; Blender path-traces test frames; GLM-5V judges vs the Dyson
# benchmark; drill until 9/10 sign-off; then render the full 72-frame turntable.
# Processes the specimens whose id is in env SPECIMENS (comma-sep).
import json, base64, urllib.request, subprocess, os, re, time, shutil
# self-heal: ensure Blender's system libs are present (lean cuda image lacks libxkbcommon etc.)
subprocess.run("export DEBIAN_FRONTEND=noninteractive; apt-get install -y -qq libxkbcommon0 libsm6 libice6 "
               "libxext6 libegl1 libgomp1 libxrender1 libxi6 libxxf86vm1 libxfixes3 libgl1 >/dev/null 2>&1",
               shell=True)
# singleton lock: prevent duplicate orchestrators (they thrash shared out_<id> dirs and stall completion)
_LK='/work/3d/orch.lock'
def _alive():
    try:
        p=int(open(_LK).read().strip()); os.kill(p,0); return True
    except Exception: return False
if _alive():
    print('orchestrator already running, exiting'); raise SystemExit(0)
open(_LK,'w').write(str(os.getpid()))
KEY = open('/work/or_key').read().strip()
OR  = "https://openrouter.ai/api/v1/chat/completions"
def get_bl(): return subprocess.check_output("ls /work/blender*/blender 2>/dev/null | head -1", shell=True).decode().strip()
WORK= "/work/3d"
MANIFEST = json.load(open(WORK+'/manifest.json'))
MINE = [s for s in os.environ.get('SPECIMENS','').split(',') if s]
MAXIT= int(os.environ.get('MAXIT','60'))
def log(sid,m): open(WORK+f'/log_{sid}.txt','a').write(m+'\n'); print(f'[{sid}] {m}',flush=True)
def call(model,msgs,mt,tmp):
    p=json.dumps({"model":model,"messages":msgs,"max_tokens":mt,"temperature":tmp}).encode()
    rq=urllib.request.Request(OR,data=p,headers={"Authorization":"Bearer "+KEY,"Content-Type":"application/json"})
    for _ in range(3):
        try:
            c=json.loads(urllib.request.urlopen(rq,timeout=330).read().decode())["choices"][0]["message"]["content"]
            if c: return c
        except Exception: pass
        time.sleep(6)
    return ""
def glm52(b): return call("z-ai/glm-5.2",[{"role":"user","content":b}],30000,0.5)
def glm5v(prompt,img):
    uri="data:image/png;base64,"+base64.b64encode(open(img,'rb').read()).decode()
    return call("z-ai/glm-5v-turbo",[{"role":"user","content":[{"type":"text","text":prompt},{"type":"image_url","image_url":{"url":uri}}]}],3000,0.35)
def render(spec, script, outdir, spp, frames):
    os.makedirs(outdir,exist_ok=True)
    for f in list(os.listdir(outdir)):
        if f.endswith('.png'):
            try: os.remove(outdir+'/'+f)
            except: pass
    env=dict(os.environ,SPP=str(spp),FRAMES=str(frames),OUT=outdir)
    bl=get_bl()
    if not bl: time.sleep(8); return []   # Blender not installed yet (onstart still running) — wait, retry
    if spec['type']=='mol': args=[str(spec['cid']), outdir]
    else: args=[spec['stype'], WORK+'/sem/'+spec['sem'], outdir]
    try: subprocess.run([bl,'--background','--python',script,'--']+args,env=env,timeout=6000,
                        stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    except: pass
    return sorted(outdir+'/'+f for f in os.listdir(outdir) if f.endswith('.png'))

GATE_MOL="""Path-traced TURNTABLE frame of the pollutant molecule "{name}", ball-and-stick with CPK colors
(grey C, GREEN F, yellow S, red O, white H, blue N, green Cl), grey bonds, dark cinematic stage, with a
SUBTLE red charge aura (negative-charge cue). Benchmark = Dyson's premium molecular render (glossy path-
traced ball-and-stick, correct CPK colors, dark stage, atoms crisp, subtle red glow NOT a solid red disc).
STRICT one-line JSON:
{{"accurate": <bool: connected structure + correct CPK, FLUORINE GREEN not white/washed>,
  "aura_good": <bool true only if red is a subtle glow hugging the molecule, atoms NOT obscured, FALSE if a solid red disc/backdrop or washes colors>,
  "photoreal": <int 1-10>, "sign_off": <bool true only if accurate AND aura_good AND photoreal>=9>,
  "fix": "<single most important fix if not signed off>"}}"""
GATE_SPEC="""You are a STRICT, skeptical scientific reviewer. This is ONE frame of a path-traced 360 turntable
of the airborne pollutant "{name}" ({stype}), from a real SEM micrograph, dark cinematic stage, with a SUBTLE
red charge aura. Frames are shown at SPREAD angles INCLUDING an edge-on (90deg) view. Benchmark = Dyson's
premium microscopic specimen render. DEFAULT TO sign_off=false. HARD-FAIL (accurate=false) if ANY of:
- the specimen looks FLAT / 2D — a flat disc, sheet, plate, blade or thin line from this angle. It MUST be a
  believable 3D VOLUMETRIC object with real depth/thickness from every angle. A thin pancake = FAIL.
- wrong morphology for a {stype} (a microbiologist would not accept it), or it reads as a bare CG primitive.
- the red is a solid disc/backdrop or washes the colors.
STRICT one-line JSON:
{{"accurate": <bool: true ONLY if correct 3D morphology + color for a {stype} AND clearly NOT flat>,
  "flat": <bool: true if it looks like a flat disc/sheet/line from this angle>,
  "aura_good": <bool: red is a subtle glow hugging the specimen, surface not obscured>,
  "photoreal": <int 1-10 vs Dyson>, "sign_off": <bool: true ONLY if accurate AND not flat AND aura_good AND photoreal>=9>,
  "fix": "<single most important fix if not signed off>"}}"""
FIX="""You are GLM-5.2 in an automated loop with judge GLM-5V, refining a Blender 4.2 Cycles turntable script
for "{name}". GLM-5V did NOT sign off. Verdict: {critique}. Top fix(es): {fixes}.
Recurring failures to avoid: RED AURA must be a SUBTLE glow hugging the specimen, NOT a solid red disc/
backdrop (if so, cut volume density/emission hard + tighten to a thin shell). Colors must be correct &
saturated (molecules: FLUORINE GREEN; organics: right taxonomy color). Keep intact: the real data source,
Cycles caustics + OpenImageDenoise, the 360 turntable camera, Dyson dark studio lighting. Smallest change
that fixes the named problem. Output the COMPLETE corrected script only (one ```python block)."""

def fetch_sem(spec):
    if spec['type']!='spec': return
    os.makedirs(WORK+'/sem',exist_ok=True)
    p=WORK+'/sem/'+spec['sem']
    if os.path.exists(p) and os.path.getsize(p)>5000: return
    try:
        rq=urllib.request.Request(spec['sem_url'],headers={'User-Agent':'research-bot/1.0'})
        open(p,'wb').write(urllib.request.urlopen(rq,timeout=60).read())
    except Exception as e: log(spec['id'],'SEM fetch fail '+str(e)[:60])

def process(spec):
    sid=spec['id']; name=spec['name']
    fetch_sem(spec)
    base = WORK+'/turntable_render.py' if spec['type']=='mol' else WORK+'/spec_turntable.py'
    script=WORK+f'/tt_{sid}.py'; outdir=WORK+f'/out_{sid}'
    shutil.copy(base, script)
    gate=(GATE_MOL if spec['type']=='mol' else GATE_SPEC).format(name=name, stype=spec.get('stype',''))
    log(sid,f'START {name} [{spec["type"]}]')
    for it in range(1,MAXIT+1):
        imgs=render(spec,script,outdir,350,4)  # 4 spread angles (0/90/180/270) incl edge-on to expose flat geometry
        if len(imgs)<1: log(sid,f'it{it}: NO RENDER'); time.sleep(4); continue
        vs=[]
        for im in imgs[:2]:
            t=glm5v(gate,im)
            try: vs.append(json.loads(t[t.find('{'):t.rfind('}')+1]))
            except: vs.append({'error':1})
        ok=len(vs)>0 and all(v.get('sign_off')==True for v in vs) and not any(v.get('flat')==True for v in vs)
        summ='|'.join(f"acc={v.get('accurate')} aura={v.get('aura_good')} pr={v.get('photoreal')} ok={v.get('sign_off')}" for v in vs)
        log(sid,f'it{it}: {summ}')
        if ok:
            log(sid,'*** GLM-5V SIGN-OFF *** full 72-frame turntable @640spp')
            imgs=render(spec,script,outdir,640,72)
            if len(imgs)>=70:
                open(WORK+f'/DONE_{sid}','w').write(summ); log(sid,f'TURNTABLE DONE {len(imgs)}'); return
            log(sid,f'turntable incomplete {len(imgs)}/72 - retry'); continue
        fixes='; '.join(str(v.get('fix','')) for v in vs if 'error' not in v)
        out=glm52(FIX.format(name=name,critique=summ,fixes=fixes)+"\n\n===== CURRENT script =====\n"+open(script).read())
        m=re.findall(r'```python\n(.*?)```',out,re.S)
        if m and len(max(m,key=len))>2000: open(script,'w').write(max(m,key=len)); log(sid,f'it{it}: GLM-5.2 revised')
        else: log(sid,f'it{it}: GLM-5.2 unusable, retry')
    log(sid,'MAXIT reached')

for spec in MANIFEST:
    if spec['id'] in MINE:
        if os.path.exists(WORK+'/DONE_'+spec['id']): log(spec['id'],'already DONE, skip'); continue
        try: process(spec)
        except Exception as e: log(spec['id'],'EXC '+str(e)[:120])
log('_pool','ASSIGNED COMPLETE')
