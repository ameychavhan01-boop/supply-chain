import json, math, os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
OUT = os.path.dirname(ROOT) if os.path.basename(ROOT) == "app-source" else os.path.join(ROOT, "dist")
os.makedirs(OUT, exist_ok=True)

def rd(n):
    with open(os.path.join(SRC, n), encoding="utf-8") as f:
        return f.read()

html = rd("index.template.html")
html = html.replace("/*CSS*/", rd("style.css"))
html = html.replace("/*DATA*/", rd("data.js"))
html = html.replace("/*GEO*/", rd("energy.js") + "\n" + rd("world.js"))
html = html.replace("/*APP*/", rd("app.js"))
with open(os.path.join(OUT, "index.html"), "w", encoding="utf-8") as f:
    f.write(html)

manifest = {
    "name": "Supply Chain", "short_name": "Supply Chain", "start_url": "./index.html", "scope": "./",
    "display": "standalone", "orientation": "landscape", "background_color": "#0B1020", "theme_color": "#0B1020",
    "icons": [{"src": "icon-180.png", "sizes": "180x180", "type": "image/png"},
              {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]
}
with open(os.path.join(OUT, "manifest.json"), "w") as f:
    json.dump(manifest, f, indent=1)

sw = """const C='supply-chain-v6';
const FILES=['./','./index.html','./manifest.json','./icon-180.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));});
"""
with open(os.path.join(OUT, "sw.js"), "w") as f:
    f.write(sw)

# App icon: globe with arrows
def make_icon(size):
    S = size * 4
    im = Image.new("RGBA", (S, S), (11, 16, 32, 255))
    d = ImageDraw.Draw(im)
    cx = cy = S / 2
    R = S * 0.30
    gold = (245, 184, 61, 255)
    teal = (45, 212, 191, 255)
    w = int(S * 0.028)
    # soft glow
    for i in range(0):
        rr = R + i * S * 0.008
        a = int(10 + (10 - i) * 3)
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=(245, 184, 61, a), width=int(S * 0.01))
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=(22, 30, 56, 255), outline=gold, width=w)
    # meridians
    for k in (0.45, 0.8):
        d.ellipse([cx - R * k, cy - R, cx + R * k, cy + R], outline=gold, width=int(w * 0.7))
    d.line([cx, cy - R, cx, cy + R], fill=gold, width=int(w * 0.7))
    for t in (-0.5, 0, 0.5):
        y = cy + R * t
        half = math.sqrt(max(0, R * R - (R * t) ** 2))
        d.line([cx - half, y, cx + half, y], fill=gold, width=int(w * 0.7))
    # orbit arrows
    def arc_arrow(start, end, rr, color):
        box = [cx - rr, cy - rr * 0.62, cx + rr, cy + rr * 0.62]
        d.arc(box, start, end, fill=color, width=int(w * 1.1))
        a = math.radians(end)
        px, py = cx + rr * math.cos(a), cy + rr * 0.62 * math.sin(a)
        ang = a + math.pi / 2
        L = S * 0.06
        p1 = (px + L * math.cos(ang - 2.6), py + L * 0.62 * math.sin(ang - 2.6) * 1.6)
        p2 = (px + L * math.cos(ang + 2.6), py + L * 0.62 * math.sin(ang + 2.6) * 1.6)
        d.polygon([(px + L * 0.9 * math.cos(ang), py + L * 0.9 * math.sin(ang)), p1, p2], fill=color)
    arc_arrow(200, 330, R * 1.42, teal)
    arc_arrow(20, 150, R * 1.42, teal)
    im = im.resize((size, size), Image.LANCZOS)
    return im.convert("RGB")

make_icon(180).save(os.path.join(OUT, "icon-180.png"))
make_icon(512).save(os.path.join(OUT, "icon-512.png"))
print("built", os.path.getsize(os.path.join(OUT, "index.html")), "bytes")
