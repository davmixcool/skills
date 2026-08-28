# Desktop Integration Patterns

Use only the integrations that materially improve the product promise.

## System tray / menu bar

Use when:
- the app should be reachable without opening a full window
- quick actions/status are central
- background presence is justified

Define explicitly:
- icon click behavior
- menu items
- open/show/hide behavior
- quit behavior
- close-window behavior
- state shown in the menu

Avoid forcing tray residency for apps used occasionally.

## Global shortcuts

Use when the user benefits from triggering the app while focused elsewhere.

Rules:
- provide a sensible default
- allow customization
- detect/report conflicts
- never intercept common OS shortcuts irresponsibly
- make disabling easy

## Autostart

Use only when the app's value depends on being available immediately after login.

Rules:
- opt-in
- explain why
- reflect current state accurately in settings
- ensure disabling removes the startup hook

## Notifications

Use for meaningful asynchronous results, failures, or reminders.

Do not use notifications merely to drive engagement.

## Clipboard

Good for:
- explicit “transform current clipboard” actions
- user-enabled history
- quick copy/paste workflows

Rules:
- disclose history capture clearly
- default sensitive contents to local storage
- provide clear/delete history controls
- consider excluded apps/types if continuous capture is used

## Filesystem access

Prefer user-selected files/folders and narrow scopes.

For organization/cleanup tools:
- preview actions
- use trash/backup rather than irreversible deletion where possible
- log changes
- provide undo when feasible

## Filesystem watchers

Use when event-driven folder changes are central.

Rules:
- watch only selected paths
- debounce noisy events
- handle renamed/moved files
- recover watchers on restart
- surface inaccessible/missing path state

## Single instance

Use for apps whose state should have one owner.

On a second launch, decide whether to:
- focus existing window
- show quick capture UI
- pass deep-link/file arguments to the existing process

## Window state

Persist size/position when it improves continuity. Avoid restoring off-screen coordinates after monitor changes; use plugin/platform behavior carefully.

## Native menus

Use platform conventions for actions such as:
- Preferences/Settings
- About
- Quit
- Edit commands
- Help

## Updater

Treat update verification as security-sensitive.

Define:
- update channel
- check cadence
- whether updates are automatic or user-approved
- restart behavior
- failure/retry state
- rollback/recovery expectations

## Deep links / protocol handlers

Use when the app needs links from browser/email/other apps.

Validate all incoming payloads as untrusted input.

## Shell/process execution

Use sparingly.

Rules:
- explicit executable and arguments
- validate/escape inputs
- avoid building shell command strings from user content
- define timeouts/cancellation
- capture exit status/errors
- do not expose a generic arbitrary shell bridge to the frontend

## Local AI

Use when privacy, latency, or marginal cost justify it.

Define:
- model/download size
- hardware requirements
- fallback behavior
- update strategy
- memory/CPU expectations
- where prompts/data are stored

Do not assume every user machine can run the same model comfortably.
