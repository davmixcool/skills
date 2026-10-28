---
name: product-emails
description: Add a product's emails to an email platform — the transactional email it must send (a licence key with a one-click unlock, a sign-in link) and the lifecycle sequences that follow (tips, check-ins, onboarding, trial ending) — with the words kept in one markdown file in the repo, an idempotent setup script that creates the templates and workflows through the platform's API, the sending code, the trigger (a purchase webhook, a signup), deploy wiring, privacy-policy wording and a doctor check with a test send. Supports Plunk (hosted or self-hosted); other platforms plug in as a provider adapter. Use when asked to "add <product> to Plunk", "email buyers their licence key", "set up onboarding / lifecycle / welcome emails", "send a sequence after purchase", "wire Plunk (or another email platform) into the app", or to repeat a sibling product's email setup for a new one.
---

# Product emails

A product's emails, set up the same way every time: decide who gets emailed and why, keep every
word in one markdown file in the repo, create the templates and workflows from it with a script
the deploy re-runs safely, send from the product with code that never loses the important email,
and say so in the privacy policy.

Two kinds of email, kept apart throughout:

- **Transactional**: one email the person needs because of something they just did (their
  licence key, a sign-in link). Sent by the product, by the template's id. No unsubscribe link,
  reaches everyone, never marketing.
- **Lifecycle (marketing)**: a sequence a workflow sends after an **event** the product tracks
  (`purchased`, `signed_up`), with waits between. Always an unsubscribe link; only to people who
  agreed to hear from the product.

Plunk is the provider built in (`providers/plunk.md`). The workflow, the emails file and the
product code's interface (`sendEmail`, `trackEvent`) are provider-neutral, so another platform is
one adapter and one guide (see "Adding a provider").

## Hard rules

- **Never print, log or commit a secret or an address.** Keys come from environment variables
  or the product's local secrets file, read by the scripts, never echoed. Product code logs
  outcomes and status codes, never recipients, keys, links or bodies. Don't ask the user to
  paste a key into the chat: they put it in their secret store themselves.
- **Applying is outward-facing.** `setup.mjs` without `--apply` changes nothing; run that freely.
  Run `--apply` against a real project, `doctor.mjs --send`, or a deploy only when the user says
  so. A test send goes to an address the user owns.
- **The important email can't be lost.** If the provider refuses its template, send the same
  words inline; if the provider is down, make the trigger retry (reference/sending.md,
  reference/triggers.md). If email isn't set up yet, the product's main flow still works.
- **Once per trigger.** A webhook replayed ten times sends one email and one event (a small
  "sent" table keyed by the trigger's id, and an idempotency key on the event).
- **Store the least.** The product keeps the trigger's id and when, not the address or the key.
  Secrets in an email (a key, a sign-in link) are one-shot template variables, never saved on
  the provider's contact.
- **The privacy policy says it** before the first email goes out (reference/privacy.md).

## Workflow

### 1. Read what's there

Look for an existing setup to match: a sibling product's emails file and setup script, an
existing provider module, the product's webhook routes, deploy workflow and secrets file
(`.dev.vars.example`, `.env.example`; never open the real `.dev.vars`/`.env`). Note the stack
(Workers, Node, other), how secrets reach production, and the product's voice (its copy guide).

### 2. Decide who gets what (reference/plan.md)

Write down, and confirm with the user if any of it isn't obvious:

- **Who** is emailed and why they agreed (buyers; signups who ticked a box; trial users).
  A product with no accounts emails only buyers.
- **The transactional email(s)**: what triggers each, what it carries, the fallback words.
- **The sequence(s)**: event name, each email's wait, subject and one-line purpose. Two or three
  short emails beat six.
- **Senders**: a sending subdomain (`updates.<domain>`), the From name and address for marketing
  (a person: "Sam at Pebble") and for transactional (the product), and a reply-to that a person
  reads.

### 3. The provider project (providers/<provider>.md)

The parts only the user can do in the provider's dashboard and DNS: a project per product, the
sending domain and its DNS records, the API keys into the product's secrets. Give them the exact
steps from the provider guide, with the product's names filled in, and do what you can yourself
(e.g. adding DNS records through a DNS API the user has authorised).

### 4. The emails file (reference/emails-file.md)

Start from `assets/emails.md`; write the product's real words in its voice. Put it where the
product keeps copy (e.g. `marketing/outbound/emails.md`). Then the config, from
`assets/emails.config.json`, next to the setup script.

### 5. The setup script, vendored

Copy into the product, keeping this layout (the imports are relative):

```
<product>/scripts/emails/setup.mjs
<product>/scripts/emails/doctor.mjs
<product>/scripts/emails/lib/config.mjs
<product>/scripts/emails/lib/templates.mjs
<product>/scripts/emails/providers/<provider>.mjs
```

It lives in the product because the deploy runs it, and the deploy can't rely on this skill being
installed. Add scripts (`"emails:setup": "node scripts/emails/setup.mjs --config emails.config.json"`,
`"emails:doctor": …`), and a test of the product's own file in the style of
`scripts/setup.test.mjs` (its fake provider works as is). Run a preview:

```bash
node scripts/emails/setup.mjs --config emails.config.json        # lints, then shows the plan
```

Without the key it stops after the lint; that's enough to check the file.

### 6. Sending code (reference/sending.md)

Copy `assets/plunk.ts` (or the provider's equivalent) into the product's provider folder and
adapt it to the product's config and logger. Write one module per transactional email: its
template id from the config, the inline fallback with the same words, the result passed back.

### 7. The trigger (reference/triggers.md)

Where the email starts: a payment webhook (Polar, Stripe, Paddle), a signup, a trial. Verify the
signature, filter to this product, look up the "sent" table, send, record, then track the event.
Answer so the platform retries only what a retry can fix.

### 8. Deploy (reference/deploy.md)

The deploy runs `setup.mjs --apply --enable-new` and passes each transactional id to the product
as config. Until the user has set the provider's secrets, the step is skipped with a warning and
the product runs without email, rather than failing every deploy.

### 9. Privacy and the product's pages (reference/privacy.md)

Update the privacy policy, and any page that says who emails the key ("check your email from
<payment provider>"). If the email links to a page (an unlock page), build it.

### 10. Verify

1. The product's tests: the trigger with the provider stubbed (sent once, retried on 5xx, inline
   fallback on a refused template, nothing for another product's event), and the setup test.
2. `setup.mjs` preview: lint clean, the plan as expected.
3. After the user has done step 3 and said go: `setup.mjs --apply`, then
   `doctor.mjs --send <template> --to <their address>`, and they check the inbox: sender, words,
   the button works.
4. One real (or sandbox) purchase or signup end to end, once deployed.

## Present results to the user

Lead with what they have to do, in order, as a checklist (dashboard, DNS, secrets, the go-ahead
to apply), then what was built and where, then what was run (tests, preview) and what wasn't
(nothing applied, nothing sent, nothing deployed, unless they said so). Name every file changed.

## Adding a provider

1. `scripts/providers/<name>.mjs`, exporting what `plunk.mjs` does: `name`, `unsubscribe`,
   `keyProblem(key)`, `lint(parsed)`, and `connect({ apiUrl, key, fetch })` returning
   `checkKey`, `findTemplate`, `createTemplate`, `updateTemplate`, `findWorkflow`,
   `createWorkflow`, `isEnabled`, `enableWorkflow`, `send`. Where the provider's API can't do
   one (some build workflows only in their dashboard), return `{ manual: '<what to click>' }`
   from it and setup prints that.
2. `providers/<name>.md`: project and domain setup, keys, the send and track calls, quirks.
3. `assets/<name>.ts`: the product-side `sendEmail` / `trackEvent` with the same results
   (`sent` / `rejected` / `failed`, and true/false).
4. Tests in `scripts/` with a fake of its API, as `setup.test.mjs` does for Plunk.

## Troubleshooting

- **"has no {{unsubscribeUrl}} link"**: every marketing email needs it; add the footer line.
- **Setup made a second template**: someone renamed one in the dashboard; setup finds by name.
  Rename it back, or delete the duplicate.
- **401 from the provider**: the wrong project's key, or a public key where a secret key is
  needed. `doctor.mjs` says which check failed.
- **The test send never arrives**: the sending domain isn't verified yet, or the provider is in
  a sandbox that only sends to verified addresses (SES without production access). Check spam.
- **The workflow exists but nothing sends**: it's off (`doctor.mjs` shows `off`), or the event
  name the product tracks differs from the workflow's.
