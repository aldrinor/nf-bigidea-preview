#!/usr/bin/env python3
"""
Daily ingest for the wildfire smoke map.
Fetches recent NOAA HMS smoke polygons + AirNow PM2.5, converts to small same-origin
files under data/wfmap/, and updates the manifest. Stdlib only (no external deps).

Run: python scripts/wfmap_ingest.py [--days N]
Default fetches today + the last 4 days (to catch NOAA/AirNow revisions of recent days).
"""
import os, re, json, math, sys, argparse, datetime, urllib.request
import xml.etree.ElementTree as ET

DATA = "data/wfmap"
NS = "{http://www.opengis.net/kml/2.2}"
DMAP = {"light": 1, "medium": 2, "heavy": 3}
HMS = "https://satepsanone.nesdis.noaa.gov/pub/FIRE/web/HMS/Smoke_Polygons/KML/{y}/{m}/hms_smoke{ymd}.kml"
AIRNOW = "https://files.airnowtech.org/airnow/{y}/{ymd}/daily_data_v2.dat"
BBOX = [-130, 20, -65, 60]


def fetch(url, timeout=90):
    for _ in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "nf-wfmap-ingest/1.0"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                if r.status == 200:
                    return r.read()
        except Exception:
            pass
    return None


def _perp(pt, a, b):
    if a == b:
        return math.hypot(pt[0] - a[0], pt[1] - a[1])
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    px, py = a[0] + t * dx, a[1] + t * dy
    return math.hypot(pt[0] - px, pt[1] - py)


def dp(points, eps):
    # Douglas-Peucker on [lon,lat]; eps in degrees (~0.01 deg ~ 1.1 km)
    if len(points) < 3:
        return points
    dmax, idx = 0.0, 0
    for i in range(1, len(points) - 1):
        d = _perp(points[i], points[0], points[-1])
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        left = dp(points[: idx + 1], eps)
        right = dp(points[idx:], eps)
        return left[:-1] + right
    return [points[0], points[-1]]


def ring(text, ndp=3, eps=0.01):
    pts = []
    for t in text.split():
        p = t.split(",")
        if len(p) >= 2:
            try:
                pts.append([round(float(p[0]), ndp), round(float(p[1]), ndp)])
            except ValueError:
                pass
    # dedupe consecutive
    r = [p for i, p in enumerate(pts) if i == 0 or p != pts[i - 1]]
    if len(r) >= 4:
        r = dp(r, eps)
    if len(r) >= 4 and r[0] != r[-1]:
        r.append(r[0])
    return r if len(r) >= 4 else None


def kml_to_geojson(kml_bytes):
    root = ET.fromstring(kml_bytes)
    feats = []
    for pm in root.iter(NS + "Placemark"):
        poly = pm.find(".//" + NS + "Polygon")
        if poly is None:
            continue
        outer = poly.find(NS + "outerBoundaryIs/" + NS + "LinearRing/" + NS + "coordinates")
        if outer is None or not outer.text:
            continue
        o = ring(outer.text)
        if not o:
            continue
        rings = [o]
        for inner in poly.findall(NS + "innerBoundaryIs/" + NS + "LinearRing/" + NS + "coordinates"):
            if inner.text:
                ir = ring(inner.text)
                if ir:
                    rings.append(ir)
        dens = None
        d = pm.find(NS + "description")
        if d is not None and d.text:
            mm = re.search(r"Density:\s*([A-Za-z]+)", d.text)
            if mm:
                dens = mm.group(1).lower()
        feats.append({
            "type": "Feature",
            "properties": {"density": DMAP.get(dens, 1)},
            "geometry": {"type": "Polygon", "coordinates": rings},
        })
    return {"type": "FeatureCollection", "features": feats}


def airnow_pm25(dat_bytes):
    out = []
    for line in dat_bytes.decode("utf-8", "ignore").splitlines():
        if not line:
            continue
        c = line.split("|")
        if len(c) < 12:
            continue
        if c[3].strip() != "PM2.5-24hr":
            continue
        try:
            lat, lon, v = float(c[10]), float(c[11]), float(c[5])
        except ValueError:
            continue
        if abs(lat) > 90 or abs(lon) > 180:
            continue
        out.append([round(lat, 4), round(lon, 4), round(v, 1)])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=5, help="number of recent days (incl today) to (re)fetch")
    args = ap.parse_args()

    today = datetime.datetime.utcnow().date()
    days = [today - datetime.timedelta(days=k) for k in range(0, max(1, args.days))]
    os.makedirs(DATA + "/smoke", exist_ok=True)
    os.makedirs(DATA + "/aq", exist_ok=True)

    man_path = DATA + "/manifest.json"
    man = json.load(open(man_path)) if os.path.exists(man_path) else {"dates": [], "aq_dates": [], "bbox": BBOX}
    dset, aset = set(man.get("dates", [])), set(man.get("aq_dates", []))

    got_s, got_a = 0, 0
    for d in days:
        ymd = d.strftime("%Y%m%d")
        kb = fetch(HMS.format(y=d.strftime("%Y"), m=d.strftime("%m"), ymd=ymd))
        if kb:
            try:
                g = kml_to_geojson(kb)
                if g["features"]:
                    json.dump(g, open(DATA + "/smoke/" + ymd + ".geojson", "w"), separators=(",", ":"))
                    dset.add(ymd); got_s += 1
            except Exception as e:
                print("smoke parse fail", ymd, e)
        ab = fetch(AIRNOW.format(y=d.strftime("%Y"), ymd=ymd))
        if ab:
            pts = airnow_pm25(ab)
            if pts:
                json.dump(pts, open(DATA + "/aq/" + ymd + ".json", "w"), separators=(",", ":"))
                aset.add(ymd); got_a += 1

    man["dates"] = sorted(dset)
    man["aq_dates"] = sorted(aset)
    man["bbox"] = man.get("bbox", BBOX)
    man["updated"] = man["dates"][-1] if man["dates"] else ""
    json.dump(man, open(man_path, "w"), separators=(",", ":"))
    print("wfmap ingest: %d smoke + %d aq updated; manifest now %d dates, newest %s"
          % (got_s, got_a, len(man["dates"]), man.get("updated")))


if __name__ == "__main__":
    main()
