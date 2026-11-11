# python tts.py spec.json voice.wav timing.json amp.json [fps]
import json, sys, numpy as np, soundfile as sf
from kokoro import KPipeline
spec = json.load(open(sys.argv[1])); SR = 24000; FPS = int(sys.argv[5]) if len(sys.argv) > 5 else 30
voice = spec.get('voice', 'am_michael'); pipe = KPipeline(lang_code=voice[0])
parts, timing = [], []
for i, s in enumerate(spec['scenes']):
    chunks = []
    for r in pipe(s['say'], voice=voice, speed=spec.get('speed', 1.0)):
        a = r[2] if isinstance(r, tuple) else r.audio
        if a is None: continue
        a = a.detach().cpu().numpy() if hasattr(a, 'detach') else np.asarray(a)
        chunks += [a, np.zeros(int(.08 * SR), dtype=np.float32)]
    a = np.concatenate(chunks)
    gap = 2.8 if i == len(spec['scenes']) - 1 else .22
    parts += [a, np.zeros(int(gap * SR), dtype=np.float32)]
    timing.append({'speech': round(len(a) / SR, 3), 'dur': round(len(a) / SR + gap, 3)}); print(i, timing[-1], flush=True)
v = np.concatenate(parts); sf.write(sys.argv[2], v, SR); json.dump(timing, open(sys.argv[3], 'w'))
hop = SR // FPS; n = len(v) // hop
rms = np.array([np.sqrt(np.mean(v[j * hop:(j + 1) * hop] ** 2)) for j in range(n)])
rms = rms / (np.percentile(rms, 95) + 1e-6); rms = np.clip(rms, 0, 1)
sm = np.convolve(rms, [.25, .5, .25], 'same')
json.dump([round(float(x), 3) for x in sm], open(sys.argv[4], 'w'))
print('total', sum(t['dur'] for t in timing))
