# python sfx.py spec.json timing.json out.wav -> sound design synced to the spec
# hook tick at 0, whoosh per scene, soft swish per camera move, pop per number card, thunk per badge,
# boing per emoji burst, ding per poll, riser into the final scene (twist).
import json, sys, numpy as np, soundfile as sf
SR = 48000; spec = json.load(open(sys.argv[1])); tm = json.load(open(sys.argv[2]))
T = sum(t['dur'] for t in tm) + 1; out = np.zeros(int(T * SR), np.float32); rng = np.random.default_rng(3)
def add(sig, t, g=1.0):
    i = max(0, int(t * SR)); j = min(len(out), i + len(sig)); out[i:j] += sig[:j - i] * g
def env(n, a=.005, d=8): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t * d)
def whoosh(d=.45, g=.5):
    n = int(d * SR); x = rng.standard_normal(n).astype(np.float32); e = np.sin(np.linspace(0, np.pi, n)) ** 2
    lp = np.convolve(x, np.ones(40) / 40, 'same'); k = np.linspace(0, 1, n); return ((lp * (1 - k) + x * .25 * k) * e * g).astype(np.float32)
def tone(f0, f1, d, g, dec):
    n = int(d * SR); f = np.linspace(f0, f1, n); return (np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .003, dec) * g).astype(np.float32)
pop = lambda: tone(900, 400, .12, .35, 35)
tick = lambda: tone(2400, 2000, .05, .25, 80)
thunk = lambda: tone(160, 70, .2, .55, 18)
boing = lambda: (tone(300, 700, .35, .3, 7) * (1 + .4 * np.sin(np.arange(int(.35 * SR)) / SR * 2 * np.pi * 18))).astype(np.float32)
ding = lambda: (tone(1320, 1320, .6, .22, 6) + tone(1980, 1980, .6, .1, 8)).astype(np.float32)
def riser(d=1.2):
    n = int(d * SR); x = rng.standard_normal(n).astype(np.float32); k = np.linspace(0, 1, n)
    hp = x - np.convolve(x, np.ones(8) / 8, 'same'); return ((hp * k ** 2 * .5) + np.sin(2 * np.pi * np.cumsum(200 + 800 * k ** 2) / SR) * k ** 2 * .12).astype(np.float32)
add(tick(), 0.02)
t0 = 0; scenes = spec['scenes']
for i, (sc, tt) in enumerate(zip(scenes, tm)):
    d = tt['dur']
    if i: add(whoosh(), max(0, t0 - .2))
    if i == len(scenes) - 1 and i: add(riser(), max(0, t0 - 1.2), .8)
    n = len(sc.get('gestures', ['a', 'b']))
    for j in range(1, n): add(whoosh(.35, .18), t0 + d * j / n - .1)
    for c in sc.get('cards', []): add(pop(), t0 + c.get('at', 0) * d)
    if sc.get('badge'): add(thunk(), t0 + .02)
    if sc.get('emoji'): add(boing(), t0 + sc.get('emojiAt', .4) * d)
    if sc.get('poll'): add(ding(), t0 + sc['poll'].get('at', .3) * d)
    t0 += d
sf.write(sys.argv[3], np.clip(out, -1, 1), SR)
