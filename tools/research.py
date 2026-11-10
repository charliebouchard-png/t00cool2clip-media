"""Find fast-rising YouTube videos with the free YouTube Data API (replaces vidIQ trending/outliers).
Usage: YT_API_KEY=... python3 tools/research.py "<query 1>|<query 2>|..." <out.json> [days] [region]

Quota (10,000 free units/day): each query is 100 units; stats for all results ~5-60 units.
For every video it reports views, views per hour (vph) and an outlier score
(views divided by the median views of that channel's recent uploads).
"""
import json, os, sys, statistics, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

KEY = os.environ.get("YT_API_KEY")
if not KEY:
    sys.exit("YT_API_KEY secret is not set: add it under repo Settings > Secrets and variables > Actions")
queries = [q.strip() for q in sys.argv[1].split("|") if q.strip()]
out = sys.argv[2]
days = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] else 14
region = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] else "US"
NOW = datetime.now(timezone.utc)
units = 0


def api(path, **params):
    global units
    params["key"] = KEY
    url = "https://www.googleapis.com/youtube/v3/" + path + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def iso_dur(s):
    h = m = sec = 0
    num = ""
    for ch in s.replace("PT", "").replace("P", ""):
        if ch.isdigit():
            num += ch
        else:
            v = int(num or 0); num = ""
            if ch == "H": h = v
            elif ch == "M": m = v
            elif ch == "S": sec = v
            elif ch == "D": h += 24 * v
    return h * 3600 + m * 60 + sec


def chunks(xs, n=50):
    for i in range(0, len(xs), n):
        yield xs[i:i + n]


after = (NOW - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")
found = {}
for q in queries:
    r = api("search", part="id", q=q, type="video", order="viewCount", publishedAfter=after,
            regionCode=region, relevanceLanguage="en", maxResults=25)
    units += 100
    for it in r.get("items", []):
        found.setdefault(it["id"]["videoId"], q)

videos = []
for ids in chunks(list(found)):
    r = api("videos", part="snippet,statistics,contentDetails", id=",".join(ids))
    units += 1
    for v in r.get("items", []):
        st, sn = v.get("statistics", {}), v["snippet"]
        pub = datetime.fromisoformat(sn["publishedAt"].replace("Z", "+00:00"))
        hours = max(1.0, (NOW - pub).total_seconds() / 3600)
        views = int(st.get("viewCount", 0))
        videos.append({"id": v["id"], "url": "https://www.youtube.com/watch?v=" + v["id"], "title": sn["title"],
                       "channel": sn["channelTitle"], "channelId": sn["channelId"], "published": sn["publishedAt"],
                       "duration_s": iso_dur(v["contentDetails"]["duration"]), "views": views,
                       "likes": int(st.get("likeCount", 0) or 0), "comments": int(st.get("commentCount", 0) or 0),
                       "vph": round(views / hours, 1), "query": found[v["id"]]})

# channel baselines for the outlier score: median views of each channel's recent uploads
chan_ids = sorted({v["channelId"] for v in videos})
uploads, subs = {}, {}
for ids in chunks(chan_ids):
    r = api("channels", part="contentDetails,statistics", id=",".join(ids))
    units += 1
    for c in r.get("items", []):
        uploads[c["id"]] = c["contentDetails"]["relatedPlaylists"]["uploads"]
        subs[c["id"]] = int(c["statistics"].get("subscriberCount", 0) or 0)
recent = {}
for cid, pl in uploads.items():
    try:
        r = api("playlistItems", part="contentDetails", playlistId=pl, maxResults=15)
        units += 1
        recent[cid] = [i["contentDetails"]["videoId"] for i in r.get("items", [])]
    except Exception:
        recent[cid] = []
all_recent = [vid for vs in recent.values() for vid in vs]
rviews = {}
for ids in chunks(all_recent):
    r = api("videos", part="statistics", id=",".join(ids))
    units += 1
    for v in r.get("items", []):
        rviews[v["id"]] = int(v.get("statistics", {}).get("viewCount", 0))
for v in videos:
    base = [rviews[x] for x in recent.get(v["channelId"], []) if x in rviews and x != v["id"]]
    med = statistics.median(base) if base else 0
    v["subscribers"] = subs.get(v["channelId"], 0)
    v["outlier"] = round(v["views"] / med, 1) if med else None

videos.sort(key=lambda v: v["vph"], reverse=True)
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
json.dump({"generated": NOW.isoformat(), "days": days, "region": region, "queries": queries,
           "quota_units_used": units, "videos": videos}, open(out, "w"), indent=1)
print(f"{len(videos)} videos, ~{units} quota units")
for v in videos[:15]:
    print(f"{v['vph']:>9} vph  x{v['outlier']}  {v['views']:>9} views  {v['duration_s'] // 60}m  {v['channel']}: {v['title']}")
