"""Kokoro voiceover with word timings.  python tts.py story.json voice.wav timing.json"""
import json, sys
import numpy as np, soundfile as sf
from kokoro import KPipeline

spec = json.load(open(sys.argv[1])); SR = 24000
voice = spec.get('voice', 'am_puck'); speed = spec.get('speed', 1.1)
pipe = KPipeline(lang_code=voice[0])
audio, words, beats, t = [], [], [], 0.0
for i, b in enumerate(spec['beats']):
    start, seg, n = t, [], 0
    for r in pipe(b['say'], voice=voice, speed=speed):
        a = r.audio
        a = a.detach().cpu().numpy() if hasattr(a, 'detach') else np.asarray(a, dtype=np.float32)
        off = start + n / SR
        got = False
        for tk in (getattr(r, 'tokens', None) or []):
            txt = (tk.text or '').strip()
            if not txt: continue
            if not any(ch.isalnum() for ch in txt):
                if words and words[-1]['t0'] >= start: words[-1]['w'] += txt
                continue
            if tk.start_ts is None or tk.end_ts is None: continue
            words.append({'w': txt, 't0': round(off + tk.start_ts, 3), 't1': round(off + tk.end_ts, 3)}); got = True
        if not got:
            ws = r.graphemes.split(); d = len(a) / SR
            for k, w in enumerate(ws): words.append({'w': w, 't0': round(off + k * d / len(ws), 3), 't1': round(off + (k + 1) * d / len(ws), 3)})
        seg.append(a); n += len(a)
    a = np.concatenate(seg) if seg else np.zeros(SR // 2, np.float32)
    gap = 0.1 if i < len(spec['beats']) - 1 else 1.2
    audio += [a, np.zeros(int(gap * SR), np.float32)]
    d = len(a) / SR + gap; beats.append({'start': round(start, 3), 'dur': round(d, 3)}); t += d
    print(i, round(d, 2), flush=True)
sf.write(sys.argv[2], np.concatenate(audio), SR)
json.dump({'beats': beats, 'words': words, 'dur': t}, open(sys.argv[3], 'w'))
print('total', round(t, 1), 'words', len(words))
