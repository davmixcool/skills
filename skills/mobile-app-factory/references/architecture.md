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
- Supabase, a minimal Node.js API, or a small edge runtime such as Cloudflare
  Workers
- Postgres
- Object storage
- queue only if asynchronous processing becomes necessary

### Backend seams

Name the responsibility and its adapter interface first; the vendor is a
current default behind that seam, not an architectural commitment. Vendors
churn — see the current-information rule in `SKILL.md`.

| Responsibility | Adapter interface | Current default |
| --- | --- | --- |
| Entitlement | `isEntitled(feature)` plus a refresh call returning status, period end and a cache timestamp | RevenueCat over StoreKit / Play Billing |
| AI and OCR | one call returning normalized content, finish reason, usage and typed errors | server-side proxy; on-device OCR first |
| Sync and backup | push/pull of versioned records plus tombstones | Supabase, or the smallest API that satisfies the contract |
| Object storage | put, public or signed URL, metadata, version-aware delete | S3-compatible storage |
| Transactional email | validated recipient, fixed template ID, bounded data | any provider behind a `sendEmail` adapter |
| Product analytics | append-only event write, non-blocking | PostHog, Firebase, or a self-owned endpoint |

No feature code should parse a provider's wire format, and no provider type
should appear in a domain model. Replacing a vendor should mean writing one new
adapter.

### Never ship a provider key in the client

An API key compiled into a Flutter app is extractable from the bundle. If a
feature calls a paid AI, OCR or email provider, the key belongs on a server that
the app calls instead. That server — not the client — owns the model, endpoint,
timeout, output limit and retry policy, and it is also the only place per-user
cost can be measured or capped.

Shipping a key to save building a proxy converts an unbounded provider bill into
someone else's free API.

### Sync contract

Sync is where local-first apps corrupt data. Decide these before writing the
first upload, and record the decision in the app's README:

- Every record carries `updatedAt` and an originating device ID.
- Deletes are tombstones with a defined retention window, never immediate row
  removal — otherwise a device that was offline re-uploads what another device
  deleted.
- Choose last-writer-wins or field-level merge **per entity type** and write the
  choice down. Silent LWW on a notes field loses user text.
- A late arriving message must never reverse newer state. Compare versions
  before applying, and drop what is stale.
- Sync is retriable and therefore at-least-once: pushes need stable operation
  IDs so a redelivery is a no-op.
- A sync failure must never block local use of the app, and must never delete
  local data that has not been confirmed stored remotely.

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
