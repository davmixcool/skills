# Reusable Desktop App Template Spec

The template should make App #2 faster without turning App #1 into a framework project.

## Required base modules

### App shell
- application bootstrap
- error boundary/fatal state
- settings entry point
- about/version screen
- clean quit behavior

### Settings
- general settings
- permissions/integration status
- keyboard shortcuts when used
- startup behavior when used
- privacy/analytics controls when used

### Persistence
- migration-ready local storage
- preferences
- durable product state

### Update layer
- update-check abstraction
- user-visible version/release behavior
- safe failure states

### Licensing/entitlement layer
- free/trial/paid state abstraction
- restore/refresh entitlement
- offline grace strategy if relevant

### Telemetry wrapper
- analytics events without sensitive payloads
- error reporting/logging abstraction
- easy opt-out where appropriate

## Optional modules — include only when the product needs them

- tray/menu bar
- global shortcut manager
- autostart
- notifications
- clipboard access
- filesystem picker/access
- filesystem watcher
- native menus
- window-state persistence
- single-instance handling
- deep links/protocol handler
- local search/indexing
- sidecar process manager
- cloud sync/auth
- AI provider abstraction

## Template rule

Do not enable every plugin by default. A factory template should reduce implementation time, not request broad permissions or increase attack surface.

## Product configuration

Prefer a small product config for brand and capability defaults:

```yaml
app:
  name: Example Utility
  identifier: com.example.utility
  promise: Do one thing extremely well

targets:
  macos: true
  windows: true
  linux: false

capabilities:
  tray: false
  global_shortcuts: false
  autostart: false
  notifications: false
  clipboard: false
  filesystem: false
  watcher: false

monetization:
  model: one_time
```

Do not force runtime configuration where compile-time/product-specific code is clearer.

## UX defaults

- no account wall before first value
- one obvious primary action
- keyboard-friendly interactions for power users
- native-feeling window behavior
- clear permission prompts before OS dialogs
- visible success/failure feedback
- undo where actions are destructive or surprising
