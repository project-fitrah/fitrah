# 00 — Vision

## Goal
Fitrah automates dawah. An experienced imam has found a recurring structure in his in-person conversations: a sequence of points that invite people to reflect on their beliefs and, ultimately, invite them to Islam. Fitrah captures that structure and lets an AI guide run it with many people worldwide.

## What makes it different
- **The AI leads.** It is not a passive assistant. It asks questions, steers the conversation, and stays on point.
- **The conversation is a story.** Progress through the conversation moves the user through a 3D environment, with environmental storytelling per chapter.
- **Structured, not improvised.** A conversation model (see `01-conversation-model.md`) tracks which points were raised, agreed or disputed. The AI works through that model instead of free-chatting.
- **Grounded in the imam's know-how.** Answers to recurring objections come from the imam's knowledge base via RAG (see `03-knowledge-base.md`).
- **Improves over time.** Every reply is measured against its outcome, and editors promote what works (see `04-learning-loop.md`).

## Users
| User | Needs |
|---|---|
| Visitor | Start without friction, have an honest, thoughtful conversation, optionally save and resume it |
| Editor (the imam, scholars) | Capture and maintain points, objections, answers and sources; review conversations |
| Analyst/admin | See where people agree, disagree and quit; see which answers work |

OPEN (C4): target audience and entry points. Atheists, Christians, agnostics, people from a Muslim background? Recommendation: start with one audience (the imam's most common conversation partner) and one entry point; add entries later as new roots in the graph.

## Principles
1. **Honest.** The guide always presents itself as an AI. The site is open about its goal.
2. **Invite, don't pressure.** No manipulation, no false urgency, no exploiting vulnerability. A user can always stop, and the guide respects a "no".
3. **Only verified sources.** The guide quotes the Quran or hadith only from sources in the knowledge base, never from model memory.
4. **Safety first.** Distress, crisis or a minor in the conversation overrides the dawah goal (see `02-engine.md`, safety mode).
5. **Content lives in data, not code.** Points, objections, tone and sources are editable by editors without a deploy.
6. **Privacy by design.** Conversations reveal religious beliefs, which is special category data under GDPR (see `06-accounts-privacy.md`).

## Success metrics
- Share of conversations that reach each stage (funnel).
- Agreement rate per point; most common disagreement points.
- Drop-off point distribution.
- Number of conversations reaching the end goal (OPEN C5, see below).
- Returning users and resumed conversations.
- Zero invented sources in evals and in sampled real conversations.

OPEN (C5): end goal of a conversation. Shahada? An invitation to contact the imam or a local mosque? Recommendation: the end state is a **human handoff** (contact form, the imam, or a partner mosque by region), never a "conversion" counted by the AI alone.

## Non-goals (for now)
- A general Islamic Q&A chatbot.
- Fatwas or religious rulings on personal matters.
- Voice conversations.
- Native mobile apps.

## Outside the code
OPEN (C13): **reach.** Needs an owner. Candidate channels: SEO landing pages per question ("Does God exist?") that open a conversation at the right point, short clips from the imam, partnerships with mosques and dawah organisations, sharable moments from a conversation (opt-in, anonymised).
