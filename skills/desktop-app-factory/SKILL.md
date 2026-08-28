---
name: desktop-app-factory
description: Evaluate, plan, build, audit, launch, and grow focused desktop utilities that remove one recurring computer workflow annoyance through native desktop integrations such as tray/menu bar, global shortcuts, filesystem/clipboard access, notifications, autostart, local storage, and background automation. Use for Tauri desktop apps, menubar utilities, developer tools, creator utilities, file/clipboard tools, follow-up tools, local AI utilities, or when turning a small desktop workflow pain into an executable product, architecture, V1, monetization plan, implementation backlog, or Tauri codebase.
metadata:
  version: "1.0.0"
  framework: "tauri"
---

# Desktop App Factory

Build small desktop products that remove one recurring computer annoyance so well that the user stops thinking about it.

Core pattern:

`recurring friction -> desktop trigger/context -> fast or automatic action -> visible result -> repeated time saved`

The product is **not** a generic productivity suite. The value is owning one narrow workflow and using desktop-native access to make it materially faster, easier, or automatic.

## Factory invariants

Apply these unless the user explicitly overrides them:

1. One app solves one clearly stated recurring computer workflow problem.
2. The app must have a desktop-native reason to exist: tray/menu bar presence, hotkeys, filesystem access, clipboard access, window control, local processing, background presence, native notifications, OS integration, or a combination of these.
3. Prefer a 5–30 second workflow improvement over a broad dashboard.
4. V1 should reach useful output within roughly one minute of install or first launch whenever possible.
5. Keep V1 local-first. Add a backend only for sync, collaboration, remote data, licensing, hosted AI, or another concrete requirement.
6. Do not require an account before first value unless identity is essential.
7. Ask for the minimum OS permissions needed and explain why each permission exists.
8. Never silently enable autostart, intrusive monitoring, broad filesystem access, or persistent background behavior without clear user intent.
9. Use automation to reduce repeated manual work, not to create opaque behavior users cannot understand or undo.
10. AI may accelerate a workflow, but the app must still have a clear non-AI job-to-be-done.
11. Do not build the factory as a platform before shipping the first real utility.
12. Do not build multiple factory apps simultaneously unless the user explicitly requests parallel work.
13. Expand only after activation, repeat usage, retention, or payment data justifies it.
14. Every app must have a clean uninstall/disable story for startup hooks, shortcuts, watchers, integrations, and generated files.

## Determine the operating mode

Infer the mode from the request. Do not force the user through every mode.

### Mode A — Evaluate an idea

Use when the user asks whether a desktop utility is worth building, which idea to choose, or how ideas compare.

1. Read `references/idea-scorecard.md` and `references/product-principles.md`.
2. Score the idea on all 10 criteria from 1–5.
3. State assumptions behind uncertain scores.
4. Identify the strongest recurring annoyance, measurable time/cost saved, desktop-native advantage, and strongest 5–10 second acquisition hook.
5. Give one verdict: **Build**, **Validate first**, **Reposition/narrow**, or **Do not build yet**.
6. If comparing ideas, use the same scoring standard for every idea.
7. Penalize ideas that are merely websites wrapped in a desktop shell.

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
- `references/desktop-integration-patterns.md`
- `references/architecture.md`
- `references/monetization.md`
- `references/analytics.md`
- `references/privacy-security.md`
- `references/distribution-signing.md`
- `references/launch-playbook.md`

Produce or update these project artifacts when a writable repo exists:

```text
docs/factory/
  APP_BRIEF.md
  WORKFLOW_MODEL.md
  V1_SCOPE.md
  DESKTOP_INTEGRATIONS.md
  MONETIZATION_PLAN.md
  ANALYTICS_PLAN.md
  DISTRIBUTION_PLAN.md
  LAUNCH_PLAN.md
  TODO.md
  niche.yaml
```

Use the templates in `assets/` where relevant. Keep every artifact specific to the current utility rather than copying generic factory prose.

`APP_BRIEF.md` must answer:
- Who exactly is this for?
- What repeated computer annoyance does the app remove?
- How often does the pain occur?
- What does the user do today instead?
- Why is a normal website/browser tab insufficient?
- What desktop-native capability creates the advantage?
- What is the first-session value moment?
- Why would someone pay?
- What is deliberately excluded from V1?

`WORKFLOW_MODEL.md` must define:
- trigger(s)
- inputs/context
- transformation or action
- output/result
- user confirmation points
- undo/recovery behavior
- history/state worth persisting
- failure modes
- OS-specific differences
- automation boundaries

`DESKTOP_INTEGRATIONS.md` must explicitly mark every integration as **required for V1**, **optional later**, or **not needed**.

`V1_SCOPE.md` must separate **must ship**, **later**, and **not now**.

### Mode C — Build or modify the desktop app

Use when the user asks for implementation, scaffolding, features, fixes, or code.

1. Inspect the existing repository before choosing libraries or structure.
2. Preserve an existing architecture unless it conflicts with a factory invariant or the user asks for a migration.
3. For a greenfield app, read `references/architecture.md`, `references/app-template-spec.md`, and `references/desktop-integration-patterns.md`.
4. Default greenfield choices:
   - Tauri 2
   - Vue 3 + TypeScript + Vite for the frontend
   - Rust commands/plugins only where native/system access is required
   - local persistence using SQLite for structured data or a key-value store for simple preferences
   - native notifications only when they directly serve the workflow
   - system tray/menu bar only when persistent quick access is valuable
   - global shortcuts only when they materially shorten the workflow
   - autostart only when background availability is core and the user explicitly opts in
   - official Tauri plugins before community/native custom code when they meet the need
5. Do not pin package/plugin versions from memory. If network/documentation access exists and API details matter, verify against current official Tauri/platform documentation.
6. Keep product-specific workflow logic isolated from reusable shell/infrastructure. Prefer a `niche/`, `domain/`, or equivalent product layer.
7. Implement the user-requested feature; do not respond with only a plan if code changes were requested and tools permit code changes.
8. Add or update tests for workflow logic, persistence, permission gates, licensing/entitlement gates, and fragile native behavior touched.
9. Run formatter/linter/type-checker, Rust checks/tests, and relevant app tests before declaring implementation complete.
10. Test platform-sensitive behavior on the actual target OS when possible.

Do not prematurely extract shared packages. After App #1 ships, move only code proven reusable into shared modules.

### Mode D — Audit an existing factory app

Use when the user asks whether the app is ready, what is missing, why native behavior is unreliable, or whether it is safe to ship.

Read:
- `references/new-app-checklist.md`
- `references/desktop-integration-patterns.md`
- `references/privacy-security.md`
- `references/distribution-signing.md`
- `references/analytics.md`

Audit in this order:
1. Core pain/value proposition
2. First-session activation
3. Desktop-native advantage
4. Permissions and consent
5. Trigger reliability
6. Action correctness and undo/recovery
7. Background/tray/autostart behavior
8. Persistence and crash/restart recovery
9. Licensing/payment behavior
10. Analytics/privacy
11. Signing/update/distribution readiness
12. OS-specific packaging issues

Report issues by severity: **blocker**, **high**, **medium**, **low**. Data-loss, destructive automation, broken permission handling, unsafe updater/signing, and core trigger failures are normally blocker/high severity.

### Mode E — Post-launch decision

Use when the user provides launch data and asks what to do next.

Read `references/analytics.md` and `references/launch-playbook.md`.

Classify the app as exactly one of:
- **Kill** — weak activation, repeat use, and payment intent
- **Maintain** — small profitable utility with low support burden
- **Grow** — healthy paid economics and repeat usage; invest in acquisition/ASO/SEO/partnerships/adjacent features
- **Graduate** — strong retention plus demand for a deeper workflow; consider a larger standalone product

Do not recommend major expansion based on downloads alone.

## Desktop integration rules

Read `references/desktop-integration-patterns.md` before changing native behavior.

Always apply these rules:

1. Treat tray/menu bar, hotkeys, autostart, filesystem access, clipboard access, notifications, watchers, and updater behavior as explicit product capabilities—not decoration.
2. Use only the integrations needed for the app's core promise.
3. Prefer event-driven behavior over polling when the platform/API supports it.
4. If polling is unavoidable, choose a conservative cadence and make resource use visible/configurable where relevant.
5. Never perform destructive file operations without a recoverable strategy such as trash, backup, preview, confirmation, or undo.
6. Global shortcuts must be configurable and gracefully handle conflicts.
7. Clipboard capture/history requires clear disclosure and local-first storage by default.
8. Filesystem watchers must scope to user-selected paths; do not scan entire disks by default.
9. Autostart must be opt-in unless the user explicitly requested silent installation behavior for a managed environment.
10. If the app lives primarily in the tray/menu bar, define what clicking the icon, double-clicking, quitting, and closing the main window do.
11. Persist enough state to recover cleanly after app restart or OS reboot.
12. Use least-privilege Tauri capabilities/permissions for each window/webview/plugin.
13. Ensure secondary app launches focus/reveal the existing instance instead of duplicating state when single-instance behavior is appropriate.
14. Make background work observable through status, history, logs, or a recent-actions view when users need confidence.
15. Any automation that can affect external systems or files needs an explicit failure and retry strategy.
16. Retry is only safe if the operation is idempotent. Give each queued or repeatable action a stable operation ID, claim it before the side effect, and record completion, so a retry after a crash does not move the same file twice or re-post the same webhook.
17. Re-validate stored destinations — watched paths, webhook targets, export endpoints — at execution time, not only when they were saved.

## Monetization rules

Read `references/monetization.md` when pricing, trials, licensing, subscriptions, paid upgrades, or premium gates are part of the task.

Defaults:
- Prefer simple paid utility economics.
- One-time purchase is a strong default for narrow local utilities with low recurring cost.
- Annual subscription is appropriate when the product has ongoing cloud/AI/sync/content costs or continuous high-value development.
- Paid major-version upgrades are viable for durable utilities.
- Free trial or limited free mode should demonstrate the core workflow before purchase.
- Avoid subscriptions whose only justification is “recurring revenue.”
- Premium value should tie to time saved, automation volume, advanced workflows, sync/collaboration, AI cost, or professional use.

Licensing and billing rules:
- Selling direct makes you the merchant, with tax obligations from the first sale. Choose a merchant of record before pricing, since its cut changes the numbers.
- Verify licence payloads locally by signature so an offline check still means something, and never trust the system clock alone for expiry.
- Billing webhooks are retried: verify against raw bytes, deduplicate by delivery ID, and apply idempotently.
- Fail open. A licence service that cannot be reached degrades premium features only — it never destroys local data or blocks export and delete.

Do not treat reference price bands as current market facts. If exact pricing matters, validate current competitors and relevant store/provider terms before finalizing them.

## Analytics rules

The north-star behavior is: **the user repeatedly completes or delegates the target desktop workflow faster because the app exists**.

At minimum track a privacy-conscious funnel such as:

`first_open -> core_trigger_configured -> first_successful_action -> repeated_successful_action -> paywall/trial -> paid`

For background utilities, DAU can be misleading. Successful actions, retained installations, weekly active automations, time saved, error rate, and paid retention may matter more.

Do not record clipboard contents, file contents, filenames, terminal commands, document text, or other sensitive user payloads in analytics unless the product explicitly requires it and the user has knowingly opted in.

Telemetry never degrades the app: analytics, crash reporting and update checks are non-blocking, their failures invisible, and their offline queue bounded.

If the app uses hosted AI or any per-use provider, record privacy-safe per-attempt cost so cost per installation can be weighed against pricing. A one-time or lifetime price is a guess without it.

Read `references/analytics.md` before defining events or interpreting post-launch metrics.

## Privacy and security rules

Read `references/privacy-security.md` whenever the app touches clipboard, filesystem, screenshots, microphone, camera, browser data, terminal/shell, credentials, tokens, local AI models, cloud AI, or external accounts.

Defaults:
- collect less
- local processing first
- least-privilege Tauri capabilities
- scope filesystem access narrowly
- no sensitive payloads in analytics/logs
- secure storage for secrets
- explicit disclosure for background monitoring
- explicit disclosure for remote AI processing
- easy disable/delete/export where relevant
- safe shell execution with explicit arguments; never concatenate untrusted input into commands
- encrypt the local database when the app stores sensitive categories; secure storage covers tokens, not the database
- never ship a provider API key inside the binary; put paid AI or email calls behind a server the app calls
- stored secrets need explicit Keep, Replace, and Clear semantics

## Distribution and update rules

Read `references/distribution-signing.md` before changing release packaging, signing, CI/CD, auto-update behavior, or store distribution.

Defaults:
- decide target OSes before implementation is “done”
- direct distribution and app-store distribution have different constraints
- code signing/notarization is part of the product release plan, not a final-day task
- auto-updates must be signed/verified according to the current Tauri updater model
- CI secrets for signing must never live in the repo
- test clean install, upgrade, downgrade/recovery expectations, uninstall, and first-run behavior
- released artifacts are immutable: never overwrite a published version key with new bytes — ship a new version instead
- keep prior versions and their manifests available for skipped releases and rollback
- serve the update feed from object storage or a CDN rather than application compute
- migrations are forward-only and additive, so an older binary can still open a database the newer one wrote

## Current-information rule

Factory principles are durable; Tauri plugins, OS permissions, signing requirements, store rules, updater behavior, licensing providers, and competitor pricing are not.

When a decision depends on current technical/store/provider behavior and the agent has network access, check primary/official sources rather than relying on remembered versions or policies. Do not silently turn time-sensitive details into permanent factory rules.

## Output quality gate

Before finalizing any evaluation, plan, or implementation, verify:

- [ ] The app solves one recurring computer annoyance.
- [ ] The pain occurs often enough or is costly enough to matter.
- [ ] The desktop-native advantage is explicit.
- [ ] First value can happen with minimal setup.
- [ ] V1 avoids unnecessary accounts/backends.
- [ ] Permissions are minimal and understandable.
- [ ] Destructive or background actions are recoverable/observable.
- [ ] The monetization model matches ongoing product costs.
- [ ] Analytics measure successful workflow delegation, not vanity usage.
- [ ] Distribution/signing/update work is planned.
- [ ] “Later” features have not leaked into V1 without evidence.

If any item fails, fix the plan/code or call out the unresolved risk.

## Gotchas

- A web dashboard wrapped in Tauri is not automatically a desktop utility.
- A tray icon is not a product strategy.
- “AI-powered” is not a substitute for a painful recurring workflow.
- Background presence can become annoying; earn the right to stay running.
- Clipboard/file monitoring can feel invasive; disclosure and scope matter.
- Cross-platform does not mean identical UX. Respect macOS, Windows, and Linux conventions.
- Avoid Rust/native complexity when a stable official plugin already solves the problem.
- Avoid JavaScript-only hacks when correctness or OS integration belongs in Rust/native code.
- Do not claim “zero CPU” or “no battery impact”; measure resource use.
- A utility can have low session frequency and still be valuable if it quietly saves time.
