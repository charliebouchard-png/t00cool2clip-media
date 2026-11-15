#!/usr/bin/env python3
"""Builds the day's posting queue from everything Agents 3, 5 and 6 made, then splits it into approval batches for the HUD.

python3 clipdesk/queue.py build <day>      day = YYYY-MM-DD
  reads  shorts/plans/c<YYMMDD>-<k>.json   (Agent 6 clip plans, rendered to branch cd-c<YYMMDD>-<k> by clipdesk-render)
         clipdesk/days/<day>/ai.json       (Agent 5 AI videos: [{id, tiktok_caption, yt_title, yt_description, score, kind}])
  writes clipdesk/days/<day>/queue.json, downloads media to /tmp/clipdesk/<day>/media/<id>.mp4,
         makes previews for AI videos and pushes them to branch cd-ai-<YYMMDD>
python3 clipdesk/queue.py batches <day>    (after qc.py) -> clipdesk/days/<day>/hud/batch_<k>.json + hud/stats.json for ArtifactData

Rules: every item goes to YouTube Shorts; TikTok gets every AI video + the highest-scoring clips up to TIKTOK_MAX (TikTok's API
allows ~15 posts/day per account; going over triggers spam_risk_too_many_posts and a posting block).
Order: sources interleaved (never the same source twice in a row), best clips first, AI videos spread evenly.
"""
import json, os, sys, glob, subprocess, shutil, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = "charliebouchard-png/t00cool2clip-media"
TIKTOK_MAX = int(os.environ.get("TIKTOK_MAX", "15"))
BATCH = 10
GAP_MIN = 10
CDN = f"https://cdn.jsdelivr.net/gh/{REPO}@"

def sh(*a, **k): return subprocess.run(a, check=True, capture_output=True, **k)
def yymmdd(day): return day[2:4] + day[5:7] + day[8:10]

def git_file(branch, path, out):
    sh("git", "-C", ROOT, "fetch", "-q", "origin", branch)
    with open(out, "wb") as fh:
        fh.write(subprocess.run(["git", "-C", ROOT, "show", f"FETCH_HEAD:{path}"], check=True, capture_output=True).stdout)

def build(day):
    d = os.path.join(ROOT, "clipdesk", "days", day); os.makedirs(d, exist_ok=True)
    media = f"/tmp/clipdesk/{day}/media"; os.makedirs(media, exist_ok=True)
    y = yymmdd(day); per_src = []
    for pf in sorted(glob.glob(os.path.join(ROOT, "shorts", "plans", f"c{y}-*.json"))):
        p = json.load(open(pf)); name = p["name"]; br = f"cd-{name}"; rows = []
        if subprocess.run(["git", "-C", ROOT, "ls-remote", "--exit-code", "origin", br], capture_output=True).returncode:
            print("not rendered yet:", br); continue
        for n, c in enumerate(p["clips"], 1):
            iid = f"{name}-{n:02d}"
            try: git_file(br, f"out/{name}/final_{n}.mp4", f"{media}/{iid}.mp4")
            except subprocess.CalledProcessError: print("missing", iid); continue
            credit = f"Clip from: {p['source_title']} by {p['channel']} https://youtu.be/{p['video_id']}"
            tags = c.get("hashtags") or ["#shorts"]
            rows.append({"id": iid, "kind": "clip", "source": p["channel"], "source_title": p["source_title"],
                         "branch": br, "path": f"out/{name}/final_{n}.mp4",
                         "preview": f"{CDN}{br}/previews/{name}/{n}.mp4", "thumb": f"{CDN}{br}/previews/{name}/{n}.jpg",
                         "title": c["title"][:100], "hook": c.get("hook", "").replace("\\N", " "),
                         "yt_description": (c.get("description", "") + "\n\n" + credit + "\n\n" + " ".join(tags)).strip(),
                         "tiktok_caption": c.get("tiktok_caption") or (c["title"].replace("#shorts", "").strip() + " " + " ".join(t for t in tags if t != "#shorts")),
                         "score": float(c.get("score", 5))})
        rows.sort(key=lambda r: -r["score"]); per_src.append(rows)
    ai = json.load(open(os.path.join(d, "ai.json"))) if os.path.exists(os.path.join(d, "ai.json")) else []
    ai_rows = []; prev = tempfile.mkdtemp(); os.makedirs(f"{prev}/previews/ai", exist_ok=True)
    for a in ai:
        iid = a["id"]
        ok = False
        for br, path in ((f"render-ai-{iid}", f"clips/{iid}.mp4"), (f"world-{iid}", f"out/{iid}.mp4")):
            try: git_file(br, path, f"{media}/{iid}.mp4"); ok = True; break
            except subprocess.CalledProcessError: pass
        if not ok: print("AI video not rendered:", iid); continue
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{media}/{iid}.mp4", "-vf", "scale=540:-2", "-c:v", "libx264", "-preset", "veryfast", "-crf", "30", "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", f"{prev}/previews/ai/{iid}.mp4"], check=True)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", "1.5", "-i", f"{media}/{iid}.mp4", "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "4", f"{prev}/previews/ai/{iid}.jpg"], check=True)
        ai_rows.append({"id": iid, "kind": "ai", "source": a.get("kind", "AI video"), "source_title": a.get("topic", ""),
                        "branch": br, "path": path, "preview": f"{CDN}cd-ai-{y}/previews/ai/{iid}.mp4", "thumb": f"{CDN}cd-ai-{y}/previews/ai/{iid}.jpg",
                        "title": a["yt_title"][:100], "hook": a.get("hook", ""), "yt_description": a["yt_description"],
                        "tiktok_caption": a["tiktok_caption"], "score": float(a.get("score", 8))})
    if ai_rows:
        url = subprocess.run(["git", "-C", ROOT, "remote", "get-url", "origin"], capture_output=True, text=True).stdout.strip()
        for c in (["init", "-q"], ["checkout", "-q", "-b", f"cd-ai-{y}"], ["add", "."],
                  ["-c", "user.name=claude", "-c", "user.email=claude@users.noreply.github.com", "commit", "-qm", f"AI previews {day}"],
                  ["push", "-q", "-f", url, f"cd-ai-{y}"]):
            sh("git", "-C", prev, *c)
    shutil.rmtree(prev, ignore_errors=True)
    # interleave sources round-robin, then spread AI videos evenly
    order = []; k = 0
    while any(per_src):
        for rows in per_src:
            if rows: order.append(rows.pop(0))
    if ai_rows:
        total = len(order) + len(ai_rows)
        for j, a in enumerate(ai_rows): order.insert(min(len(order), round((j + 1) * total / (len(ai_rows) + 1)) - 1), a)
    # platforms: everything to Shorts; TikTok = all AI + best clips until TIKTOK_MAX
    tk = {r["id"] for r in ai_rows}
    for r in sorted((r for r in order if r["kind"] == "clip"), key=lambda r: -r["score"]):
        if len(tk) >= TIKTOK_MAX: break
        tk.add(r["id"])
    for r in order: r["platforms"] = ["youtube"] + (["tiktok"] if r["id"] in tk else [])
    q = {"day": day, "gap_min": GAP_MIN, "items": order}
    json.dump(q, open(os.path.join(d, "queue.json"), "w"), indent=1)
    print(f"queue: {len(order)} items ({len(ai_rows)} AI, {len(order)-len(ai_rows)} clips), TikTok {len(tk)}")

def batches(day):
    d = os.path.join(ROOT, "clipdesk", "days", day); q = json.load(open(os.path.join(d, "queue.json")))
    ok = [r for r in q["items"] if r.get("qc", {}).get("pass", True)]
    h = os.path.join(d, "hud"); os.makedirs(h, exist_ok=True)
    for f in glob.glob(f"{h}/batch_*.json"): os.remove(f)
    for k in range(0, len(ok), BATCH):
        part = ok[k:k + BATCH]; b = k // BATCH + 1
        json.dump({"day": day, "n": b, "status": "pending", "createdAt": day + "T00:00:00Z",
                   "items": [{"id": r["id"], "kind": r["kind"], "title": r["title"], "hook": r.get("hook", ""), "source": r["source"],
                              "platforms": r["platforms"], "preview": r["preview"], "thumb": r["thumb"], "score": r["score"],
                              "dur": r.get("qc", {}).get("dur"), "warn": r.get("qc", {}).get("warn", []), "skip": False, "state": "waiting"}
                             for r in part]}, open(f"{h}/batch_{b}.json", "w"), indent=1)
    failed = [r["id"] for r in q["items"] if not r.get("qc", {}).get("pass", True)]
    json.dump({"day": day, "made": len(q["items"]), "qcPassed": len(ok), "qcFailed": failed, "batches": (len(ok) + BATCH - 1) // BATCH,
               "tiktok": sum("tiktok" in r["platforms"] for r in ok), "youtube": len(ok)}, open(f"{h}/stats.json", "w"), indent=1)
    print(f"{(len(ok)+BATCH-1)//BATCH} batches, {len(ok)} items ({len(failed)} failed QC)")

if __name__ == "__main__":
    {"build": build, "batches": batches}[sys.argv[1]](sys.argv[2])
