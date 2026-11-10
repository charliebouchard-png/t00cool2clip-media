"""Cut vertical captioned clips from a source video.
Usage: python3 tools/render.py <source.mp4> <jobs.json> <outdir>

Each job: {"name", "start", "dur", "hook"} plus optional
  "keywords": words to highlight in captions (green),
  "punch": words that trigger a punch-in zoom (first time each is said),
  "skip": [[abs_start, abs_end], ...] source ranges to leave out (to join two moments),
  "tighten": false to keep pauses (default true: dead air and fillers are cut),
  "sfx": false to skip the whoosh/pop sounds,
  "cues": [[start_rel, end_rel, text], ...] fallback captions if whisper is unavailable,
  "words": [[abs_start, abs_end, word], ...] word timings to use instead of transcribing.
"""
import json, subprocess, sys, os, re, tempfile

src, jobs, outdir = sys.argv[1:4]
os.makedirs(outdir, exist_ok=True)
TMP = tempfile.mkdtemp()
FONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts")

FILLERS = {"um", "uh", "erm", "uhm", "umm", "hmm", "ah", "er", "mm"}
STOP = set("""a an the and or but so if then than that this these those there their they them you your yours
we our ours i me my mine he him his she her hers it its is are was were be been being am do does did done
have has had having will would should could can may might must of in on at to for from by with about into
over under again just very really also too not no yes all any some more most such only own same other what
which who whom when where why how because while during before after above below up down out off here
thing things gonna wanna like know actually right okay well going get got make made one two let lets""".split())
BAD = ["motherfucker", "fucking", "fucked", "fucker", "fuck", "shitty", "shit", "bitches", "bitch", "dumbass",
       "asshole", "ass", "dick", "niggas", "nigga", "pussy", "bastard", "cunt", "damn"]
CAP_YELLOW = "&H0000E1FF&"
HILITE = "&H0055FF3C&"  # bright green (BGR)


def censor(w):
    def rep(m):
        s = m.group(0)
        return s[0] + "*" * (len(s) - 1)
    for b in BAD:
        w = re.sub(r"\b" + b + r"\b", rep, w, flags=re.I) if b != "ass" else re.sub(r"\bass\b", rep, w, flags=re.I)
    return w


def ts(x):
    x = max(0, x)
    h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def norm(w):
    return re.sub(r"[^a-z0-9$%']", "", w.lower())


def run(cmd):
    subprocess.run(cmd, check=True)


def load_wav(path):
    import wave, numpy as np
    with wave.open(path) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype("float32") / 32768.0


_model = None
def model():
    global _model
    if _model is None:
        try:
            from faster_whisper import WhisperModel
            _model = WhisperModel(os.environ.get("WHISPER_MODEL", "small.en"), device="cpu", compute_type="int8")
        except Exception as e:  # noqa
            print("whisper unavailable:", e, flush=True)
            _model = False
    return _model


def transcribe_words(start, dur):
    m = model()
    if not m:
        return None
    a = max(0.0, start - 1.5)
    wav = os.path.join(TMP, "w.wav")
    run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(a), "-t", str(dur + 3), "-i", src,
         "-vn", "-ac", "1", "-ar", "16000", wav])
    segs, _ = m.transcribe(load_wav(wav), word_timestamps=True, beam_size=5, condition_on_previous_text=False)
    out = []
    for s in segs:
        for w in s.words or []:
            out.append([a + w.start, a + w.end, w.word.strip()])
    return out


def plan(c):
    """Return (clip_start, clip_end, keep intervals relative to clip_start, kept words abs)."""
    start, dur = float(c["start"]), float(c["dur"])
    words = c.get("words") or transcribe_words(start, dur)
    if not words:
        return start, start + dur, [(0.0, dur)], None
    W = [w for w in words if start - 0.4 <= (w[0] + w[1]) / 2 <= start + dur + 0.4 and w[2]]
    skips = [tuple(map(float, k)) for k in c.get("skip", [])]
    W = [w for w in W if not any(a <= (w[0] + w[1]) / 2 <= b for a, b in skips)]
    if not W:
        return start, start + dur, subtract([(0.0, dur)], skips, start), None
    cs = max(0.0, W[0][0] - 0.12) if W[0][0] - start < 3 else start
    ce = W[-1][1] + 0.35
    speech = [w for w in W if norm(w[2]) not in FILLERS]
    if c.get("tighten", True) is False:
        return cs, ce, subtract([(0.0, ce - cs)], skips, cs), speech
    MAXGAP = 0.45
    spans = []
    for s, e, _ in speech:
        s, e = s - 0.07, e + 0.07
        if spans and s - spans[-1][1] <= MAXGAP:
            spans[-1][1] = max(spans[-1][1], e)
        else:
            spans.append([s, e])
    spans[0][0] = cs
    spans[-1][1] = ce
    keep = [(max(0.0, a - cs), b - cs) for a, b in spans if b > a]
    return cs, ce, subtract(keep, skips, cs), speech


def subtract(keep, skips, cs):
    out = list(keep)
    for a, b in skips:
        a, b = a - cs, b - cs
        nxt = []
        for x, y in out:
            if b <= x or a >= y:
                nxt.append((x, y))
            else:
                if a > x: nxt.append((x, a))
                if b < y: nxt.append((b, y))
        out = nxt
    return [(x, y) for x, y in out if y - x > 0.05]


def mapper(keep):
    def f(t):
        acc = 0.0
        for a, b in keep:
            if t < a:
                return acc
            if t <= b:
                return acc + t - a
            acc += b - a
        return acc
    return f


def build_cues(speech, cs, f, kw):
    toks = []
    for s, e, w in speech:
        toks.append((f(s - cs), f(e - cs), w))
    cues, cur = [], []
    for t in toks:
        cur.append(t)
        txt = " ".join(x[2] for x in cur)
        if len(cur) >= 3 or len(txt) >= 16 or re.search(r"[.?!,]$", t[2]):
            cues.append(cur); cur = []
    if cur:
        cues.append(cur)
    out = []
    for i, cue in enumerate(cues):
        a, b = cue[0][0], cue[-1][1]
        if i + 1 < len(cues):
            nxt = cues[i + 1][0][0]
            b = nxt if nxt - b < 0.35 else b
        words = [re.sub(r"[.,;:]+$", "", censor(x[2])).upper() for x in cue]
        # one highlighted word per cue: keyword > number > long content word
        hi = None
        for j, x in enumerate(cue):
            if norm(x[2]) in kw:
                hi = j; break
        if hi is None:
            for j, x in enumerate(cue):
                if re.search(r"\d|\$|%", x[2]):
                    hi = j; break
        if hi is None:
            cands = [(len(norm(x[2])), j) for j, x in enumerate(cue) if norm(x[2]) not in STOP and len(norm(x[2])) >= 7]
            if cands:
                hi = max(cands)[1]
        parts = []
        for j, w in enumerate(words):
            w = w.replace("{", "(").replace("}", ")")
            parts.append("{\\c" + HILITE + "\\fscx108\\fscy108}" + w + "{\\c" + CAP_YELLOW + "\\fscx100\\fscy100}" if j == hi else w)
        out.append((a, b, " ".join(parts), [norm(x[2]) for x in cue]))
    return out


def punch_times(c, cues, total):
    want = [norm(w) for w in c.get("punch", [])]
    times = []
    for w in want:
        for a, b, _, ws in cues:
            if w in ws or any(w and x.startswith(w) for x in ws):
                times.append(a); break
    if not times:  # auto: highlighted keyword moments around 40% and 75%
        kw = {norm(k) for k in c.get("keywords", [])}
        hits = [a for a, b, _, ws in cues if kw & set(ws)] or [a for a, b, t, ws in cues if "\\c" + HILITE in t]
        for target in (0.4 * total, 0.75 * total):
            if hits:
                times.append(min(hits, key=lambda x: abs(x - target)))
    times = sorted(set(round(t, 2) for t in times if 1.0 < t < total - 1.0))
    out = []
    for t in times:
        if not out or t - out[-1] >= 3.5:
            out.append(t)
    return out[:3]


def zoom_expr(times):
    if not times:
        return "1"
    env = "+".join(f"if(between(t,{p},{p + 1.5}),min(1,(t-{p})/0.1)*min(1,({p + 1.5}-t)/0.3),0)" for p in times)
    return f"(1+0.12*({env}))"


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
    print("render", c["name"], flush=True)
    cs, ce, keep, speech = plan(c)
    f = mapper(keep)
    total = sum(b - a for a, b in keep)
    kw = {norm(k) for k in c.get("keywords", [])}
    if speech:
        cues = build_cues(speech, cs, f, kw)
    else:
        cues = [(a, b, censor(t).upper(), [norm(x) for x in t.split()]) for a, b, t in c.get("cues", [])]
    punches = punch_times(c, cues, total)
    print(f"  {cs:.2f}-{ce:.2f}s, {len(keep)} spans, {total:.1f}s after cuts, punches {punches}", flush=True)

    # 1) cut the clip with pauses and fillers removed
    cut = os.path.join(TMP, c["name"] + "_cut.mp4")
    sel = "+".join(f"between(t,{a:.3f},{b:.3f})" for a, b in keep)
    run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{cs:.3f}", "-t", f"{ce - cs + 0.1:.3f}", "-i", src,
         "-vf", f"fps=30,select='{sel}',setpts=N/FRAME_RATE/TB,scale=-2:1080",
         "-af", f"aselect='{sel}',asetpts=N/SR/TB", "-map", "0:v:0", "-map", "0:a:0",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-c:a", "pcm_s16le", cut.replace(".mp4", ".mov")])
    cut = cut.replace(".mp4", ".mov")

    # 2) captions
    ev = [f"Dialogue: 1,{ts(0)},{ts(total)},Hook,,0,0,0,,{{\\pos(540,340)\\fad(150,0)}}{c['hook'].upper()}"]
    for a, b, t, _ in cues:
        if b - a < 0.12 or a >= total:
            continue
        ev.append(f"Dialogue: 0,{ts(a)},{ts(min(b, total))},Cap,,0,0,0,,{{\\pos(540,1390)\\fscx85\\fscy85\\t(0,90,\\fscx100\\fscy100)}}{t}")
    ass = os.path.join(TMP, c["name"] + ".ass")
    open(ass, "w").write(HEAD + "\n".join(ev) + "\n")

    # 3) compose: blurred fill, centred video, punch-in zooms, captions, sound effects
    z = zoom_expr(punches)
    vf = ("[0:v]split[a][b];"
          "[a]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=10:2,eq=brightness=-0.12,scale=1080:1920[bg];"
          f"[b]scale={c.get('scale', 1240)}:-2,crop=1080:ih[fg];"
          "[bg][fg]overlay=0:(H-h)/2-70,setsar=1[comp];"
          f"[comp]scale=w='trunc(1080*{z}/2)*2':h='trunc(1920*{z}/2)*2':eval=frame,crop=1080:1920,setsar=1[zm];"
          f"[zm]ass={ass}:fontsdir={FONTS}[v]")
    inputs = ["-i", cut]
    if c.get("sfx", True):
        inputs += ["-f", "lavfi", "-i", "anoisesrc=d=0.55:c=pink:a=0.5,highpass=f=300,lowpass=f=4000,afade=t=in:d=0.3,afade=t=out:st=0.3:d=0.25"]
        af = "[1:a]volume=0.55[wh];"
        mix = ["[0:a]", "[wh]"]
        for i, p in enumerate(punches):
            inputs += ["-f", "lavfi", "-i", "sine=f=900:d=0.09,afade=t=out:st=0:d=0.09"]
            ms = int(p * 1000)
            af += f"[{i + 2}:a]volume=0.35,adelay=delays={ms}:all=1[p{i}];"
            mix.append(f"[p{i}]")
        af += "".join(mix) + f"amix=inputs={len(mix)}:duration=first:normalize=0,alimiter=limit=0.95[aout]"
        fc = vf + ";" + af
        amap = "[aout]"
    else:
        fc, amap = vf, "0:a:0"
    out = os.path.join(outdir, c["name"] + ".mp4")
    run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", fc, "-map", "[v]", "-map", amap,
         "-t", f"{total:.3f}", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", out])
    os.remove(ass); os.remove(cut)
