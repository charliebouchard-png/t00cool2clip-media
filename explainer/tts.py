# python tts.py spec.json voice.wav timing.json
import json, sys, numpy as np, soundfile as sf
from kokoro import KPipeline
spec = json.load(open(sys.argv[1])); SR = 24000
voice = spec.get('voice', 'bf_emma'); pipe = KPipeline(lang_code=voice[0])
parts, timing = [], []
for i, b in enumerate(spec['beats']):
    chunks = []
    for r in pipe(b['say'], voice=voice, speed=spec.get('speed', 1.0)):
        a = r[2] if isinstance(r, tuple) else r.audio
        if a is None: continue
        a = a.detach().cpu().numpy() if hasattr(a, 'detach') else np.asarray(a)
        chunks.append(a); chunks.append(np.zeros(int(.12 * SR), dtype=np.float32))
    a = np.concatenate(chunks) if chunks else np.zeros(SR, dtype=np.float32)
    nxt = spec['beats'][i + 1]['vis'] if i + 1 < len(spec['beats']) else None
    gap = .9 if (isinstance(nxt, dict) and nxt.get('type') == 'chapter') else .35
    if isinstance(b['vis'], dict) and b['vis'].get('type') == 'chapter': gap = .7
    if i == len(spec['beats']) - 1: gap = 2.5
    speech = len(a) / SR; parts += [a, np.zeros(int(gap * SR), dtype=np.float32)]
    timing.append({'speech': round(speech, 3), 'dur': round(speech + gap, 3)}); print(i, round(speech, 2), flush=True)
sf.write(sys.argv[2], np.concatenate(parts), SR); json.dump(timing, open(sys.argv[3], 'w'))
print('total', sum(t['dur'] for t in timing))
