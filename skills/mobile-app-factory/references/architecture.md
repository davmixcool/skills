# Architecture

## Goal

Create a reusable Flutter foundation where 70–80% of infrastructure can be reused across niche reminder apps.

## Recommended stack

### Client
- Flutter
- Dart
- Riverpod or Bloc for state management
- GoRouter for navigation

### Local data
- Drift + SQLite
- Secure storage for sensitive tokens/settings

### Notifications
- Local notifications as the default
- Platform-specific scheduling adapters where required
- Push notifications only when remote events are needed

### Payments
- RevenueCat preferred for cross-platform entitlement management
- Native App Store / Play Billing underneath

### Analytics
- PostHog, Firebase Analytics, or equivalent lightweight product analytics
- Crash reporting via Firebase Crashlytics or Sentry

### Optional backend
Only add when required for:
- account sync
- remote backup
- shared data
- server-driven reminders
- OCR/AI processing
- webhooks/integrations

Suggested backend when needed:
- Supabase or a minimal Node.js API
- Postgres
- Object storage
- queue only if asynchronous processing becomes necessary

## Layered architecture

```text
Presentation
  Screens
  Widgets
  ViewModels / Controllers

Application
  Use cases
  Reminder orchestration
  Subscription gates
  Analytics events

Domain
  Entity
  Event
  Schedule
  ReminderRule
  Action
  Domain templates

Infrastructure
  SQLite
  Notification adapters
  Billing
  OCR
  Cloud sync
  Analytics
```

## Core reusable domain objects

### TrackedEntity
Represents the thing being remembered.

Examples:
- car
- passport
- subscription
- pet
- invoice

Fields:
- id
- type
- title
- metadata
- createdAt
- updatedAt
- archivedAt

### LifecycleEvent
Represents something that becomes due.

Fields:
- id
- entityId
- eventType
- title
- dueAt
- dueMetric
- recurrenceRule
- status
- source

### ReminderRule
Defines when to notify relative to an event.

Fields:
- id
- eventId
- offset
- channel
- enabled
- repeatPolicy

### ActionRecord
Captures what the user did.

Examples:
- renewed
- serviced
- paid
- cancelled
- followed up

Fields:
- id
- eventId
- actionType
- completedAt
- notes
- metadata

## Recommended Flutter package layout

```text
lib/
  app/
    app.dart
    router.dart
    theme.dart
  core/
    analytics/
    billing/
    database/
    notifications/
    permissions/
    storage/
    utils/
  features/
    onboarding/
    entities/
    events/
    reminders/
    timeline/
    paywall/
    settings/
  domain/
    models/
    repositories/
    services/
  niche/
    config.dart
    templates/
    copy/
    assets/
```

The `niche/` folder is what changes most between apps.

## Build flavors

Use flavors only if you intentionally maintain multiple branded apps from one codebase.

Possible structure:

```text
flavors/
  carcare/
  expiry/
  followup/
```

Each flavor can define:
- bundle ID
- app name
- icons
- onboarding copy
- enabled modules
- default templates
- paywall copy
- analytics app ID

Do not over-engineer flavoring before the first app ships.
