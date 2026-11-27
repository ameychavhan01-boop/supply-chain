import json, math, sys
import numpy as np
NE = "/home/claude/nvkelso/natural-earth-vector/geojson/"
TOL = float(sys.argv[1]) if len(sys.argv) > 1 else 0.03
W = 1000.0
S = W / (2 * math.pi)
LAT0, LAT1 = 84.0, -58.0
def ym(lat): return 1.25 * math.log(math.tan(math.pi / 4 + 0.4 * math.radians(lat)))
Y0 = ym(LAT0); H = S * (Y0 - ym(LAT1))
def pr(lon, lat):
    lat = max(min(lat, 89.0), -89.0)
    return ((lon + 180.0) / 360.0 * W, S * (Y0 - ym(lat)))

def dp(pts, tol):
    pts = np.asarray(pts, dtype=float)
    n = len(pts)
    if n < 4: return pts
    keep = np.zeros(n, bool); keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1: continue
        A, B = pts[a], pts[b]; seg = pts[a+1:b]
        d = B - A; L = math.hypot(*d)
        if L == 0: dist = np.hypot(*(seg - A).T)
        else: dist = np.abs(d[0]*(seg[:,1]-A[1]) - d[1]*(seg[:,0]-A[0])) / L
        i = int(np.argmax(dist)); 
        if dist[i] > tol:
            k = a + 1 + i; keep[k] = True; stack += [(a, k), (k, b)]
    return pts[keep]

def area(r):
    x = np.asarray(r)[:,0]; y = np.asarray(r)[:,1]
    return 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))

def ring_path(r):
    q = [pr(x, y) for x, y in r]
    out = []; px = py = None
    for i, (x, y) in enumerate(q):
        X, Y = round(x, 1), round(y, 1)
        if i == 0: out.append("M%g %g" % (X, Y))
        else:
            dx, dy = round(X - px, 1), round(Y - py, 1)
            if dx == 0 and dy == 0: continue
            out.append("l%g %g" % (dx, dy))
        px, py = X, Y
    return "".join(out) + "z"

d = json.load(open(NE + "ne_10m_admin_0_countries_ind.geojson"))
countries = []
feats = sorted(d["features"], key=lambda f: -sum(area(pl[0]) for pl in (f["geometry"]["coordinates"] if f["geometry"]["type"] == "MultiPolygon" else [f["geometry"]["coordinates"]])))
used = set()
for f in feats:
    p = f["properties"]
    a2 = p["ISO_A2_EH"] if p["ISO_A2"] in ("-99", None) else p["ISO_A2"]
    if a2 in ("-99", None): a2 = p["ADM0_A3"][:2] + "_"
    if p["ADM0_A3"] == "TWN": a2 = "TW"
    if p["ADM0_A3"] == "ATA": continue
    if a2 in used: a2 = p["ADM0_A3"]
    used.add(a2)
    g = f["geometry"]; polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    is_ind = p["ADM0_A3"] == "IND"
    amin = 0.0004 if is_ind else 0.004
    paths = []; xs = []; ys = []; lo = []
    big = max(area(poly[0]) for poly in polys)
    bigp = [poly for poly in polys if area(poly[0]) == big][0][0]
    bx = [pr(x, y) for x, y in bigp]; bcx = sum(q[0] for q in bx) / len(bx); bcy = sum(q[1] for q in bx) / len(bx)
    bdiag = math.hypot(max(q[0] for q in bx) - min(q[0] for q in bx), max(q[1] for q in bx) - min(q[1] for q in bx))
    zx = []; zy = []
    for poly in polys:
        outer = poly[0]
        A = area(outer)
        if A < amin and A < big * 0.5: continue
        t = TOL * (0.4 if A < 0.5 else 1.0)
        if A >= (0.01 if is_ind else 0.08) or A == big:
            sl = dp(outer, 0.16 if A > 2 else 0.06)
            if len(sl) >= 4: lo.append(ring_path(sl.tolist()))
        for k, ring in enumerate(poly):
            if k > 0 and area(ring) < 0.05: continue
            s = dp(ring, t)
            if len(s) < 4:
                if k == 0 and A >= amin: s = np.asarray(ring)[:: max(1, len(ring)//6)]
                else: continue
            if len(s) < 3: continue
            paths.append(ring_path(s.tolist()))
            pq = [pr(x, y) for x, y in s]
            for X, Y in pq: xs.append(X); ys.append(Y)
            if k == 0:
                cx_ = sum(q[0] for q in pq) / len(pq); cy_ = sum(q[1] for q in pq) / len(pq)
                if math.hypot(cx_ - bcx, cy_ - bcy) <= max(55, 0.9 * bdiag):
                    for X, Y in pq: zx.append(X); zy.append(Y)
    if not paths: continue
    lx, ly = pr(p["LABEL_X"], p["LABEL_Y"])
    countries.append({"a2": a2, "a3": p["ADM0_A3"], "n": p["NAME"], "d": "".join(paths), "dl": "".join(lo) or "".join(paths),
        "lx": round(lx, 1), "ly": round(ly, 1), "lr": p.get("LABELRANK", 5), "ml": p.get("MIN_LABEL", 5),
        "mc": p.get("MAPCOLOR9", 1), "bb": [round(min(xs),1), round(min(ys),1), round(max(xs),1), round(max(ys),1)],
        "zb": [round(min(zx),1), round(min(zy),1), round(max(zx),1), round(max(zy),1)], "ar": round(big, 2),
        "cont": p.get("CONTINENT", "")})

pp = json.load(open(NE + "ne_50m_populated_places_simple.geojson"))
caps = []; seen = set()
for f in pp["features"]:
    p = f["properties"]
    if p.get("adm0cap") == 1 and p["featurecla"].startswith("Admin-0 capital") and p["adm0_a3"] not in seen:
        if p["adm0_a3"] in ("ZAF", "BOL", "NLD") and p["featurecla"] != "Admin-0 capital": continue
        x, y = pr(p["longitude"], p["latitude"])
        caps.append({"n": p["name"].replace(",  ", ", "), "a3": p["adm0_a3"], "x": round(x, 1), "y": round(y, 1)})
        seen.add(p["adm0_a3"])

def inside(px, py, ring):
    x = ring[:,0]; y = ring[:,1]; x2 = np.roll(x, -1); y2 = np.roll(y, -1)
    c = ((y > py) != (y2 > py)) & (px < (x2 - x) * (py - y) / (y2 - y + 1e-12) + x)
    return np.count_nonzero(c) % 2 == 1
def segdist(px, py, ring):
    a = ring; b = np.roll(ring, -1, axis=0); ab = b - a; ap = np.array([px, py]) - a
    t = np.clip((ap * ab).sum(1) / ((ab * ab).sum(1) + 1e-12), 0, 1)
    pt = a + ab * t[:, None]; return np.min(np.hypot(pt[:,0] - px, pt[:,1] - py))
SKIP = {"Weddell Sea", "Ross Sea", "Amundsen Sea", "Bellingshausen Sea", "Scotia Sea", "Drake Passage", "SOUTHERN OCEAN"}
OCEANS = [("PACIFIC OCEAN", -150, 10, 0), ("PACIFIC OCEAN", 175, -30, 0), ("ATLANTIC OCEAN", -40, 30, 0), ("ATLANTIC OCEAN", -18, -25, 0),
          ("INDIAN OCEAN", 78, -22, 0), ("ARCTIC OCEAN", 10, 80, 0), ("SOUTHERN OCEAN", 60, -55, 0)]
seas = [{"n": n, "x": round(pr(lo, la)[0], 1), "y": round(pr(lo, la)[1], 1), "r": r} for n, lo, la, r in OCEANS]
mp = json.load(open(NE + "ne_50m_geography_marine_polys.geojson"))
for f in mp["features"]:
    p = f["properties"]
    if p["featurecla"] == "ocean" or p["scalerank"] > 3 or p["name"] in SKIP: continue
    g = f["geometry"]; polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    ring = max((pl[0] for pl in polys), key=area)
    R = np.array([pr(x, y) for x, y in ring])
    x0, y0 = R.min(0); x1, y1 = R.max(0); best = None
    for gx in np.linspace(x0, x1, 36):
        for gy in np.linspace(y0, y1, 36):
            if inside(gx, gy, R):
                dd = segdist(gx, gy, R)
                if best is None or dd > best[0]: best = (dd, gx, gy)
    if not best: continue
    seas.append({"n": p["label"] or p["name"], "x": round(best[1], 1), "y": round(best[2], 1), "r": p["scalerank"]})

out = {"W": W, "H": round(H, 2), "S": S, "Y0": Y0, "lat0": LAT0, "lat1": LAT1, "countries": countries, "caps": caps, "seas": seas}
js = "window.SC_WORLD=" + json.dumps(out, separators=(",", ":")) + ";"
open("/home/claude/supply-chain/src/world.js", "w").write(js)
print("countries", len(countries), "caps", len(caps), "bytes", len(js), "H", H)
ind = [c for c in countries if c["a3"] == "IND"][0]
print("seas", len(seas)); print("IND rings", ind["d"].count("M"), "bb", ind["bb"])
