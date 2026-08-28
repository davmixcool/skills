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

When user marks an event complete:

1. Save completion record.
2. Cancel outstanding notifications.
3. If recurring, calculate next occurrence.
4. Schedule next reminders.
5. Update timeline.

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
