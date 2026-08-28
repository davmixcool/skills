---
name: mobile-app-factory
description: Evaluate, plan, build, audit, and launch focused Flutter mobile utilities where the app understands a recurring responsibility and generates reliable reminders or lifecycle actions for the user. Use for niche reminder apps, expiry trackers, car maintenance apps, subscription renewal apps, pet/home maintenance apps, invoice follow-up apps, or when turning one of these ideas into an executable product, architecture, V1, monetization plan, implementation backlog, or Flutter codebase.
metadata:
  version: "1.0.0"
  framework: "flutter"
---

# Mobile App Factory

Build small mobile products that own one recurring responsibility and remember it better than the user.

Core pattern:

`tracked thing -> lifecycle knowledge -> due event -> reminder -> action -> history/next event`

The product is **not** a generic reminder UI. The value is knowing what should be remembered, when it matters, and what the user should do next.

## Factory invariants

Apply these unless the user explicitly overrides them:

1. One app owns one clear responsibility.
2. The app should generate or recommend reminders from minimal input; do not make users manually recreate a calendar.
3. Core reminder delivery must work without a network connection when the due information is already known locally.
4. Notifications are product-critical infrastructure. Treat reminder reliability like payment reliability.
5. Do not require an account before first value unless the feature fundamentally requires identity, sync, collaboration, or remote data.
6. Keep V1 local-first. Add a backend only for a concrete requirement.
7. AI/OCR may reduce input friction, but the core reminder loop must not depend on an LLM.
8. Give the user a useful result in roughly the first minute whenever possible.
9. Monetize confidence, automation, coverage, records, or useful actions—not cosmetic features.
10. Do not build the factory as a platform before shipping the first real app.
11. Do not build multiple factory apps simultaneously unless the user explicitly requests parallel work.
12. Expand a utility only after activation, reminder usage, retention, or payment data justifies it.

## Determine the operating mode

Infer the mode from the request. Do not force the user through every mode.

### Mode A — Evaluate an idea

Use when the user asks whether an app niche is worth building, which idea to choose, or how ideas compare.

1. Read `references/idea-scorecard.md` and `references/product-principles.md`.
2. Score the idea on all 10 criteria from 1–5.
3. State assumptions behind any uncertain score.
4. Identify the strongest consequence-of-forgetting and the strongest 5–10 second acquisition hook.
5. Give one verdict: **Build**, **Validate first**, **Reposition/narrow**, or **Do not build yet**.
6. If comparing ideas, use the same scoring standard for every idea.

If deterministic scoring is useful, create a JSON input and run:

```bash
python scripts/score_idea.py idea.json
```

Do not inflate scores to be encouraging.

### Mode B — Turn an approved idea into an executable product

Use when the user has chosen an app or asks for product/technical documents.

Read:
- `references/product-principles.md`
- `references/app-template-spec.md`
- `references/reminder-engine.md`
- `references/monetization.md`
- `references/analytics.md`
- `references/privacy-security.md`
- `references/launch-playbook.md`

Produce or update these project artifacts when a writable repo exists:

```text
docs/factory/
  APP_BRIEF.md
  DOMAIN_MODEL.md
  V1_SCOPE.md
  MONETIZATION_PLAN.md
  ANALYTICS_PLAN.md
  LAUNCH_PLAN.md
  TODO.md
  niche.yaml
```

Use the templates in `assets/` where relevant. Keep every artifact specific to the current niche rather than copying generic factory prose.

`APP_BRIEF.md` must answer:
- Who exactly is this for?
- What responsibility does the app own?
- What happens when the user forgets?
- Why are Apple Reminders/Google Calendar insufficient?
- What minimal input lets the app generate useful reminders?
- What is the first-session value moment?
- Why would someone pay?
- What is deliberately excluded from V1?

`DOMAIN_MODEL.md` must define:
- tracked entity and fields
- lifecycle event types
- event sources
- reminder offsets
- recurrence rules
- completion actions
- snooze/reschedule behavior
- overdue behavior
- history records
- domain templates used to generate reminders

`V1_SCOPE.md` must separate **must ship**, **later**, and **not now**.

### Mode C — Build or modify the Flutter app

Use when the user asks for implementation, scaffolding, features, fixes, or code.

1. Inspect the existing repository before choosing libraries or structure.
2. If an architecture already exists, preserve it unless it conflicts with a factory invariant or the user asks for a migration.
3. For a greenfield app, read `references/architecture.md`, `references/app-template-spec.md`, and `references/reminder-engine.md`.
4. Default greenfield choices:
   - Flutter/Dart
   - Riverpod for state management
   - GoRouter for navigation
   - Drift + SQLite for local persistence
   - platform secure storage for secrets
   - local notifications for locally-known reminders
   - RevenueCat for cross-platform subscription entitlement unless direct StoreKit/Play Billing is a better project fit
5. Do not pin package versions from memory. If network/documentation access exists and package/API details matter, verify against current official Flutter/platform/package documentation.
6. Keep niche-specific behavior isolated from reusable infrastructure. Prefer a `niche/` or equivalent configuration/domain layer.
7. Implement the user-requested feature; do not respond with only a plan if code changes were requested and tools permit code changes.
8. Add or update tests for reminder calculations, recurrence, persistence, entitlement gates, and any fragile domain rule touched.
9. Run the project's formatter, analyzer, and relevant tests before declaring implementation complete.

Do not prematurely extract shared packages. After App #1 ships, move only code proven reusable into shared modules.

### Mode D — Audit an existing factory app

Use when the user asks whether the app is ready, what is missing, or why a reminder feature is unreliable.

Read:
- `references/reminder-engine.md`
- `references/new-app-checklist.md`
- `references/privacy-security.md`
- `references/analytics.md`

Audit in this order:
1. Core responsibility/value proposition
2. First-session activation
3. Notification permission flow
4. Reminder persistence and reconciliation
5. Recurrence/completion correctness
6. Offline behavior
7. Paywall/restore purchases
8. Analytics coverage
9. Privacy/permissions
10. Store/launch readiness

Report issues by severity: **blocker**, **high**, **medium**, **low**. A reminder-delivery defect is normally a blocker or high-severity issue.

### Mode E — Post-launch decision

Use when the user provides launch data and asks what to do next.

Read `references/analytics.md` and `references/launch-playbook.md`.

Classify the app as exactly one of:
- **Kill** — weak activation, retention, and payment intent
- **Maintain** — small profitable utility with low support burden
- **Grow** — healthy paid economics; invest in acquisition/ASO/adjacent features
- **Graduate** — strong retention plus demand for deeper workflows; consider a larger standalone product

Do not recommend major expansion based on downloads alone.

## Reminder-engine rules

Always apply these when designing or implementing reminders:

1. Persist events and reminder rules in durable local storage.
2. A single lifecycle event may have multiple pre-alert offsets.
3. On completion, record the action, cancel obsolete notifications, calculate the next occurrence if recurring, and schedule the next reminders.
4. Missed due events become overdue; never silently discard them.
5. Reconcile scheduled notifications after relevant app launches/updates, event changes, timezone changes, and permission changes.
6. Detect disabled notification permissions and show a recoverable state.
7. Separate date-based, interval-based, usage-based, and state-based reminder semantics. Do not pretend usage/state triggers are solved by date scheduling.
8. V1 should normally prioritize date- and interval-based reminders unless usage/state triggers are essential to the niche promise.
9. Store enough information to rebuild the OS notification schedule from the database.
10. Test real-device behavior where OS scheduling/background constraints matter.

Read `references/reminder-engine.md` before changing reminder scheduling logic.

## Monetization rules

Read `references/monetization.md` when pricing, paywalls, subscriptions, trials, or premium gates are part of the task.

Defaults:
- Freemium utility
- Free tier provides a complete taste of the core value
- Annual subscription is the primary offer
- Monthly is optional
- Paywall after the user understands the protected responsibility, not blindly at first launch
- Premium unlocks greater coverage/automation/history/smart input/sync/sharing where relevant

Do not treat the reference price bands as current market facts. If exact pricing recommendations matter, validate current competitors/store norms before finalizing them.

## Analytics rules

The north-star behavior is: **the user successfully delegates a recurring responsibility to the app**.

At minimum track the funnel:

`first_open -> entity_added -> reminder_generated -> reminder_enabled -> reminder_action -> paywall -> paid`

For low-frequency utilities, do not over-index on DAU. Future reminders scheduled, active tracked entities, reminder action rate, paid retention, and retained installation may be more meaningful.

Read `references/analytics.md` before defining events or interpreting post-launch metrics.

## Privacy rules

Read `references/privacy-security.md` whenever the niche includes documents, health schedules, financial information, client information, vehicle registration details, images/OCR, accounts, backup, or cloud sync.

Defaults:
- collect less
- local storage first
- no document contents in analytics
- disclose remote OCR/AI processing
- export/delete controls
- minimum OS permissions
- no forced account for local-only utility

## Current-information rule

The factory principles are durable; platform APIs, Flutter packages, App Store/Play Store rules, privacy requirements, and competitor pricing are not.

When a decision depends on current technical or store behavior and the agent has network access, check primary/official sources rather than relying on remembered versions or policies. Do not silently turn time-sensitive details into permanent factory rules.

## Output quality gate

Before finalizing any evaluation, plan, or implementation, verify:

- [ ] The app owns one responsibility.
- [ ] The consequence of forgetting is explicit.
- [ ] The app adds domain knowledge beyond a generic calendar.
- [ ] First value can happen with minimal setup.
- [ ] V1 can work locally unless remote behavior is essential.
- [ ] Reminder reliability and recovery states are designed.
- [ ] Premium value is tied to a meaningful outcome.
- [ ] Analytics can distinguish installs from real delegation/activation.
- [ ] Sensitive data and permissions are minimized.
- [ ] "Later" features have not leaked into V1 without evidence.

If any item fails, fix the plan/code or call out the unresolved risk.

## Gotchas

- A polished generic reminder screen does not create a niche product.
- "AI-powered" is not a substitute for lifecycle knowledge.
- Notification scheduling is not equivalent to background execution; respect platform constraints.
- Usage-based triggers (mileage, runtime hours, remaining quota) need an explicit strategy for receiving updated usage.
- State-based triggers (e.g. unpaid invoice) need a trustworthy source of state; if the app cannot observe state automatically, design an honest manual confirmation loop.
- A reminder app may have low session frequency and still have strong retention/value. Measure the right behavior.
- Do not introduce login/cloud sync just to make the architecture look complete.
- Do not clone App #2 until App #1 has exposed what is genuinely reusable.

## References

Load only what the current task needs:

- `references/product-principles.md` — product thesis, scope, expansion rules
- `references/idea-scorecard.md` — 50-point niche evaluation framework
- `references/architecture.md` — shared Flutter architecture/domain model
- `references/app-template-spec.md` — reusable app shell and niche configuration
- `references/reminder-engine.md` — scheduling, recurrence, reconciliation, reliability
- `references/monetization.md` — freemium/subscription/paywall strategy
- `references/analytics.md` — event taxonomy and factory metrics
- `references/privacy-security.md` — local-first security/privacy rules
- `references/launch-playbook.md` — validation, store launch, acquisition, expansion gate
- `references/new-app-checklist.md` — end-to-end launch checklist
- `references/factory-todo.md` — recommended order for building the reusable core

## Example requests that should activate this skill

- "Score this niche reminder app idea."
- "Turn this pet vaccination reminder into an app plan."
- "Build the Flutter foundation for my expiry tracker."
- "What reminder events should a car maintenance app generate?"
- "Audit my reminder scheduler before App Store submission."
- "Create the V1 docs and TODO for this niche app."
- "Here are my first 30 days of metrics—should I grow or kill this app?"
