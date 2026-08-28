# Analytics

## North-star behavior

A user successfully delegates a recurring responsibility to the app.

This means:
1. adds a tracked entity
2. accepts/creates at least one event
3. enables reminders
4. later acts on a reminder

## Core funnel

### Acquisition
- install
- first_open
- acquisition_source

### Activation
- onboarding_started
- entity_added
- reminder_generated
- reminder_enabled
- notification_permission_granted

### Engagement
- reminder_opened
- reminder_completed
- reminder_snoozed
- entity_viewed
- history_viewed

### Monetization
- paywall_viewed
- trial_started
- purchase_completed
- purchase_restored
- subscription_cancelled if available

## Core KPIs

### Activation rate
Percent of new users who create their first tracked entity.

### Reminder setup rate
Percent of activated users who enable at least one reminder.

### Notification permission rate
Percent granting notifications after the value prompt.

### Reminder action rate
Percent of delivered/opened reminders resulting in completion, snooze or other action.

### D7 / D30 retention
Measure by niche carefully because some reminder apps naturally have infrequent usage.

Also track:
- retained installation
- active tracked entities
- future reminders scheduled

These can be more meaningful than daily active usage.

### Free-to-paid conversion
Track:
- overall
- after activation
- by acquisition source
- by paywall variant

### Paid retention
Most important long-term revenue metric.

## Telemetry must never harm the app

Analytics is not a feature the user asked for, so it never degrades one:

- An analytics or crash SDK failure must not delay, block, or fail a user
  action. Fire and forget; never await a network write on a UI path.
- The offline event queue is bounded and lossy by design. Cap it, drop oldest
  first, and never let it grow until it becomes a storage complaint.
- A failed telemetry write is not an error worth surfacing to the user.

## Cost per active user

Any app with remote OCR, AI, sync or backup has a per-user cost that decides
whether its pricing works — and whether a lifetime tier is survivable.

Record for every real provider attempt, including attempts whose output was
rejected as invalid:
- feature, provider and model
- normalized token, byte, or request usage
- estimated cost from a versioned pricing constant
- outcome and typed error class

Never record the content itself. Cost per active user and cost per paying user
belong in the factory dashboard next to conversion — a niche can convert well
and still lose money per user.

## Experiments

Test one major variable at a time:
- onboarding promise
- free limit
- annual price
- trial/no-trial
- paywall timing
- notification permission timing
- first domain template

## Factory dashboard

Maintain a cross-app table:

| App | Installs | Activation | Reminder Setup | Paid Conversion | D30 | Annual Revenue |
|---|---:|---:|---:|---:|---:|---:|

The purpose of the portfolio is to find the niches with the strongest economics, not merely the most downloads.
