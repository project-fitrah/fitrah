# 06 — Accounts and privacy

## Accounts
- **Supabase Auth** for everyone.
- Visitors start with an **anonymous session** (Supabase anonymous sign-in). No sign-up needed to talk.
- To save and resume, the user links the anonymous session to an account (email magic link, or OAuth). The conversation moves with it.
- A user can list, resume and delete their conversations.
- Admin users are Supabase users with a role (`07-admin.md`). The current email allowlist (`ADMIN_EMAIL_ALLOWLIST`) and the static `x-admin-key` in the backend are replaced by roles.

## Privacy (GDPR)
A conversation about faith reveals religious or philosophical beliefs: **special category data (GDPR Art. 9)**. The team is in Belgium, so GDPR applies fully.

Requirements:
- **Explicit consent** before the first message, with a clear explanation of what is stored and why.
- **Data minimisation**: no name or email needed to talk. IP addresses are not stored with conversations (use only for rate limiting, in memory).
- **Retention**: anonymous conversations are deleted after OPEN period (recommendation: 90 days). Saved conversations are kept until the user deletes them or the account.
- **Rights**: export and delete, self-service.
- **Analytics** use pseudonymous ids; the admin conversation viewer hides personal details by default.
- **Processors**: Supabase, OpenRouter (and the providers it routes to), TypeSafe (Jev) if used, Railway, Deepgram (recordings). Each needs a DPA. Configure OpenRouter's provider routing and data policies so only providers that don't train on or retain data are used. OPEN (T10): data residency (EU-only?).
- **Imam recordings and transcripts** are sensitive too: access restricted to editors.
- A privacy policy in Dutch. OPEN: legal review (the university or a privacy lawyer).

## Minors
OPEN (C9): age gate, and what to do with a detected minor. Recommendation: a minimum age of 18, confirmed at consent. That is stricter than Belgium's age of digital consent (13), because the site's goal is religious persuasion. If the safety check signals a minor anyway, end politely (`02-engine.md`).

## Acceptance criteria
- A visitor can talk without an account, then save the conversation by signing up, without losing it.
- A user can export and delete all their data.
- RLS: a user can read only their own conversations; editors and analysts only via their role.
