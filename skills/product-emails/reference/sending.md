# Sending from the product

Two layers: the **provider module** (`assets/plunk.ts`: talks to the provider, knows nothing
about the product) and one **email module** per transactional email (knows the words, the
variables and the fallback). Triggers call the email module and `trackEvent`.

## The provider module

`sendEmail(mail, config) → 'sent' | 'rejected' | 'failed'`

| Result | Means | The caller |
| --- | --- | --- |
| `sent` | accepted | records it |
| `rejected` | 4xx: a missing template, a bad field, a bad address | tries the inline words once; never retries the same thing |
| `failed` | unreachable, timeout, 429, 5xx, or not configured | asks the trigger to retry later |

`trackEvent(event, config) → boolean`: true when the provider has it, now or already (Plunk's
409 for a seen idempotency key). A false is logged and never undoes the transactional email.

Keep the provider's names for its secrets (`PLUNK_SECRET_KEY`, `PLUNK_KEY`), so it's always clear
which service a key belongs to. The product's config hands them in: on Workers, from `env`.

## An email module

```ts
// src/emails/licence.ts
import { sendEmail, oneShot, type SendResult } from '../providers/plunk';

export const unlockUrl = (siteUrl: string, key: string) =>
  `${siteUrl.replace(/\/$/, '')}/unlock#key=${encodeURIComponent(key)}`;   // after #: never sent to a server

/** The first word of the name they gave, or "there". */
export function firstName(name: string | null | undefined): string {
  const first = (name ?? '').trim().split(/\s+/)[0] ?? '';
  return first && first.length <= 40 ? first : 'there';
}

export async function sendLicenceEmail(to: string, name: string, key: string, env: Env): Promise<SendResult> {
  const plunk = { apiUrl: env.PLUNK_API_URL, secretKey: env.PLUNK_SECRET_KEY };
  const url = unlockUrl(env.SITE_URL, key);
  const template = String(env.PLUNK_LICENCE_TEMPLATE ?? '');
  if (template) {
    const result = await sendEmail({ to, template, data: { firstName: name, key: oneShot(key), unlockUrl: oneShot(url) } }, plunk);
    if (result !== 'rejected') return result;
    log.error('licence_email.template_failed', {});    // a wrong id, a deleted template
  }
  return sendEmail({ to, subject: 'Your Pebble Pro key', from: { name: 'Pebble', email: 'hello@updates.pebble.app' },
    reply: 'hello@pebble.app', html: inline(name, key, url) }, plunk);
}
```

- `inline()` is the emails file's words, with every value HTML-escaped. Keep the two in step
  (a test can check the subject and that the key and link appear).
- Secrets are `oneShot()`: used for this email, never saved on the contact.
- `firstName` is the only thing saved on the contact (and the event's `data`).

## Logging

Log the outcome and the provider's status: `licence_email.sent`, `licence_email.template_failed`,
`plunk.send_failed {status}`, `…sequence_not_started`. Never the address, the name, the key, the
link or the body. These are the lines to watch after launch.

## Tests

Stub `fetch` (a queue of expected calls is simplest) and cover:

- the template send: the right id, `firstName`, the secrets as one-shot values;
- a refused template (404): the inline words go, with the key and the link in them;
- the provider down (502): `failed`, so the trigger asks for a retry;
- not configured: `failed` without a network call.
