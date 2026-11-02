# 05 — Experience (web)

The public site, in the single Next.js app (`08-architecture.md`). All user-facing text is Dutch (OPEN C6 for other languages).

## Flow
1. **Landing**: a short invitation, honest about what this is (an AI guide built on the knowledge of an imam). Optionally an entry question, or a landing page per question that opens the conversation at the right entry.
2. **Consent**: before the first message, explicit consent for processing the conversation (`06-accounts-privacy.md`).
3. **Conversation**: the guide opens. Chat in the foreground, the 3D scene behind/around it.
4. **Chapters**: when a stage completes, the scene transitions to the next place.
5. **Save**: after a few turns, the guide or the UI offers to save the conversation by creating an account.
6. **End**: a warm close and the handoff (OPEN C5): a contact with the imam or a mosque, resources, the option to come back.

## Chat
- Streaming replies from `/api/conversations/[id]/messages`. The existing dialogue chunking and zustand store (`apps/web/stores/joe-chat-store.ts`, `apps/web/lib/dialogue-chunks.ts`) are the starting point. The placeholder `/api/chat` is removed.
- A subtle progress indicator per chapter (no score, no "conversion bar").
- Always visible: who/what is talking (an AI), a way to stop, and a link to privacy.

## 3D and story
- Every stage has a **place** (`scene_key`). The environment tells the story: what changes as the user progresses (light, openness, landscape) reflects the chapter.
- The existing scene (space, platform, the "Joe" character, first-person walking, cinematic camera; `components/world-experience.tsx`) is the base.
- Scenes load lazily per stage. Budget per scene: OPEN, recommendation ≤ 3 MB compressed GLB and 60 fps on a mid-range phone.
- **Text-only / low-power mode** is required: automatic on weak devices and selectable by the user. The conversation must work fully without 3D.

OPEN (C12): the narrative arc and which place belongs to which stage. Needs a story designer (or the team plus the imam).

## The guide's representation
OPEN (C7): a human character (like the existing "Joe") or an abstract presence (light, a voice-like visual)? Ask the imam about depicting animate beings, and decide whether the guide speaks as the imam, as "an AI guide", or as a character. Recommendation: an abstract presence, which avoids the question of depiction and the uncanny-valley risk, and is cheaper to produce.

## 3D production without an artist
- Stylised or abstract environments (light, particles, shaders, low-poly) rather than realistic ones.
- CC0 libraries: Poly Haven, Kenney, Quaternius.
- AI generation: Meshy 6 (text → mesh, auto-rig, GLB export), Hunyuan 3.1 and TRELLIS 2 (open, rig-friendly geometry), Tripo. Then Mixamo or AccuRig for rigging and animations. Expect 2–3 iterations per asset and manual cleanup.
- GPT-6 Astra: reported (Sept 2026) to drive Blender to build scenes rather than generate meshes directly, with limited access. Usable as an assistant; don't depend on it.

## Acceptance criteria
- A conversation can be completed start to finish in text-only mode.
- A stage completion triggers a scene transition within 1 s of the final stream event.
- First load on mobile (without 3D assets) under 2 s on 4G.
