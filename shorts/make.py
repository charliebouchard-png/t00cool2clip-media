#!/usr/bin/env python3
# python3 shorts/make.py shorts/plans/<name>.json  -> /tmp/shorts/<name>/final_<n>.mp4 (1080x1920, captions burned, hook title)
import json, sys, os, subprocess, math
plan = json.load(open(sys.argv[1])); NAME = plan['name']; W = f"/tmp/shorts/{NAME}"; os.makedirs(W, exist_ok=True)
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); FONTS = os.path.join(R, 'explainer', 'fonts')
words = json.load(open(f"{W}/words.json"))
YT = ["python3", os.path.expanduser("~/ytd/yt-dlp"), "-q", "--no-warnings", "--js-runtimes", "node", "--remote-components", "ejs:github", "--extractor-args", "youtube:player_client=mweb,web_embedded"]
def ts(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f"{h}:{m:02d}:{s:05.2f}"

# --- face-tracked 9:16 crop (falls back to blurred-background layout when no faces) ---
def face_track(path, dur):
    try:
        import cv2
    except Exception:
        print('opencv missing: pip install --break-system-packages opencv-python-headless'); return None
    xml = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "haarcascade_frontalface_default.xml")
    casc = cv2.CascadeClassifier(xml)
    if casc.empty():
        return None
    cap = cv2.VideoCapture(path); fps = cap.get(cv2.CAP_PROP_FPS) or 30
    W0 = cap.get(cv2.CAP_PROP_FRAME_WIDTH); H0 = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    if not W0 or W0 / max(H0, 1) < 1.2:
        return None  # already vertical-ish
    pts = []; t = 1.0
    while t < dur + 1.0:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); ok, fr = cap.read()
        if not ok: break
        g = cv2.cvtColor(cv2.resize(fr, (int(W0 * 360 / H0), 360)), cv2.COLOR_BGR2GRAY)
        f = casc.detectMultiScale(g, 1.15, 6, minSize=(28, 28))
        if len(f):
            x, y, w, h = max(f, key=lambda r: r[2] * r[3]); pts.append((t - 1.0, (x + w / 2) / g.shape[1]))
        else:
            pts.append((t - 1.0, None))
        t += 0.5
    cap.release()
    hits = [p for p in pts if p[1] is not None]
    if len(hits) < max(3, 0.35 * len(pts)):
        return None
    # fill gaps with last seen, then median-smooth and merge into steady segments
    last = hits[0][1]; xs = []
    for tt, v in pts:
        last = v if v is not None else last; xs.append((tt, last))
    sm = []
    for k in range(len(xs)):
        win = sorted(v for _, v in xs[max(0, k - 2):k + 3]); sm.append((xs[k][0], win[len(win) // 2]))
    segs = [[sm[0][0], sm[0][1]]]
    for tt, v in sm[1:]:
        if abs(v - segs[-1][1]) > 0.12: segs.append([tt, v])
    segs = segs[:14]
    return segs, W0 / H0

def crop_expr(segs, ar):
    # source scaled to 1920 tall -> width = 1920*ar; crop 1080 wide centred on face x (clamped)
    SW = 1920 * ar
    def cx(v): return max(0, min(SW - 1080, v * SW - 540))
    e = f"{cx(segs[-1][1]):.0f}"
    for k in range(len(segs) - 2, -1, -1):
        e = f"if(lt(t,{segs[k + 1][0]:.2f}),{cx(segs[k][1]):.0f},{e})"
    return e
import re as _re
_BAD = _re.compile(r"\b(f+u+c+k\w*|s+h+i+t\w*|b+i+t+c+h\w*|c+u+n+t\w*|motherf\w*|d+i+c+k\w*)", _re.I)
def censor(t): return _BAD.sub(lambda m: m.group(0)[0] + '*' * (len(m.group(0)) - 1), t)
def esc(t): return t.replace('{', '(').replace('}', ')').replace('\n', '\\N')
for i, c in enumerate(plan['clips'], 1):
    st, en = float(c['start']), float(c['end'])
    _w = [w for w in words if w['s'] >= st - .3]; st = _w[0]['s'] - .15 if _w else st
    _e = [w for w in words if w['e'] <= en + .3]; en = _e[-1]['e'] + .35 if _e else en
    dur = en - st
    raw = f"{W}/raw_{i}.mp4"
    if not os.path.exists(raw):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{max(0, st-1):.2f}", "-i", f"{W}/src.mp4", "-t", f"{dur+2:.2f}", "-vf", "scale=-2:1080", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-c:a", "aac", "-b:a", "192k", raw], check=True)
    # ASS: hook title (top, whole clip) + 3-word caption chunks with active-word highlight
    ws = [w for w in words if st <= w['s'] < en]
    ev = []
    hook = esc(c['hook'])
    ev.append(f"Dialogue: 1,{ts(0)},{ts(dur)},Hook,,0,0,0,,{hook}")
    for g in range(0, len(ws), 3):
        grp = ws[g:g + 3]
        for j, w in enumerate(grp):
            a = w['s'] - st + 1.0; b = (grp[j + 1]['s'] if j + 1 < len(grp) else (ws[g + 3]['s'] if g + 3 < len(ws) else w['e'] + .3)) - st + 1.0
            txt = ' '.join(("{\\c&H3FD2FF&}" + esc(censor(x['w']).upper()) + "{\\c&HFFFFFF&}") if k == j else esc(censor(x['w']).upper()) for k, x in enumerate(grp))
            ev.append(f"Dialogue: 0,{ts(max(0,a))},{ts(max(a+.05,b))},Cap,,0,0,0,,{txt}")
    credit = esc(f"🎥 {plan['channel']}")
    ev.append(f"Dialogue: 0,{ts(0)},{ts(dur+2)},Credit,,0,0,0,,{credit}")
    ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,Archivo Black,66,&H00111111,&H00111111,&H00FFFFFF,&H00FFFFFF,0,0,0,0,100,100,0,0,3,18,0,8,70,70,250,1
Style: Cap,Archivo Black,78,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,7,3,2,60,60,470,1
Style: Credit,Archivo Black,34,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,3,0,2,60,60,330,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + "\n".join(ev) + "\n"
    open(f"{W}/sub_{i}.ass", "w").write(ass)
    out = f"{W}/final_{i}.mp4"
    ft = face_track(raw, dur)
    if ft:
        segs, ar = ft
        vf = (f"[0:v]scale=-2:1920,crop=1080:1920:'{crop_expr(segs, ar)}':0,"
              f"subtitles={W}/sub_{i}.ass:fontsdir={FONTS}[v]")
        print(f"clip {i}: face-tracked crop, {len(segs)} segment(s)")
    else:
      vf = ("[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:3,eq=brightness=-0.18[bg];"
            f"[b]scale=1080:-2,zoompan=z='min(1+0.0006*on,1.08)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x608:fps=30[fg];"
            f"[bg][fg]overlay=0:(H-h)/2-40,subtitles={W}/sub_{i}.ass:fontsdir={FONTS}[v]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "1.0", "-i", raw, "-t", f"{dur:.2f}", "-filter_complex", vf, "-map", "[v]", "-map", "0:a",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-af", "loudnorm=I=-14:TP=-1.5", "-movflags", "+faststart", out], check=True)
    print(out, round(dur, 1), "s")
