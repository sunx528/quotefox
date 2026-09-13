# Decision Log — Quotefox

## 1. Opportunity selection (2026-09-13)
**Decision:** Build an interactive quote-builder / lead-qualification funnel SaaS for home-service trades (roofing, plumbing, electrical, HVAC, painting, landscaping, cleaning, pest control, moving, renovation, garages, photography), branded **Quotefox**.

**Alternatives considered:** 10 opportunities scored (see research below): Postiz-style social scheduler, Cometly-style marketing attribution, 1Lookup-style validation API, Comp AI-style compliance automation, Warm-Inboxes-style email warmup/outbound, AEO-Engine-style AI-search optimization, PROSP-style LinkedIn outreach, Aplano-style workforce scheduling, Kibu-style I/DD healthcare EHR.

**Weighted scores (0-10):**
| Rank | Opportunity | Score |
|---|---|---|
| 1 | Interactive quote/lead-qual funnel (home services) | 8.17 |
| 2 | Email warmup / outbound alt | 5.89 |
| 3 | SaaS marketing attribution alt | 5.82 |
| 4 | Social scheduler alt | 5.68 |
| 5 | Workforce scheduling alt | 5.34 |
| 6 | AI answer-engine optimization alt | 5.19 |
| 7 | LinkedIn outreach automation alt | 5.09 |
| 8 | Phone/email validation API alt | 5.08 |
| 9 | Compliance automation alt | 4.94 |
| 10 | I/DD healthcare EHR alt | 4.83 |

**Reason:** The quote/lead-qual funnel wins on the criteria that matter most for a small team building autonomously right now: it needs no licensed data feeds (unlike validation APIs), no HIPAA/SOC2 liability (unlike Kibu/Comp AI clones), no platform-ToS ban risk (unlike LinkedIn-automation or email-warmup clones), and it competes in a category with no dominant vertical-specific incumbent (Outgrow/Involve.me/Interact are horizontal and expensive; Roofle/Roofr are roofing-only and priced at $350+/mo with setup fees). Demand and pain evidence are unusually strong and *primary*: contractors already pay $50-120 per shared lead on Angi/Thumbtack with well-documented complaints about lead quality (FTC $7.2M settlement, SF DA $6.82M settlement, Angi Services $2.95M settlement — all for false lead-quality/earnings claims), which makes "$49-249/mo for a self-owned qualification funnel that never resells your lead" an easy ROI story. Technical complexity is the lowest of any finalist (conditional forms + a pricing engine + lead CRM — no ML, no data licensing, no regulated data), which matters because the mandate is to ship a genuinely complete, working product in this session, not a research memo.

**Runner-up rejections:**
- Email warmup/outbound (#2): real pain evidence, but the entire category carries platform-policy risk (Gmail/Outlook anti-spam crackdowns can invalidate the product overnight) and thin technical differentiation from 5+ direct competitors.
- Marketing attribution (#3): strong revenue comp (Cometly, Stripe-verified $214k MRR) but technically the hardest build (server-side tracking, ad-platform API integrations, identity stitching) and crowded against well-funded incumbents (Triple Whale, Hyros).
- The mandatory candidate (quote/lead-qual) was evaluated on identical criteria to the other 9, not given a bye — it won on the numbers, not by mandate.

## 2. Stack (2026-09-13)
**Decision:** Next.js 16 (App Router) + TypeScript + Tailwind v4, Prisma ORM, self-rolled session-cookie auth (no Clerk/Supabase account needed — no credentials available in this environment), Stripe (test mode), Resend (email, degrades to console-log when no API key is configured), SQLite for local dev via Prisma (schema written to be trivially portable to Postgres — see README) since Docker/Postgres are not installed on this machine.

**Why not Supabase/Clerk as literally specified in the default stack:** Both require creating an external account, which is a "prohibited without user action" step in this environment. The app is built so swapping `DATABASE_URL` to a Postgres/Supabase connection string and running `prisma migrate deploy` is the entire migration — no code changes.

**Why SQLite for dev, not Docker Postgres:** Docker is not installed on this machine and I cannot install system-level software without the user's explicit action. SQLite is a real relational database with real constraints/foreign keys/persistence — it satisfies "no fake databases" for local development and testing; production deploy targets Postgres.

## 3. UI localized to French (2026-09-13)
All user-facing text — marketing site, auth pages, dashboard, funnel builder, the public funnel widget,
transactional emails, and the six default trade templates' content — was translated to French at the
user's request. Enum values stored in the database (question types, lead/funnel status, plan names, etc.)
were deliberately left in English so the schema and business logic stay language-independent; a new
mapping layer (`src/lib/labels.ts`) translates them to French only at render time. Two real bugs were
caught and fixed during this pass: (1) the lead-capture heuristic in the public submit route matched the
English substring "name" to find which answer was the visitor's name — broadened to also match the
French "nom" (word-boundary, to avoid false-positives like "nombre"); (2) visitor-supplied text going into
notification emails was already HTML-escaped from an earlier security pass, verified still correct after
the templates changed. Demo/seed data (business name, funnel name) was also translated since it renders
directly in the UI; developer-facing console output (seed script logs, code comments) was left in English
as it is tooling output, not product interface.

## 4. Gap-closing additions during the build (2026-09-13)
Two features were added after the initial MVP pass because leaving them out would have meant either
advertising something that didn't work or shipping auth that a real user would immediately get stuck on:
- **Password reset.** The MVP scope in PRODUCT_SPEC.md originally covered only signup/login/logout. A
  real user *will* forget their password, so this was added: single-use, hashed, 1-hour-expiry tokens;
  resetting a password invalidates every existing session for that account; the "does this email exist"
  response is identical whether or not the account is real, to avoid email enumeration.
- **Outbound webhooks.** The Business plan's pricing card advertised "webhooks" as a feature before any
  webhook code existed — that would have been exactly the kind of fake/advertised-but-missing
  functionality this build is not supposed to ship. Implemented: one webhook URL per org, HMAC-SHA256
  signed payload (`X-Quotefox-Signature` header, verified independently during testing — see README),
  delivery logged to a `WebhookDelivery` table visible in the billing UI. Explicit scope limit: a single
  delivery attempt, no retry queue — documented in the README as a known limitation for a multi-instance
  production deployment.

## 5. Auth (2026-09-13)
**Decision:** Custom email/password auth (bcrypt hashing, signed session cookies via `jose`/HS256, httpOnly+secure+sameSite cookies) rather than NextAuth or Clerk.
**Why:** No OAuth app / Clerk account exists yet, and standing up one requires the user's own account creation (prohibited for me to do on their behalf). A self-rolled implementation needs zero external accounts and is still production-appropriate (industry-standard hashing + signed sessions), with server-side authorization checks on every mutation.
