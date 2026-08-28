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
