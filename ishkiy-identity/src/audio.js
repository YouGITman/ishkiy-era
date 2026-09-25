// iSHKiY Identity — the sound room. Every sound is made here, in the browser,
// from oscillators and noise. No files, no licences, nothing to download, and
// it works offline. The same graph runs live and inside an OfflineAudioContext,
// so the mix you download sounds exactly like the one you hear.

let ctx = null;
export const getCtx = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

/* A binaural beat is two slightly different tones, one in each ear; the
   brain hears the difference as a slow pulse. It needs headphones. The pad
   and noise work without them. */
export const BEDS = {
  theta: { name: "Theta", hz: 6, carrier: 180, root: 87.31, line: "Six pulses a second. The drowsy, open state. For your recording, morning and night." },
  alpha: { name: "Alpha", hz: 10, carrier: 200, root: 98.0, line: "Ten pulses a second. Calm and awake. For the day." },
  delta: { name: "Deep sleep", hz: 2.5, carrier: 150, root: 73.42, line: "Slow and low. For drifting off after your recording." },
  still: { name: "No beat", hz: 0, carrier: 0, root: 87.31, line: "Just the warm pad and soft rain. No headphones needed." },
};

function noiseBuffer(ac, seconds = 8) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < len; i++) {
      // brown noise: integrated white noise, gently leaking back to zero
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.2;
    }
    // cross-fade the loop point so it never clicks
    const fade = Math.floor(ac.sampleRate * 0.25);
    for (let i = 0; i < fade; i++) { const k = i / fade; d[i] = d[i] * k + d[len - fade + i] * (1 - k); }
  }
  return buf;
}

function impulse(ac, seconds = 2.8, decay = 2.6) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

/* A struck bowl: a handful of inharmonic partials, each a pair of sines a
   hair apart so they beat slowly as they fade. */
export function strike(ac, dest, when, freq = 220, level = 0.12) {
  const partials = [[1, 1, 7], [2.71, 0.45, 4.5], [5.15, 0.22, 2.8], [8.3, 0.1, 1.6]];
  partials.forEach(([r, a, dec]) => {
    [0, 0.6].forEach((det) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.frequency.value = freq * r + det;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(level * a * 0.5, when + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dec);
      o.connect(g).connect(dest);
      o.start(when); o.stop(when + dec + 0.1);
    });
  });
}

/* Build a bed into any context. Returns the master gain and a stop(). */
function buildBed(ac, dest, key, { level = 1, bowls = true, offlineLength = 0 } = {}) {
  const bed = BEDS[key] || BEDS.theta;
  const master = ac.createGain();
  master.gain.value = 0;
  master.connect(dest);
  const stops = [];
  const now = ac.currentTime;

  // soft rain / brown noise
  const n = ac.createBufferSource();
  n.buffer = noiseBuffer(ac);
  n.loop = true;
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700;
  const ng = ac.createGain(); ng.gain.value = 0.11;
  n.connect(lp).connect(ng).connect(master);
  n.start(now); stops.push(n);

  // warm pad: root, fifth, octave, each breathing on its own slow LFO
  const padF = ac.createBiquadFilter(); padF.type = "lowpass"; padF.frequency.value = 520; padF.Q.value = 0.4;
  padF.connect(master);
  [[1, "sine", 0.05, 0.043], [1.5, "triangle", 0.022, 0.061], [2, "sine", 0.028, 0.029], [3, "sine", 0.008, 0.083]].forEach(([r, type, g0, lfoHz]) => {
    const o = ac.createOscillator(); o.type = type; o.frequency.value = bed.root * r;
    const g = ac.createGain(); g.gain.value = g0;
    const lfo = ac.createOscillator(); lfo.frequency.value = lfoHz;
    const lg = ac.createGain(); lg.gain.value = g0 * 0.7;
    lfo.connect(lg).connect(g.gain);
    o.connect(g).connect(padF);
    o.start(now); lfo.start(now); stops.push(o, lfo);
  });

  // the binaural pair
  if (bed.hz > 0) {
    [[-1, bed.carrier - bed.hz / 2], [1, bed.carrier + bed.hz / 2]].forEach(([pan, f]) => {
      const o = ac.createOscillator(); o.frequency.value = f;
      const g = ac.createGain(); g.gain.value = 0.05;
      const p = ac.createStereoPanner(); p.pan.value = pan;
      o.connect(g).connect(p).connect(master);
      o.start(now); stops.push(o);
    });
  }

  master.gain.linearRampToValueAtTime(level, now + 4);

  // an occasional bowl, far away
  let timer = null;
  if (bowls) {
    const notes = [bed.root * 4, bed.root * 6, bed.root * 5.04];
    if (offlineLength) {
      for (let t = 8; t < offlineLength - 10; t += 45 + ((t * 7) % 20)) strike(ac, master, t, notes[Math.floor(t) % 3], 0.05);
    } else {
      const ring = () => { strike(ac, master, ac.currentTime + 0.05, notes[Math.floor(Math.random() * 3)], 0.05); timer = setTimeout(ring, 38000 + Math.random() * 30000); };
      timer = setTimeout(ring, 9000);
    }
  }

  return {
    master,
    stop: (when = ac.currentTime) => { clearTimeout(timer); stops.forEach((s) => { try { s.stop(when); } catch {} }); },
  };
}

/* ---------------- live beds ---------------- */
let live = null;
export function startBed(key, { volume = 0.8 } = {}) {
  stopBed(0.4);
  const ac = getCtx();
  const out = ac.createGain(); out.gain.value = volume; out.connect(ac.destination);
  const b = buildBed(ac, out, key);
  const handle = {
    key,
    out,
    setVolume: (v) => out.gain.setTargetAtTime(v, ac.currentTime, 0.15),
    fadeOut: (sec = 3) => {
      const t = ac.currentTime;
      b.master.gain.cancelScheduledValues(t);
      b.master.gain.setValueAtTime(b.master.gain.value, t);
      b.master.gain.linearRampToValueAtTime(0, t + sec);
      b.stop(t + sec + 0.1);
      setTimeout(() => { try { out.disconnect(); } catch {} }, (sec + 0.3) * 1000);
      if (live === handle) live = null;
    },
  };
  live = handle;
  return handle;
}
export function stopBed(sec = 2) { if (live) live.fadeOut(sec); }
export const liveBed = () => live;

/* ---------------- one-off sounds ---------------- */
export function bowl(freq = 261.6, level = 0.14) {
  const ac = getCtx();
  strike(ac, ac.destination, ac.currentTime + 0.02, freq, level);
}

/* Letting go: a breath of air that rises and thins out, over a low bowl. */
export function releaseSound() {
  const ac = getCtx();
  const t = ac.currentTime + 0.02;
  const n = ac.createBufferSource(); n.buffer = noiseBuffer(ac, 4);
  const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(4200, t + 3.2);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.8); g.gain.exponentialRampToValueAtTime(0.001, t + 3.6);
  n.connect(bp).connect(g).connect(ac.destination);
  n.start(t); n.stop(t + 3.8);
  strike(ac, ac.destination, t, 174.6, 0.12);
  strike(ac, ac.destination, t + 1.4, 349.2, 0.06);
}

/* ---------------- voice ---------------- */
export async function decodeBlob(blob) {
  const ac = getCtx();
  const arr = await blob.arrayBuffer();
  return await new Promise((res, rej) => ac.decodeAudioData(arr, res, rej));
}

/* Play the recording over a bed. The bed keeps going for tailMin after the
   voice ends, then fades, so you can fall asleep inside it. */
export async function playSession({ bedKey = "theta", voiceBlob, volume = 0.8, voiceLevel = 1, tailMin = 3, onVoiceEnd, onEnd }) {
  const ac = getCtx();
  const bed = startBed(bedKey, { volume });
  let src = null, tailTimer = null, stopped = false;
  if (voiceBlob) {
    const buf = await decodeBlob(voiceBlob);
    src = ac.createBufferSource(); src.buffer = buf;
    const vg = ac.createGain(); vg.gain.value = voiceLevel;
    const wet = ac.createConvolver(); wet.buffer = impulse(ac);
    const wg = ac.createGain(); wg.gain.value = 0.22;
    src.connect(vg);
    vg.connect(ac.destination);
    vg.connect(wet).connect(wg).connect(ac.destination);
    src.onended = () => {
      if (stopped) return;
      onVoiceEnd && onVoiceEnd();
      tailTimer = setTimeout(() => { bed.fadeOut(45); onEnd && setTimeout(onEnd, 45000); }, tailMin * 60000);
    };
    src.start(ac.currentTime + 6);
  }
  return {
    duration: src ? src.buffer.duration + 6 : 0,
    startedAt: ac.currentTime,
    stop: () => { stopped = true; clearTimeout(tailTimer); try { src && src.stop(); } catch {} bed.fadeOut(2.5); },
  };
}

/* The phone's own voice, for anyone who hasn't recorded yet. Sentence by
   sentence, because some browsers cut a long utterance off halfway. */
export function speakScript(script, { onLine, onDone, rate = 0.82 } = {}) {
  const synth = window.speechSynthesis;
  if (!synth) { onDone && onDone(); return { stop() {} }; }
  synth.cancel();
  const voices = synth.getVoices();
  const voice = voices.find((v) => /en-GB/i.test(v.lang) && /female|serena|kate|libby|sonia|martha/i.test(v.name)) || voices.find((v) => /en-GB/i.test(v.lang)) || voices.find((v) => /^en/i.test(v.lang));
  const bits = script.replace(/\n+/g, " … ").split(/\s*…\s*/).map((s) => s.trim()).filter(Boolean);
  let i = 0, dead = false, timer = null;
  const next = () => {
    if (dead) return;
    if (i >= bits.length) { onDone && onDone(); return; }
    const u = new SpeechSynthesisUtterance(bits[i]);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : "en-GB";
    u.rate = rate; u.pitch = 0.95; u.volume = 1;
    onLine && onLine(bits[i], i, bits.length);
    u.onend = () => { i++; timer = setTimeout(next, 1100); };
    u.onerror = () => { i++; timer = setTimeout(next, 300); };
    synth.speak(u);
  };
  next();
  return { stop: () => { dead = true; clearTimeout(timer); synth.cancel(); } };
}

/* ---------------- listening for the spoken word ----------------
   Only the loudness is measured, on the phone, and nothing is recorded. It's
   how the app knows an affirmation was said out loud rather than thought. */
export async function listenLevel(onLevel) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const ac = getCtx();
  const src = ac.createMediaStreamSource(stream);
  const an = ac.createAnalyser(); an.fftSize = 1024;
  src.connect(an);
  const data = new Float32Array(an.fftSize);
  let raf = 0;
  const tick = () => {
    an.getFloatTimeDomainData(data);
    let sum = 0; for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    onLevel(Math.sqrt(sum / data.length));
    raf = requestAnimationFrame(tick);
  };
  tick();
  return () => { cancelAnimationFrame(raf); try { src.disconnect(); } catch {} stream.getTracks().forEach((t) => t.stop()); };
}

/* ---------------- the downloadable mix ----------------
   Voice over the bed, rendered to a WAV you can play in any app, all night,
   with the screen off. 24 kHz stereo keeps a ten-minute file near 45 MB. */
export async function renderMix({ bedKey = "theta", voiceBlob, tailSec = 180, sampleRate = 24000 }) {
  const voice = voiceBlob ? await decodeBlob(voiceBlob) : null;
  const lead = 6;
  const length = lead + (voice ? voice.duration : 0) + tailSec + 20;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ac = new OAC(2, Math.ceil(length * sampleRate), sampleRate);
  const out = ac.createGain(); out.gain.value = 0.8; out.connect(ac.destination);
  const b = buildBed(ac, out, bedKey, { offlineLength: length });
  b.master.gain.setValueAtTime(1, length - 22);
  b.master.gain.linearRampToValueAtTime(0, length - 1);
  strike(ac, out, 1, BEDS[bedKey].root * 4, 0.12);
  if (voice) {
    const src = ac.createBufferSource(); src.buffer = voice;
    const vg = ac.createGain(); vg.gain.value = 1;
    const wet = ac.createConvolver(); wet.buffer = impulse(ac);
    const wg = ac.createGain(); wg.gain.value = 0.22;
    src.connect(vg); vg.connect(ac.destination); vg.connect(wet).connect(wg).connect(ac.destination);
    src.start(lead);
    strike(ac, out, lead + voice.duration + 2, BEDS[bedKey].root * 4, 0.1);
  }
  const rendered = await ac.startRendering();
  return encodeWav(rendered);
}

function encodeWav(buf) {
  const ch = buf.numberOfChannels, sr = buf.sampleRate, n = buf.length;
  const out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); out.setUint32(4, 36 + n * ch * 2, true); w(8, "WAVE"); w(12, "fmt ");
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true);
  w(36, "data"); out.setUint32(40, n * ch * 2, true);
  const chans = [...Array(ch)].map((_, i) => buf.getChannelData(i));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, chans[c][i])); out.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
  return new Blob([out], { type: "audio/wav" });
}
