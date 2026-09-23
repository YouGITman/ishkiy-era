// iSHKiY mini-assessments — Library lenses. Unlocked at Full Portrait.
// Each: ~10-13 items, own scoring, own short read. Feed the profile as named facets.
//
// Formats: L5 (five-point agreement), FC (two cards), PK (pick one of several).
// A lens lists its scored dimensions in `dims`; every L5 item's `facet` names one
// of them. `research` is the explainer behind the "Grounded in…" line: what the
// lens draws on, and what it can't claim. `read(r)` turns a scored result into
// the words a person sees — worked out at render time, never stored, so wording
// can improve without anyone having to retake a lens.
//
// Items are written for iSHKiY. They sample the ideas in the research named;
// none reproduces a published scale's wording.

const band = (v) => (v == null ? null : v >= 67 ? "high" : v <= 33 ? "low" : "mid");
const ranked = (dims, keys) => keys.filter((k) => dims[k] != null).sort((a, b) => dims[b] - dims[a]);
const bars = (m, r) => m.dims.map((d) => [d.label, r.dims ? r.dims[d.key] : null]);

export const MINIS = {
  /* ---------------- Relationships ---------------- */
  attachment: {
    id: "attachment",
    subject: "closeness",
    name: "How you attach",
    kicker: "A short lens on attachment",
    from: "Grounded in adult attachment research",
    research: {
      what: "Attachment theory began with John Bowlby and Mary Ainsworth watching how infants handle separation from a carer. In 1987 Cindy Hazan and Phillip Shaver showed the same patterns turn up in adult love. A decade later Kelly Brennan, Catherine Clark and Phillip Shaver pooled dozens of questionnaires and found almost everything reduced to two dimensions: attachment anxiety (how much you worry about being left) and attachment avoidance (how uneasy closeness makes you). Where you sit on those two gives the four familiar styles — secure, anxious, avoidant, and fearful-avoidant.",
      limits: "Attachment is not a fixed type stamped on you in childhood. It shifts with relationships and with life — researchers call the move towards security 'earned security'. You may also attach differently to a partner than to a parent or a friend. This lens reads your general pattern, not a diagnosis.",
    },
    blurb: "When someone matters, do you lean in, hold back, or both at once? The pattern underneath most of your closest relationships. Twelve questions, about six minutes.",
    tint: "clay",
    dims: [{ key: "anxiety", label: "Worry about being left" }, { key: "avoidance", label: "Unease with closeness" }],
    items: [
      { id: "AT-A1", format: "L5", facet: "anxiety", text: "I worry that the people I love don't feel as strongly about me as I do about them." },
      { id: "AT-V1", format: "L5", facet: "avoidance", text: "I get uneasy when someone wants to be very close to me." },
      { id: "AT-A2", format: "L5", facet: "anxiety", text: "If someone close to me goes quiet, I start wondering what I've done." },
      { id: "AT-V2", format: "L5", facet: "avoidance", text: "I'd rather not lean on other people, even when things are hard." },
      { id: "AT-A3", format: "L5", facet: "anxiety", text: "I need a fair bit of reassurance that I'm wanted." },
      { id: "AT-V3", format: "L5", facet: "avoidance", reverse: true, text: "I find it easy to tell the people I love what I need." },
      { id: "AT-A4", format: "L5", facet: "anxiety", reverse: true, text: "I rarely worry about being left." },
      { id: "AT-V4", format: "L5", facet: "avoidance", text: "When a relationship gets serious, part of me wants to step back." },
      { id: "AT-A5", format: "L5", facet: "anxiety", text: "When I'm apart from someone I love, I find it hard to settle." },
      { id: "AT-V5", format: "L5", facet: "avoidance", reverse: true, text: "I'm comfortable depending on a partner or a close friend." },
      { id: "AT-A6", format: "L5", facet: "anxiety", text: "I sometimes push for closeness in a way I regret later." },
      { id: "AT-V6", format: "L5", facet: "avoidance", text: "I keep my deepest feelings to myself, even with people I trust." },
    ],
    read(r) {
      const a = r.dims.anxiety, v = r.dims.avoidance;
      const style = a >= 50 ? (v >= 50 ? "fearful" : "anxious") : (v >= 50 ? "avoidant" : "secure");
      const S = {
        secure: {
          label: "Secure",
          headline: "Secure, mostly. You can let people close, and let them go, without it rattling you.",
          paras: ["You tend to trust that the people who love you will still love you tomorrow, and you can ask for what you need without it feeling like a risk. That steadiness is a gift to everyone around you, even when they don't notice it.",
            "The thing to watch is empathy for people who aren't built like you. If closeness has always felt safe, it's easy to read someone else's worry or distance as a choice, when for them it's a reflex."],
          tryThis: "Next time someone close pulls back or clings, ask what they need before deciding what it means.",
        },
        anxious: {
          label: "Anxious",
          headline: "Closeness matters so much to you that its absence gets loud.",
          paras: ["When someone you love goes quiet, your mind fills the silence, usually with the worst version. You're highly tuned to connection, which makes you warm and attentive. It also means you can spend a lot of energy checking whether you're still wanted.",
            "The research calls this 'hyperactivation': turning the signal up to make sure it gets heard. It isn't neediness. It's a strategy that once made sense, running a little louder than today requires."],
          tryThis: "Ask for the reassurance directly instead of testing for it. “I'm feeling a bit wobbly, can you tell me we're okay?” works far better than waiting to see if they notice.",
        },
        avoidant: {
          label: "Avoidant",
          headline: "You've learned to rely on yourself first.",
          paras: ["Independence comes naturally to you, and you're steady in a crisis. The flip side is that closeness can start to feel like pressure, and when a relationship deepens, part of you looks for the door, sometimes before you've noticed you're doing it.",
            "The research calls this 'deactivation': turning the need down so it can't let you down. It keeps you safe. It can also keep people who'd be good for you at arm's length."],
          tryThis: "Run a small experiment: let someone help with something you'd normally handle alone, and notice what happens in you when they do.",
        },
        fearful: {
          label: "Fearful-avoidant",
          headline: "You want closeness and brace against it at the same time.",
          paras: ["Part of you reaches for people; another part expects it to go wrong and gets ready to leave first. That push and pull is exhausting, for you more than anyone, and it can make relationships feel like weather you can't predict.",
            "This pattern usually has a history behind it, and it tends to soften with steady relationships and good support. It isn't a flaw in you. It's a sensible response to something that once wasn't safe."],
          tryThis: "This one is worth talking through with someone trained to help. A good therapist is, among other things, a safe place to practise closeness.",
        },
      }[style];
      return { tag: S.label, headline: S.headline, bars: bars(this, r), paras: [...S.paras, "Attachment isn't fixed. People move towards security over time, often through one steady relationship."], tryThis: S.tryThis };
    },
  },

  friend: {
    id: "friend",
    subject: "closeness",
    name: "The friend you are — and the one you need",
    kicker: "A short lens on closeness",
    from: "Grounded in attachment and social-support research",
    research: {
      what: "Social-support research separates what we give from what we receive, and finds the two are often out of step: plenty of people are generous supporters who rarely let anyone support them. It also finds the kind of support matters as much as the amount. Some people need presence and reliability; others need to feel deeply understood. Attachment research adds the 'why': how much reassurance you need tends to track how safe closeness has felt to you before.",
      limits: "Friendship is two people, and this lens only hears from one of them. It reads your tendencies, not how good a friend you are. Your friends might tell a different, kinder story.",
    },
    blurb: "Two questions, really. What do you bring to the people you love? And what do you quietly need back? Twelve questions, about six minutes.",
    tint: "clay",
    dims: [{ key: "give", label: "What you give" }, { key: "need", label: "What you need" }],
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
    read(r) {
      const gap = r.give != null && r.need != null ? r.give - r.need : 0;
      const headline = gap > 15 ? "You give more than you ask for. A quiet strength, and worth watching so the well doesn't run dry."
        : gap < -15 ? "You feel the need for closeness keenly. That's not weakness; it's how you're wired to bond."
        : "You give and need in fair balance. Rarer than it sounds.";
      const paras = ["This lens looks at two sides of closeness: what you naturally give the people you love, and what you quietly need back. Neither number is good or bad. The interesting part is the gap between them, and whether the people around you know what you need."];
      if (r.needMost) paras.push(`When it comes to it, the friend you need most is one who offers ${r.needMost === "reliability" ? "reliability: someone who simply shows up" : "depth: someone who really gets you"}.`);
      return { tag: gap > 15 ? "The giver" : gap < -15 ? "The seeker" : "In balance", headline, bars: [["What you give", r.give], ["What you need", r.need]], paras,
        tryThis: gap > 15 ? "Tell one friend this week something you need from them. Small counts." : "Name the kind of friend you need to the friends you have. Most people can't guess." };
    },
  },

  room: {
    id: "room",
    subject: "closeness",
    name: "The room you walk into",
    kicker: "A short lens on presence",
    from: "Grounded in interpersonal circumplex research",
    research: {
      what: "In the 1950s Timothy Leary (the psychologist, before his other career) mapped how people behave with each other onto a circle. Jerry Wiggins later refined it into the interpersonal circumplex, which rests on two axes that turn up across cultures: agency (how much you lead, steer and take up space) and communion (how much warmth and connection you bring). Every social style is some blend of the two. Research on 'self-monitoring' and emotional labour adds a third question: how much effort it takes to be the person people meet.",
      limits: "You read the room from the inside. How others experience you can differ from how you experience yourself, sometimes a lot. And most people shift style between work, friends and family; this lens reads your default.",
    },
    blurb: "What happens to a room when you enter it, and what that costs you to keep up. Ten questions, about five minutes.",
    tint: "clay",
    dims: [{ key: "lead", label: "Taking the lead" }, { key: "warmth", label: "Warmth" }, { key: "upkeep", label: "Cost to keep up" }],
    items: [
      { id: "RM-L1", format: "L5", facet: "lead", text: "In a new group, I'm usually the one who gets things moving." },
      { id: "RM-W1", format: "L5", facet: "warmth", text: "Strangers tend to relax around me quickly." },
      { id: "RM-U1", format: "L5", facet: "upkeep", text: "Being 'on' in company leaves me needing time to recover." },
      { id: "RM-L2", format: "L5", facet: "lead", text: "People tend to look to me when a decision needs making." },
      { id: "RM-W2", format: "L5", facet: "warmth", text: "I notice who's on the edge of a conversation and bring them in." },
      { id: "RM-U2", format: "L5", facet: "upkeep", text: "The version of me people meet takes effort to keep up." },
      { id: "RM-L3", format: "L5", facet: "lead", reverse: true, text: "I'm happy to let others take the floor." },
      { id: "RM-W3", format: "L5", facet: "warmth", reverse: true, text: "I keep a bit of distance until I know people well." },
      { id: "RM-U3", format: "L5", facet: "upkeep", reverse: true, text: "I'm much the same person in a room as I am on my own." },
      { id: "RM-PK1", format: "PK", text: "When you walk into a room, what do people most often get from you?", options: [
        { text: "Momentum — things start happening", key: "momentum" }, { text: "Warmth — people feel welcome", key: "warmth" },
        { text: "Order — things get clearer", key: "order" }, { text: "Quiet attention — people feel heard", key: "attention" }] },
    ],
    read(r) {
      const L = r.dims.lead, W = r.dims.warmth, U = r.dims.upkeep;
      const q = L >= 50 ? (W >= 50 ? "host" : "captain") : (W >= 50 ? "harbour" : "observer");
      const Q = {
        host: ["The host", "You lift a room and give it a direction.", "You combine warmth with a willingness to lead, so people tend to feel both welcomed and taken somewhere. Groups often organise themselves around you without anyone deciding they should."],
        captain: ["The captain", "People feel steered by you — clearly, and sometimes from a slight distance.", "You bring direction and decisiveness more than warmth. That makes you valuable when things need sorting, and can make you harder to get close to. People may respect you before they feel they know you."],
        harbour: ["The harbour", "People feel safe around you, and may not always hear you.", "You bring warmth without needing the spotlight. People confide in you and settle around you. The risk is that your view gets lost because you won't push for the floor."],
        observer: ["The observer", "You read a room before you enter it.", "You tend to hang back, watch, and engage on your own terms. You often see what others miss. People may find you hard to know at first, which suits you more than it bothers you."],
      }[q];
      const cost = band(U) === "high" ? "And it costs you. Keeping this up takes real effort, which is why you need time alone afterwards. That isn't antisocial; it's maintenance."
        : band(U) === "low" ? "And it costs you little. The person people meet is close to the person you are, which is rarer, and more restful, than it sounds."
        : "It costs you something, though not everything. Some rooms drain you more than others, and it's worth noticing which.";
      const pick = { momentum: "You said people get momentum from you.", warmth: "You said people get warmth from you.", order: "You said people get clarity from you.", attention: "You said people get your quiet attention." }[(r.picks || {})["RM-PK1"]];
      return { tag: Q[0], headline: Q[1], bars: bars(this, r), paras: [Q[2], ...(pick ? [pick + " Worth checking with someone who knows you whether they'd say the same."] : []), cost],
        tryThis: band(U) === "high" ? "Before a big social day, plan the recovery as seriously as the event." : "Ask one person what changes when you walk into a room. The answer is usually surprising." };
    },
  },

  fight: {
    id: "fight",
    subject: "closeness",
    name: "How you fight",
    kicker: "A short lens on conflict",
    from: "Grounded in conflict style research",
    research: {
      what: "Conflict-style research rests on the 'dual concern' model, developed by Robert Blake and Jane Mouton and later by Afzalur Rahim and by Dean Pruitt. In any disagreement you are balancing two things: how much you care about your own outcome, and how much you care about theirs. The balance gives five broad moves — competing, collaborating, compromising, avoiding and accommodating. Most people use all five but reach for one first, and that first reach is usually learned early.",
      limits: "No style is the right one; each fits some situations and backfires in others. This reads your habit under tension, not your skill. You may fight quite differently with a partner than with a colleague.",
    },
    blurb: "Everyone has a move when it gets tense. Yours is probably older than the argument. Eleven questions, about five minutes.",
    tint: "clay",
    dims: [{ key: "compete", label: "Hold your ground" }, { key: "collaborate", label: "Work it through" }, { key: "compromise", label: "Meet in the middle" }, { key: "avoid", label: "Step away" }, { key: "accommodate", label: "Give way" }],
    items: [
      { id: "CF-CP1", format: "L5", facet: "compete", text: "In an argument, I hold my ground until the other person sees it my way." },
      { id: "CF-AV1", format: "L5", facet: "avoid", text: "I'll go a long way to avoid a row." },
      { id: "CF-CO1", format: "L5", facet: "collaborate", text: "I want to get to the bottom of what we both actually need, even if it takes longer." },
      { id: "CF-AC1", format: "L5", facet: "accommodate", text: "I often give in just to keep the peace." },
      { id: "CF-CM1", format: "L5", facet: "compromise", text: "I look for the middle ground so we can both move on." },
      { id: "CF-CP2", format: "L5", facet: "compete", text: "If I'm right, I'll keep pushing, even when it gets uncomfortable." },
      { id: "CF-AV2", format: "L5", facet: "avoid", text: "When things get tense, I change the subject or leave the room." },
      { id: "CF-CO2", format: "L5", facet: "collaborate", text: "I'd rather talk it all the way through than settle quickly." },
      { id: "CF-AC2", format: "L5", facet: "accommodate", text: "In the moment, their feelings matter more to me than being right." },
      { id: "CF-CM2", format: "L5", facet: "compromise", text: "Splitting the difference usually feels fair to me." },
      { id: "CF-PK1", format: "PK", text: "Afterwards, what usually bothers you most?", options: [
        { text: "That I didn't say what I really meant", key: "unsaid" }, { text: "That I said too much", key: "oversaid" },
        { text: "That nothing actually got resolved", key: "unresolved" }, { text: "That they're still upset", key: "hurt" }] },
    ],
    read(r) {
      const order = ranked(r.dims, ["compete", "collaborate", "compromise", "avoid", "accommodate"]);
      const M = {
        compete: ["The stand", "Your move is to hold your ground.", "You care about getting the outcome right and you'll push for it. It's invaluable when something important is at stake and someone needs to be firm. It costs you when the other person stops arguing, not because they agree, but because they've given up talking to you."],
        collaborate: ["The table", "Your move is to work it through.", "You want both of you to leave with what you actually need, and you'll put in the time. It's the most constructive style there is, and also the most tiring: not every argument deserves a full summit, and some people just want it over."],
        compromise: ["The middle", "Your move is to meet halfway.", "You're quick to find something both sides can live with, which keeps things moving. The risk is that halfway becomes a habit, and neither of you gets what really mattered, because you split it before anyone said what it was."],
        avoid: ["The exit", "Your move is to step away.", "You'd rather let things cool than fight in the heat, and sometimes that's wise. But the things you don't say don't go anywhere. They wait, and they tend to come back larger."],
        accommodate: ["The peace", "Your move is to give way.", "You protect the relationship by letting the other person have it. It's generous, and it makes you easy to be close to. Over time, though, the people around you may not know what you want, because you've stopped telling them."],
      };
      const top = order[0], second = order[1];
      const after = { unsaid: "You said what bothers you afterwards is what you didn't say. That's usually a sign your first move is quieter than you'd like it to be.", oversaid: "You said what bothers you afterwards is saying too much. The heat gets ahead of you, and it's worth having a way to slow it down.", unresolved: "You said what bothers you afterwards is that nothing got resolved. You want arguments to end somewhere, not just stop.", hurt: "You said what bothers you afterwards is that they're still upset. The relationship matters more to you than the point." }[(r.picks || {})["CF-PK1"]];
      const paras = [M[top][2]];
      if (second) paras.push(`Your second move is to ${M[second][1].replace(/^Your move is to /, "").replace(/\.$/, "").toLowerCase()}. When the first doesn't work, that's where you go.`);
      if (after) paras.push(after);
      return { tag: M[top][0], headline: M[top][1], bars: bars(this, r), paras,
        tryThis: top === "avoid" || top === "accommodate" ? "Next time, say one sentence of what you actually want before you let it go. Just one." : top === "compete" ? "Next time, ask one real question about their side before making your next point." : "Next time, ask yourself before you start: does this one need solving, or just hearing?" };
    },
  },

  /* ---------------- Drive ---------------- */
  approach: {
    id: "approach",
    subject: "drive",
    name: "How you meet the world",
    kicker: "A short lens on drive",
    from: "Grounded in approach–avoidance motivation research",
    research: {
      what: "Approach–avoidance motivation is one of the oldest ideas in psychology, running from Kurt Lewin through Jeffrey Gray's work on the brain's reward and threat systems to Andrew Elliot's research on goals. People are moved both towards things they want and away from things they fear, but most lead with one. Tory Higgins' regulatory focus theory frames it as 'promotion' (chasing gains) versus 'prevention' (guarding against losses), and shows each changes how you plan, decide and feel about outcomes.",
      limits: "Neither orientation is better. Leading with the upside makes you bold; leading with care makes you steady. Which one you lead with can also shift with circumstances, especially under stress.",
    },
    blurb: "Do you move towards what you want, or away from what you fear? Neither is wrong, but knowing which changes everything. Ten questions, about five minutes.",
    tint: "steel",
    dims: [{ key: "approach", label: "Moving towards" }, { key: "avoid", label: "Moving away" }],
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
    read(r) {
      const toward = r.orientation === "toward";
      return { tag: toward ? "Towards" : "Away", headline: toward ? "You lead with the upside." : "You lead with care.", bars: [["Moving towards what you want", r.approach], ["Moving away from what you fear", r.avoid]],
        paras: [toward ? "You move towards what you want more than away from what you fear. That makes you brave, and occasionally blind to the cliff edge." : "You move to protect what matters before you reach for more. That makes you steady, and sometimes slower to the thing you'd love.",
          "Most people do both, but one usually leads. Knowing which one leads helps explain why some choices feel easy and others feel like a fight."],
        tryThis: toward ? "Before your next big yes, spend five minutes writing down what could go wrong. Then decide anyway." : "Before your next no, ask what you'd do if you knew it would work. Then decide anyway." };
    },
  },

  builder: {
    id: "builder",
    subject: "drive",
    name: "The builder's pattern",
    kicker: "A short lens on starting things",
    from: "Grounded in entrepreneurial disposition research",
    research: {
      what: "Research on who starts things draws on several threads. Thomas Bateman and Michael Crant's 'proactive personality' describes people who act on their environment rather than waiting for it. Work on risk-taking and tolerance of ambiguity (from Budner onwards) shows builders are less bothered by not knowing. Angela Duckworth's research on grit adds staying power: the ability to keep going through the dull middle. Studies of founders consistently find the mix matters more than any single trait.",
      limits: "Plenty of successful founders score modestly here, and plenty of high scorers never start anything. Circumstances — money, time, responsibilities, luck — shape who builds as much as temperament does. This reads the disposition, not the destiny.",
    },
    blurb: "Some people can't stop starting things. An honest measure of whether you're one of them. Twelve questions, about six minutes.",
    tint: "steel",
    dims: [{ key: "initiative", label: "Initiative" }, { key: "risk", label: "Appetite for risk" }, { key: "ambiguity", label: "Comfort with not knowing" }, { key: "persistence", label: "Staying power" }],
    items: [
      { id: "BD-I1", format: "L5", facet: "initiative", text: "I start things without waiting to be asked." },
      { id: "BD-R1", format: "L5", facet: "risk", text: "I'd take a real chance at something big over a safe bet at something small." },
      { id: "BD-A1", format: "L5", facet: "ambiguity", text: "Not knowing how something will turn out excites me more than it worries me." },
      { id: "BD-P1", format: "L5", facet: "persistence", text: "I keep going on a project long after the first excitement has worn off." },
      { id: "BD-I2", format: "L5", facet: "initiative", text: "When I see something broken, I want to build the fix myself." },
      { id: "BD-R2", format: "L5", facet: "risk", text: "I can live with losing money or status on a bet I believe in." },
      { id: "BD-A2", format: "L5", facet: "ambiguity", text: "I can act without having the full picture." },
      { id: "BD-P2", format: "L5", facet: "persistence", text: "Rejection makes me more determined, not less." },
      { id: "BD-I3", format: "L5", facet: "initiative", reverse: true, text: "I'd rather improve something that exists than start something new." },
      { id: "BD-R3", format: "L5", facet: "risk", reverse: true, text: "Stability matters more to me than upside." },
      { id: "BD-P3", format: "L5", facet: "persistence", reverse: true, text: "I lose interest once the hard, boring middle starts." },
      { id: "BD-PK1", format: "PK", text: "Honestly, how many things have you started in the last five years? Ventures, side projects, groups, anything.", options: [
        { text: "None", key: "0" }, { text: "One or two", key: "1" }, { text: "Three to five", key: "2" }, { text: "More than I can count", key: "3" }] },
    ],
    read(r) {
      const d = r.dims, keys = ["initiative", "risk", "ambiguity", "persistence"];
      const vals = keys.map((k) => d[k]).filter((v) => v != null);
      const idx = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      const order = ranked(d, keys), hi = order[0], lo = order[order.length - 1];
      const L = { initiative: "initiative", risk: "appetite for risk", ambiguity: "comfort with not knowing", persistence: "staying power" };
      const headline = idx >= 65 ? "Yes. You're a builder." : idx >= 45 ? "A builder, under the right conditions." : "You're more steward than starter, and that's a rarer asset than it sounds.";
      const shape = hi === "initiative" && band(d.persistence) !== "high" ? "Your shape is the classic starter: quick to begin, less sure in the long middle. Starters do best with a finisher beside them."
        : hi === "persistence" && band(d.initiative) !== "high" ? "Your shape is the finisher: slower to begin, very hard to stop once you have. Finishers are what most starters are secretly looking for."
        : `Your strongest suit is ${L[hi]}; your thinnest is ${L[lo]}. Builders rarely have all four, and the good ones know which they're borrowing from someone else.`;
      const started = { "0": "You haven't started anything in five years, which may be circumstance rather than disposition.", "3": "You've started more than you can count. The question for you is probably less 'can I start?' than 'which one do I finish?'" }[(r.picks || {})["BD-PK1"]];
      return { tag: idx >= 65 ? "Builder" : idx >= 45 ? "Conditional builder" : "Steward", headline, bars: bars(this, r), paras: [shape, ...(started ? [started] : [])],
        tryThis: `Find the person who is strong where your ${L[lo]} is thin, and build the next thing with them.` };
    },
  },

  stuck: {
    id: "stuck",
    subject: "drive",
    name: "What you do when you're stuck",
    kicker: "A short lens on coping",
    from: "Grounded in coping and self-regulation research",
    research: {
      what: "Richard Lazarus and Susan Folkman's work in the 1980s split coping into two families: tackling the problem itself, and managing how you feel about it. Charles Carver's research mapped the everyday moves people actually make, from planning and asking for help to distraction and denial. James Gross added reappraisal — changing how you see a situation — as one of the most reliably helpful. Susan Nolen-Hoeksema showed that rumination, going round the same thoughts without moving, is closely tied to low mood.",
      limits: "No coping move is good or bad in itself; a night of television can be exactly right. What matters is range and fit: whether you have more than one move, and whether the one you reach for suits the problem. This reads your habits, not your character.",
    },
    blurb: "Not what you'd like to do. What you actually do, at eleven at night, when it isn't moving. Thirteen questions, about six minutes.",
    tint: "steel",
    dims: [{ key: "tackle", label: "Tackle it" }, { key: "reframe", label: "Look again" }, { key: "reach", label: "Reach out" }, { key: "rest", label: "Step away" }, { key: "numb", label: "Numb it" }, { key: "loop", label: "Go round in circles" }],
    items: [
      { id: "SK-T1", format: "L5", facet: "tackle", text: "I break the problem into smaller pieces and do the next one." },
      { id: "SK-N1", format: "L5", facet: "numb", text: "I scroll, snack, drink or binge something to stop thinking about it." },
      { id: "SK-F1", format: "L5", facet: "reframe", text: "I try to look at it from a different angle." },
      { id: "SK-L1", format: "L5", facet: "loop", text: "I go over it again and again in my head without getting anywhere." },
      { id: "SK-S1", format: "L5", facet: "reach", text: "I talk it through with someone I trust." },
      { id: "SK-R1", format: "L5", facet: "rest", text: "I step away and come back to it fresh." },
      { id: "SK-T2", format: "L5", facet: "tackle", text: "I make a plan, even a rough one." },
      { id: "SK-N2", format: "L5", facet: "numb", text: "I put it off and hope it sorts itself out." },
      { id: "SK-F2", format: "L5", facet: "reframe", text: "I remind myself what's actually in my control." },
      { id: "SK-L2", format: "L5", facet: "loop", text: "I lie awake replaying it." },
      { id: "SK-S2", format: "L5", facet: "reach", text: "I ask for help, even when it feels awkward." },
      { id: "SK-R2", format: "L5", facet: "rest", text: "I move my body: a walk, the gym, anything." },
      { id: "SK-PK1", format: "PK", text: "Eleven at night, stuck. What are you most likely doing?", options: [
        { text: "Still working at it", key: "tackle" }, { text: "On my phone", key: "numb" }, { text: "Lying there thinking", key: "loop" }, { text: "Messaging someone", key: "reach" }] },
    ],
    read(r) {
      const d = r.dims;
      const good = ranked(d, ["tackle", "reframe", "reach", "rest"]);
      const G = { tackle: ["The fixer", "You get to work on it.", "Your first move is practical: break it down, make a plan, do the next thing. It's the right move for problems that can be solved, and a frustrating one for problems that can't."],
        reframe: ["The reframer", "You look at it again.", "Your first move is to change the angle, to find what's in your control and what the situation might mean. It's one of the most reliably helpful moves the research has found."],
        reach: ["The connector", "You reach for someone.", "Your first move is to talk it through. Other people shrink problems, and you know it. Just make sure they're the right people for this particular problem."],
        rest: ["The reset", "You step away and come back.", "Your first move is distance: a walk, some sleep, a break. It works because stuck minds rarely unstick by force. It's worth pairing with a plan for coming back."] };
      const top = good[0] || "tackle";
      const paras = [G[top][2]];
      const costly = band(d.loop) === "high" || (d.loop >= 50 && d.loop >= d.numb) ? "loop" : d.numb >= 50 ? "numb" : null;
      if (costly === "loop") paras.push("The move that costs you is going round in circles. Rumination feels like working on the problem, but it isn't. It's the coping habit most tied to low mood, which makes it worth interrupting on purpose.");
      else if (costly === "numb") paras.push("The move that costs you is numbing: the scroll, the snack, the glass, the 'later'. In small doses it's fine. As a first resort, it means the problem is still there in the morning, plus a bit of guilt.");
      else paras.push("Neither numbing nor going round in circles has much of a hold on you. That's worth knowing, because both are common.");
      const care = band(d.loop) === "high" && band(d.numb) === "high";
      if (care) paras.push("If stuck has started to feel like most of the time, that's worth taking seriously. Talking to someone helps more than it seems it will, and there are people you can reach tonight.");
      return { tag: G[top][0], headline: G[top][1], bars: bars(this, r), paras, care,
        tryThis: costly === "loop" ? "When you catch yourself replaying it, write the next single action on paper. Then stop until morning." : costly === "numb" ? "Next time you reach for your phone, set a ten-minute timer first. Then decide again." : `Add a second move to your ${G[top][0].toLowerCase().replace("the ", "")} habit. ${top === "reach" ? "Try a plan." : "Try telling someone."}` };
    },
  },

  /* ---------------- Mind ---------------- */
  pressure: {
    id: "pressure",
    subject: "mind",
    name: "How you carry pressure",
    kicker: "A short lens on stress and recovery",
    from: "Grounded in stress and recovery research",
    research: {
      what: "Stress research long ago stopped treating pressure as the enemy. What wears people down is load without recovery. Sabine Sonnentag and Charlotte Fritz identified four experiences that restore people after demanding days: psychological detachment (actually switching off), relaxation, mastery (doing something absorbing and challenging for yourself) and control (choosing how you spend your own time). Sheldon Cohen's work on perceived stress shows that how loaded you feel matters as much as what's actually on your plate.",
      limits: "This is a snapshot of right now, and right now changes. It isn't a measure of burnout, anxiety or depression, and it can't tell you whether you need help. If pressure has become too much, please talk to your GP or one of the services in the SOS section.",
    },
    blurb: "Where your load actually sits, what it costs you, and the recovery that works for someone built like you. Eleven questions, about five minutes.",
    tint: "sage",
    dims: [{ key: "load", label: "Load right now" }, { key: "detach", label: "Switching off" }, { key: "relax", label: "Unwinding" }, { key: "mastery", label: "Absorbed in something" }, { key: "control", label: "Your time, your call" }],
    items: [
      { id: "PR-L1", format: "L5", facet: "load", text: "Lately, it feels like there's more on me than I can handle." },
      { id: "PR-D1", format: "L5", facet: "detach", text: "When I stop working, I can actually stop thinking about work." },
      { id: "PR-X1", format: "L5", facet: "relax", text: "There's something in my week that properly lets me unwind." },
      { id: "PR-L2", format: "L5", facet: "load", text: "I've felt on edge most days in the past month." },
      { id: "PR-M1", format: "L5", facet: "mastery", text: "Outside work, I do things that challenge me in a good way: learning, sport, making." },
      { id: "PR-C1", format: "L5", facet: "control", text: "I get to decide how I spend at least some of my free time." },
      { id: "PR-D2", format: "L5", facet: "detach", reverse: true, text: "My mind stays on my to-do list in the evenings." },
      { id: "PR-L3", format: "L5", facet: "load", reverse: true, text: "I feel on top of the things that matter to me right now." },
      { id: "PR-X2", format: "L5", facet: "relax", text: "I can sit still without feeling guilty about it." },
      { id: "PR-C2", format: "L5", facet: "control", reverse: true, text: "My free time feels like it belongs to other people." },
      { id: "PR-PK1", format: "PK", text: "When pressure builds, where do you notice it first?", options: [
        { text: "My body — shoulders, sleep, stomach", key: "body" }, { text: "My head — racing thoughts, can't focus", key: "head" },
        { text: "My mood — short fuse, or flat", key: "mood" }, { text: "What I do — eat, drink, scroll or work more", key: "habits" }] },
    ],
    read(r) {
      const d = r.dims, lb = band(d.load);
      const rec = ranked(d, ["detach", "relax", "mastery", "control"]), best = rec[0], thin = rec[rec.length - 1];
      const R = { detach: "switching off", relax: "unwinding", mastery: "getting absorbed in something of your own", control: "having your time be yours" };
      const headline = lb === "high" ? "You're carrying a lot right now." : lb === "low" ? "Your load feels manageable right now." : "You're carrying a fair amount, and mostly holding it.";
      const paras = [`Your strongest recovery is ${R[best]}. Your thinnest is ${R[thin]}, and that's usually where the leak is. Recovery doesn't come from rest alone; it comes from whichever of the four you're short of.`];
      const where = { body: "You notice pressure in your body first. Your body tends to know before you do, so it's worth treating tight shoulders or bad sleep as an early warning, not background noise.", head: "You notice pressure in your head first: racing thoughts, lost focus. Getting things out of your head and onto paper helps more for you than for most.", mood: "You notice pressure in your mood first. The people closest to you probably notice it before you do; it's worth asking them to tell you.", habits: "You notice pressure in what you do: more eating, drinking, scrolling or working. Those habits are the signal, not the problem, and they're easier to spot than feelings." }[(r.picks || {})["PR-PK1"]];
      if (where) paras.push(where);
      const care = d.load != null && d.load >= 75;
      if (care) paras.push("A load this heavy for long is worth talking to someone about, whether that's your GP, someone you trust, or one of the services in the SOS section of the Library. You don't have to be in crisis to ask for help.");
      const tips = { detach: "Build an end-of-day ritual: write tomorrow's first task, close the laptop, change clothes. It tells your mind the day is done.", relax: "Put one properly restful thing in your diary this week, and guard it like a meeting.", mastery: "Pick one small thing outside work to get better at. Absorption restores in a way rest can't.", control: "Claim one hour this week that belongs to nobody but you." };
      return { tag: lb === "high" ? "Heavy load" : lb === "low" ? "Light load" : "Holding it", headline, bars: bars(this, r), paras, care, tryThis: tips[thin] };
    },
  },

  resilience: {
    id: "resilience",
    subject: "mind",
    name: "Getting back up",
    kicker: "A short lens on resilience",
    from: "Grounded in resilience research",
    research: {
      what: "Ann Masten, who spent decades studying children who thrived against the odds, called resilience 'ordinary magic': not a rare trait but a set of everyday resources most people can build. Bruce Smith's work focused on the simplest part, how quickly you bounce back. Albert Bandura's self-efficacy research shows that believing you can act is itself protective. Research on social support and on meaning, including Viktor Frankl's, adds two more: people who have others to lean on, and a reason to keep going, recover better.",
      limits: "Resilience isn't the same as never struggling, and a low score here doesn't mean you'll break. It means some of your handholds are thinner than others, which is useful to know while things are calm.",
    },
    blurb: "Setbacks don't test character so much as reveal a pattern. This one finds yours before you need it. Eleven questions, about five minutes.",
    tint: "sage",
    dims: [{ key: "bounce", label: "Bounce-back speed" }, { key: "agency", label: "Belief you can act" }, { key: "connect", label: "People to lean on" }, { key: "meaning", label: "A reason to keep going" }, { key: "flex", label: "Finding plan B" }],
    items: [
      { id: "GB-B1", format: "L5", facet: "bounce", text: "I tend to bounce back quickly after hard times." },
      { id: "GB-A1", format: "L5", facet: "agency", text: "When something goes wrong, I believe I can do something about it." },
      { id: "GB-C1", format: "L5", facet: "connect", text: "There are people I could call at 3am." },
      { id: "GB-M1", format: "L5", facet: "meaning", text: "Even in bad stretches, I know what I'm doing it all for." },
      { id: "GB-F1", format: "L5", facet: "flex", text: "When plan A fails, I'm quick to find a plan B." },
      { id: "GB-B2", format: "L5", facet: "bounce", reverse: true, text: "It takes me a long time to get over setbacks." },
      { id: "GB-A2", format: "L5", facet: "agency", text: "I've come through hard things before, and I know it." },
      { id: "GB-C2", format: "L5", facet: "connect", reverse: true, text: "When I'm struggling, I tend to disappear from people." },
      { id: "GB-M2", format: "L5", facet: "meaning", text: "I can usually find something worth learning in a setback, eventually." },
      { id: "GB-F2", format: "L5", facet: "flex", reverse: true, text: "I keep trying the same approach even when it isn't working." },
      { id: "GB-PK1", format: "PK", text: "After a real knock, what usually gets you moving again?", options: [
        { text: "Doing something — anything", key: "agency" }, { text: "Other people", key: "connect" }, { text: "Remembering why it matters", key: "meaning" }, { text: "Time, mostly", key: "bounce" }] },
    ],
    read(r) {
      const d = r.dims, keys = ["agency", "connect", "meaning", "flex"];
      const order = ranked(d, keys), best = order[0], thin = order[order.length - 1];
      const N = { agency: "your belief that you can act", connect: "the people you can lean on", meaning: "knowing what it's all for", flex: "finding another way" };
      const bb = band(d.bounce);
      const headline = bb === "high" ? "You get back up quickly." : bb === "low" ? "Knocks stay with you a while, and you still get up." : "You get back up, in your own time.";
      const paras = [`Your first handhold is ${N[best]}. When things go wrong, that's what you'll reach for, and it's worth knowing so you can reach for it on purpose.`,
        `Your thinnest is ${N[thin]}. Worth building now, while things are calm, because it's much harder to build in the middle of a storm.`];
      const pick = (r.picks || {})["GB-PK1"];
      if (pick && pick !== best && N[pick]) paras.push(`You said ${N[pick]} is what gets you moving. Your answers suggest ${N[best]} may be doing more of the work than you realise.`);
      const tips = { agency: "Write down three hard things you've already come through. Keep the list somewhere you'll find it.", connect: "Message one person this week just to stay in touch. The 3am people are made in the ordinary weeks.", meaning: "Write one sentence about what you're doing all this for. Rewrite it until it's true.", flex: "Next time something stalls, force yourself to list three other ways in before trying again." };
      return { tag: bb === "high" ? "Quick to rise" : bb === "low" ? "Slow and sure" : "Steady", headline, bars: bars(this, r), paras, tryThis: tips[thin] };
    },
  },

  /* ---------------- Money ---------------- */
  money: {
    id: "money",
    subject: "money",
    name: "Money and you",
    kicker: "A short lens on money",
    from: "Grounded in wealth psychology",
    research: {
      what: "Financial psychologists Brad Klontz and Ted Klontz found that most people carry 'money scripts': beliefs about money, usually picked up in childhood, that run quietly in the background of every financial decision. Their research groups them into four families. Money avoidance (money is bad, or not for people like me), money worship (more would fix things), money status (net worth is self-worth), and money vigilance (be careful, be private, save). Each script is linked to predictable patterns of spending, saving and worry.",
      limits: "Scripts aren't right or wrong; each one protects you from something. This lens isn't financial advice, and it can't see your actual situation. It reads the beliefs, not the bank balance.",
    },
    blurb: "What money means to you, what it protects you from, and what that protection costs. Thirteen questions, about six minutes.",
    tint: "gold",
    dims: [{ key: "avoidance", label: "Money is suspect" }, { key: "worship", label: "More would fix it" }, { key: "status", label: "Worth is net worth" }, { key: "vigilance", label: "Guard it closely" }],
    items: [
      { id: "MN-A1", format: "L5", facet: "avoidance", text: "Deep down, I think people with a lot of money are a bit suspect." },
      { id: "MN-W1", format: "L5", facet: "worship", text: "More money would solve most of my problems." },
      { id: "MN-S1", format: "L5", facet: "status", text: "What I earn says something about what I'm worth." },
      { id: "MN-V1", format: "L5", facet: "vigilance", text: "I feel anxious if I don't have savings set aside." },
      { id: "MN-A2", format: "L5", facet: "avoidance", text: "I'd rather not look at my bank balance." },
      { id: "MN-W2", format: "L5", facet: "worship", text: "I'll never quite feel I have enough." },
      { id: "MN-S2", format: "L5", facet: "status", text: "I sometimes spend to show people I'm doing well." },
      { id: "MN-V2", format: "L5", facet: "vigilance", text: "Money isn't something to talk about, even with people close to me." },
      { id: "MN-A3", format: "L5", facet: "avoidance", text: "I feel uncomfortable having more than the people around me." },
      { id: "MN-W3", format: "L5", facet: "worship", reverse: true, text: "Past a certain point, more money doesn't make people happier." },
      { id: "MN-S3", format: "L5", facet: "status", text: "I'd be embarrassed if people knew my real financial position." },
      { id: "MN-V3", format: "L5", facet: "vigilance", text: "Spending on myself makes me uneasy, even when I can afford it." },
      { id: "MN-PK1", format: "PK", text: "Growing up, money was mostly…", options: [
        { text: "Tight, and talked about", key: "scarce" }, { text: "Tight, and never mentioned", key: "silent" },
        { text: "Comfortable, and not discussed", key: "comfort" }, { text: "A source of rows", key: "conflict" }] },
    ],
    read(r) {
      const order = ranked(r.dims, ["avoidance", "worship", "status", "vigilance"]), top = order[0];
      const S = {
        avoidance: ["The avoider", "Money feels a bit grubby to you, so you keep your distance from it.", "It protects you from feeling greedy, or from being the kind of person you've decided money makes people. It costs you in the unopened letters, the unchecked balance, and sometimes in turning down what you're worth."],
        worship: ["The seeker", "Somewhere in you is the belief that more would fix it.", "It protects you from having to look at what else might be wrong, and it keeps you striving. It costs you because the finish line moves: 'enough' tends to rise as you approach it."],
        status: ["The signaller", "Money is part of how you measure where you stand.", "It protects you from feeling less than the people around you, and it can be a powerful motivator. It costs you when spending becomes a performance, or when a bad year feels like a verdict on you rather than on the year."],
        vigilance: ["The guardian", "You watch money carefully and keep it private.", "It protects you from the fear of not having enough, and it's the script most linked to financial health. It costs you when careful becomes anxious, or when you can't enjoy what you've carefully built."],
      }[top];
      const past = { scarce: "You grew up with money tight and talked about. That tends to leave people either very careful or very determined never to feel it again.", silent: "You grew up with money tight and never mentioned. Silence around money is one of the commonest roots of avoidance: nobody showed you how to look at it.", comfort: "You grew up comfortable, with money rarely discussed. That can leave people surprisingly unsure of the basics, and quietly worried about keeping up.", conflict: "You grew up with money as a source of rows. That can make it feel dangerous to talk about, even now." }[(r.picks || {})["MN-PK1"]];
      return { tag: S[0], headline: S[1], bars: bars(this, r), paras: [S[2], ...(past ? [past] : [])],
        tryThis: top === "avoidance" ? "Look at your balance once a day for a week, without judging it. Just look." : top === "vigilance" ? "Spend a small, planned amount on something purely for pleasure, and notice what happens." : "Write down the number that would be enough. Then ask who told you it was that number." };
    },
  },

  enough: {
    id: "enough",
    subject: "money",
    name: "Enough",
    kicker: "A short lens on aspiration",
    from: "Grounded in research on aspiration and satisfaction",
    research: {
      what: "Several lines of research meet here. Barry Schwartz distinguished 'maximisers', who need the best option, from 'satisficers', who are content with good enough, and found satisficers tend to be happier. Philip Brickman's 'hedonic treadmill' describes how we adapt to gains and reset our expectations upwards. Leon Festinger's social comparison theory explains why other people's lives move our own finish line. Tim Kasser and Richard Ryan showed that goals built on growth, relationships and contribution are more satisfying than goals built on wealth, image and fame.",
      limits: "Ambition isn't the problem, and wanting more isn't wrong. This lens looks at whether your idea of 'enough' is yours, and whether it holds still long enough for you to reach it.",
    },
    blurb: "Everyone has a number. Almost nobody has asked themselves where theirs came from. Eleven questions, about five minutes.",
    tint: "gold",
    dims: [{ key: "maximise", label: "Needing the best" }, { key: "compare", label: "Measuring against others" }, { key: "treadmill", label: "A moving finish line" }, { key: "intrinsic", label: "Aims money can't count" }],
    items: [
      { id: "EN-M1", format: "L5", facet: "maximise", text: "I rarely settle for good enough; I want the best option." },
      { id: "EN-C1", format: "L5", facet: "compare", text: "I measure how I'm doing against people my age." },
      { id: "EN-T1", format: "L5", facet: "treadmill", text: "When I reach a goal, the satisfaction fades faster than I expected." },
      { id: "EN-I1", format: "L5", facet: "intrinsic", text: "What I'm aiming for is mostly about growth, closeness or contribution, not money or status." },
      { id: "EN-M2", format: "L5", facet: "maximise", text: "Even after I choose, I wonder what else was out there." },
      { id: "EN-C2", format: "L5", facet: "compare", text: "Other people's good news — promotions, houses, holidays — lands on me harder than I'd like." },
      { id: "EN-T2", format: "L5", facet: "treadmill", text: "My idea of 'enough' has gone up every time I've got close to it." },
      { id: "EN-I2", format: "L5", facet: "intrinsic", text: "I'd take a smaller life I love over a bigger one I don't." },
      { id: "EN-T3", format: "L5", facet: "treadmill", reverse: true, text: "There's a point at which I'd genuinely say: that's enough." },
      { id: "EN-I3", format: "L5", facet: "intrinsic", reverse: true, text: "Being admired matters a lot to me." },
      { id: "EN-PK1", format: "PK", text: "Your number — the amount that would feel like enough. Where did it come from?", options: [
        { text: "What my parents had, or didn't", key: "parents" }, { text: "What people around me have", key: "peers" },
        { text: "What would make me feel safe", key: "fear" }, { text: "What my plans actually cost", key: "plans" }, { text: "I honestly don't know", key: "unknown" }] },
    ],
    read(r) {
      const d = r.dims;
      const moving = ((d.treadmill || 0) + (d.compare || 0)) / 2;
      const headline = moving >= 60 ? "Your finish line moves." : moving <= 35 ? "You know what enough looks like." : "Your 'enough' mostly holds still, with the odd nudge.";
      const paras = [moving >= 60 ? "Each time you get close, it shifts, often because someone nearby has moved theirs. That's the treadmill most people are on without noticing, and it means satisfaction is always one more step away." : moving <= 35 ? "Other people's progress doesn't move you much, and when you reach a goal, it counts. That's less common than it should be, and it's a real source of contentment." : "You notice what others have, and your targets drift a bit, but not so much that you can't enjoy getting somewhere."];
      paras.push(band(d.intrinsic) === "high" ? "What you're aiming for is mostly made of things money can't count: growth, people, contribution. The research is clear that those goals satisfy more when you reach them." : band(d.intrinsic) === "low" ? "What you're aiming for leans towards things others can see: money, status, admiration. Nothing wrong with that, but the research suggests those goals satisfy less once you get there, so it's worth checking they're really yours." : "Your aims are a mix of things others can see and things only you can.");
      if (band(d.maximise) === "high") paras.push("You also tend to need the best option, not just a good one. Maximisers often get better results and enjoy them less.");
      const src = { parents: "Your number came from your parents, whether matching them or escaping them. Worth asking whether it fits the life you want, rather than the one you grew up in.", peers: "Your number came from the people around you. That's the one most likely to keep moving, because they keep moving too.", fear: "Your number is about safety. That's a sound instinct; the question is whether the number would ever actually feel safe enough.", plans: "Your number comes from what your plans actually cost. That's the most solid kind: it's anchored to something real.", unknown: "You don't know where your number came from. That's the honest answer most people don't give, and the best place to start." }[(r.picks || {})["EN-PK1"]];
      if (src) paras.push(src);
      return { tag: moving >= 60 ? "Moving line" : moving <= 35 ? "Fixed line" : "Mostly steady", headline, bars: bars(this, r), paras,
        tryThis: "Write down what 'enough' would actually look like — the house, the week, the people — not the number. Then price it." };
    },
  },

  /* ---------------- Purpose ---------------- */
  narrative: {
    id: "narrative",
    subject: "becoming",
    name: "The life you meant to build",
    kicker: "A short lens on your story",
    from: "Grounded in life-narrative research",
    research: {
      what: "Psychologist Dan McAdams argues that by early adulthood we all carry a 'narrative identity': an internal, evolving story of how we became who we are. His research, and Jonathan Adler's, finds the shape of that story matters. People who tell 'redemption' stories, where bad things lead somewhere good, tend to report more wellbeing and give more back. People who tell 'contamination' stories, where good things get spoiled, tend to struggle more. So do people who see themselves as a passenger, not the author, of their own lives.",
      limits: "Your story isn't your life; it's the version you tell. That's the hopeful part: stories can be retold. This lens reads the shape of yours today, not whether your life has gone well or badly.",
    },
    blurb: "The story you tell about how you got here, and what it's quietly deciding about where you go next. Eleven questions, about five minutes.",
    tint: "heather",
    dims: [{ key: "author", label: "Author of your story" }, { key: "redemption", label: "Hard things led somewhere" }, { key: "contamination", label: "Good things got spoiled" }, { key: "communion", label: "People at the centre" }, { key: "direction", label: "Knowing the next chapter" }],
    items: [
      { id: "LN-A1", format: "L5", facet: "author", text: "When I tell the story of my life, I'm the one making the key decisions in it." },
      { id: "LN-R1", format: "L5", facet: "redemption", text: "The hardest chapters of my life led somewhere good." },
      { id: "LN-X1", format: "L5", facet: "contamination", text: "Good things in my life have a way of being spoiled." },
      { id: "LN-C1", format: "L5", facet: "communion", text: "The people in my story matter more to me than the achievements." },
      { id: "LN-D1", format: "L5", facet: "direction", text: "I know what my next chapter is meant to be about." },
      { id: "LN-A2", format: "L5", facet: "author", reverse: true, text: "Most of my life has happened to me rather than because of me." },
      { id: "LN-R2", format: "L5", facet: "redemption", text: "I can see how a past failure made me who I am." },
      { id: "LN-X2", format: "L5", facet: "contamination", text: "There's a point in my life I think of as where things went wrong." },
      { id: "LN-C2", format: "L5", facet: "communion", text: "I've been shaped most by the people who stood by me." },
      { id: "LN-D2", format: "L5", facet: "direction", reverse: true, text: "If I'm honest, I'm drifting." },
      { id: "LN-PK1", format: "PK", text: "Which chapter are you in?", options: [
        { text: "A beginning", key: "beginning" }, { text: "The long middle", key: "middle" }, { text: "A turning point", key: "turning" },
        { text: "Rebuilding", key: "rebuilding" }, { text: "Harvest — reaping what I planted", key: "harvest" }] },
    ],
    read(r) {
      const d = r.dims;
      const arc = (d.redemption || 0) - (d.contamination || 0);
      const headline = arc >= 15 ? "Yours is a redemption story." : arc <= -15 ? "Your story has a shadow over it." : "Your story is still deciding what kind it is.";
      const paras = [arc >= 15 ? "When you look back, hard things tend to lead somewhere. That shape, bad turning into good, is the one the research most links to wellbeing and to wanting to give something back." : arc <= -15 ? "When you look back, good things have a way of being spoiled, or there's a point where it all went wrong. That's an understandable way to tell a hard story, and it can quietly decide that the next chapter will go the same way. Stories can be retold; it's often what good therapy does." : "Some chapters have turned good; some have been spoiled. You haven't settled on the shape yet, which means you still get to choose it."];
      paras.push(band(d.author) === "high" ? "You see yourself as the author, not a passenger. That's a strong predictor of taking the next chapter in hand." : band(d.author) === "low" ? "You tell it as though much of it happened to you. That may be true; it's also worth asking where you had more say than you're giving yourself credit for." : "You share the writing with circumstance: some of it's yours, some of it just happened.");
      paras.push(band(d.direction) === "high" ? "And you know what comes next, which is rarer than it should be." : band(d.direction) === "low" ? "What comes next is unclear right now. That's often the most honest place to start from." : "What comes next is partly written.");
      const ch = { beginning: "You said you're at a beginning.", middle: "You said you're in the long middle, the part stories skip and lives are mostly made of.", turning: "You said you're at a turning point. How you tell this chapter later will shape the next one.", rebuilding: "You said you're rebuilding. Redemption stories are written in chapters like this one.", harvest: "You said you're in harvest, reaping what you planted." }[(r.picks || {})["LN-PK1"]];
      if (ch) paras.push(ch);
      return { tag: arc >= 15 ? "Redemption" : arc <= -15 ? "Contamination" : "Unwritten", headline, bars: bars(this, r), paras,
        tryThis: "Write the story of your hardest year in five sentences. Then write it again, ending with what it gave you." };
    },
  },
};

/* Scoring. `friend` and `approach` keep the shapes results were first stored in,
   so nobody who took them before loses anything. Every other lens scores each
   dimension 0-100 from its items and keeps any picks as they were chosen. */
export function scoreMini(id, answers) {
  const m = MINIS[id];
  const val = (it) => { const idx = answers[it.id]; if (idx == null || typeof idx !== "number") return null; return (it.reverse ? 4 - idx : idx) + 1; };
  const mean = (pred) => { const vs = m.items.filter((i) => i.format === "L5" && pred(i)).map(val).filter((v) => v != null); return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null; };
  const to100 = (x) => x == null ? null : Math.round(((x - 1) / 4) * 100);
  if (id === "friend") {
    const give = to100(mean((i) => i.facet && i.facet.startsWith("give")));
    const need = to100(mean((i) => i.facet && i.facet.startsWith("need")));
    const fc = answers["FR-FC1"]; const needMost = fc === "a" ? "reliability" : fc === "b" ? "depth" : null;
    return { give, need, needMost, kind: "friend" };
  }
  if (id === "approach") {
    const app = to100(mean((i) => i.facet === "approach"));
    const avo = to100(mean((i) => i.facet === "avoid"));
    return { approach: app, avoid: avo, orientation: app == null ? null : (app >= avo ? "toward" : "away"), kind: "approach" };
  }
  const dims = Object.fromEntries(m.dims.map((d) => [d.key, to100(mean((i) => i.facet === d.key))]));
  const picks = Object.fromEntries(m.items.filter((i) => i.format === "PK" && answers[i.id] != null).map((i) => [i.id, answers[i.id]]));
  return { kind: id, dims, picks };
}

/* The words for a result. Null-safe, so a half-stored result never breaks a screen. */
export function readMini(id, result) {
  const m = MINIS[id];
  if (!m || !result) return null;
  if (result.dims && !Object.values(result.dims).some((v) => v != null)) return null;
  try { return m.read.call(m, result); } catch { return null; }
}
