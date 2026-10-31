# 01 — Conversation model

The imam's structure is modelled as a **dependency graph of points**, grouped into **stages**. The graph is data (stored in the DB, edited in the admin), not code.

## Concepts

### Point
One claim the user should come to agree with, e.g. "The universe had a beginning."

| Field | Meaning |
|---|---|
| `key` | Stable identifier, e.g. `universe_has_beginning` |
| `statement` | The claim, in user-facing language |
| `guidance` | For the AI: why this point matters, how the imam usually raises it |
| `agreement_criteria` | What counts as agreement for this point (see "Agreement" below) |
| `required` | Whether the stage needs this point agreed to be complete |
| `prerequisites` | Points that must be agreed before this one can be raised (AND) |
| `routes` | One or more argument routes (see below) |
| `sources`, `objections` | Links to the knowledge base (`03-knowledge-base.md`) |

### Prerequisites and groups
A point can be raised once all its prerequisites are agreed. Points that share the same prerequisites can be done **in any order**. That is how a "group of points" emerges, without a separate group concept.

```
[A] ──► [B] ──► [D]
   └──► [C] ──┘          B and C: any order. D needs both.
```

The graph must be acyclic. The admin editor rejects cycles.

### Routes
A point can have several argument routes (route A: from causality; route B: from personal experience). The director tries the primary route first and switches when the user stays unconvinced (see `02-engine.md`).

### Stage
A presentational grouping of points that maps to one story chapter and one 3D scene.

| Field | Meaning |
|---|---|
| `key`, `title`, `order` | Identification and ordering |
| `scene_key` | Which 3D scene/place belongs to it (`05-experience.md`) |
| `intro_guidance` | How the guide opens this chapter |

A stage is **complete** when all its required points are `agreed`. The next stage opens when its points' prerequisites are met. Stages are not gates on their own; the point prerequisites are.

### Entry points
The graph can have several roots for different audiences (OPEN C4). A conversation starts at one entry, chosen by an opening question or by the landing page the user came from.

## Point state (per conversation)

```
open ──► raised ──► agreed
                ├─► disagreed
                ├─► unsure
                └─► deferred
```

- `open`: not yet discussed.
- `raised`: the guide has put it on the table.
- `agreed` / `disagreed` / `unsure`: the user's position, set by the tracker.
- `deferred`: parked by the director (stuck, or the user wants to come back to it).
- A state can go **backwards**: a user who withdraws agreement moves `agreed → disagreed`. Points that depended on it are flagged for re-check, not reset.

Every state change records: the message that justifies it (evidence), the tracker's confidence, and the time.

## Agreement
OPEN (C2): what counts as agreement. Recommendation:
- **Explicit or clearly implied** agreement in the user's own words counts. "Yeah, sure" right after a long explanation counts only with high confidence plus a check question.
- **Partial agreement** ("yes, but…") is `unsure` plus a detected objection.
- **Agreeing just to move on** (repeated short answers, impatience) is detected as a signal; the guide checks once, then accepts and moves on, marking low confidence.
- Low-confidence agreement still unlocks prerequisites, but analytics separates high and low confidence.

## Firm disagreement
OPEN (C3): what to do when a foundation point is firmly disputed. Recommendation:
1. Handle the objection with the imam's answer.
2. Try the alternative route.
3. Park the point (`deferred`), say so openly, and continue with any points that don't depend on it.
4. If nothing remains available, wrap up warmly and leave the door open (offer to resume later, offer a human contact).

The guide never insists more than the configured number of attempts per point (default: 2 routes, 3 turns per route).

## Content versioning
The graph is versioned. A conversation is pinned to the graph version it started on. Editors publish a new version; new conversations use it, and running conversations finish on their own version. OPEN: migrate long-lived saved conversations to new versions? Recommendation: offer "start fresh" instead of migrating.

## Acceptance criteria
- The graph can express: a sequential chain, an any-order group, a point with two routes, and multiple entries.
- Given a set of point states, "available points" and "stage complete" are computed deterministically by code (unit-tested).
- Cycles are rejected on save.
