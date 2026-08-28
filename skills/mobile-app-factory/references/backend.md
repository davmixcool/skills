# Mobile Backend

Most factory apps ship with no backend at all. Local storage plus local
notifications is the default, and it is the reason the privacy promise in
`privacy-security.md` can be made honestly.

Add a backend only when a feature cannot exist without it.

## Scope

| Endpoint | Exists because | Skip when |
| --- | --- | --- |
| AI / OCR proxy | A feature calls a paid provider | On-device OCR is sufficient |
| Sync and backup | Data must survive device loss or reach a second device | Local-only app |
| Entitlement webhook | Server-side state depends on subscription status | No backend at all |
| Push dispatch | A reminder depends on remote data the device cannot know | Local notifications suffice |

**There is no licence server.** The store is the merchant of record and the
entitlement source; RevenueCat or StoreKit/Play Billing already answers "is this
user subscribed". Building a second entitlement system creates two answers to
one question. This is the opposite of the same factory's desktop apps, which
sell direct and must run their own licensing — see `monetization.md`.

## Reference implementation

A proven default, not a requirement. Each vendor sits behind a seam so it can be
replaced without touching app code.

| Concern | Reference system | Replacement seam |
| --- | --- | --- |
| HTTP and scheduled work | Cloudflare Workers | Standards-based request/response handlers and explicit bindings |
| Sync state | Cloudflare D1, Supabase, or any small SQL database | Repository functions plus migrations |
| Uploaded documents | Backblaze B2 | put, signed URL, metadata, version-aware delete |
| Structured AI generation | OpenAI Responses API | Adapter returning content, finish reason, usage, typed errors |
| Transactional email | Resend | `sendEmail(recipient, templateId, data)` |
| Deployment | Wrangler | Declarative config in source control, secrets out of band |

The store and RevenueCat already cover billing and entitlement — no payment
vendor belongs on this list.

Keep non-secret configuration in version control and secrets in the platform's
secret store. Treat the SQL database as authoritative and any key-value layer as
a cache that must never decide entitlement or quota.

## The API contract outlives the app version

Users skip updates, and old app versions keep calling the API they were built
against. Extend additively, never change the meaning of an existing field, and
verify an older client still gets what it expects before shipping. A forced
upgrade is a product failure, not a migration strategy.

## Fail closed on the server

The app fails **open** on entitlement — an unreachable service degrades premium
features but never destroys local data (`monetization.md`). The server does the
opposite: missing configuration, an invalid signature or an ambiguous identity
stops the request before any side effect. Do not copy the client rule into the
server.

## AI and OCR proxy

The proxy exists so the provider key never ships inside the app bundle, where it
is extractable.

- The server owns model, endpoint, timeout and output limit. The client sends
  the image or text, never the configuration.
- Authenticate before spending. An anonymous proxy is someone else's free API.
- Cap request size, upstream response size, and per-user spend per period.
- Return a normalized result — content, finish reason, usage, typed error — so
  no provider wire format reaches the app.
- Prefer on-device OCR for basic date and text extraction. It is faster, works
  offline, costs nothing, and needs no disclosure.
- Disclose remote processing at the point it happens, per `privacy-security.md`:
  what is uploaded, why, and whether it is retained.
- Delete uploaded images once extraction completes. A document scan sitting in
  object storage is a liability with no product value.
- Record usage and estimated cost per attempt, never the content.

If the proxy returns structured data — extracted dates, amounts, document
fields — pin a schema, request structured output against it, and validate
mechanically before returning. Truncation and schema violations are typed
failures, not results. Never cache a failed or malformed response, and never
charge a user for output that failed validation, though the provider cost is
still recorded.

A cache key must include the account, every validated option, the model, and the
schema or prompt version. Never place a raw key or token in a cache key.

## Sync and backup

The contract lives in `architecture.md`. The server side of it:

```text
record    id, user_id, entity_type, payload, updated_at, device_id,
          deleted_at, version
```

- Every write carries the client's `updated_at`, `device_id` and `version`.
- Reject a write whose `version` is older than stored. A late arrival must never
  reverse newer state.
- Deletes set `deleted_at`. Rows are removed only after the retention window,
  so an offline device cannot resurrect what another device deleted.
- Pull is incremental by cursor, not a full table scan.
- Pushes are retried, so they carry a stable operation ID and applying one twice
  changes nothing.
- Sensitive payloads are encrypted at rest, and the retention period is stated
  in the privacy policy.
- A sync failure never blocks local use and never deletes local data that is not
  confirmed stored.

## Entitlement webhook

Only if server-side state depends on subscription status — for example, sync
quota. The app's own gating still reads the client entitlement.

1. Verify the signature over raw bytes before parsing.
2. Insert the provider's delivery ID into a unique column before applying
   anything. Duplicate means already processed.
3. Apply idempotently. A redelivered event must not extend a period or reset an
   allowance.
4. A late event for a superseded subscription must not revoke newer access.
5. Acknowledge verified events you deliberately ignore, or the provider retries
   them forever.

## Push dispatch

Push is for reminders the device cannot compute alone — a shared household
event, a server-side price change, a document expiring based on remote data.

- A reminder the device already knows about is scheduled locally. Never make a
  local reminder depend on network delivery.
- Push is best-effort. It supplements local scheduling; it does not replace it.
- Payloads carry identifiers, not content. A lock-screen preview should not leak
  a passport number or an invoice total.
- Deduplicate by event and occurrence, since delivery is at-least-once.

## Operations

- Secrets live in the platform's secret store, never in the app, the repo, or
  CI logs.
- Apply migrations before deploying code that depends on them; back up first.
- Keep an authenticated delete-my-data path. Stores require it, and
  `privacy-security.md` promises it.
- Smoke test after deploy: proxy call with a capped spend, a sync push replayed
  twice, and a replayed webhook that changes nothing.

## Do not build

- an account system, for a local-only app
- a licence or entitlement server that competes with the store
- a backend "for later", before a feature needs it
- analytics ingestion you could get from a hosted product
- server-side reminder scheduling for reminders the device can compute
