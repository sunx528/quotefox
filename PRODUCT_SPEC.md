# Quotefox — Product Specification

## 1. Market
Local home-service businesses (roofing, plumbing, electrical, HVAC, painting, landscaping, cleaning, pest control, moving, renovation, garage doors, photography) that get inbound web traffic but convert it poorly because their only "get a quote" option is a plain contact form or a phone number.

## 2. ICP
A 1-20 person home-service business owner or their office manager, already spending money on Google/Facebook ads or SEO, currently either (a) paying $50-120/lead to Angi/Thumbtack/HomeAdvisor for shared, often-unresponsive leads, or (b) losing website visitors to a static contact form with no qualification.

## 3. Problem
Visitors who want a price won't call, and won't fill out a name/email/phone form with no immediate payoff. Businesses that buy leads from marketplaces get low-intent, shared, and disputed-quality leads at high cost (evidenced by FTC's $7.2M and San Francisco DA's $6.82M settlements against HomeAdvisor/Angi over lead-quality and earnings misrepresentation, and an additional $2.95M Angi Services settlement — see research). Businesses that build a static contact form get low completion rates and no automatic price framing.

## 4. Customer
Same as ICP. Buyer is usually the owner; user is the owner or office admin who reviews leads daily.

## 5. Existing alternatives
- Marketplaces: Angi, Thumbtack, HomeAdvisor — pay-per-shared-lead, quality complaints well documented.
- Horizontal quiz/funnel builders: Outgrow, Involve.me, Interact, Heyflow, ConvertCalculator — not trade-specific, steep pricing tiers, generic templates.
- Vertical instant-quote tools: Roofle/RoofQuote PRO ($350/mo + $2,000 setup, roofing-only), Roofr (per-report fees stack up) — narrow (single trade), and don't include lead CRM.
- Static contact forms / phone numbers — the default "alternative" for most small contractors today, and the weakest.

## 6. Market gap
No product combines: (a) trade-agnostic templates covering the ~12 target trades, (b) database-backed conditional logic anyone can configure without code, (c) a deterministic server-validated pricing engine, (d) a built-in lightweight lead CRM, and (e) a flat, transparent monthly price well below both the horizontal tools' top tiers and a single Angi lead.

## 7. Positioning
"The quote funnel that pays for itself with one job." A self-owned, embeddable, branded quote wizard that qualifies traffic into priced, ready-to-close leads — instead of paying $50-120 per shared lead that may never answer the phone.

## 8. USP
Vertical-ready templates + no-code conditional logic + deterministic pricing engine + built-in lead CRM, at a flat price under the cost of two marketplace leads.

## 9. Value proposition
Turn website visitors into priced, qualified leads in the time it takes to fill out a 6-question quiz — no code, no per-lead fees, own the funnel and the data.

## 10. Product workflow (core loop)
```
Contractor signs up → picks a trade template → customizes questions/logic/pricing/branding
→ publishes → embeds widget or shares public link
→ Visitor opens funnel (mobile-first, no account) → answers branching questions → optional photo upload
→ sees instant estimate range → submits contact info → lead lands in dashboard
→ Contractor gets email/webhook notification → works the lead (status pipeline) → wins the job
```

## 11. MVP (MUST HAVE)
- Auth: signup/login/logout, session-protected dashboard.
- Organization model (one org per account to start; ready for multi-user later).
- Funnel builder: create/edit/duplicate/delete/publish/unpublish; question CRUD + reordering; question types: single choice, multiple choice, short text, number, date, location (zip/address text), email, phone, photo upload; per-question conditional visibility rules (if question X = value Y); pricing rule engine (base + per-question modifiers → estimate range); branding (logo, primary color, headline).
- Public runtime: public URL per funnel, mobile-first, progress bar, validation, loading/error/success states, price calculated and re-validated server-side, lead capture form at the end, confirmation screen.
- Lead management: list/detail/status pipeline (NEW → CONTACTED → QUALIFIED → WON/LOST), search, filter by funnel/status, CSV export, delete.
- File uploads: photo upload on funnels, size/type validated, stored locally (dev) / ready for S3-compatible storage in prod, linked to lead, access-controlled by org ownership.
- Billing: Stripe Checkout (test mode) for Free/Pro/Business plans, customer portal, webhook-driven subscription state, feature gating (funnel count, monthly lead cap) enforced server-side.
- Email: lead-notification email to the contractor and confirmation email to the visitor via Resend (degrades to a logged no-op with a clear warning if RESEND_API_KEY is absent, never a fake "sent" state).
- Analytics: view/start/completion/lead events stored per funnel, dashboard shows views, starts, completion rate, leads, conversion rate.
- Embed: a copy-paste `<script>` snippet that iframes the public funnel on the contractor's own site.
- Marketing site: home, pricing, FAQ, legal placeholders, signup CTA.
- Security: server-side ownership checks on every query/mutation, Stripe webhook signature verification, rate limiting on public endpoints, input validation (Zod) everywhere.

## 12. SHOULD HAVE (implemented if time allows, else Later)
- Duplicate/clone a published funnel as a starting template per trade (roofing/plumbing/electrical/etc. seeded template library).
- A/B test two variants of a funnel.
- Webhook out (send lead JSON to a contractor-configured URL, signed payload).

## 13. LATER
- Native CRM integrations (Housecall Pro, Jobber, ServiceTitan).
- SMS lead notifications.
- Multi-user orgs with roles.
- White-label / agency reseller mode.
- AI-assisted funnel creation from a URL/business description.

## 14. Pricing
Anchored against a single Angi/Thumbtack lead ($50-120) and existing SMB SaaS spend (Jobber $25-249/mo, Housecall Pro $49-300/mo):
- **Free** — 1 funnel, 25 leads/mo, Quotefox branding on the widget. (Try-before-you-buy; branding removal is the upgrade trigger.)
- **Pro — $79/mo** (or $790/yr) — 5 funnels, 500 leads/mo, remove branding, CSV export, email notifications.
- **Business — $199/mo** (or $1,990/yr) — unlimited funnels, 3,000 leads/mo, webhooks, priority support.
Overage/expansion path: per-additional-1,000-leads add-on post-launch (HYPOTHESIS, to validate with real usage data).

## 15. Business model
B2B SaaS subscription, monthly/annual, self-serve signup with a 14-day Pro trial (no card required) to hit "value in 5 minutes" before any billing friction.

## 16. Acquisition (evidence-based)
- **SEO** (highest-confidence channel): long-tail, high-intent pages per trade ("roofing quote calculator for your website", "plumbing lead qualification form") — genuine tool pages, not thin content.
- **Content/communities**: r/roofing, r/HVAC, r/Construction, r/smallbusiness, trade Facebook groups — educational posts about lead-quality problems with marketplaces (a well-evidenced pain point), not spam.
- **Partnerships**: web design agencies serving contractors, and marketing agencies running paid traffic for trades (they need a conversion tool for the traffic they already buy).
- Paid acquisition (Google/Meta) is a HYPOTHESIS channel — evaluate CAC after organic/partnership traction, not on day one.

## 17. Retention
Once a funnel is embedded on a contractor's live site and wired into their daily lead-review habit, switching cost is real (re-embedding, re-training staff, losing historical leads). Dashboard habit (checking new leads daily) is the retention hook — analogous to how CRM tools retain via daily-use habit formation.

## 18. Differentiation
Vertical templates + no-code conditional logic + server-validated pricing engine + built-in lead CRM + embeddable widget, at a flat price under two marketplace leads — no direct competitor combines all five.

## 19. Risks
- **Acquisition is unproven** (HYPOTHESIS) — no keyword-volume data could be verified in this research pass; must be validated with real campaigns post-launch.
- **Horizontal incumbents could add trade templates** — mitigated by moving faster and by CRM/webhook depth incumbents haven't prioritized.
- **Contractors are a notoriously hard SMB segment to reach digitally** — mitigated by partnership channel (agencies already serving them).

## 20. Technical architecture
Next.js 16 (App Router, Server Actions + Route Handlers) · TypeScript · Tailwind v4 · Prisma ORM · SQLite (dev) / PostgreSQL (prod, e.g. Supabase or Neon) · Stripe (test mode now, live keys are the only prod change) · Resend (email) · self-rolled session-cookie auth · local disk storage (dev) / S3-compatible storage (prod, single adapter swap) · Vercel (deploy target).

## 21. Data model (see `prisma/schema.prisma`)
Organization, User, Session, Funnel, Question, LogicRule, PricingRule, Lead, LeadAnswer, UploadedFile, AnalyticsEvent, Subscription.

## 22. Authentication model
Email + password, bcrypt-hashed, signed httpOnly session cookie (HS256 JWT via `jose`), server-side org-ownership check on every query. Ready to add Google OAuth later without a schema change (User table already supports a nullable `passwordHash` for that path).

## 23. Billing model
Stripe Checkout + Customer Portal (test mode). Subscription table mirrors Stripe webhook events (`checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`) — webhook state, not client state, is authoritative for feature gating.

## 24. Integration requirements
Stripe (test keys provided in `.env.example`; live keys are an owner action), Resend (optional at dev time; required for real email delivery in prod), file storage (local in dev; S3-compatible env vars documented for prod).
