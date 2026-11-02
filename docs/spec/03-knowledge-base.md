# 03 — Knowledge base

The knowledge base (KB) holds everything the guide knows from the imam. It lives in Supabase and is edited in the admin (`07-admin.md`). `docs/logic_flows/` holds narrative methodology and the first drafts during capture.

## Content types

| Type | Content | Linked to |
|---|---|---|
| Point graph | Points, prerequisites, routes, stages (`01-conversation-model.md`) | — |
| Objection | A recurring objection, a few example phrasings, the imam's answer (guidance, not a script) | One or more points |
| Example pair | User message + good reply + optional bad reply + reason (the existing `behavior_examples`) | Point and/or mode |
| Source | Quran verse or hadith with exact reference, Arabic text, approved translation(s) | Points, objections |
| Persona and tone | How the guide speaks: register, warmth, length, words to avoid | Global |

Objections, example pairs and sources are embedded for vector search.

## Capturing the imam's know-how
The biggest gap in the project is that the structure isn't captured yet (OPEN C1). Proposed process, using what already exists:

1. **Workshop** with the imam: walk through 3–5 real conversations he remembers. Draw the points and their order on paper.
2. **Recordings**: the imam records explanations and answers with the existing admin recorder (Deepgram transcription → Claude structuring into Markdown, currently `apps/admin/app/api/recordings`, moving to the single app's admin).
3. **AI proposes**: from a structured transcript, an AI drafts points, objections and example pairs.
4. **Editor approves**: nothing reaches the live KB without approval by the imam or an assigned editor.
5. Start with **one stage**, run evals, then expand.

## Sources and theological accuracy
OPEN (C8):
- Who approves content? Recommendation: the imam, or editors he appoints. Every KB item has an `approved_by` and `approved_at`.
- Which translations count as verified (Dutch and other languages)?
- Which stance on contested topics, and which madhhab where relevant?

Rule for the guide: quotes come from `Source` items only (see `02-engine.md`). Sources are entered with a reference and checked by an editor; the AI never creates a source item on its own.

## Versioning
KB items have a status: `draft → approved → archived`. The point graph is published as a version (`01-conversation-model.md`). Objections, examples and sources are used live once approved; the usage log (`04-learning-loop.md`) records which version of an item was used.

## Language
OPEN (C6): Dutch only, or multilingual? Recommendation: Dutch first. Model the content with a `language` field from the start so translations can be added per item later.

## Acceptance criteria
- An editor can create a point, link an objection with the imam's answer, and attach a source, without a deploy.
- Only approved items are retrieved by the engine.
- Each retrieved item can be traced back to its approver.
