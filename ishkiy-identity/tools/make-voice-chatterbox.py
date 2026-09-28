"""Records the spoken guides with Chatterbox (Resemble AI, MIT licence).

Chatterbox copies the voice in a short reference recording (tools/voice-ref.wav,
10 to 20 seconds of one person speaking calmly, no music). Only use a voice you
have the right to use: your own, someone who has agreed, or a synthetic one.

Setup, once:
    python3 -m venv .venv && .venv/bin/pip install chatterbox-tts imageio-ffmpeg
    (the model downloads from huggingface.co on first run)
Then, from the project folder:
    node tools/calm-lines.mjs > /tmp/lines.json
    .venv/bin/python tools/make-voice-chatterbox.py /tmp/lines.json --ref tools/voice-ref.wav
Writes audio/<folder>/<id>.mp3 for every line. --only <folder> records one folder.
"""
import argparse, json, os, re, subprocess, tempfile
import torch, torchaudio as ta, imageio_ffmpeg
from chatterbox.tts import ChatterboxTTS

ap = argparse.ArgumentParser()
ap.add_argument("lines")
ap.add_argument("--ref", default="tools/voice-ref.wav")
ap.add_argument("--exaggeration", type=float, default=0.3)  # lower is calmer
ap.add_argument("--cfg", type=float, default=0.3)           # lower is slower, more deliberate
ap.add_argument("--temperature", type=float, default=0.7)
ap.add_argument("--seed", type=int, default=7)
ap.add_argument("--out", default="audio")
ap.add_argument("--only", default=None)
a = ap.parse_args()

model = ChatterboxTTS.from_pretrained(device="cuda" if torch.cuda.is_available() else "cpu")
ff = imageio_ffmpeg.get_ffmpeg_exe()
groups = json.load(open(a.lines))
jobs = [(f, cid, t) for f, lines in groups.items() if not a.only or f == a.only for cid, t in lines.items()]

for folder, cid, text in jobs:
    os.makedirs(os.path.join(a.out, folder), exist_ok=True)
    # sentence by sentence, with a breath between: steadier than one long run
    parts = [p.strip() for p in re.split(r"(?<=[.?:])\s+", text) if p.strip()]
    chunks = []
    for p in parts:
        torch.manual_seed(a.seed)
        wav = model.generate(p, audio_prompt_path=a.ref, exaggeration=a.exaggeration, cfg_weight=a.cfg, temperature=a.temperature)
        chunks += [wav, torch.zeros(1, int(model.sr * 0.6))]
    # keep a little air after the last word so the fade never eats a final consonant
    audio = torch.cat(chunks[:-1] + [torch.zeros(1, int(model.sr * 0.45))], dim=1)
    with tempfile.NamedTemporaryFile(suffix=".wav") as t:
        ta.save(t.name, audio, model.sr)
        subprocess.run([ff, "-loglevel", "error", "-y", "-i", t.name,
                        "-af", "loudnorm=I=-20:TP=-2:LRA=7,afade=t=in:d=0.05,areverse,afade=t=in:d=0.12,areverse",
                        "-ac", "1", "-ar", "24000", "-c:a", "libmp3lame", "-b:a", "48k",
                        os.path.join(a.out, folder, cid + ".mp3")], check=True)
    print(folder, cid, round(audio.shape[1] / model.sr, 1), "s", flush=True)
