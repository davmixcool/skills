# [App Name] — Workflow Model

## Primary workflow

### Trigger
[Hotkey / tray action / watched-folder event / app launch / user action / other]

### Context/input
[What data is needed]

### Action
[What the app does]

### Result
[What the user gets]

### Confirmation boundary
[What requires confirmation vs may be automatic]

### Undo / recovery
[How the user reverses or recovers]

## Persisted state
- [state/history]

## Failure modes
| Failure | User-visible behavior | Retry/recovery |
|---|---|---|
| [failure] | [message/state] | [recovery] |

## OS differences
### macOS
[notes]

### Windows
[notes]

### Linux
[notes or not targeted]

## Native integrations
| Integration | V1? | Why | Permission/scope |
|---|---:|---|---|
| Tray/menu bar | No | | |
| Global shortcut | No | | |
| Autostart | No | | |
| Notifications | No | | |
| Clipboard | No | | |
| Filesystem | No | | |
| Watcher | No | | |
| Single instance | No | | |
| Updater | Yes | Release reliability | |
