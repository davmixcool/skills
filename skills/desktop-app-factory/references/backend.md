# Desktop Utility Backend

A desktop utility usually needs no backend. When it does, it needs four small
endpoints, not an application platform.

Build only what a concrete requirement forces. Every endpoint here is one the
app cannot function without once the corresponding feature exists.

## Scope

| Endpoint | Exists because | Skip when |
| --- | --- | --- |
| Licence activation and validation | The app is paid and sold direct | Store-distributed, or free |
| Update manifest | The app self-updates | Store-distributed |
| Billing webhook receiver | A merchant of record sells the licence | No direct sales |
| AI proxy | A feature calls a paid provider | No hosted AI |
| Licence delivery email | Someone buys and needs their key | No direct sales |

A small edge runtime, a single relational database and object storage cover all
of it. Do not stand up a general-purpose application server for a licence check.

## Reference implementation

A proven default, not a requirement. Each vendor sits behind a seam so it can be
replaced without touching product logic — the seam is the architecture, the
vendor is today's answer.

| Concern | Reference system | Replacement seam |
| --- | --- | --- |
| HTTP and scheduled work | Cloudflare Workers | Standards-based request/response handlers and explicit bindings |
| Licence and release state | Cloudflare D1, or any small SQL database | Repository functions plus migrations, never provider calls in handlers |
| Artifacts and update feed | Backblaze B2 behind a CDN | put, public URL, metadata, version-aware delete |
| Short-lived coordination | Cloudflare KV | Versioned key namespaces with explicit TTL |
| Periodic sweeps | Cron triggers | A scheduler invoking the same idempotent operations |
| Billing and merchant of record | Polar, Paddle, Lemon Squeezy | Product mapping, checkout client, verified idempotent webhook |
| Structured AI generation | OpenAI Responses API | Adapter returning content, finish reason, usage, typed errors |
| Transactional email | Resend | `sendEmail(recipient, templateId, data)` |
| Deployment | Wrangler | Declarative config in source control, secrets supplied out of band |

Keep non-secret bindings and settings in version control, generate types from
that config, and supply secrets through the platform's secret mechanism rather
than committed files.

D1 is authoritative state, not a cache. KV is eventually consistent and must
never be the source of truth for a seat count, an expiry, or a one-time
transition.

## Data model

Small enough to fit in one migration:

```text
licence          id, key_hash, product, plan, status, issued_at, expires_at,
                 seats, order_ref
activation       id, licence_id, device_id, device_label, activated_at,
                 last_seen_at, released_at
webhook_delivery provider, delivery_id (unique), received_at, event_type
release          version, channel, artifact_url, sha256, size, signature,
                 published_at
```

Store a hash of the licence key, not the key. `webhook_delivery.delivery_id`
carries a unique constraint — that constraint is the deduplication mechanism,
not application code that checks first and inserts second.

## Licence activation and validation

1. Rate-limit by key and by source address before touching the database. An
   activation endpoint is a brute-force target.
2. Look up by key hash with a timing-safe comparison.
3. Activation is idempotent: re-activating the same `device_id` returns the
   existing activation and consumes no additional seat.
4. Enforce the seat limit only after the idempotent case is handled.
5. Return a **signed payload** — licence status, plan, expiry, issued-at, device
   ID — that the app verifies offline with a public key baked into the binary.
   The signature is what makes offline validation meaningful.
6. Keep the payload short-lived and re-issue it on each successful validation,
   so revocation propagates without requiring a live check on every launch.
7. Include server time in the payload. The client compares it to the system
   clock and treats a large backwards jump as suspicious rather than
   authoritative.
8. Never return the licence key, another customer's data, or a distinguishable
   error for "no such key" versus "wrong product".

Releasing a seat must be self-service. A user who reinstalls an OS or sells a
laptop should not have to email support.

## Update manifest

- Serve the manifest and artifacts from object storage or a CDN, never from
  application compute. Bandwidth through a Worker is the most expensive way to
  ship a binary.
- The manifest is public. It contains no customer data and needs no auth.
- Version, digest, size and signature come from the `release` row so the feed
  cannot drift from what was actually published.
- Released artifacts are immutable — see `distribution-signing.md`. The backend
  must refuse to publish a version that already exists rather than overwriting
  it.
- Keep prior versions listed. Users skip releases, and rollback needs them.

## Billing webhook receiver

Webhooks are retried, arrive out of order, and are the one endpoint an attacker
can call directly.

1. Read the raw body first. Verify the signature over exact bytes, before any
   JSON parsing.
2. Enforce a short timestamp tolerance.
3. Compare signatures in constant time, and support multiple valid signatures so
   secret rotation does not drop deliveries.
4. Insert `delivery_id` into `webhook_delivery` before applying anything. A
   duplicate key means already processed: acknowledge and stop.
5. Apply the state change idempotently, then acknowledge.
6. A late event for a superseded subscription must not revoke newer access.
   Compare against current state before downgrading anything.
7. Treat "created" style events as audit-only; they can precede payment.
8. Acknowledge verified events you do not act on. Returning an error makes the
   provider retry something you deliberately ignored.
9. Never log the secret, the signature, the raw body, or the computed MAC.

Store the endpoint secret exactly as the provider issued it, including any
prefix. Trimming or decoding it before use is a common cause of every delivery
failing signature verification.

## AI proxy

The proxy exists so the provider key never ships to a user's machine.

- The server owns model, endpoint, timeout, output limit and retry policy. The
  client sends inputs, never configuration.
- Authenticate the caller by licence before spending anything.
- Cap request size, upstream response size, and per-licence spend. An
  unauthenticated or uncapped proxy is someone else's free API.
- Return a normalized result — content, finish reason, usage, typed error — so
  no provider wire format reaches the app.
- Record usage and estimated cost per attempt, including attempts whose output
  failed validation. Never record the content.
- If the product supports a user's own key, accept it in a dedicated header,
  keep it ephemeral, and never persist it beside platform credentials.

## Email

Licence delivery is transactional and must not be lost.

- Validate the recipient, use a fixed template ID and bounded data.
- Send from a domain with SPF, DKIM and DMARC configured, or keys land in spam
  and support cost exceeds the sale.
- Links are one-use, short-lived and built from a fixed origin, never from a
  caller-supplied redirect.
- Never log the key, the token, or the recipient address.
- A failed send must not roll back a completed purchase. Queue a retry and make
  the key recoverable from the account page.

## The endpoint contract is permanent

A desktop binary from two years ago is still running on someone's machine and
will call the version of the API it was compiled against. Unlike a web app, you
cannot migrate those clients.

- Extend additively. New fields, new endpoints — never a changed meaning for an
  existing field.
- Before shipping a change, prove an old client's request produces the same
  response it did before.
- If a replacement contract is unavoidable, version it and keep the old one
  serving until telemetry shows the old binaries are gone.
- The update manifest shape is part of this contract. Break it and you lose the
  ability to update the very clients that need updating.

## Fail closed on the server

The client fails **open** on licence checks — an unreachable server must not lock
a paying user out of their own files (`monetization.md`). The server does the
opposite: missing configuration, an invalid signature, an ambiguous identity or
an unsafe destination stops the request before any side effect.

Both are the same principle applied to who bears the cost of uncertainty. Do not
copy the client rule into the server.

## Structured output and caching

If the AI proxy returns structured data:

- Pin a schema, request structured output against it, and validate mechanically
  before returning. Never hand a caller unvalidated provider JSON.
- Treat truncation, incomplete output and schema violations as typed provider
  failures, not as results.
- Never cache a failed, truncated or malformed response.
- Do not charge for provider work whose output failed validation, but do record
  its cost — the provider still bills you.

A cache key must include every input that can change the answer: the licence or
account, all validated options, the model, the schema or prompt version, and the
credential mode. Where the user supplies their own provider key, isolate their
entries with an HMAC fingerprint of that key computed with an independent
secret. Never put a raw key, header, or token into a cache key or value.

## Storing a user's own credentials

If the product lets a customer supply their own provider key and the server
retains it:

- Encrypt with AES-256-GCM or an equivalent authenticated cipher.
- Use a random nonce per encryption, and bind the ciphertext to the account,
  resource and field with additional authenticated data.
- Version the envelope and keep an active write key while older versions remain
  readable, so rotation is possible.
- Expose whether a key is configured, never the value.
- Delete recurring credentials when their owning configuration is deleted.

## Operations

- Secrets live in the platform's secret store. Independent secrets for
  independent purposes, so rotating one does not break another.
- Keep non-secret configuration — product-to-plan mapping, public delivery
  domain, channel names — in version-controlled config so environments differ
  without code changes.
- Apply migrations before deploying code that depends on them, and back up
  before anything destructive.
- CI pins the runtime, installs from the lockfile, runs tests and a deploy
  dry-run, and defaults to read-only permissions.
- Smoke test after deploy against a dedicated licence: activate, validate
  offline, exceed the seat limit, replay a webhook, and confirm the replay
  changed nothing.

## Do not build

- user accounts, if a licence key is sufficient
- a dashboard, before customers ask for one
- analytics ingestion you could get from a hosted product
- a queue, until a real operation needs to outlive a request
- multi-tenancy, for a single-product utility
