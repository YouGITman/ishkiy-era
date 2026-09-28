"""Records the calm-body-calm-mind script with a Kokoro voice.

Kokoro-82M is open source (Apache 2.0), so the recordings are ours to ship.
Setup, once:
    python3 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile imageio-ffmpeg
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
    curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
Then, from the project folder:
    node tools/calm-lines.mjs > /tmp/calm-lines.json
    .venv/bin/python tools/make-voice.py /tmp/calm-lines.json --voice bm_george --models /path/to/models
Writes audio/<folder>/<id>.mp3 for every line. --only <folder> records one folder.
"""
import argparse, json, os, subprocess, tempfile
import numpy as np, soundfile as sf, imageio_ffmpeg
from kokoro_onnx import Kokoro

ap = argparse.ArgumentParser()
ap.add_argument("lines")
ap.add_argument("--voice", default="bm_george")
ap.add_argument("--speed", type=float, default=0.82)
ap.add_argument("--models", default=".")
ap.add_argument("--out", default="audio")
ap.add_argument("--only", default=None)
a = ap.parse_args()

k = Kokoro(os.path.join(a.models, "kokoro-v1.0.onnx"), os.path.join(a.models, "voices-v1.0.bin"))
ff = imageio_ffmpeg.get_ffmpeg_exe()
groups = json.load(open(a.lines))
jobs = [(folder, cid, text) for folder, lines in groups.items() if not a.only or folder == a.only for cid, text in lines.items()]
for folder, cid, text in jobs:
    os.makedirs(os.path.join(a.out, folder), exist_ok=True)
    # sentence by sentence, with a breath of silence between, reads slower and calmer than one run
    parts = [p.strip() for p in text.replace("?", "?|").replace(".", ".|").replace(":", ":|").split("|") if p.strip()]
    chunks = []
    for p in parts:
        audio, sr = k.create(p, voice=a.voice, speed=a.speed, lang="en-gb")
        chunks += [audio, np.zeros(int(sr * 0.55), dtype=audio.dtype)]
    audio = np.concatenate(chunks[:-1])
    with tempfile.NamedTemporaryFile(suffix=".wav") as t:
        sf.write(t.name, audio, sr)
        subprocess.run([ff, "-loglevel", "error", "-y", "-i", t.name,
                        "-af", "loudnorm=I=-20:TP=-2:LRA=7,afade=t=in:d=0.08,areverse,afade=t=in:d=0.25,areverse",
                        "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "48k",
                        os.path.join(a.out, folder, cid + ".mp3")], check=True)
    print(folder, cid, round(len(audio) / sr, 1), "s")
