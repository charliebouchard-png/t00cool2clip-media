"""Cut vertical captioned clips from a source video.
Usage: python3 tools/render.py <source.mp4> <jobs.json> <outdir>"""
import json, subprocess, sys, os

src, jobs, outdir = sys.argv[1:4]
os.makedirs(outdir, exist_ok=True)

def ts(x):
    h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
    return f"{h}:{m:02d}:{s:05.2f}"

HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,Poppins,76,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,7,3,5,70,70,0,1
Style: Cap,Poppins,74,&H0000E1FF,&H0000E1FF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,7,3,5,60,60,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

for c in json.load(open(jobs)):
    dur = c["dur"]
    ev = [f"Dialogue: 1,{ts(0)},{ts(dur)},Hook,,0,0,0,,{{\\pos(540,340)\\fad(150,0)}}{c['hook'].upper()}"]
    cues = c["cues"]
    for i, (a, b, t) in enumerate(cues):
        if i + 1 < len(cues):
            b = min(b, cues[i + 1][0])
        if b - a < 0.12:
            continue
        ev.append(f"Dialogue: 0,{ts(a)},{ts(min(b, dur))},Cap,,0,0,0,,{{\\pos(540,1390)\\fscx85\\fscy85\\t(0,90,\\fscx100\\fscy100)}}{t.upper()}")
    ass = os.path.join(outdir, c["name"] + ".ass")
    open(ass, "w").write(HEAD + "\n".join(ev) + "\n")
    out = os.path.join(outdir, c["name"] + ".mp4")
    vf = ("[0:v]split[a][b];"
          "[a]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:2,eq=brightness=-0.12,scale=1080:1920[bg];"
          f"[b]scale={c.get('scale', 1240)}:-2,crop=1080:ih[fg];"
          f"[bg][fg]overlay=0:(H-h)/2-70,fps=30,ass={ass}:fontsdir=fonts[v]")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-ss", str(c["start"]), "-t", str(dur), "-i", src,
           "-filter_complex", vf, "-map", "[v]", "-map", "0:a:0",
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out]
    print("render", c["name"], flush=True)
    subprocess.run(cmd, check=True)
    os.remove(ass)
