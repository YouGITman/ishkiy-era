// iSHKiY Identity — every word the app says lives here, so the voice can be
// edited in one place. UK English. Plain words. No "journey", no "unlock".

/* The lock, not the key. Six cards, one idea each. The science is told as
   the story it is ("the story goes", "the idea is") rather than as settled
   fact, because some of it isn't. */
export const EXPLAIN = [
  { kicker: "The lock, not the key", line: "You've been hunting for the key.", sub: "Another book. Another podcast. One more video that's meant to change everything. It feels good for a day, then it fades. That's because the problem was never the key. It's the lock." },
  { kicker: "The frog", line: "A frog can starve beside a pile of flies.", sub: "The story goes that it only sees what moves. Dead flies don't, so to the frog they aren't there. You're wired in a similar way. Your nervous system decides what you notice, and it quietly filters out anything that doesn't fit the picture you already hold of yourself.", visual: "frog" },
  { kicker: "The firewall", line: "Your beliefs are apps. Your nervous system is the firewall.", sub: "Most of its settings were fixed early, largely before you were seven, by what you saw and heard and felt. It isn't there to make you happy. It's there to keep you safe, and to it, familiar means safe. So new beliefs bounce off.", visual: "firewall" },
  { kicker: "The rubber band", line: "Go past the picture you hold of yourself and you snap back.", sub: "The weight comes back. The money goes. The old habit returns on a bad Tuesday. The strongest pull in you is the need to stay consistent with who you think you are. Change the picture and the snapping back stops.", visual: "band" },
  { kicker: "Who before why", line: "\"I'm trying to quit.\" \"I'm not a smoker.\"", sub: "Same cigarette, two different people. The first still sees a smoker in the mirror and hopes the behaviour changes. The second has already moved. Be first. Then doing gets easy, and having follows the doing.", visual: "who" },
  { kicker: "How this works", line: "Safe first. Then new.", sub: "A nervous system lets new things in when it feels safe, not when it's pushed. So we begin with calm, not effort. Then you name who you've been, let it go, write who you are now, and hear it in your own voice every morning and every night for 21 days.", visual: "path" },
];

/* The Path: the one-time setup, in order. */
export const PATH = [
  { id: "explain", name: "See the lock", line: "Why nothing has stuck so far" },
  { id: "calm", name: "Feel safe", line: "Calm body, calm mind. Ten minutes" },
  { id: "audit", name: "Name the old you", line: "The lines you've been living by" },
  { id: "release", name: "Let it go", line: "Thank them, and put them down" },
  { id: "become", name: "Write the new you", line: "Who you are now, in the present tense" },
  { id: "script", name: "Make your recording", line: "Your words, your voice, a theta bed" },
  { id: "begin", name: "Begin your era", line: "21 days, morning and night" },
];

export const AREAS = [
  { id: "worth", name: "Self-worth", colour: "#D4A547", lines: ["I'm not enough", "I have to earn my place", "I'm the one who gets overlooked", "I'm too much"] },
  { id: "body", name: "Body", colour: "#C06B5C", lines: ["I always put the weight back on", "I'm not a sporty person", "I'm not a morning person", "I'm always tired"] },
  { id: "money", name: "Money", colour: "#6F8F5E", lines: ["Money slips through my fingers", "I'm bad with money", "People like me don't get rich", "There's never enough"] },
  { id: "love", name: "Love", colour: "#8A6FA0", lines: ["I always end up alone", "I give more than I get", "I pick the wrong people", "I'm hard to love"] },
  { id: "work", name: "Work", colour: "#5C7CA3", lines: ["I start things and never finish them", "I'm not a leader", "I'm not creative", "I'm not clever enough for that"] },
  { id: "habit", name: "Habits", colour: "#B08630", lines: ["I'm a smoker", "I can't stick to anything", "I'm hopeless with my phone", "I need a drink to unwind"] },
];
export const areaOf = (id) => AREAS.find((a) => a.id === id) || AREAS[0];

export const ORIGIN_AGES = ["Before I was seven", "Seven to twelve", "As a teenager", "As an adult", "I honestly don't know"];

/* A gentle first draft of the new line, offered, never imposed. */
export const REWRITES = {
  "I'm not enough": "I am enough, exactly as I am today",
  "I have to earn my place": "I belong here. My place was never up for sale",
  "I'm the one who gets overlooked": "I am seen, and I let myself be seen",
  "I'm too much": "I am the right amount. The right people are glad of all of me",
  "I always put the weight back on": "I am someone who lives in a strong, looked-after body",
  "I'm not a sporty person": "I am someone who moves every day",
  "I'm not a morning person": "I am someone who rises easily and uses the first hour well",
  "I'm always tired": "I am full of steady energy",
  "Money slips through my fingers": "Money stays with me and grows",
  "I'm bad with money": "I am calm and capable with money",
  "People like me don't get rich": "I am someone wealth comes to and stays with",
  "There's never enough": "I have enough, and more is on its way",
  "I always end up alone": "I am loved, and I let love stay",
  "I give more than I get": "I give and I receive in equal measure",
  "I pick the wrong people": "I choose people who are good for me",
  "I'm hard to love": "I am easy to love",
  "I start things and never finish them": "I am someone who finishes what I start",
  "I'm not a leader": "I am a leader people are glad to follow",
  "I'm not creative": "I am creative, and ideas come to me easily",
  "I'm not clever enough for that": "I am more than capable of this",
  "I'm a smoker": "I am not a smoker. I breathe clean air",
  "I can't stick to anything": "I am someone who keeps my word to myself",
  "I'm hopeless with my phone": "I am in charge of my attention",
  "I need a drink to unwind": "I unwind easily, clear-headed",
};
/* For lines people write themselves: a nudge towards present tense. */
export const tenseCheck = (t) => {
  const s = (t || "").toLowerCase();
  if (/\b(i will|i'll|i want to|i'm going to|i hope|i'm trying|i try to|one day)\b/.test(s)) return "Say it as if it's already true. \"I am\", not \"I will\".";
  if (/\b(not|never|don't|no longer|stop)\b/.test(s) && !/^i am not a /.test(s) && !/^i'm not a /.test(s)) return "Where you can, say what you are rather than what you're not. \"I'm not a smoker\" is the exception that works.";
  return null;
};

export const SENSES = [
  { id: "where", q: "Where are you?", hint: "It's done. You're living it. Where are you standing, sitting, waking up?" },
  { id: "see", q: "What do you see?", hint: "Colours, light, faces. What's in front of you?" },
  { id: "hear", q: "What do you hear?", hint: "Voices, what someone says to you, the sound of the room." },
  { id: "feel", q: "What do you feel in your body?", hint: "Your chest, your shoulders, your face. How does it feel to already have it?" },
  { id: "thanks", q: "What are you grateful for?", hint: "Say thank you as if it's already happened." },
];

/* Straight from the idea that the brain can't refuse a question. */
export const POWER_QUESTIONS = [
  "What would my highest, most developed self do right now?",
  "What would a healed nervous system feel like right now?",
  "What can I be grateful for right now?",
  "Who do I love, and who loves me?",
  "What would the new me do with the next ten minutes?",
  "What's already going right today?",
  "If this were easy, what would I do next?",
  "What am I letting in right now, and does it belong to the old me or the new?",
];

/* Calm body, calm mind: spoken, so it works with the eyes shut. Each step is
   one recorded clip (audio/calm/<id>.mp3, made by tools/make-voice.py from
   the "say" text), followed by "gap" seconds of quiet. The evening version
   plays the steps without "longOnly" and shortens every gap. Change a line
   here, then run the tool again to re-record it. */
export const CALM_SCRIPT = [
  { id: "c01", line: "Lie down, or sit somewhere that holds you.", sub: "Let your eyes close when you're ready.", say: "Lie down, or sit somewhere that holds you. Let your eyes close when you're ready. You won't need the screen. Just listen.", gap: 10 },
  { id: "c02", line: "Imagine your body is made of balloons.", sub: "Soft, full, a little too tight.", say: "Imagine your body is made of balloons. Soft. Full. A little too tight.", gap: 12 },
  { id: "c03", line: "There's a small valve on the sole of each foot.", sub: "Let them open. Feel the air begin to leave.", say: "There's a small valve on the sole of each foot. Let them open. Feel the air begin to leave.", gap: 14 },
  { id: "c04", line: "Your feet go soft. Then your calves. Then your knees.", sub: "Your legs empty and settle flat.", say: "Your feet go soft. Then your calves. Then your knees. Your legs empty, and settle flat.", gap: 16 },
  { id: "c05", line: "A valve opens in your chest.", sub: "The air escapes. Your ribs soften. Your belly lets go.", say: "Now a valve opens in the middle of your chest. The air escapes. Your ribs soften. Your belly lets go.", gap: 16 },
  { id: "c06", line: "Your shoulders. Your arms. Your hands.", sub: "Empty. Heavy. Resting.", say: "Your shoulders. Your arms. Your hands. Empty. Heavy. Resting.", gap: 16 },
  { id: "c07", line: "Your neck. Your jaw. The small muscles round your eyes.", sub: "Let any worry fizz out with the air.", say: "Your neck. Your jaw. The small muscles around your eyes. Let any worry fizz out with the air.", gap: 18 },
  { id: "c08", line: "Now just notice the breath going out.", sub: "You don't need to change it.", say: "Now just notice the breath going out. You don't need to change it.", gap: 10 },
  { id: "c09", line: "On the next out-breath: calm body.", sub: "Say it quietly to yourself.", say: "On the next out-breath, say quietly to yourself: calm body.", gap: 8 },
  { id: "c10", line: "And on the one after: calm mind.", sub: "", say: "And on the one after: calm mind.", gap: 10 },
  { id: "c11", line: "Calm body.", sub: "", say: "Calm body.", gap: 9, mantra: true },
  { id: "c12", line: "Calm mind.", sub: "", say: "Calm mind.", gap: 9, mantra: true },
  { id: "c11", line: "Calm body.", sub: "", say: "Calm body.", gap: 9, mantra: true },
  { id: "c12", line: "Calm mind.", sub: "", say: "Calm mind.", gap: 12, mantra: true },
  { id: "c13", line: "When a thought pulls you off, that's fine.", sub: "Don't judge it. Come back to the next out-breath.", say: "If a thought pulls you away, that's fine. Don't judge it. Just come back to the next out-breath.", gap: 30 },
  { id: "c11", line: "Calm body.", sub: "", say: "Calm body.", gap: 10, mantra: true },
  { id: "c12", line: "Calm mind.", sub: "", say: "Calm mind.", gap: 30, mantra: true },
  { id: "c14", line: "You're doing it.", sub: "Nothing to try at. Trying is the one thing that doesn't work here.", say: "You're doing it. There's nothing to try at here. Trying is the one thing that doesn't work. Just let go.", gap: 60, longOnly: true },
  { id: "c11", line: "Calm body.", sub: "", say: "Calm body.", gap: 12, mantra: true, longOnly: true },
  { id: "c12", line: "Calm mind.", sub: "", say: "Calm mind.", gap: 60, mantra: true, longOnly: true },
  { id: "c15", line: "Stay here as long as you like.", sub: "", say: "Stay here as long as you like.", gap: 90, longOnly: true },
  { id: "c16", line: "Your nervous system knows this place now.", sub: "Do this each day and you'll find it on command.", say: "Your nervous system knows this place now. Do this each day, and you'll be able to find it on command. When you're ready, gently open your eyes.", gap: 4, last: true, longOnly: true },
  { id: "c17", line: "Take your time.", sub: "When you're ready, the next part begins.", say: "Take your time. When you're ready, open your eyes, and we'll carry on.", gap: 4, last: true, shortOnly: true },
];

/* Morning and evening, the two windows where the mind takes suggestion best. */
export const MORNING_LINES = [
  "You've just woken. This is one of the two best moments in the day for this.",
  "Before the phone. Before the news. You first.",
];
export const EVENING_LINES = [
  "The last twenty minutes before sleep carry the most weight.",
  "Fall asleep as the new you, and you wake up as them.",
];

export const INPUT_CHOICES = [
  { id: "clean", label: "Mostly clean", sub: "Things that lift me" },
  { id: "mixed", label: "Mixed", sub: "Some of both" },
  { id: "noise", label: "Mostly noise", sub: "Old-me stuff" },
];

export const QUOTES = [
  "The me I see is the me I will be.",
  "Be. Then do. Then have.",
  "You don't need a new key. You need a softer lock.",
  "The harder you try, the further away it gets. Soften.",
  "Every word you speak is an affirmation. Choose which one.",
  "Not \"I will be\". \"I am.\"",
  "Feel it done. Then rest there.",
  "What you let in today is who you are tomorrow.",
];

export const SAFETY = "iSHKiY Identity is a self-development practice, not therapy or medical treatment. If looking back at old beliefs brings up something heavy, stop, breathe, and talk to someone you trust or a professional. Never listen to the sound beds while driving or doing anything that needs your full attention.";

export const SOS_LINES = [
  { name: "Emergency services", what: "If you or someone else is in immediate danger.", call: "999" },
  { name: "NHS 111", what: "Urgent mental health help in England. Choose the mental health option.", call: "111" },
  { name: "Samaritans", what: "Someone to talk to, whatever it is. Free, 24/7.", call: "116 123" },
  { name: "Shout", what: "If you'd rather text than talk. Text SHOUT to 85258.", text: "85258", body: "SHOUT" },
];

/* ---------------- the recording script ----------------
   Assembled from their own words. "…" marks a pause when the phone reads it,
   and a breath when they record it. Written to be read slowly: about four
   to six minutes. */
export function buildScript({ statements, scene, eraName }) {
  const iam = statements.filter((s) => s.text && s.text.trim()).map((s) => fix(s.text));
  const sc = scene || {};
  const parts = [];
  parts.push(`Let your eyes close … and let your breath slow down on its own … There's nothing to do now, and nowhere to be … This is your time.`);
  parts.push(`Feel the weight of your body, held … by the bed, or the chair … by the floor beneath it … You are safe here … completely safe.`);
  parts.push(`Take a breath in … and as you let it go, let your shoulders drop … Again … in … and out … and with every breath out, you go a little deeper … a little softer.`);
  parts.push(`In a moment I'll count down from ten to one … and with each number, you'll drift twice as deep … Ten … nine … letting go … eight … seven … softer now … six … five … heavier … four … three … nearly there … two … and one … Deep. Calm. Open.`);
  parts.push(`Calm body … calm mind … Calm body … calm mind.`);
  parts.push(`The old stories have been thanked, and put down … You don't need them now … They kept you safe once … and you're safe without them.`);
  if (iam.length) {
    parts.push(`Now listen … not with effort … just let these words land where they belong.`);
    iam.forEach((l) => parts.push(`${l} …`));
  }
  if (sc.where || sc.see || sc.hear || sc.feel) {
    parts.push(`Now step into the moment where it's already done …`);
    if (sc.where) parts.push(`${present(sc.where)} …`);
    if (sc.see) parts.push(`Look around … ${present(sc.see)} …`);
    if (sc.hear) parts.push(`Listen … ${present(sc.hear)} …`);
    if (sc.feel) parts.push(`And feel it in your body … ${present(sc.feel)} …`);
    parts.push(`It isn't something you're waiting for … It's done … It's yours … Stay in this feeling … let it soak all the way through you.`);
    if (sc.thanks) parts.push(`Thank you … ${present(sc.thanks)} …`);
  }
  if (iam.length) {
    parts.push(`Once more … quietly …`);
    iam.slice(0, 3).forEach((l) => parts.push(`${l} …`));
  }
  parts.push(`${eraName ? `This is ${eraName} … ` : ""}This is who you are now … The me I see is the me I will be.`);
  parts.push(`If it's night, let yourself drift into sleep carrying this feeling … If it's morning, take one more breath … and when you're ready, open your eyes … as the new you.`);
  return parts.join("\n\n");
}
const fix = (t) => { let s = t.trim().replace(/\s+/g, " "); s = s.charAt(0).toUpperCase() + s.slice(1); return /[.!?]$/.test(s) ? s.replace(/[.!?]$/, "") : s; };
const present = (t) => fix(t).replace(/\bI will be\b/gi, "I am").replace(/\bI'll be\b/gi, "I am").replace(/\bI will\b/gi, "I").replace(/\bI'll\b/gi, "I");

/* Daytime top-ups: short, optional, spoken. Same voice and the same engine
   as calm body calm mind; clips live in audio/topup/<id>.mp3 and are
   recorded by tools/make-voice.py. "lines" marks the point where the
   person's own lines are said out loud with the mic. */
export const TOPUPS = [
  {
    id: "reset", name: "Two-minute reset", when: "When stress spikes", mins: 2, bed: "alpha",
    line: "Breathe out the spike. Come back to calm body, calm mind.",
    steps: [
      { id: "r01", line: "Two minutes. Wherever you are, this is enough.", sub: "Feet on the floor. Shoulders down.", say: "Two minutes. Wherever you are, this is enough. Let your feet find the floor. Let your shoulders drop, away from your ears.", gap: 6 },
      { id: "r02", line: "In through the nose.", sub: "Out slowly, longer than the breath in.", say: "Breathe in through your nose. And let it go slowly, longer than the breath in.", gap: 8 },
      { id: "r03", line: "Again.", sub: "In, and a long, slow breath out.", say: "Again. In. And a long, slow breath out.", gap: 9 },
      { id: "r04", line: "One more.", sub: "As you breathe out, let your jaw soften.", say: "One more. And as you breathe out, let your jaw soften.", gap: 9 },
      { id: "r05", line: "Calm body.", sub: "", say: "Calm body.", gap: 7, mantra: true },
      { id: "r06", line: "Calm mind.", sub: "", say: "Calm mind.", gap: 7, mantra: true },
      { id: "r05", line: "Calm body.", sub: "", say: "Calm body.", gap: 8, mantra: true },
      { id: "r06", line: "Calm mind.", sub: "", say: "Calm mind.", gap: 8, mantra: true },
      { id: "r07", line: "In here, you're alright.", sub: "Your body is safe right now.", say: "Your body is safe right now. Whatever is happening out there, in here, you're alright.", gap: 10 },
      { id: "r08", line: "Nothing's changed out there. You have.", sub: "", say: "When you're ready, carry this with you. Nothing's changed out there. You have.", gap: 2 },
    ],
  },
  {
    id: "before", name: "Before it matters", when: "Before a call, a meeting, a hard talk", mins: 2, bed: "alpha",
    line: "Walk in as the new you, not the old one.",
    steps: [
      { id: "b01", line: "Something's coming up that matters.", sub: "Let's get you ready.", say: "Something's coming up that matters. A call, a meeting, a conversation. Let's get you ready.", gap: 4 },
      { id: "b02", line: "Feet on the floor.", sub: "Breathe out slowly, longer than the breath in. Twice more.", say: "Feet on the floor. Breathe out slowly, longer than the breath in. And twice more.", gap: 12 },
      { id: "b03", line: "Picture the moment.", sub: "Where you'll be. Who'll be there.", say: "Now picture the moment. Where you'll be. Who'll be there.", gap: 10 },
      { id: "b04", line: "What would my highest, most developed self do here?", sub: "", say: "Ask yourself: what would my highest, most developed self do here?", gap: 12 },
      { id: "b05", line: "See yourself doing it.", sub: "Unhurried. Clear.", say: "See yourself doing it. The way you stand. The way you speak. Unhurried. Clear.", gap: 14 },
      { id: "b06", line: "It's done, and it went well.", sub: "How does that feel in your chest?", say: "Now fast forward. It's done, and it went well. How does that feel, in your chest?", gap: 14 },
      { id: "b07", line: "Stay in that feeling.", sub: "It isn't a hope. It's already yours.", say: "Stay in that feeling. It isn't a hope. It's already yours.", gap: 10 },
      { id: "b08", line: "Go and be them.", sub: "", say: "It isn't the old you walking into this. It's the new one. Go and be them.", gap: 2 },
    ],
  },
  {
    id: "noise", name: "After the noise", when: "After the news, the scroll, a hard person", mins: 2, bed: "still",
    line: "Clear what went in. Choose what goes in next.",
    steps: [
      { id: "n01", line: "Something got in that belongs to the old you.", sub: "That's alright. Let's clear it.", say: "You've let something in that belongs to the old you. The news, the scroll, a hard conversation. That's alright. Let's clear it.", gap: 4 },
      { id: "n02", line: "Phone face down, if you can.", sub: "Breathe out, long and slow.", say: "Put the phone face down, if you can. Breathe out, long and slow.", gap: 8 },
      { id: "n03", line: "It's just static on the surface.", sub: "You don't need to fight it.", say: "Picture it as grey static on the surface of your mind. You don't need to fight it. It's just noise.", gap: 10 },
      { id: "n04", line: "With every breath out, a little more drifts away.", sub: "", say: "With every breath out, watch a little more of it drift away.", gap: 14 },
      { id: "n05", line: "What went in doesn't decide who you are.", sub: "What you let in next does.", say: "What went in doesn't decide who you are. What you let in next does.", gap: 8 },
      { id: "n06", line: "Choose it now.", sub: "Music, a walk, someone who lifts you, your own recording.", say: "So choose it now. Something that feeds the new you. Music, a walk, someone who lifts you, your own recording.", gap: 10 },
      { id: "n07", line: "Your input is your outlook.", sub: "", say: "Your input is your outlook. Go and choose it.", gap: 2 },
    ],
  },
  {
    id: "questions", name: "Power questions", when: "Any time you're drifting", mins: 2, bed: "alpha",
    line: "Five questions your brain can't leave alone.",
    steps: [
      { id: "q01", line: "Give your brain good questions.", sub: "Answer inside, or out loud. There's no wrong answer.", say: "The brain can't leave a question alone. So let's give it good ones. Answer inside, or out loud. There's no wrong answer.", gap: 4 },
      { id: "q02", line: "What would my highest, most developed self do right now?", sub: "", say: "What would my highest, most developed self do, right now?", gap: 20 },
      { id: "q03", line: "What would a healed nervous system feel like right now?", sub: "", say: "What would a healed nervous system feel like, right now?", gap: 20 },
      { id: "q04", line: "What can I be grateful for right now?", sub: "", say: "What can I be grateful for, right now?", gap: 20 },
      { id: "q05", line: "Who do I love, and who loves me?", sub: "", say: "Who do I love? And who loves me?", gap: 20 },
      { id: "q06", line: "What would the new me do with the next ten minutes?", sub: "", say: "What would the new me do with the next ten minutes?", gap: 20 },
      { id: "q07", line: "Let whatever came up lead the next hour.", sub: "", say: "Whatever came up, let it lead the next hour. Go gently.", gap: 2 },
    ],
  },
  {
    id: "thanks", name: "Two minutes of thank you", when: "Midday, or when it feels thin", mins: 2, bed: "alpha",
    line: "Gratitude is the feeling of already having.",
    steps: [
      { id: "g01", line: "Two minutes of thank you.", sub: "Let your breath slow down.", say: "Two minutes of thank you. Let your breath slow down.", gap: 6 },
      { id: "g02", line: "One thing from today that went right.", sub: "However small. Hold it.", say: "Think of one thing from today that went right. However small. Hold it.", gap: 14 },
      { id: "g03", line: "One person who's glad you exist.", sub: "See their face.", say: "Now one person. Someone who's glad you exist. See their face.", gap: 14 },
      { id: "g04", line: "One thing about you.", sub: "Something the new you does that the old you didn't.", say: "And one thing about yourself. Something the new you is doing, that the old you didn't.", gap: 16 },
      { id: "g05", line: "Say thank you for all three.", sub: "Inside, or out loud.", say: "Say thank you, inside or out loud, for all three.", gap: 10 },
      { id: "g06", line: "Carry the feeling of already having.", sub: "", say: "Gratitude is the feeling of already having. Carry that into the rest of your day.", gap: 2 },
    ],
  },
  {
    id: "lines", name: "Your lines, out loud", when: "A quick midday booster", mins: 1, bed: "alpha",
    line: "Stand up and say who you are now.",
    steps: [
      { id: "y01", line: "Let's say your lines.", sub: "Out loud, present tense, like they're already true.", say: "Let's say your lines. Out loud, in the present tense, like they're already true. Stand up if you can.", gap: 1 },
      { id: "lines", lines: true },
      { id: "y02", line: "That's a vote for the new you.", sub: "", say: "That's a vote for the new you. Every word you speak is an affirmation. Keep choosing these ones.", gap: 2 },
    ],
  },
];
/* Task-switching primers. Same shape as the top-ups above, so they show in the
   top-up list and log the same way; "prime" also puts them in the Transition
   Timer (a short break, then the primer starts on its own). Creativity is
   eyes shut over the alpha bed; focus is eyes open with no beat. */
TOPUPS.push(
  {
    id: "primeCreate", name: "Prime for creativity", when: "Before writing, designing, ideas", mins: 2, bed: "alpha", prime: true, eyes: "shut",
    line: "Put the last task down. Open the door to the next.",
    steps: [
      { id: "pc01", line: "You're changing gear.", sub: "Close your eyes.", say: "You're changing gear. Before the next thing starts, let's put the last one down. Close your eyes.", gap: 4 },
      { id: "pc02", line: "Notice what's still running.", sub: "The half-finished thought. Just notice it.", say: "Notice what's still running from the last task. The half-finished thought. The thing you meant to check. Just notice it.", gap: 8 },
      { id: "pc03", line: "Put each one on a shelf.", sub: "It will be there when you come back.", say: "Picture a shelf. Put each loose thought on it, one at a time. It will still be there when you come back for it.", gap: 12 },
      { id: "pc04", line: "Breathe out, long and slow.", sub: "Let your forehead soften.", say: "Now breathe out, long and slow. Let your forehead soften. Let your jaw go.", gap: 9 },
      { id: "pc05", line: "Let your attention go wide.", sub: "No edges. Nothing to solve yet.", say: "Let your attention go wide, like looking at the horizon with your eyes shut. No edges. Nothing to solve yet.", gap: 12 },
      { id: "pc06", line: "What wants to be made?", sub: "Don't answer it. Let it sit.", say: "Ask yourself, quietly: what wants to be made next? Don't answer it. Let the question sit.", gap: 14 },
      { id: "pc07", line: "Begin with the smallest step.", sub: "", say: "When you're ready, open your eyes. Begin with the smallest step, and let the rest come to you.", gap: 2 },
    ],
  },
  {
    id: "primeFocus", name: "Prime for focus", when: "Before spreadsheets, admin, detail", mins: 2, bed: "still", prime: true, eyes: "open",
    line: "Eyes open. Clear the desk, square the breath, start one thing.",
    steps: [
      { id: "pf01", line: "Eyes open. You're changing gear.", sub: "Sit up. Feet flat on the floor.", say: "Keep your eyes open. You're changing gear into focused work. Sit up, and put your feet flat on the floor.", gap: 4 },
      { id: "pf02", line: "Close what you don't need.", sub: "Tabs, messages, the last task.", say: "Close what you don't need for the next task. Tabs, messages, the last thing you were doing. Do it now.", gap: 12 },
      { id: "pf03", line: "In for four. Hold for four.", sub: "Out for four. Hold for four.", say: "Now a square breath. Breathe in for four. Hold for four. Out for four. Hold for four.", gap: 18 },
      { id: "pf04", line: "Again.", sub: "In, hold, out, hold.", say: "Again. In for four. Hold. Out for four. Hold.", gap: 18 },
      { id: "pf05", line: "Rest your eyes on one point.", sub: "Let everything else blur.", say: "Pick one point on your screen, or on the page. Rest your eyes on it. Let everything else blur.", gap: 8 },
      { id: "pf06", line: "Name the first step.", sub: "Out loud, in a few words.", say: "Name the very first step, out loud, in a few words. Only the first one.", gap: 8 },
      { id: "pf07", line: "Begin.", sub: "One thing, until it's done.", say: "Good. Begin now. One thing, until it's done.", gap: 2 },
    ],
  },
);
export const PRIMES = TOPUPS.filter((t) => t.prime);
export const topupOf = (id) => TOPUPS.find((t) => t.id === id);

/* Identity reinforcement. It records who the person IS, never who they
   were or want to be: every prompt, example and placeholder is "I am", "I do",
   "My life is". The one nod to the past is HISTORY_LINE, shown once, at the
   start of Create. It supersedes the standalone vision: the vision's words
   live on as "A day in my life", and its recording as the identity recording. */
export const HISTORY_LINE = "Everyone has a history. That's exactly what it is: history. This is who you are now.";
export const ID_DOMAINS = [
  { id: "wealth", name: "Wealth" },
  { id: "relationships", name: "Relationships" },
  { id: "mind", name: "Mind mastery" },
  { id: "habits", name: "Habit mastery" },
  { id: "control", name: "Self-control" },
  { id: "spirit", name: "Spirituality" },
];
/* Suggestions to edit, never to keep as they are. Domains the person adds
   themselves get none. */
export const ID_SEEDS = {
  wealth: ["I am calm and capable with money.", "Money comes to me through work I'm proud of.", "I spend with intention and save with ease.", "I am generous, because I have enough."],
  relationships: ["I am present with the people I love.", "I say what I mean, kindly.", "I am easy to trust.", "My relationships are honest and warm."],
  mind: ["I choose where my attention goes.", "My mind is clear and steady.", "I meet hard thoughts with curiosity.", "I learn something every day."],
  habits: ["I do what I say I'll do.", "Small actions are how I live.", "My mornings belong to me.", "I keep my word to myself."],
  control: ["I pause before I act.", "I feel the urge and let it pass.", "I choose the long view.", "I am in charge of what I reach for."],
  spirit: ["I make time for stillness.", "I live by my values.", "I am part of something larger than me.", "I notice what's already good."],
};
export const ID_TRAIT_EXAMPLES = [
  { name: "Steady", how: "I keep my voice low and my pace slow when things get loud." },
  { name: "Disciplined", how: "I do the important thing first, before I open my phone." },
  { name: "Generous", how: "I give my full attention to whoever is in front of me." },
  { name: "Brave", how: "I say the true thing in the meeting, calmly." },
  { name: "Healthy", how: "I move every day and I eat food that feels good an hour later." },
];
/* Proof actions start with a verb, so "When [cue], I [action]" reads as a sentence. */
export const ID_ACTION_EXAMPLES = ["sit still for two minutes", "spend ten minutes on the hardest task, before email", "put my phone in another room", "drink a glass of water before coffee", "send one message of thanks"];
export const ID_CUE_EXAMPLES = ["I sit down at my desk", "I put the kettle on", "we sit down to eat", "I close my laptop at lunch", "I get into bed"];
export const ID_TIMES = { morning: "07:00", evening: "21:00" };
export const ID_CUSTOM_KINDS = [
  { id: "did", label: "Something I did" },
  { id: "moment", label: "A moment" },
  { id: "affirm", label: "A new affirmation" },
];
export const ID_LIFE_HINT = "An ordinary day, in the present tense. When you wake, what you do, who's around you, how it feels. Read aloud, the whole thing takes about a minute.";
export const ID_RECORD_INTRO = "Somewhere quiet, phone a hand's width away. Read it slowly and warmly, as a description of your life as it is. Sixty to ninety seconds is right.";
export const ID_PRACTICE = {
  morning: "Hear it, read it, choose today's proof. Under two minutes.",
  evening: "Tick what you did. This is the evidence. Under a minute.",
  ticked: "This is what I do.",
  unticked: "Tap when it's done.",
};

/* For everything in Identity: present tense only. Catches the future, the
   wish, the attempt and the past, and nudges towards "I am". */
const NOT_NOW = /\b(i will|i'll|i'd like|i would like|i want|i wanna|wants? to|would like to|will be|going to|trying to|hopes? to|wish(?:es)? to|plans? to|i'm going to|i am going to|i'm gonna|i hope|i wish|i plan to|i'm trying|i am trying|i try to|i'm working on|i am working on|i need to|i should|one day|someday|some day|becoming|i'm becoming|i am becoming|goals?|future self|future me|old me|old self|the old you|used to|no longer|anymore|any more)\b/;
export const presentCheck = (t) => (NOT_NOW.test((t || "").toLowerCase()) ? "Say it as it is now: \"I am\", \"I do\", \"My life is\"." : null);

/* "When I sit down at my desk, I open the hardest task." The action reads
   with or without its own "I". */
export function ifThen(cue, action) {
  const a = String(action || "").trim().replace(/[.!?]+$/, "").replace(/^i\s+/i, "");
  const c = String(cue || "").trim().replace(/[.!?,]+$/, "").replace(/^(when|whenever|after|as soon as)\s+/i, "");
  if (!a) return "";
  const lower = (x) => (/^(I\b|I'|[A-Z]{2})/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1));
  return c ? `When ${lower(c)}, I ${lower(a)}.` : `I ${lower(a)}.`;
}

/* The recording: the statement, the traits by name, a day in the life, and
   the paragraph per domain, closing in the present. About a minute aloud. */
export function buildIdentityScript({ statement, traits = [], life = {}, domains = [] }) {
  const end = (t) => { const x = String(t || "").trim(); return !x ? "" : /[.!?]$/.test(x) ? x : x + "."; };
  const names = traits.map((t) => (t.name || "").trim().toLowerCase()).filter(Boolean);
  const parts = [];
  if (statement) parts.push(end(statement));
  if (names.length) parts.push(`I am ${names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0]}.`);
  if (life.text) parts.push(end(life.text));
  domains.forEach((d) => { const p = (life.by || {})[d.id]; if (p && p.trim()) parts.push(end(p)); });
  parts.push("This is who I am. This is my life.");
  return parts.join("\n\n");
}

/* A first draft from what they've already written, to edit rather than face a blank page. */
export function draftVision({ statements = [], scene = {}, eraName }) {
  const s = (t) => { const x = present(t); return /[.!?]$/.test(x) ? x : x + "."; };
  const parts = [];
  if (scene.where) parts.push(s(scene.where));
  statements.map((x) => (x.text || "").trim()).filter(Boolean).forEach((l) => parts.push(s(l)));
  if (scene.feel) parts.push(s(scene.feel));
  if (scene.thanks) parts.push(s(scene.thanks));
  parts.push(eraName ? `This is ${eraName}, and it's already mine.` : "This is my life now, and it's already mine.");
  return parts.join(" ");
}

/* Gratitude: a running log of what's already good, reminders that come back
   round through the day with a different prompt each time, and a short
   thank-you script the person records in their own voice. */
export const GRATITUDE_TIMES = [["Morning", "08:00"], ["Midday", "13:00"], ["Evening", "21:00"]];
export const GRATITUDE_PROMPTS = [
  "Someone who made today a little easier.",
  "Something your body did for you today.",
  "Something you have now that you once wished for.",
  "A small thing you'd miss if it went.",
  "Something you got right today.",
  "A person you're glad is in your life, and why.",
  "Something about the place you live.",
  "A moment today you'd happily live again.",
  "Something the new you did today.",
  "Something hard that taught you something.",
];
export const promptFor = (n) => GRATITUDE_PROMPTS[((n % GRATITUDE_PROMPTS.length) + GRATITUDE_PROMPTS.length) % GRATITUDE_PROMPTS.length];
export const GRATITUDE_HINT = "Short and slow, in the present tense. Read aloud it takes a minute or two. Pause at every “…” and let each thank-you land before the next.";

/* A thank-you script from the log, newest first, to edit rather than write
   from nothing. "I'm grateful for my sister" becomes "Thank you for my
   sister"; "grateful that it rained" becomes "I'm thankful that it rained".
   Phone keyboards capitalise the first letter, so it's lowered mid-sentence,
   except for "I" and acronyms. A name at the start gets lowered too; the
   script is there to edit. */
const lowerStart = (t) => (/^(I\b|I'|[A-Z]{2})/.test(t) ? t : t[0].toLowerCase() + t.slice(1));
export function thanksLine(raw) {
  let t = String(raw || "").trim().replace(/[.!?\s]+$/, "");
  if (!t) return "";
  const that = /^(i'?m |i am )?(so |really |very )?(grateful|thankful) that\s+/i;
  if (that.test(t)) return `I'm thankful that ${t.replace(that, "")}`;
  // a whole sentence ("I finished the report") reads as "I'm thankful that…"
  if (/^(I|I've|I'd|We|We've|They|He|She|It)\s/i.test(t) && !/^(i'?m |i am )/i.test(t)) return `I'm thankful that ${lowerStart(t)}`;
  t = t.replace(/^(i'?m |i am )?(so |really |very )?(grateful|thankful)( for)?\s+/i, "").replace(/^thank you( for)?\s+/i, "").replace(/^thanks( for)?\s+/i, "");
  return `Thank you for ${lowerStart(t)}`;
}
export function draftGratitude(log = [], { eraName } = {}) {
  const seen = new Set();
  const lines = [];
  for (const e of log) { const l = thanksLine(e.text); const k = l.toLowerCase(); if (l && !seen.has(k)) { seen.add(k); lines.push(l); } if (lines.length >= 8) break; }
  const parts = [];
  parts.push("Take a breath in … and let it go … Let your shoulders drop … and your jaw soften … There's nothing to do for the next minute … except notice what's already here.");
  if (lines.length) parts.push(lines.join(" … ") + " …");
  else parts.push("Thank you for this breath … Thank you for the people who love me … Thank you for this body, which carries me every day …");
  parts.push("Thank you for the things I can't see yet … the ones already on their way to me … I have enough … I am enough … and there is more good here than I usually stop to notice.");
  parts.push(`${eraName ? `This is ${eraName} … ` : ""}I'm grateful … and it shows in how I live … Take one more breath … and carry that feeling with you.`);
  return parts.join("\n\n");
}
