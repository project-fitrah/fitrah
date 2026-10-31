# 04 — Learning loop

The system improves through measurement and human curation, not through automatic self-training.

## What is logged per guide reply
- Conversation, turn, stage, focus point, mode.
- Which KB items were retrieved and given to the guide (objection answers, example pairs, sources), with their versions.
- The outcome over the next turns:
  - point state change (`unsure → agreed`, `raised → disagreed`, …),
  - the user continued, or quit within the next N turns,
  - a new objection appeared.

## Measures
| Measure | Per |
|---|---|
| Agreement rate after use | Objection answer, example pair, route |
| Drop-off rate after use | Same |
| Turns to agreement | Point, route |
| Unanswered objections | Objections detected by the tracker that had no good KB match |

## The loop
1. The dashboard shows the best and worst performing answers and routes, plus the most frequent unanswered objections.
2. An editor reviews the underlying conversations (anonymised).
3. The editor can:
   - promote a strong reply from a real conversation to a new example pair,
   - rewrite or archive a weak answer,
   - add a new objection with the imam's answer.
4. The new content is used from then on, and its performance becomes visible in turn.

## Why not automatic
Optimising directly for "agreement" can reward manipulative replies. Every change in what the guide says goes past a human. OPEN (C11): what defines a "good" answer. Recommendation: agreement rate **and** low drop-off, never agreement alone; review a sample regularly for tone.

Later, at most: an A/B choice between two approved routes for the same point (a bandit), only between options an editor approved.

## Acceptance criteria
- For any guide reply, the KB items used can be retrieved.
- The dashboard can rank objection answers by agreement rate and drop-off.
- Unanswered objections are listed with frequency.
