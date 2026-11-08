# python music.py seconds seed out.wav  -- soft ambient bed
import sys, numpy as np, wave
dur, seed, out = float(sys.argv[1]), int(sys.argv[2]), sys.argv[3]; SR = 44100
rng = np.random.default_rng(seed); n = int(dur * SR); o = np.zeros(n); t = np.arange(n) / SR
progs = [[[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 48, 52]], [[52, 55, 59], [48, 52, 55], [45, 48, 52], [47, 50, 54]]]
prog = progs[seed % 3]; bar = 8.0; f = lambda m: 440 * 2 ** ((m - 69) / 12)
for bi in range(int(dur / bar) + 2):
    s0 = int(bi * bar * SR); L = int((bar + 2) * SR); L = min(L, n - s0)
    if L <= 0: break
    tt = np.arange(L) / SR; envl = np.minimum(1, tt / 2.5) * np.minimum(1, np.maximum(0, (bar + 2 - tt)) / 2.5)
    for m in prog[bi % 4]:
        for det in (-.07, .07): o[s0:s0 + L] += .02 * np.sin(2 * np.pi * f(m) * (1 + det / 100) * tt) * envl
    o[s0:s0 + L] += .03 * np.sin(2 * np.pi * f(prog[bi % 4][0] - 24) * tt) * envl
beat = 60 / (76 + (seed * 7) % 24)
for k in range(int(dur / beat)):
    i0 = int(k * beat * SR); L = int(.25 * SR); tt = np.arange(min(L, n - i0)) / SR
    o[i0:i0 + len(tt)] += .05 * np.sin(2 * np.pi * (50 + 40 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 12) * (k % 2 == 0)
    h0 = i0 + int(beat / 2 * SR); hl = min(int(.03 * SR), n - h0)
    if hl > 0: o[h0:h0 + hl] += .012 * rng.uniform(-1, 1, hl)
fo = int(3 * SR); o[:int(SR)] *= np.linspace(0, 1, int(SR)); o[-fo:] *= np.linspace(1, 0, fo)
o = o / np.max(np.abs(o)) * .8
w = wave.open(out, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((o * 32767).astype(np.int16).tobytes()); w.close()
