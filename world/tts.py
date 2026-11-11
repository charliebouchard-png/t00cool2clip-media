# python tts.py spec.json voice.wav timing.json amp.json [fps]
import json, sys, numpy as np, soundfile as sf
from kokoro import KPipeline
spec = json.load(open(sys.argv[1])); SR = 24000
if spec.get('cast'):
    import os; c = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cast.json')))[spec['cast']]
    for k in ('voice', 'speed', 'pitch'): spec.setdefault(k, c[k]); FPS = int(sys.argv[5]) if len(sys.argv) > 5 else 30
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
    gap = .35 if i == len(spec['scenes']) - 1 else .22
    parts += [a, np.zeros(int(gap * SR), dtype=np.float32)]
    timing.append({'speech': round(len(a) / SR, 3), 'dur': round(len(a) / SR + gap, 3)}); print(i, timing[-1], flush=True)
v = np.concatenate(parts); sf.write(sys.argv[2], v, SR); json.dump(timing, open(sys.argv[3], 'w'))
pitch = spec.get('pitch', 1.0)
if pitch != 1.0:
    import subprocess
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', sys.argv[2], '-af', f'asetrate={int(SR*pitch)},aresample={SR},atempo={1/pitch:.5f}', sys.argv[2] + '.p.wav'], check=True)
    v, _ = sf.read(sys.argv[2] + '.p.wav', dtype='float32'); import os; os.replace(sys.argv[2] + '.p.wav', sys.argv[2])
hop = SR // FPS; n = len(v) // hop
rms = np.array([np.sqrt(np.mean(v[j * hop:(j + 1) * hop] ** 2)) for j in range(n)])
rms = rms / (np.percentile(rms, 95) + 1e-6); rms = np.clip(rms, 0, 1)
sm = np.convolve(rms, [.25, .5, .25], 'same')
json.dump([round(float(x), 3) for x in sm], open(sys.argv[4], 'w'))
print('total', sum(t['dur'] for t in timing))
