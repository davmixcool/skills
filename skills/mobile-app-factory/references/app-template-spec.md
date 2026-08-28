# App Template Specification

## Purpose

This is the reusable starter that every factory app begins with.

## Required modules

### 1. Onboarding
- 2–4 screens maximum
- explain the consequence being avoided
- add the first tracked item during onboarding
- defer account creation

### 2. Home
Should answer:

> What needs my attention next?

Default sections:
- due soon
- overdue
- recently completed
- all tracked items

### 3. Entity creation
Reusable flow:
- choose/add entity
- capture minimum required metadata
- generate suggested events
- confirm reminders

### 4. Timeline
Chronological view of:
- upcoming reminders
- completed events
- skipped events
- history

### 5. Reminder scheduler
Supports:
- exact date
- recurring date
- relative offsets
- snooze
- mark complete
- reschedule
- multiple pre-alerts

### 6. Notifications
Notification actions where supported:
- Done
- Remind later
- Open

### 7. Paywall
Support:
- annual plan
- optional monthly plan
- lifetime only if strategically justified
- trial configuration
- restore purchases

### 8. Settings
- notification permission state
- timezone
- default reminder lead time
- subscription management
- export/delete data
- privacy policy
- support

### 9. Analytics
Predefined event names should be shared across apps.

### 10. Remote config
Optional but useful for:
- paywall copy
- free limits
- trial length
- experiment toggles

## Config-driven niche layer

Each new app should define:

```yaml
app_name: AutoDue
entity_name: Vehicle
primary_promise: Know what your car needs next
free_entity_limit: 1
premium_entity_limit: unlimited
primary_event_types:
  - oil_change
  - insurance_expiry
  - tyre_rotation
  - inspection
```

## UI principles

- Native-feeling, not dashboard-heavy
- One primary action per screen
- Due information should dominate the home screen
- Avoid dense SaaS-style tables
- Strong use of empty states to teach users what to add
- Notification permission request only after demonstrating value
