# Quotefox

Instant quote / lead-qualification funnels for home service businesses (roofing, plumbing, electrical,
HVAC, painting, landscaping, cleaning, pest control, moving, renovation, garage doors, photography).

Visitors answer a short branching quiz, see a server-computed price estimate, and leave their contact
info — the submission lands as a priced, qualified lead in the business's dashboard. See
[PRODUCT_SPEC.md](./PRODUCT_SPEC.md) for the full product spec and [DECISIONS.md](./DECISIONS.md) for
why this product and this stack were chosen over the alternatives that were researched.

## Stack

- **Framework:** Next.js 16 (App Router, Server Actions + Route Handlers), React 19, TypeScript
- **Styling:** Tailwind CSS v4, hand-rolled UI primitives (`src/components/ui`)
- **Database:** Prisma ORM. SQLite locally (no Docker/Postgres required for development); PostgreSQL in
  production (Supabase, Neon, RDS, etc. — the schema needs zero changes, only the provider/URL)
- **Auth:** Self-rolled email/password auth — bcrypt password hashing, opaque random session tokens
  hashed with SHA-256 before storage, httpOnly/secure/sameSite cookies, plus a real password-reset flow
  (single-use hashed tokens, 1-hour expiry, all sessions revoked on reset). No external auth provider
  account is required to run this project.
- **Billing:** Stripe Checkout + Billing Portal + webhooks (test mode until you add live keys)
- **Email:** Resend (falls back to structured console logging — never a fake "sent" state — when
  `RESEND_API_KEY` is unset)
- **Charts:** Recharts
- **Tests:** Vitest (unit tests for the pricing/conditional-logic engine, the one piece of business logic
  with the highest cost of a silent bug)

## Local setup

```bash
npm install
cp .env.example .env   # then fill in what you have; see "Environment variables" below
npx prisma migrate dev --name init   # creates prisma/dev.db and applies the schema
npm run db:seed                      # optional: creates a demo account + funnel + leads
npm run dev
```

Open http://localhost:3000. Log in with the seeded demo account: `demo@quotefox.example` /
`quotefox-demo` (or sign up fresh at `/signup`).

## Environment variables

See `.env.example` for the full list with comments. Nothing beyond `DATABASE_URL` is required to run the
app locally — Stripe and Resend are optional in development and degrade gracefully (billing shows a "not
configured" notice; email logs to the console instead of sending). Sessions are opaque random tokens
hashed with SHA-256 before being stored, so there's no separate signing secret to manage.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | `file:./dev.db` locally; a Postgres connection string in production |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For billing | From the Stripe Dashboard (test mode keys while developing) |
| `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_BUSINESS_MONTHLY` | For billing | Price IDs for the two paid plans |
| `RESEND_API_KEY` / `EMAIL_FROM` | For real email delivery | Leave blank in dev |
| `NEXT_PUBLIC_APP_URL` | Yes | Used in embed snippets, email links, Stripe redirect URLs |

## Database

Schema: [prisma/schema.prisma](./prisma/schema.prisma). Key models: `Organization`, `User`, `Session`,
`Funnel`, `Question`, `LogicRule`, `PricingRule`, `Lead`, `LeadAnswer`, `UploadedFile`,
`AnalyticsEvent`, `Subscription`, `WebhookEvent`.

SQLite has no native enum type, so enum-like fields (question type, lead status, plan, etc.) are plain
strings validated by Zod schemas in [src/lib/enums.ts](./src/lib/enums.ts) — this also means the schema
is identical on Postgres, so moving providers is a one-line change plus re-running migrations.

**Moving to production Postgres:**
1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
2. Point `DATABASE_URL` at your Postgres instance.
3. Run `npx prisma migrate dev --name init` (or `migrate deploy` in CI/CD) against the new database.

**Seeding:** `npm run db:seed` creates one fictional demo organization ("Riverside Roofing Co. (demo)"),
one user, one published roofing funnel with real conditional-logic-ready questions and pricing rules,
and a few sample leads. It refuses to run twice (checks for the demo email first) and is meant for local
development only — never run it against a production database.

## Development commands

```bash
npm run dev      # start the dev server (Turbopack)
npm run build    # production build (also runs TypeScript's type checker)
npm run start    # run the production build
npm run lint     # ESLint
npm test         # Vitest — the funnel pricing/conditional-logic engine unit tests
npm run db:seed  # seed demo data (see above)
```

## Testing

`src/lib/funnel-engine.ts` is the deterministic core of the product — conditional question visibility
and price computation — and is covered by unit tests in `src/lib/__tests__/funnel-engine.test.ts`
(visibility with AND/OR conditions, a rule referencing a deleted question, required-field validation,
email format validation, and all three pricing modifier types including the negative-price floor).
This same file runs on both the client (for instant UI feedback while a visitor fills out a funnel) and
the server (`src/app/api/funnels/[slug]/submit/route.ts`, which recomputes everything from scratch and
never trusts a price sent by the browser).

Manual QA performed during development (see the session's testing pass): full public funnel completion
end-to-end (intro → 8 branching questions incl. a file upload and a validation error → price review →
submit → lead appears in the dashboard with the exact expected price), analytics event counts, the
funnel builder's Logic and Pricing tabs, tenant-isolation checks (a second signed-up account sees zero
of the first account's funnels/leads), and an IDOR check (requesting another organization's funnel by ID
returns a 404, not the data).

## Billing (Stripe)

1. Create two recurring Prices in the Stripe Dashboard (test mode to start) — Pro and Business — and put
   their IDs in `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_BUSINESS_MONTHLY`.
2. Put your secret key in `STRIPE_SECRET_KEY` and publishable key in
   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Add a webhook endpoint pointing at `POST /api/webhooks/stripe` listening for at least
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and
   `invoice.payment_failed`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. For local testing, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.

Stripe webhook state is the single source of truth for plan/status (`src/app/api/webhooks/stripe/route.ts`)
— the app never trusts client-reported subscription state, and webhook events are deduplicated via the
`WebhookEvent` table (Stripe's event `id` is the primary key) so a redelivered event is a no-op.

## Email (Resend)

Set `RESEND_API_KEY` and `EMAIL_FROM` to send real lead-notification and lead-confirmation emails. With
no key set, the app logs what it would have sent (`[email:not-configured] …`) and returns a normal
response — it never shows a fake "email sent" success state to a user.

## Webhooks (outbound)

Business-plan organizations can configure one webhook URL from **Dashboard → Billing**. Every new lead
triggers a `lead.created` POST with an HMAC-SHA256 signature (of the raw JSON body, using a per-org
secret shown in that same settings panel) in the `X-Quotefox-Signature` header — verify it the same way
Stripe's own webhook signatures are verified. Delivery is a single attempt (success/failure logged to the
`WebhookDelivery` table and shown in the UI) — there is no retry queue; add one (e.g. a background job
with exponential backoff) before relying on this for a receiver that needs guaranteed delivery.

## File uploads

Stored on local disk under `storage/uploads/` in development (git-ignored), served through
`/api/uploads/[id]` which checks the requesting user's organization against the lead the file belongs to
before returning it. Files are validated by size (10MB max), declared MIME type, and — for JPEG/PNG/WebP/
PDF — real magic-byte sniffing so a relabeled file is rejected. In production, swap the two functions in
`src/lib/storage.ts` for an S3-compatible SDK call; nothing else needs to change.

## Deployment (Vercel)

1. Push to a Git repository and import it into Vercel (or your platform of choice).
2. Provision a Postgres database (Vercel Postgres, Supabase, Neon, etc.) and switch the Prisma provider
   as described above.
3. Set all the environment variables from `.env.example` in the platform's dashboard.
4. Run `npx prisma migrate deploy` against the production database (as a build step or manually).
5. Point the Stripe webhook at your production URL.

## Known limitations / required external actions before real customers can pay

- **No Postgres/Docker in the build environment** — the app runs on SQLite locally; production needs a
  real Postgres instance (see "Moving to production Postgres" above). The schema and migrations are
  already Postgres-compatible.
- **No git available in the build environment** — this project is not yet a git repository. Run `git
  init` and commit before pushing anywhere.
- **Stripe is not configured with real keys** — billing UI and webhook handler are fully implemented and
  will work the moment real (or Stripe CLI test-mode) keys are supplied; see "Billing" above.
- **Resend is not configured** — email sending code is complete; add `RESEND_API_KEY` to send real email.
- **Legal pages are placeholders** — `/legal/privacy` and `/legal/terms` are clearly marked
  placeholders and must be replaced with lawyer-reviewed policies before accepting real customer data or
  payments.
- **In-memory rate limiting** — `src/lib/rate-limit.ts` is sufficient for a single server instance; a
  multi-instance deployment should swap it for a shared store (e.g. Upstash Redis) — the two call sites
  are isolated to the public submit/event routes.
- **`npm audit` flags 3 high-severity advisories** in a transitive dependency of the `prisma` CLI package
  (`deepmerge-ts`, via `@prisma/config`). This affects only the build-time CLI (migrations/codegen), not
  the `@prisma/client` runtime bundled into the deployed app — but re-run `npm audit` before shipping and
  upgrade once a patched `prisma` release is available.
