# python commons.py out_dir '["query1","query2"]'  -> candidates + meta.json + contact sheets
import json, sys, os, time, urllib.request, urllib.parse, re
from PIL import Image, ImageDraw
D = sys.argv[1]; qs = json.loads(sys.argv[2]); os.makedirs(D, exist_ok=True)
UA = {"User-Agent": "t00cool2clip-world/1.0 (https://github.com/charliebouchard-png/t00cool2clip-media)"}
def get(u):
    for i in range(5):
        try: return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()
        except Exception as e: print("retry", e); time.sleep(3 + i * 3)
meta = {}
OK = re.compile(r"^(cc0|public domain|pd|cc by(-sa)? [0-9.]+.*)$", re.I)
for qi, q in enumerate(qs):
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({"action": "query", "format": "json", "generator": "search", "gsrnamespace": 6, "gsrlimit": 30, "gsrsearch": q + " filetype:bitmap", "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 1800})
    d = json.loads(get(u) or b"{}"); pages = sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    tiles = []
    for p in pages:
        ii = p["imageinfo"][0]; m = ii.get("extmetadata", {})
        lic = re.sub("<[^>]+>", "", m.get("LicenseShortName", {}).get("value", ""))
        if ii["width"] < 1400 or not OK.match(lic.strip()): continue
        k = f"q{qi}_{len(tiles)}"; raw = get(ii["thumburl"]); 
        if not raw: continue
        open(f"{D}/{k}.jpg", "wb").write(raw)
        try: im = Image.open(f"{D}/{k}.jpg").convert("RGB")
        except Exception: continue
        meta[k] = {"q": q, "file": p["title"], "page": ii["descriptionurl"], "license": lic, "artist": re.sub("<[^>]+>", "", m.get("Artist", {}).get("value", ""))[:120], "w": im.width, "h": im.height}
        t = im.copy(); t.thumbnail((400, 300)); c = Image.new("RGB", (400, 320)); c.paste(t)
        ImageDraw.Draw(c).text((4, 302), f"{k} {lic}", fill="white"); tiles.append(c)
        if len(tiles) >= 8: break
        time.sleep(.5)
    if tiles:
        sh = Image.new("RGB", (1600, 320 * ((len(tiles) + 3) // 4)))
        for j, t in enumerate(tiles): sh.paste(t, ((j % 4) * 400, (j // 4) * 320))
        sh.save(f"{D}/sheet_q{qi}.jpg", quality=82)
    print(qi, q, len(tiles), flush=True)
json.dump(meta, open(f"{D}/meta.json", "w"), indent=1)
