# [App Name] — Domain Model

## Tracked entity
### [EntityName]
Fields:
- `id`
- `title`
- `createdAt`
- `updatedAt`
- [niche fields]

## Lifecycle events
| Event type | Trigger/source | Due semantics | Recurrence | Default offsets |
|---|---|---|---|---|
| [event] | [source] | [date/interval/usage/state] | [rule] | [offsets] |

## Event sources
- user-entered
- generated template
- imported/scanned
- integration/remote state (only if present)

## Completion actions
| Event | Action | What changes after completion? |
|---|---|---|
| [event] | [action] | [history + next occurrence] |

## Snooze/reschedule
[Allowed options and semantics]

## Overdue behavior
[What the UI and scheduler do after the due point]

## History
[Action records and fields worth retaining]

## Domain templates
[Rules used to turn entity metadata into recommended events]

## Reliability notes
[OS/platform/reconciliation risks specific to this niche]
