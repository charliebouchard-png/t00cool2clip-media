"""Music bed + sound effects for a story.  python audio.py story.json timing.json sfx.wav music.wav"""
import json, sys, wave
import numpy as np
spec = json.load(open(sys.argv[1])); tim = json.load(open(sys.argv[2])); SR = 44100
dur = tim['dur'] + 0.5; n = int(dur * SR); rng = np.random.default_rng(spec.get('seed', 1))
def env(L, a=0.005, d=0.2):
    t = np.arange(L) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def put(buf, x, at, g=1.0):
    i = int(at * SR); j = min(len(buf), i + len(x));
    if i < len(buf) and j > i: buf[i:j] += x[:j - i] * g
def write(path, x):
    x = x / max(1e-6, np.max(np.abs(x))) * 0.9
    w = wave.open(path, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()
# ---- sfx
def whoosh():
    L = int(0.45 * SR); t = np.arange(L) / SR; nz = rng.uniform(-1, 1, L)
    f = np.cumsum(nz) ; f = f - np.convolve(f, np.ones(40) / 40, 'same'); e = np.sin(np.pi * t / t[-1]) ** 2
    return f / np.max(np.abs(f)) * e
def pop():
    L = int(0.12 * SR); t = np.arange(L) / SR; return np.sin(2 * np.pi * (300 + 900 * np.exp(-t * 40)) * t) * env(L, 0.002, 0.04)
def ching():
    L = int(0.9 * SR); t = np.arange(L) / SR; x = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(2093, 1), (2637, .7), (3136, .5), (4186, .3)])
    x2 = np.zeros(L); s = int(0.08 * SR); x2[s:] = x[:L - s]; return (x * env(L, .002, .25) + x2 * env(L, .002, .35)) * 0.5
def boom():
    L = int(0.8 * SR); t = np.arange(L) / SR; return np.sin(2 * np.pi * (40 + 80 * np.exp(-t * 12)) * t) * env(L, 0.003, 0.25) + rng.uniform(-1, 1, L) * env(L, .001, .05) * .3
def ding():
    L = int(0.7 * SR); t = np.arange(L) / SR; return (np.sin(2 * np.pi * 1318 * t) + .5 * np.sin(2 * np.pi * 1760 * t)) * env(L, .002, .2) * .6
def buzz():
    L = int(0.5 * SR); t = np.arange(L) / SR; return np.sign(np.sin(2 * np.pi * 110 * t)) * env(L, .005, .3) * .25
def cheer():
    L = int(1.6 * SR); x = rng.uniform(-1, 1, L); x = np.convolve(x, np.ones(25) / 25, 'same'); t = np.arange(L) / SR; return x * np.minimum(1, t / .2) * np.exp(-t / .9) * 3
sfx = np.zeros(n)
for i, (b, bt) in enumerate(zip(spec['beats'], tim['beats'])):
    s = bt['start']; fx = b.get('fx', [])
    if i > 0: put(sfx, whoosh(), s - 0.12, 0.35)
    if any(p.get('type') == 'tag' for p in b.get('props', [])): put(sfx, pop(), s + 0.05, 0.5)
    if 'coins' in fx or 'cash' in fx or any('$' in p.get('text', '') for p in b.get('props', []) if p.get('type') == 'tag'): put(sfx, ching(), s + 0.12, 0.45)
    if b.get('big'): put(sfx, boom(), s + 0.02, 0.6)
    if b.get('notif'): put(sfx, ding(), s + 0.15, 0.6)
    if 'red' in fx or 'alert' in fx: put(sfx, buzz(), s + 0.05, 0.5)
    if 'confetti' in fx: put(sfx, cheer(), s + 0.1, 0.35)
    if b.get('press'): put(sfx, boom(), s + 0.35, 0.5)
write(sys.argv[3], sfx)
# ---- music: bouncy pluck loop
bpm = spec.get('bpm', 118); beat = 60 / bpm; key = spec.get('key', 0)
prog = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]]
f = lambda m: 440 * 2 ** ((m - 69) / 12)
mus = np.zeros(n)
def pluck(freq, L):
    t = np.arange(L) / SR; x = np.sign(np.sin(2 * np.pi * freq * t)) * 0.3 + np.sin(2 * np.pi * freq * t) * 0.7; return x * env(L, .003, .12)
bars = int(dur / (beat * 4)) + 1
for bi in range(bars):
    ch = prog[bi % 4]; b0 = bi * 4 * beat
    for k in range(8):
        note = 60 + key + ch[[0, 1, 2, 1, 0, 2, 1, 2][k]] + (12 if k in (3, 6) else 0)
        put(mus, pluck(f(note), int(beat / 2 * SR)), b0 + k * beat / 2, 0.22)
    for k in range(4):
        L = int(beat * SR * .9); t = np.arange(L) / SR
        put(mus, np.sin(2 * np.pi * f(36 + key + ch[0]) * t) * env(L, .005, .25), b0 + k * beat, 0.5)
        Lk = int(.2 * SR); tk = np.arange(Lk) / SR; put(mus, np.sin(2 * np.pi * (45 + 90 * np.exp(-tk * 35)) * tk) * env(Lk, .001, .08), b0 + k * beat, 0.6)
        Lh = int(.04 * SR); put(mus, rng.uniform(-1, 1, Lh) * env(Lh, .001, .01), b0 + k * beat + beat / 2, 0.18)
        if k % 2: Lc = int(.15 * SR); put(mus, rng.uniform(-1, 1, Lc) * env(Lc, .001, .05), b0 + k * beat, 0.25)
fo = int(1.5 * SR); mus[-fo:] *= np.linspace(1, 0, fo); mus[:int(.3 * SR)] *= np.linspace(0, 1, int(.3 * SR))
write(sys.argv[4], mus)
print('audio ok', round(dur, 1))
