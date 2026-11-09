"""Transcribe a source video into timed segments for picking clip moments.
Usage: python3 tools/transcribe.py <source.mp4> <out.json>"""
import json, subprocess, sys, tempfile, os
from faster_whisper import WhisperModel

src, out = sys.argv[1:3]
wav = os.path.join(tempfile.mkdtemp(), "a.wav")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-vn", "-ac", "1", "-ar", "16000", wav], check=True)
model = WhisperModel(os.environ.get("WHISPER_MODEL", "base.en"), device="cpu", compute_type="int8")
segs, info = model.transcribe(wav, vad_filter=True, beam_size=1)
rows = [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()} for s in segs]
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
json.dump({"duration": info.duration, "segments": rows}, open(out, "w"), indent=0)
print("segments", len(rows))
