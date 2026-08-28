# Desktop App Factory — Architecture

## Greenfield default

Use this only when the existing repository does not already establish a different stack.

```text
Tauri 2
├── Frontend: Vue 3 + TypeScript + Vite
├── Native shell/runtime: Rust/Tauri
├── State: simple composables/store appropriate to app complexity
├── Persistence: SQLite for structured data; key-value store for simple preferences
├── Native integrations: official Tauri APIs/plugins where suitable
└── Backend: none unless a concrete product requirement exists
```

Do not pin versions from memory. Verify current official documentation when package/plugin details matter.

## Architectural layers

```text
src/
├── app/                 # routing, shell, bootstrapping
├── ui/                  # shared presentational components
├── features/            # product workflows
├── domain/              # product rules/models
├── services/            # frontend service interfaces
├── native/              # typed wrappers around Tauri invoke/plugins
└── telemetry/           # analytics/error wrapper

src-tauri/
├── src/
│   ├── commands/        # Rust commands
│   ├── services/        # filesystem/process/native services
│   ├── state/           # app-managed native state
│   └── lib.rs
├── capabilities/        # least-privilege capability configs
└── tauri.conf.json
```

Adapt to the repo; do not restructure working code just to match this diagram.

## Frontend vs Rust boundary

Keep in TypeScript/Vue when:
- UI/state logic is sufficient
- an official JS plugin API is appropriate
- no privileged native logic is needed

Move to Rust/native commands when:
- privileged filesystem/process behavior needs strict validation
- performance-sensitive local processing requires it
- native APIs are not exposed adequately through plugins
- a side effect should be isolated from untrusted UI input
- cross-window/native state needs a reliable owner

Do not add Rust complexity for ordinary UI/business logic.

## Persistence

Use a key-value store for:
- preferences
- onboarding flags
- simple window/tool state

Use SQLite for:
- action history
- queued work
- searchable records
- structured entities/relationships
- durable automation state

Persist enough data to recover cleanly after crashes/restarts.

## Background work

Prefer:
1. user-triggered actions
2. OS/native event-driven triggers
3. lightweight resident tray process when core to the promise
4. polling only when necessary

If polling:
- avoid aggressive intervals
- pause when irrelevant where possible
- surface status/error state
- measure resource usage

Use sidecars only for concrete needs such as an existing binary, local model server, or specialized runtime. Define lifecycle, ports, logs, upgrades, and failure behavior explicitly.

## Security boundary

Tauri capabilities are part of architecture.

For every native integration, define:
- which window/webview needs it
- exact permission/scope
- allowed paths/URLs/commands
- input validation
- error/recovery behavior

Avoid broad wildcard permissions.

## Cross-platform strategy

Choose target OSes intentionally.

Recommended factory approach:
- ship the OS where the target audience is strongest first when speed matters
- add the second OS once the core workflow is proven
- support Linux when the audience justifies its packaging/support surface

Keep OS-specific adapters around differences such as:
- menu/tray conventions
- autostart behavior
- filesystem paths
- keyboard modifiers
- window chrome
- notifications
- signing/distribution

Do not scatter platform conditionals throughout feature logic.

## Backend seams

A desktop utility earns a backend only for licensing, sync, hosted AI, an update
feed, or email. When one is required, name the responsibility and its adapter
interface first; the vendor is a current default behind that seam, not an
architectural commitment.

| Responsibility | Adapter interface | Notes |
| --- | --- | --- |
| Licence activation and validation | `activate(key, deviceId)` and `validate()` returning status, expiry and a signed payload | The only endpoint many utilities ever need |
| Update feed | signed manifest plus immutable artifact URLs | See `distribution-signing.md` |
| Billing and checkout | hosted checkout plus a verified webhook | Merchant of record — see `monetization.md` |
| AI proxy | one call returning normalized content, finish reason, usage and typed errors | Keeps the provider key off the user's machine |
| Transactional email | validated recipient, fixed template ID, bounded data | Licence delivery and receipts |
| Sync and backup | push/pull of versioned records plus tombstones | Only when the product genuinely needs it |

A small edge runtime such as Cloudflare Workers, or any minimal API, is enough
for the first four. Object storage with a CDN in front serves the update feed.
Do not stand up a general-purpose application server for a licence check.

### Never ship a provider key in the app

A key compiled into a Tauri binary — or sitting in a config file beside it — is
extractable. Anything paid and remote (AI, email, telemetry ingest with write
scope) belongs behind a server the app calls. That server owns the model,
endpoint, timeout, output limit and retry policy, and it is the only place
per-user cost can be capped.

The app may still hold a *user's own* key for a service they control, stored in
platform secure storage and clearly theirs.

### Validate destinations at execution, not only at save

Watched folders, webhook targets, export endpoints and import URLs are stored
once and used for months. Re-validate before every execution: allowed protocol,
no embedded credentials, no private, loopback or link-local address for outbound
calls, canonical path inside the permitted scope, and a bounded response size.
A destination that was safe when saved may not resolve the same way today.

## Reusable shell extraction

After App #1 ships, candidates for extraction include:
- updater wrapper
- license/entitlement wrapper
- analytics/error wrapper
- settings shell
- tray primitives
- shortcut manager
- app lifecycle/single-instance handling
- persistence helpers
- permission diagnostics
- release scripts

Product-specific triggers/actions should remain in the product until reuse is proven.
