# Plunk

[Plunk](https://www.useplunk.com) (open source, AGPL-3.0: github.com/useplunk/plunk): contacts,
events, workflows, transactional and marketing templates, broadcasts. Hosted, or self-hosted
sending through your own AWS SES. Adapter: `scripts/providers/plunk.mjs`; product code:
`assets/plunk.ts`.

| | Hosted | Self-hosted |
| --- | --- | --- |
| API (`apiUrl`) | `https://next-api.useplunk.com` | the instance's API host (e.g. `https://mail-api.example.com`) |
| Dashboard | Plunk's app | the instance's dashboard host |

## Set up a product (the user, in the dashboard)

1. **A project per product** (Plunk's project switcher → New project). Contacts, templates,
   workflows and keys are per project, so products never share a list. Projects are made in the
   dashboard; the API can't.
2. **The sending domain**: the project's settings → Domains → add `updates.<product domain>`.
   Plunk shows DKIM records and a MAIL FROM subdomain (`plunk.updates.<domain>` by default: an MX
   and a TXT, so that name can't already be a CNAME). Add them in the domain's DNS exactly as
   shown (on Cloudflare: DNS only, grey cloud), then wait for **Verified**.
3. **The keys**: the project's settings → API keys.
   - **Secret key** `sk_…`: setup, doctor and sending (`/v1/send`). Into CI secrets and the
     product's runtime secrets.
   - **Public key** `pk_…`: tracking events (`/v1/track`). Into the product's runtime secrets.
4. **Self-hosted on SES**: the SES account must be out of the SES sandbox (production access) to
   reach real inboxes; in the sandbox it sends only to verified addresses.

Fill in the product's names when handing these steps over, and say which secret goes where.

## The calls

Management (setup, doctor), `Authorization: Bearer sk_…`:

| Call | |
| --- | --- |
| `GET /templates?search=<name>&pageSize=100` | find by name (the list may be `data`, `items` or a bare array) |
| `POST /templates` `{ name, subject, body, from, fromName, replyTo, type }` | `type`: `MARKETING` or `TRANSACTIONAL` |
| `PATCH /templates/:id` | same fields |
| `GET /workflows?search=<name>&pageSize=100` | find by name |
| `POST /workflows` `{ name, eventName, allowReentry: false, enabled: false }` | once per person |
| `POST /workflows/:id/steps` `{ type: 'DELAY', config: { amount, unit } , autoConnect: true }` | units: `minutes`, `hours`, `days` |
| `POST /workflows/:id/steps` `{ type: 'SEND_EMAIL', config: { templateId }, templateId, autoConnect: true }` | `autoConnect` joins it after the last step |
| `PATCH /workflows/:id` `{ enabled: true }` | switch on |

Sending (the product):

| Call | |
| --- | --- |
| `POST /v1/send` `{ to, template, data }` (sk) | a transactional template by id; `data` values are strings, or `{ value, persistent: false }` to keep one off the contact |
| `POST /v1/send` `{ to, subject, body, from: { name, email }, reply }` (sk) | inline, the fallback |
| `POST /v1/track` `{ event, email, subscribed?, data? }` (pk) + `Idempotency-Key` | starts the event's workflow; a repeated key answers 409, which counts as done |

## Quirks

- **Names are identity.** Setup finds templates and workflows by name; renaming one in the
  dashboard makes setup create another.
- **Marketing needs `{{unsubscribeUrl}}`** in the body when it's created through the API; Plunk
  skips unsubscribed contacts for marketing templates, never for transactional ones.
- **Click tracking** (SES configuration sets with click events) rewrites links. Put
  `ses:no-track` on any link that carries a secret.
- **A contact's `data`** is saved and becomes template variables. Put only the first name there.
- **Self-hosted safety**: keep Plunk's automatic project suspension on (a bad list suspends one
  project, not the whole SES account), signups closed after your account exists, and the
  database backed up off the box.
