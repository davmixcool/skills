# Reminder Engine

## Objective

The reminder engine is the shared core of the factory.

It converts domain events into reliable scheduled notifications.

## Reminder types

### Date-based
Examples:
- passport expiry
- insurance renewal
- invoice due date

### Interval-based
Examples:
- service every 6 months
- grooming every 8 weeks

### Usage-based
Examples:
- oil change every 5,000 km
- filter replacement every 300 hours

### State-based
Examples:
- invoice remains unpaid
- renewal has not been confirmed

V1 should prioritize date- and interval-based reminders.

## Reminder offsets

A single event can have multiple reminders.

Example:

```text
Expiry: 20 Dec 2026
- 180 days before
- 90 days before
- 30 days before
- 7 days before
- 1 day before
```

Offsets should be stored as rules, not hardcoded UI behavior.

## Completion behavior

When the user marks an event complete, steps 1-4 must commit as a single
database transaction, with OS scheduling driven from the committed result:

1. Claim the occurrence with a compare-and-set on its status. If it is already
   completed, stop — a second tap must not produce a second occurrence.
2. Save the completion record.
3. If recurring, calculate the next occurrence.
4. Commit.
5. Cancel obsolete notifications and schedule the next reminders from committed
   state.
6. Update timeline.

A crash between the commit and the scheduling call is recoverable: the next
reconciliation rebuilds the OS schedule from the database. A crash inside a
non-transactional version of these steps leaves the user with two next
occurrences, or none.

## Snooze behavior

Suggested defaults:
- later today
- tomorrow
- 3 days
- 1 week
- custom

## Missed reminders

If the app is opened after a due event:
- show overdue state
- do not silently discard
- allow complete, reschedule or dismiss

## Timezone rules

- Store canonical timestamps.
- Resolve notification time in the user's active timezone.
- Recalculate future schedules when timezone changes if appropriate.

## Reliability rules

1. Never depend on network access to deliver a locally-known reminder.
2. Persist all reminder schedules in the database.
3. Reconcile scheduled notifications on app launch.
4. Reconcile after app update.
5. Reconcile after timezone change.
6. Reconcile after permission changes.
7. Detect when notification permission is disabled.
8. Show users when the OS prevents reliable delivery.

## Notification identity and idempotency

Reconciliation runs on launch, after update, after timezone change and after
permission change. Every one of those is a retry over work that may already
exist, so schedules need a stable identity or reconciliation will duplicate
them.

1. Derive each OS notification ID deterministically from the reminder rule, the
   occurrence timestamp and a schedule version. Never from a random value, row
   insertion order, or an incrementing counter.
2. Reconciliation is then a diff: cancel scheduled IDs the database no longer
   justifies, schedule the ones that are missing, leave matching ones untouched.
   Running it twice in a row must produce no visible change.
3. Persist the IDs actually handed to the OS, so the app can still cancel
   schedules created by an earlier version whose derivation has since changed.
4. Bump the schedule version when offset semantics or notification copy change,
   so corrected schedules replace old ones instead of stacking on top of them.
5. Treat "reconcile twice, see one notification" as a required test. Duplicate
   notifications destroy trust in a reminder app faster than a missed one.

The same rule applies to any queued or retried work the app performs — backup
uploads, sync pushes, webhook calls. Give the operation a stable identifier and
make repeating it harmless, rather than assuming it runs exactly once.

## Domain template example

```json
{
  "eventType": "insurance_expiry",
  "defaultOffsets": [30, 14, 7, 1],
  "recurring": true,
  "defaultRecurrence": "P1Y"
}
```

## Smart reminder generation

Each niche can define templates based on entity metadata.

Example:

```text
Vehicle added
  -> create annual insurance event
  -> suggest oil change schedule
  -> suggest tyre rotation schedule
  -> suggest inspection schedule
```

The factory's advantage comes from these domain templates.
