# The emails file

One markdown file holds every word the product emails. People edit it like any doc; `setup.mjs`
reads its headings, field lines and HTML blocks. The starter is `assets/emails.md`.

## What setup reads

````markdown
## Event `purchased`                  ← a sequence: one workflow, started by this event
                                         (an optional number is fine: "## 2. Event `trial_ending`")

### Email `tips`                      ← a template, named "<namePrefix>: tips"; in order

**Wait:** `2 days`                    ← before this email: N minutes / hours / days.
                                         Leave it out (or 0) to send at once.
**Subject:** `Three things to try in Pebble`

```html
<p>Hi {{firstName}},</p> …
<a href="{{unsubscribeUrl}}">Stop these emails</a>
```

## Transactional emails              ← everything after this heading

### Template `licence`               ← "<namePrefix>: licence"

**Var:** `PLUNK_LICENCE_TEMPLATE`     ← the config var the product reads the id from
                                         ("Wrangler var" and "Env var" work too)
**Subject:** `Your Pebble Pro key`
**From:** `hello@updates.pebble.app`  ← optional: the config's `transactional` fills these in
**From name:** `Pebble`
**Reply-to:** `hello@pebble.app`

```html
…{{key}}… <a ses:no-track href="{{unlockUrl}}">Unlock Pebble</a>
```
````

Rules:

- Field lines start the line, the label in `**…:**`, the value in backticks.
- Each email has one ` ```html ` block; the first is used.
- Keys (`tips`, `licence`) and events are unique: the names setup finds things by come from them.
- Variables use the provider's syntax (Plunk: `{{name}}`). Marketing bodies must link the
  provider's unsubscribe variable (Plunk: `{{unsubscribeUrl}}`); the lint stops otherwise.
- A link that carries a secret (a key, a sign-in token) is excluded from click tracking (with SES
  behind it: `ses:no-track`), or the secret passes through a tracking redirect.
- Everything else (prose, tables, comments) is for people: say who gets each email and why, the
  variables, and how edits flow (below).

## The config

`assets/emails.config.json`, next to the setup script:

| Field | |
| --- | --- |
| `provider` | the adapter: `plunk` |
| `apiUrl` | the provider's API (Plunk hosted: `https://next-api.useplunk.com`; self-hosted: its API host) |
| `dashboardUrl` | optional: printed after an apply |
| `secretEnv` | the environment variable holding the secret key (`PLUNK_SECRET_KEY`) |
| `secretsFile` | optional: the local secrets file to read the key from when the variable isn't set: `.env`, `.env.local`, or `.dev.vars` on Cloudflare Workers (any `KEY=value` file; `export`, quotes and comments are fine). Gitignored, and never opened by the agent |
| `templates` | the emails file, relative to the config |
| `namePrefix` | template and workflow names: `"Pebble"` → `Pebble: tips`, `Pebble: purchased` |
| `marketing` | `{ from, fromName, replyTo }` for every sequence email |
| `transactional` | optional defaults for the transactional templates' sender fields |

## How edits flow

- **First time**: `setup.mjs --apply` creates everything from the file.
- **Every deploy**: `--apply --enable-new`, never `--update`, so wording edited in the dashboard
  is kept, and only new workflows are switched on.
- **Changing words from the repo**: edit the file, then `setup.mjs --apply --update` by hand
  (it overwrites the dashboard's copy of every template).
- **Never rename in the dashboard**: setup would make a new one beside it.
- **Removing an email**: delete it in the dashboard too; setup never deletes.
