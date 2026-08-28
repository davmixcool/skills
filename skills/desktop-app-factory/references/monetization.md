# Desktop Utility Monetization

Choose monetization based on value and ongoing cost, not founder preference.

## Model A — One-time purchase

Strong default when:
- core value is local
- support/cloud cost is low
- the app is a narrow utility
- users expect ownership

Possible structure:
- limited free/trial
- one-time Pro unlock
- optional paid major-version upgrades later

## Model B — Annual license/subscription

Use when:
- hosted AI/API usage creates recurring cost
- cloud sync/collaboration matters
- the product evolves continuously
- professional workflow value is ongoing

Avoid monthly-only pricing for a tiny utility unless the value is obviously recurring.

## Model C — One-time + optional service plan

Example shape:
- buy the local app once
- optional annual plan for cloud sync, AI credits, team features, or major updates

This can align cost with value better than forcing all users into a subscription.

## Model D — Team/business licensing

Use when:
- the utility saves employee time
- deployment/admin controls matter
- businesses want multi-seat management

## Trial/paywall principles

The user should experience the core workflow before the purchase decision whenever practical.

Good gating dimensions:
- automation count
- history length
- advanced transforms
- batch size
- multiple watched folders/projects
- sync/collaboration
- professional/export features
- AI usage/credits

Weak gating dimensions:
- dark mode
- basic settings
- fixes to intentionally crippled UX

## Pricing heuristic

Do not treat static reference prices as current market facts.

When setting exact pricing:
1. find current direct competitors
2. inspect store/direct-purchase norms
3. estimate time/money saved
4. estimate recurring service cost
5. test one simple price before creating a complex matrix

For narrow utilities, simplicity usually beats tier explosion.

## Who takes the money

Selling direct makes you the merchant. From the first sale that means collecting
and remitting tax in jurisdictions you may never have heard of — EU VAT applies
from the first euro, with no threshold for digital goods sold to consumers.

A merchant of record (Polar, Paddle, Lemon Squeezy, FastSpring and others)
becomes the seller of record and absorbs that obligation, in exchange for a
percentage. For a solo developer this is usually the difference between shipping
and not shipping.

- Decide the merchant of record before pricing, because its cut and its
  supported payout countries change the numbers.
- App-store distribution is different: the store is already the merchant, and
  its own billing is mandatory for digital goods. A product shipping both direct
  and through a store needs both paths, and one licence model that spans them.
- Keep product-to-plan mapping in configuration, not in code, so test and
  production can point at different products.
- Lifecycle events arrive by webhook and are retried. Verify the signature
  against the raw request bytes before parsing, deduplicate by the provider's
  delivery ID, and make application idempotent — a redelivered event must not
  extend a licence or reset an allowance.
- A late event for a superseded subscription must not revoke newer access.

## Licensing reliability

Define:
- activation flow
- offline grace
- machine/device policy
- restore after reinstall
- refund/revocation behavior if applicable
- what happens when licensing service is unavailable

Never make temporary network failure destroy local user data or lock essential export/delete paths.

This inverts the usual server instinct to fail closed. A licence service that
cannot be reached is not evidence of piracy, and locking a paying user out of
their own local files during an outage costs more trust than the occasional
unlicensed session saves. Fail open, degrade premium features only, and keep
export and delete available unconditionally.

Additional rules:
- Validate a licence payload's signature locally so an offline check is still
  meaningful, and keep the public key in the binary.
- Never rely on the system clock alone for expiry; it is user-settable. Record
  the last verified server time and treat a clock that jumps backwards as
  suspicious rather than authoritative.
- Activation, deactivation and restore are retriable. Applying the same
  activation twice must not consume a second device seat.
- State what happens at the seat limit, and give the user a self-service way to
  release a machine they no longer own.
