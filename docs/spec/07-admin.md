# 07 — Admin

`apps/admin`: the internal dashboard. It already has Supabase login, the recordings pipeline, and empty stubs for analytics, scholars and settings.

## Roles
| Role | Can |
|---|---|
| `admin` | Everything, including users and roles, settings |
| `editor` | Edit and approve KB content and the point graph; review conversations; use recordings |
| `analyst` | View dashboards and anonymised conversations; no editing |

## Pages
### Dawah funnel
- Funnel per stage: started → reached → completed.
- Per point: raised → agreed / disagreed / unsure / deferred, split by confidence.
- Drop-off: at which point and mode people quit.
- Filters: period, entry point, graph version, language.

### Objections
- Most frequent objections, with and without a matching KB answer.
- Per objection answer: agreement rate and drop-off after use (`04-learning-loop.md`).

### Conversations
- A list with filters (stage reached, ended how, flagged by safety).
- A viewer: the messages with a state timeline (which point changed when, the mode per turn, the KB items used).
- Personal details hidden by default.
- Actions: flag, promote a reply to an example pair.

### Knowledge base and graph editor
- A visual graph of points and prerequisites per stage (drag to connect, cycle check).
- Editing points, routes, objections, example pairs, sources, persona/tone.
- Draft → approve flow, publishing a graph version.

### Recordings
Existing: record, transcribe, structure. Extended: "propose KB items" from a structured transcript (`03-knowledge-base.md`).

### Visitors
Visits, sources (referrers, landing pages), devices; 3D vs text-only usage.

### Settings
Models per role, limits (turns per route, off-topic turns), budget caps, retention period.

## Analytics events
Stored in Supabase (a single `events` table), written by the backend.

| Event | Data |
|---|---|
| `conversation_started` | entry point, landing page, device class, 3D or text-only |
| `stage_entered` / `stage_completed` | stage |
| `point_state_changed` | point, from, to, confidence |
| `objection_detected` | point, matched KB objection or none |
| `mode_selected` | mode, point |
| `safety_triggered` | type (no content) |
| `account_linked` | — |
| `conversation_ended` | how (wrap-up, user stopped, timeout/abandoned), last point and stage |

Abandonment: a conversation without messages for OPEN period (recommendation: 30 min) is marked abandoned at its last point.

## Acceptance criteria
- An editor can build a small graph (3 points, an any-order pair, one dependency) and publish it.
- The funnel shows drop-off per point for a given period.
- Analysts cannot edit content.
