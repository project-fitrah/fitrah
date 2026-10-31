# 02 — Conversation engine

The engine runs in the FastAPI backend (`apps/backend`). Each user message goes through a fixed pipeline. Only the tracker and the guide are model calls; the director is plain code.

## Per-turn pipeline

```
user message
   │
   ├─► 1. Safety check ───────────┐ (parallel)
   ├─► 2. Tracker                 │
   │                              ▼
   └──────────────────────► 3. Director (code)
                                  │
                                  ▼
                           4. Retrieval
                                  │
                                  ▼
                           5. Guide (streams to the user)
                                  │
                                  ▼
                           6. Persist + events
```

### 1. Safety check
Classifies the user message (and the running session risk) for: distress/self-harm, signs of a minor, abuse, jailbreak/prompt injection. Per-turn classifiers miss jailbreaks that drift over many turns, so the engine keeps a **session-level risk score** that accumulates.

### 2. Tracker
Input: recent messages, the points currently `raised`, and the available points. Output (strict schema):

```json
{
  "point_updates": [{"point_key": "...", "state": "agreed", "confidence": 0.82, "evidence": "..."}],
  "signals": ["objection", "question", "off_topic", "hostile", "wants_to_stop", "impatient"],
  "objection": {"summary": "...", "point_key": "..."} ,
  "question": "..."
}
```

Output is validated against the schema. Invalid output → retry once → fall back to "no state change" (never crash the turn). This replaces `json.loads` on free text in the current `services/phase.py`.

### 3. Director
Deterministic code. Given point states, signals, safety result and turn counters, it chooses:
- the **focus point**, and
- a **mode**:

| Mode | When |
|---|---|
| `safety` | Safety check flags distress or a minor. Overrides everything |
| `answer_question` | The user asked a question. Answer briefly, then steer back |
| `handle_objection` | An objection was detected on a point |
| `alternative_route` | The point stayed `unsure`/`disagreed` after the configured turns on this route |
| `advance` | The focus point is agreed. Pick the next available point |
| `repair` | Agreement withdrawn, or the user seems confused |
| `park` | Stuck on all routes. Mark `deferred`, say so, continue elsewhere |
| `wrap_up` | End reached, nothing available, or the user wants to stop |

Off-topic handling: allow the configured number of off-topic turns (default 2), then steer back politely. OPEN (C10): how much space for free questions.

This replaces the linear gate and the forced advance after 6 turns in `services/phase.py`.

### 4. Retrieval
Retrieves for the focus point and mode:
- the imam's answers for the detected objection (vector search, filtered by point),
- good/bad example pairs for this point/mode (the existing `behavior_examples` idea),
- verified sources linked to the point.

Search uses one embedding of the user message (computed once per turn, reused).

### 5. Guide
Writes the reply and streams it to the user. The system prompt is assembled from: persona and tone guidelines, the mode, the focus point (statement, guidance, active route), retrieved answers, examples and sources.

Hard rules in the prompt, also checked by evals:
- At most one question per turn.
- Quote the Quran or hadith only from the provided sources, with their references. Otherwise paraphrase without quoting.
- Never claim to be human.
- Respect "no": in `wrap_up` mode, no further persuasion.

### 6. Persist and events
Save the user message, the guide reply, point-state changes with evidence, the mode, and which KB items were used (needed for `04-learning-loop.md`). Emit analytics events (`07-admin.md`). If a stage was completed, send a scene trigger to the frontend.

## Safety mode
When distress or self-harm signals appear, the guide drops the dawah goal: it responds with care and shows help resources (Belgium: Zelfmoordlijn 1813; international: a list per country). If signs point to a minor: no dawah, a short friendly message, end. OPEN (C9): exact policy for minors and vulnerable users; needs the imam's and a legal opinion.

## Models

All model access goes through **OpenRouter** (one OpenAI-compatible client, model per role in config), except where noted.

| Role | Candidate | Notes |
|---|---|---|
| Tracker | **Jev** (TypeSafe) | Schema-constrained "decision" model for classification/routing, low latency, cheap. Early access, vendor-only benchmarks, Dutch performance unknown, its own API. **Fallback:** a structured-output model via OpenRouter behind the same interface |
| Guide | Strong instruction-following model via OpenRouter | Pick through evals (`09-evals.md`) on Dutch, tone and rule-following |
| Safety | Llama Guard 4 or Qwen3Guard | Plus the session-level risk score |
| Embeddings | Via OpenRouter's embeddings endpoint | OPEN (T16): choose before writing migrations; the vector column size depends on it |

The model per role must be switchable by config only. No multi-provider factory: OpenRouter is the factory.

## Latency budget
Target: first guide token within 2.5 s at p50. Safety check and tracker run in parallel; the embedding is computed once. The guide streams via SSE.

## API

| Endpoint | Purpose |
|---|---|
| `POST /conversations` | Start a conversation (entry point, optional landing context). Returns the id |
| `POST /conversations/{id}/messages` | Send a user message. Response: SSE stream of guide tokens, then a final event with state (stage, scene trigger, completed points) |
| `GET /conversations/{id}` | History and current state, for resuming |
| `GET /health` | Existing |

Auth: Supabase JWT (anonymous or registered user), checked in the backend. The existing `/query` endpoint is replaced.

## Acceptance criteria
- An invalid tracker response never breaks a turn.
- The director is fully unit-tested on mode selection.
- Changing the model of a role needs only a config change.
- The guide's stream starts before persistence finishes.
