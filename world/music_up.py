# python music_up.py seconds seed out.wav -- upbeat, happy pop bed (synth)
import sys, numpy as np, wave
dur, seed, out = float(sys.argv[1]), int(sys.argv[2]), sys.argv[3]; SR = 44100
rng = np.random.default_rng(seed); n = int(dur * SR); o = np.zeros(n)
bpm = 118 + seed % 8; b = 60 / bpm; f = lambda m: 440 * 2 ** ((m - 69) / 12)
progs = [[[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]], [[62, 66, 69], [57, 61, 64], [59, 62, 66], [55, 59, 62]], [[65, 69, 72], [60, 64, 67], [62, 65, 69], [58, 62, 65]]]
prog = progs[seed % 3]
def put(sig, t):
    i = int(t * SR); j = min(n, i + len(sig))
    if i < n: o[i:j] += sig[:j - i]
def tone(fr, d, a=.1, dec=6, wave_='saw'):
    t = np.arange(int(d * SR)) / SR; ph = 2 * np.pi * fr * t
    s = np.sin(ph) + (.35 * np.sin(2 * ph) + .2 * np.sin(3 * ph) if wave_ == 'saw' else 0)
    return a * s * np.exp(-t * dec) * np.minimum(1, t / .005)
kick = (lambda t: .5 * np.sin(2 * np.pi * (45 + 90 * np.exp(-t * 40)) * t) * np.exp(-t * 9))(np.arange(int(.3 * SR)) / SR)
hat = rng.uniform(-1, 1, int(.04 * SR)) * np.exp(-np.arange(int(.04 * SR)) / SR * 90) * .08
clap = rng.uniform(-1, 1, int(.12 * SR)) * np.exp(-np.arange(int(.12 * SR)) / SR * 30) * .16
beats = int(dur / b) + 1
for k in range(beats):
    t = k * b; ch = prog[(k // 8) % 4]
    put(kick, t)
    put(hat, t + b / 2)
    if k % 2 == 1 and k >= 8: put(clap, t)
    put(tone(f(ch[0] - 24), b * .9, .16, 4, 'sine'), t)                       # bass
    for j in range(2): put(tone(f(ch[(k * 2 + j) % 3] + 12), b * .5, .045, 9), t + j * b / 2)   # pluck arp
    if k % 8 == 0:
        for m in ch: put(tone(f(m), b * 8, .025, .35), t)                     # pad
fo = int(.3 * SR); o[:int(.05 * SR)] *= np.linspace(0, 1, int(.05 * SR)); o[-fo:] *= np.linspace(1, 0, fo)
o = np.tanh(o * 1.2); o = o / np.max(np.abs(o)) * .8
w = wave.open(out, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((o * 32767).astype(np.int16).tobytes()); w.close()
