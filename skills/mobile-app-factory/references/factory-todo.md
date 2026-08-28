# Mobile App Factory — TODO

## Phase 1 — Build the reusable core

### Project foundation
- [ ] Create Flutter starter repository
- [ ] Configure iOS and Android projects
- [ ] Add routing
- [ ] Add state management
- [ ] Add theme system
- [ ] Add environment/config handling

### Database
- [ ] Add Drift/SQLite
- [ ] Implement TrackedEntity
- [ ] Implement LifecycleEvent
- [ ] Implement ReminderRule
- [ ] Implement ActionRecord
- [ ] Add migrations

### Reminder engine
- [ ] Schedule local notification
- [ ] Cancel notification
- [ ] Multiple offsets per event
- [ ] Snooze
- [ ] Complete event
- [ ] Generate next recurring event
- [ ] Reconcile scheduled notifications
- [ ] Handle timezone changes
- [ ] Detect disabled notification permission

### Shared UI
- [ ] Onboarding shell
- [ ] Home / due-soon view
- [ ] Add entity flow
- [ ] Event detail
- [ ] Timeline/history
- [ ] Settings
- [ ] Empty states

### Monetization
- [ ] RevenueCat integration
- [ ] Entitlement service
- [ ] Annual product
- [ ] Monthly product
- [ ] Paywall component
- [ ] Restore purchase
- [ ] Free-limit gate

### Analytics
- [ ] Analytics provider
- [ ] Crash reporting
- [ ] Shared event naming
- [ ] Activation funnel
- [ ] Paywall events
- [ ] Reminder interaction events

### Privacy
- [ ] Local data deletion
- [ ] Export mechanism
- [ ] Privacy policy template
- [ ] Permission rationale copy

## Phase 2 — Ship first factory app

Recommended: **Car maintenance reminder**.

- [ ] Define vehicle entity fields
- [ ] Define maintenance event templates
- [ ] Define insurance/registration expiry templates
- [ ] Define mileage-based V1 strategy
- [ ] Brand/name app
- [ ] Write onboarding
- [ ] Build niche-specific screens
- [ ] Configure paywall
- [ ] Create store assets
- [ ] Test notifications extensively
- [ ] Ship TestFlight / internal Android test
- [ ] Submit stores

## Phase 3 — Learn before cloning

- [ ] Measure activation
- [ ] Measure notification opt-in
- [ ] Measure reminders created
- [ ] Measure reminder actions
- [ ] Measure paid conversion
- [ ] Interview early paid users
- [ ] Fix reusable factory problems in the core repo

## Phase 4 — Extract reusable template

Only after App #1 ships:

- [ ] Identify niche-specific code
- [ ] Move generic code into shared packages/modules
- [ ] Create documented app config
- [ ] Create starter generator/script if helpful
- [ ] Document store setup
- [ ] Document analytics setup
- [ ] Document RevenueCat setup

## Phase 5 — Launch App #2

Recommended: **Expiry reminder**.

Goal: prove that the factory reduces build time substantially without making every app feel identical.

## Important constraint

Do **not** build the factory as a platform before shipping the first real app.

The first app is how you discover what actually deserves to be reusable.
