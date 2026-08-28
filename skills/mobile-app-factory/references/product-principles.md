# Product Principles

## 1. The product is not the reminder

A phone already has alarms, calendars, reminders and notifications.

The value comes from domain knowledge.

Bad:
> Remind me on September 20.

Good:
> Your vehicle insurance expires in 30 days.

Better:
> Your vehicle insurance expires in 30 days. Renew it now or remind me again in 7 days.

## 2. Every app owns one responsibility

Each app should answer:

> What important responsibility can this app remember better than the user?

Examples:
- vehicle ownership
- passport/visa/document expiry
- subscription renewals
- pet health schedules
- home maintenance
- invoices and client follow-ups

Avoid broad positioning such as "remember everything".

## 3. Optimize for consequence

The best niches involve one or more of:

- losing money
- missing a legal/compliance deadline
- damaging an asset
- losing an opportunity
- embarrassment
- health risk
- recurring mental load

The greater the consequence, the easier monetization becomes.

## 4. The app should generate reminders

The user should not manually construct every reminder.

Preferred flow:

1. User adds an entity.
2. User gives minimal context.
3. App generates recommended events.
4. User accepts or edits them.
5. App monitors and reminds.

## 5. Reduce setup friction

Target first value in under 60 seconds.

Use:
- smart defaults
- templates
- OCR/scanning
- prebuilt schedules
- auto-detected dates
- simple onboarding

Do not require:
- account creation before value
- long forms
- mandatory cloud sync
- complex setup wizards

## 6. Offline-first by default

The core app should remain useful without a server.

Local-first should cover:
- entities
- events
- reminder schedules
- reminder history
- settings
- entitlement cache

Cloud features are optional additions.

## 7. AI is a feature, not the architecture

Use AI for:
- OCR correction
- extracting dates from documents
- understanding receipts
- identifying car maintenance entries
- generating follow-up messages
- classifying imported content

Do not make basic reminder reliability dependent on an LLM call.

## 8. One obvious premium promise

Examples:
- "Never miss a renewal."
- "Know what your car needs next."
- "Never lose money because you forgot to follow up."

Premium should unlock increased confidence, automation or coverage—not cosmetic features alone.

## 9. Earn expansion

Do not add marketplace, community, chat, AI assistant, social features or complex backend systems before retention proves the core reminder loop matters.

Expansion order:

1. Reminder utility
2. History / records
3. Smart recommendations
4. Action workflows
5. Marketplace/services only if demand exists

## 10. Kill weak ideas quickly

A niche should be reconsidered if:
- users do not complete setup
- fewer than 30% create the first tracked entity
- reminders do not produce meaningful opens/actions
- users say the phone calendar is enough
- users cannot explain why they would pay
- retention collapses after the initial setup period
