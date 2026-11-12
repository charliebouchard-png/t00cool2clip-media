#!/usr/bin/env python3
# python3 shorts/make.py shorts/plans/<name>.json  -> /tmp/shorts/<name>/final_<n>.mp4 (1080x1920, captions burned, hook title)
import json, sys, os, subprocess, math
plan = json.load(open(sys.argv[1])); NAME = plan['name']; W = f"/tmp/shorts/{NAME}"; os.makedirs(W, exist_ok=True)
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); FONTS = os.path.join(R, 'explainer', 'fonts')
words = json.load(open(f"{W}/words.json"))
YT = ["python3", os.path.expanduser("~/ytd/yt-dlp"), "-q", "--no-warnings", "--js-runtimes", "node", "--remote-components", "ejs:github", "--extractor-args", "youtube:player_client=mweb,web_embedded"]
def ts(t): h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60; return f"{h}:{m:02d}:{s:05.2f}"
def esc(t): return t.replace('{', '(').replace('}', ')').replace('\n', '\\N')
for i, c in enumerate(plan['clips'], 1):
    st, en = float(c['start']), float(c['end']); dur = en - st
    raw = f"{W}/raw_{i}.mp4"
    if not os.path.exists(raw):
        subprocess.run(YT + ["-f", "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080]", "--download-sections", f"*{st-1:.2f}-{en+1:.2f}", "--force-keyframes-at-cuts", "--merge-output-format", "mp4", "-o", raw, "--", plan['video_id']], check=True)
    # ASS: hook title (top, whole clip) + 3-word caption chunks with active-word highlight
    ws = [w for w in words if st <= w['s'] < en]
    ev = []
    hook = esc(c['hook'])
    ev.append(f"Dialogue: 1,{ts(0)},{ts(dur)},Hook,,0,0,0,,{hook}")
    for g in range(0, len(ws), 3):
        grp = ws[g:g + 3]
        for j, w in enumerate(grp):
            a = w['s'] - st + 1.0; b = (grp[j + 1]['s'] if j + 1 < len(grp) else (ws[g + 3]['s'] if g + 3 < len(ws) else w['e'] + .3)) - st + 1.0
            txt = ' '.join(("{\\c&H3FD2FF&}" + esc(x['w'].upper()) + "{\\c&HFFFFFF&}") if k == j else esc(x['w'].upper()) for k, x in enumerate(grp))
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
    vf = ("[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:3,eq=brightness=-0.18[bg];"
          f"[b]scale=1080:-2,zoompan=z='min(1+0.0006*on,1.08)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x608:fps=30[fg];"
          f"[bg][fg]overlay=0:(H-h)/2-40,subtitles={W}/sub_{i}.ass:fontsdir={FONTS}[v]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "1.0", "-i", raw, "-t", f"{dur:.2f}", "-filter_complex", vf, "-map", "[v]", "-map", "0:a",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-af", "loudnorm=I=-14:TP=-1.5", "-movflags", "+faststart", out], check=True)
    print(out, round(dur, 1), "s")
