# Monetization

## Default business model

Freemium mobile subscription.

Recommended starting structure:

### Free
- 1 tracked entity or limited active reminders
- core notifications
- enough value to experience the product

### Premium
- unlimited entities
- advanced reminder schedules
- history
- smart templates
- document/photo scanning
- cloud backup/sync if available
- export
- family/shared access where relevant

## Pricing principle

Price against the consequence avoided, not development effort.

Suggested testing bands:

### Consumer utility
- $14.99–$29.99/year
- $2.99–$4.99/month

### Higher-value financial/professional utility
- $29.99–$59.99/year
- $4.99–$9.99/month

Do not blindly copy these numbers. Test by niche and market.

## Preferred paywall timing

Do not show the paywall before the user understands the product.

Strong moments:
- after first item is configured
- when adding the second item
- when enabling an advanced smart feature
- after previewing generated reminders

## Paywall message framework

### Headline
Outcome, not feature.

Example:
> Never miss what your car needs next.

### Proof
Show exactly what premium protects:
- service deadlines
- insurance expiry
- inspection
- maintenance history

### Offer
- annual highlighted
- monthly available
- clear renewal language

## Trial rules

Use a trial when the user needs time to experience recurring value.

Avoid trials when:
- value is immediately obvious
- the niche has low retention
- users can exploit the utility and leave

## Lifetime pricing

Use cautiously.

Appropriate when:
- backend cost is close to zero
- user lifetime usage is long
- lifetime offer creates early cash

Avoid if cloud/AI costs are expected to grow.

## Who takes the money

On iOS and Android the store is the merchant of record for in-app digital
goods. It collects payment, handles tax, and takes its cut. That is not a
choice, and wiring an external payment provider such as Polar, Paddle or Stripe
into an app-store binary to sell in-app digital content violates store policy.

This is the opposite of the same factory's desktop apps, which sell direct and
therefore need their own merchant of record. Do not carry a desktop billing
design into a mobile app.

Consequences to plan for:
- The store's commission applies to every price band in this document.
- Refunds and chargebacks are handled by the store, not by the app.
- What may be linked to, steered toward, or sold outside the app changes with
  regulation and store policy, and differs by region. Verify current rules
  before designing around an external purchase path — see the
  current-information rule in `SKILL.md`.

## Entitlement integrity

The store owns the transaction. The app stays authoritative for what the user
can currently do, so the entitlement check needs its own rules:

1. Treat the cached entitlement as a bounded cache, not a source of truth.
   Store status, the period end, and when it was last refreshed.
2. Define an offline grace window and honour it. A user on a plane with no
   network must keep the features they paid for.
3. When the entitlement service is unreachable and grace has expired, degrade to
   read-only rather than destroying anything. Never delete local data, and never
   block export, delete, or existing reminders because of a billing check.
4. Never trust the device clock alone for expiry. It is user-settable.
5. Restores and redelivered receipts are at-least-once. Applying one twice must
   not extend a period, reset a counted allowance, or grant a second trial.
6. Test restore on a clean install, on a second device, and after a refund.
7. A revoked or expired subscription removes premium features only. It never
   removes the user's own records.

## Revenue target math

Track:

`downloads -> activated users -> paywall viewers -> trial starts -> paid -> retained paid`

Do not optimize installs while ignoring activation and paid retention.
