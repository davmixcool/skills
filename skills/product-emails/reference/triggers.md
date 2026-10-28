# Triggers

Where an email starts, and how the trigger answers so its source retries only what a retry can
fix.

## The shape, whatever the source

1. **Verify** the delivery (the webhook's signature). Unsigned or wrong: 401.
2. **Filter** to this product: the payment account may sell several (match the product or benefit
   id). Anything else: acknowledge (2xx) and stop.
3. **Once**: look the trigger's id up in a small table (`licence_emails(license_key_id, sent_at)`,
   `welcome_emails(user_id, sent_at)`). Seen: acknowledge.
4. **Email off?** If the provider isn't configured yet (no secret key), log it and acknowledge:
   the product works without email, and a retry storm could get the endpoint disabled, taking
   the source's other events down with it.
5. **Send** the transactional email. `failed` → 503 (retry later); `rejected` even inline → log
   and acknowledge (retrying won't help).
6. **Record** the id, then **track** the event with `subscribed: true` (they agreed: they bought,
   or ticked the box) and the idempotency key `<event>:<trigger id>`.

Nothing about the person is stored: the table holds the id and the time.

| Situation | Answer | Why |
| --- | --- | --- |
| bad signature | 401 | not from the source |
| another product, another event | 202 | not ours |
| already sent | 202 `{ duplicate: true }` | a replay |
| email not configured | 202 | retrying won't configure it |
| provider down / 5xx / timeout | 503 | a retry will work |
| a lookup the source refused for good (404, 403) | 202, logged | a retry won't change it |
| sent | 202 | done |

## Polar (licence keys)

Polar sends `benefit_grant.created` when a licence-key benefit is granted. The payload has the
benefit id, the customer's email and name, and the key's **id** (`properties.license_key_id`),
not the key. Read the key with an organization token that has `license_keys:read`:

```
GET {POLAR_API}/v1/license-keys/{license_key_id}     Authorization: Bearer <token>   → { key, … }
```

- Filter on `benefit_id === <this product's benefit>`: the organization may sell other products.
- Subscribe the webhook endpoint to `benefit_grant.created` (plus whatever it already handles).
  If the product's Polar setup script manages the endpoint's events, add it there.
- Polar emails the key itself too. Say so in your email, and on the checkout's success page.
- `order.paid` is the event for counting sales or credit packs; the key email belongs on the
  grant, which is when the key exists.

## Stripe

`checkout.session.completed` (or `invoice.paid` for subscriptions): `customer_details.email`,
`customer_details.name`, and the session id as the trigger id. Verify with the endpoint's signing
secret. If the product issues its own key, create it before sending, idempotently per session.

## Signups and trials

No webhook: the product's own route. After the account (or trial) is created:

- the transactional email (a sign-in link) goes from the route, through the email module;
- `trackEvent('signed_up', { subscribed: <their marketing choice> })` starts the sequence. With
  `subscribed: false` the provider skips its marketing emails to them, so anything they must get
  (a trial ending that changes what they pay) is a transactional template, not a sequence email.

Do it after the database write commits, and don't fail the signup if the provider is down: log,
and let the person ask for the link again.
