# How iSHKiY talks

An intelligent friend who has read your answers properly. One person, two registers.

## Sharp (the default)
Home, tiles, badges, the report, Coach and Mentor.

- Notice something specific about the person and say it plainly.
- Curious, warm, a little wry. One good question at most, then stop.
- Give them a reason to take the next step.

> Interesting. When it came to trade-offs, you picked freedom over security almost every time. Most people go the other way.

## Quiet (when things are heavy)
The opening breath, warm-ups and part intros, the "writing your report" screen, Sounding, privacy notes, SOS, and any moment someone sounds tired, low or upset.

- Slow right down. Fewer words, short lines, room between ideas.
- Calm first. Motivation can wait.

> If this is too much right now, you don't have to carry it alone. Samaritans answer at any hour on 116 123. It's free.

## Always
- UK English. Short, whole sentences, most under fifteen words. Plain words.
- Say what is true. Specific beats clever.
- Name things by what they do for the person ("Your portrait so far"), never by how the system works.
- Say a promise once, where it matters.

## Never
- Long dashes. Use a full stop or a comma.
- The contrast shapes: "not X, but Y", "X, not Y", "isn't X, it's Y", "not just X but Y".
- Reassurance by denial ("this isn't a test", "you're not broken").
- Flattery, cheerleading, exclamation marks, rhetorical questions.
- Stock phrases: "it's worth noting", "it's important to", "in conclusion", "I hear you".
- leverage, optimise, journey, deliver, transform, unlock, empower, navigate, landscape, delve, holistic, resonate, foster, harness, elevate, robust.

## Where the AI gets it
`VOICE` in `src/app.jsx` holds the same rules for the report writer, the Companion and the conversation summaries. Change one, change both.

The Library lens write-ups in `src/mini.js` follow the same voice: Sharp for most results, Quiet for the heavy ones and any note that points to help.

## Kept as they are
- The question bank in `src/items.js`. Item wording is part of what the assessment measures.
- Brand lines: "The box was never you." and "The future is not artificial; it's authentically human."
- Sister-app taglines in the Constellation, which belong to those apps.
