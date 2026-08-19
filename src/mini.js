// iSHKiY mini-assessments — Library lenses. Unlocked after core completion.
// Each: ~12-16 items, own scoring, own short narrative. Feed the profile as named facets.
// Gate 1 note: FRIEND items below are for founder review; APPROACH is a second lens.

export const MINIS = {
  friend: {
    id: "friend",
    name: "The friend you are — and the one you need",
    kicker: "A short lens on closeness",
    from: "Grounded in attachment and social-support research",
    blurb: "Two questions, really. What do you bring to the people you love? And what do you quietly need back? Twelve questions, about six minutes.",
    tint: "clay",
    items: [
      { id: "FR-G1", format: "L5", facet: "give_presence", text: "When someone I love is struggling, I show up — even when it's inconvenient." },
      { id: "FR-G2", format: "L5", facet: "give_space", text: "I can let people be upset without rushing to fix them." },
      { id: "FR-G3", format: "L5", facet: "give_honesty", text: "I'll tell a friend a hard truth if it serves them." },
      { id: "FR-G4", format: "L5", facet: "give_reliability", text: "People know that if I say I'll be there, I will." },
      { id: "FR-G5", format: "L5", facet: "give_celebrate", text: "I'm genuinely glad when good things happen to my friends." },
      { id: "FR-G6", format: "L5", facet: "give_presence", reverse: true, text: "I go quiet when people need me most." },
      { id: "FR-N1", format: "L5", facet: "need_reassurance", text: "I need to hear that I matter to the people close to me." },
      { id: "FR-N2", format: "L5", facet: "need_space", text: "When I'm low, I'd rather be given room than fussed over." },
      { id: "FR-N3", format: "L5", facet: "need_depth", text: "Small talk drains me; I want the real conversation." },
      { id: "FR-N4", format: "L5", facet: "need_reliability", text: "Being let down by a friend cuts deeper than most things." },
      { id: "FR-N5", format: "L5", facet: "need_reassurance", reverse: true, text: "I rarely need others to tell me where I stand with them." },
      { id: "FR-FC1", format: "FC", facet: "fc", a: { text: "A friend who always shows up", key: "reliability" }, b: { text: "A friend who really gets me", key: "depth" }, text: "If you had to choose the friend you need:" },
    ],
  },
  approach: {
    id: "approach",
    name: "How you meet the world",
    kicker: "A short lens on drive",
    from: "Grounded in approach–avoidance motivation research",
    blurb: "Do you move toward what you want, or away from what you fear? Neither is wrong — but knowing which changes everything. Ten questions, about five minutes.",
    tint: "steel",
    items: [
      { id: "AP-1", format: "L5", facet: "approach", text: "I chase the thing I want more than I avoid the thing I fear." },
      { id: "AP-2", format: "L5", facet: "avoid", text: "I spend a lot of energy making sure things don't go wrong." },
      { id: "AP-3", format: "L5", facet: "approach", text: "The upside pulls me harder than the downside scares me." },
      { id: "AP-4", format: "L5", facet: "avoid", reverse: true, text: "I rarely play it safe just to avoid a bad outcome." },
      { id: "AP-5", format: "L5", facet: "approach", text: "I'd rather try and fail than never know." },
      { id: "AP-6", format: "L5", facet: "avoid", text: "A possible loss weighs on me more than an equal gain." },
      { id: "AP-7", format: "L5", facet: "approach", text: "New opportunities light me up." },
      { id: "AP-8", format: "L5", facet: "avoid", text: "I check the exits before I commit." },
      { id: "AP-9", format: "L5", facet: "approach", text: "I make decisions from what I want, not what I'm avoiding." },
      { id: "AP-10", format: "L5", facet: "avoid", reverse: true, text: "Security is not my first question about a choice." },
    ],
  },
};

export function scoreMini(id, answers) {
  const m = MINIS[id];
  const val = (it) => { const idx = answers[it.id]; if (idx == null) return null; return (it.reverse ? 4 - idx : idx) + 1; };
  const mean = (pred) => { const vs = m.items.filter(pred).map(val).filter((v) => v != null); return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null; };
  const to100 = (x) => x == null ? null : Math.round(((x - 1) / 4) * 100);
  if (id === "friend") {
    const give = to100(mean((i) => i.facet && i.facet.startsWith("give")));
    const need = to100(mean((i) => i.facet && i.facet.startsWith("need")));
    const fc = answers["FR-FC1"]; const needMost = fc === "a" ? "reliability" : fc === "b" ? "depth" : null;
    return { give, need, needMost, kind: "friend" };
  }
  const app = to100(mean((i) => i.facet === "approach"));
  const avo = to100(mean((i) => i.facet === "avoid"));
  return { approach: app, avoid: avo, orientation: app == null ? null : (app >= avo ? "toward" : "away"), kind: "approach" };
}
