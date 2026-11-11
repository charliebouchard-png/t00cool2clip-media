# python voices.py out_dir 'json [[voice,speed,pitch],...]' "text"
import json, sys, os, numpy as np, soundfile as sf, subprocess
from kokoro import KPipeline
D, cfg, text = sys.argv[1], json.loads(sys.argv[2]), sys.argv[3]; os.makedirs(D, exist_ok=True)
SR = 24000; pipes = {}; allp = []
beep = (np.sin(2 * np.pi * 880 * np.arange(int(.15 * SR)) / SR) * .25).astype(np.float32)
for i, (v, sp, pitch) in enumerate(cfg):
    p = pipes.setdefault(v[0], KPipeline(lang_code=v[0]))
    a = np.concatenate([(r[2] if isinstance(r, tuple) else r.audio).detach().cpu().numpy() for r in p(text, voice=v, speed=sp)])
    f = f"{D}/{i+1}_{v}.wav"; sf.write(f, a, SR)
    if pitch != 1:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f, "-af", f"asetrate={int(SR*pitch)},aresample={SR},atempo={1/pitch:.4f}", f + ".p.wav"], check=True)
        a, _ = sf.read(f + ".p.wav", dtype="float32"); os.remove(f + ".p.wav"); sf.write(f, a, SR)
    allp += [beep, np.zeros(int(.3 * SR), np.float32), a, np.zeros(int(.8 * SR), np.float32)]
sf.write(f"{D}/all.wav", np.concatenate(allp), SR)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{D}/all.wav", "-b:a", "160k", f"{D}/all.mp3"], check=True)
