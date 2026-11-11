# python sfx.py spec.json timing.json out.wav  -> whoosh on scene changes, pop on cards
import json, sys, numpy as np, soundfile as sf
SR = 48000; spec = json.load(open(sys.argv[1])); tm = json.load(open(sys.argv[2]))
T = sum(t['dur'] for t in tm) + 1; out = np.zeros(int(T * SR), np.float32); rng = np.random.default_rng(3)
def add(sig, t):
    i = int(t * SR); j = min(len(out), i + len(sig)); out[i:j] += sig[:j - i]
def whoosh(d=.45):
    n = int(d * SR); x = rng.standard_normal(n).astype(np.float32)
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    # crude sweep: blend lowpassed and raw noise over time
    lp = np.convolve(x, np.ones(40) / 40, 'same'); k = np.linspace(0, 1, n)
    return ((lp * (1 - k) + x * .25 * k) * env * .5).astype(np.float32)
def pop():
    n = int(.12 * SR); t = np.arange(n) / SR; f = 900 - 500 * t / .12
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * .35).astype(np.float32)
t0 = 0
for i, (sc, tt) in enumerate(zip(spec['scenes'], tm)):
    if i: add(whoosh(), max(0, t0 - .2))
    for c in sc.get('cards', []): add(pop(), t0 + (c.get('at', 0)) * tt['dur'])
    t0 += tt['dur']
sf.write(sys.argv[3], out, SR)
