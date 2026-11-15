#!/usr/bin/env python3
"""Agent 7 — Quality Control. Audits every finished video + its metadata before it can reach the approval box.

python3 clipdesk/qc.py <day>            -> checks every item in clipdesk/days/<day>/queue.json (files in /tmp/clipdesk/<day>/media/<id>.mp4)
                                           writes clipdesk/days/<day>/qc.json and sets item["qc"] = {"pass": bool, "issues": [...], "warn": [...]}
Hard fails (item is dropped from the approval box): wrong size/shape, < 7 s or > 179 s, no audio, near-silent audio,
black or frozen opening, file > 250 MB, missing/oversized title or caption, Pipedream link leak, duplicate of something already posted.
Warnings (shown in the HUD, still postable): long pauses, quiet audio, clip > 60 s, few hashtags.
"""
import json, os, re, subprocess, sys, hashlib, glob

def probe(f):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size:stream=codec_type,width,height", "-of", "json", f], capture_output=True, text=True)
    return json.loads(r.stdout or "{}")

def ff(f, args, dur=None):
    cmd = ["ffmpeg", "-hide_banner", "-nostats"] + (["-t", str(dur)] if dur else []) + ["-i", f] + args + ["-f", "null", "-"]
    return subprocess.run(cmd, capture_output=True, text=True).stderr

def md5(f):
    h = hashlib.md5()
    with open(f, "rb") as fh:
        for b in iter(lambda: fh.read(1 << 20), b""): h.update(b)
    return h.hexdigest()

def posted_hashes(root):
    hs = set()
    for p in glob.glob(os.path.join(root, "clipdesk", "days", "*", "posted.json")):
        try:
            for x in json.load(open(p)): hs.add(x.get("md5"))
        except Exception: pass
    return hs

def check(f, item, seen):
    iss, warn = [], []
    if not os.path.exists(f): return {"pass": False, "issues": ["file missing"], "warn": []}
    p = probe(f); fmt = p.get("format", {}); st = p.get("streams", [])
    v = [s for s in st if s.get("codec_type") == "video"]; a = [s for s in st if s.get("codec_type") == "audio"]
    d = float(fmt.get("duration", 0)); size = int(fmt.get("size", 0))
    if not v or (v[0].get("width"), v[0].get("height")) != (1080, 1920): iss.append(f"not 1080x1920 ({v[0].get('width') if v else '?'}x{v[0].get('height') if v else '?'})")
    if d < 7: iss.append(f"too short ({d:.1f}s, campaigns/platforms reject <7s)")
    if d > 179: iss.append(f"too long for Shorts ({d:.0f}s)")
    elif d > 60: warn.append(f"{d:.0f}s (over 60 s)")
    if size > 250e6: iss.append("file over 250 MB")
    if not a: iss.append("no audio")
    else:
        m = re.search(r"mean_volume: (-?[\d.]+) dB", ff(f, ["-af", "volumedetect"]))
        mv = float(m.group(1)) if m else -99
        if mv < -40: iss.append(f"near-silent audio ({mv} dB)")
        elif mv < -26: warn.append(f"quiet audio ({mv} dB)")
        sil = re.findall(r"silence_duration: ([\d.]+)", ff(f, ["-af", "silencedetect=n=-45dB:d=1.2"]))
        if sil: warn.append(f"{len(sil)} pause(s) > 1.2 s")
    e = ff(f, ["-vf", "blackdetect=d=0.4:pix_th=0.08"], dur=3)
    if re.search(r"black_start:0(\.0+)?\b", e): iss.append("opens on a black frame")
    e = ff(f, ["-vf", "freezedetect=n=0.003:d=2.5"], dur=6)
    if "freeze_start: 0" in e or re.search(r"freeze_start: [0-1]\.", e): iss.append("frozen picture in the first seconds")
    t = item.get("title", ""); c = item.get("tiktok_caption", ""); yd = item.get("yt_description", "")
    if not t or len(t) > 100: iss.append("YouTube title missing or over 100 chars")
    if "youtube" in item.get("platforms", []) and "#shorts" not in (t + yd).lower(): warn.append("no #shorts tag")
    if "tiktok" in item.get("platforms", []):
        if not c or len(c) > 2200: iss.append("TikTok caption missing or too long")
        elif len(re.findall(r"#\w+", c)) < 3: warn.append("fewer than 3 hashtags")
    if "pipedream.net" in (t + c + yd): iss.append("Pipedream link in metadata")
    h = md5(f)
    if h in seen: iss.append("duplicate of a video already posted")
    return {"pass": not iss, "issues": iss, "warn": warn, "dur": round(d, 1), "md5": h}

if __name__ == "__main__":
    day = sys.argv[1]; root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    qp = os.path.join(root, "clipdesk", "days", day, "queue.json"); q = json.load(open(qp))
    seen = posted_hashes(root); res = {}
    for it in q["items"]:
        r = check(f"/tmp/clipdesk/{day}/media/{it['id']}.mp4", it, seen)
        if r["pass"]: seen.add(r.get("md5"))
        it["qc"] = r; res[it["id"]] = r
        print(("PASS " if r["pass"] else "FAIL ") + it["id"], "; ".join(r["issues"] + ["warn: " + w for w in r["warn"]]))
    json.dump(q, open(qp, "w"), indent=1); json.dump(res, open(os.path.join(os.path.dirname(qp), "qc.json"), "w"), indent=1)
    n = sum(r["pass"] for r in res.values()); print(f"QC: {n}/{len(res)} passed")
