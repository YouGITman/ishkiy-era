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
