// Records the spoken guides with an ElevenLabs voice, during the Netlify build.
//
// It only runs when the site has ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID set
// (Netlify → Project configuration → Environment variables). Without them the
// build ships the Kokoro recordings in audio/ exactly as they are.
//
// Every clip is cached by a hash of its text, voice and settings, so a deploy
// only pays for lines that are new or changed. Changing the voice re-records
// everything once. Optional: ELEVENLABS_SPEED (0.7 to 1.2, default 0.88),
// ELEVENLABS_STABILITY (default 0.6), ELEVENLABS_MODEL (default eleven_multilingual_v2).
const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");
const { pathToFileURL } = require("url");

const CACHE = ".voice-cache";

module.exports = {
  async onPreBuild({ utils }) {
    const key = process.env.ELEVENLABS_API_KEY;
    const voice = process.env.ELEVENLABS_VOICE_ID;
    if (!key || !voice) { console.log("eleven-voice: no ElevenLabs key or voice set, keeping the recordings in audio/"); return; }
    const model = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
    const settings = {
      stability: +(process.env.ELEVENLABS_STABILITY || 0.6),
      similarity_boost: 0.75,
      style: 0.05,
      use_speaker_boost: true,
      speed: +(process.env.ELEVENLABS_SPEED || 0.88),
    };

    const { CALM_SCRIPT, TOPUPS } = await import(pathToFileURL(path.resolve("src/content.js")).href);
    const jobs = [];
    CALM_SCRIPT.forEach((s) => jobs.push({ dir: "calm", id: s.id, text: s.say }));
    TOPUPS.forEach((t) => t.steps.forEach((s) => s.say && jobs.push({ dir: "topup", id: s.id, text: s.say })));
    const unique = [...new Map(jobs.map((j) => [j.dir + "/" + j.id, j])).values()];

    await utils.cache.restore(CACHE);
    fs.mkdirSync(CACHE, { recursive: true });

    // a short breath between sentences, the way a person reads slowly
    const spoken = (t) => t.replace(/([.?:])\s+/g, '$1 <break time="0.7s" /> ');
    let made = 0, reused = 0, failed = 0;
    const one = async (j) => {
      const hash = createHash("sha256").update(JSON.stringify([voice, model, settings, j.text])).digest("hex").slice(0, 20);
      const cached = path.join(CACHE, hash + ".mp3");
      if (!fs.existsSync(cached)) {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
          method: "POST",
          headers: { "xi-api-key": key, "content-type": "application/json", accept: "audio/mpeg" },
          body: JSON.stringify({ text: spoken(j.text), model_id: model, voice_settings: settings }),
        });
        if (!res.ok) { failed++; console.warn(`eleven-voice: ${j.dir}/${j.id} failed, ${res.status} ${(await res.text()).slice(0, 200)}`); return; }
        fs.writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
        made++;
      } else reused++;
      fs.mkdirSync(path.join("audio", j.dir), { recursive: true });
      fs.copyFileSync(cached, path.join("audio", j.dir, j.id + ".mp3"));
    };
    // three at a time keeps well inside the API's concurrency limits
    for (let i = 0; i < unique.length; i += 3) await Promise.all(unique.slice(i, i + 3).map(one));

    await utils.cache.save(CACHE);
    console.log(`eleven-voice: ${made} recorded, ${reused} from cache, ${failed} failed (those keep the Kokoro recording)`);
  },
};
