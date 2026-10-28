# Pebble's emails

<!--
  A starter emails file (reference/emails-file.md). Replace Pebble with the product, keep the
  structure: setup.mjs reads the `## Event`, `### Email`, `## Transactional emails` and
  `### Template` headings, the **Field:** `value` lines and the ```html blocks. Everything else
  (this comment, the prose) is for the people who edit it.
-->

Pebble has no accounts, so the only people it emails are **buyers**. When someone buys Pebble Pro,
the API:

1. sends them their key with a one-click unlock (the transactional template at the end);
2. tracks `purchased`, once, which starts the **Pebble: purchased** workflow below.

The words live here. After setup creates them, edit in the provider's dashboard or here (then run
setup with `--update`); every deploy runs setup without `--update`, so dashboard edits are kept.
Don't rename templates or workflows in the dashboard: setup finds them by name and would make new
ones.

## Every marketing email

From, From name and Reply-to come from `emails.config.json` → `marketing`. Variables:
`{{firstName}}` (the first word of the buyer's name, or "there") and `{{unsubscribeUrl}}`, which
the provider fills in. Every one of them links it.

## Event `purchased`

Tracked once per licence key, when the key has been emailed.

### Email `tips`

**Wait:** `2 days`
**Subject:** `Three things to try in Pebble`

```html
<p>Hi {{firstName}},</p>
<p>Thanks again for getting Pebble Pro. Three things that make it feel at home after a day or two:</p>
<ol>
<li><b>The first thing.</b> What it is, and the one move that shows it off.</li>
<li><b>The second thing.</b> A feature people miss in their first week.</li>
<li><b>The third thing.</b> A setting worth changing.</li>
</ol>
<p>Everything else is in the docs: <a href="https://pebble.app/docs">pebble.app/docs</a>.</p>
<p>Sam</p>
<p style="color:#888;font-size:12px">You're getting this because you bought Pebble Pro. <a href="{{unsubscribeUrl}}">Stop these emails</a>.</p>
```

### Email `checkin`

**Wait:** `5 days`
**Subject:** `How's Pebble working for you?`

```html
<p>Hi {{firstName}},</p>
<p>You've had Pebble for a week now, and I'd love to know how it's going: what you use it for, what feels off, and what you'd have it do next. Just reply to this email; it comes straight to me.</p>
<p>Thanks for backing a small product,<br>Sam</p>
<p style="color:#888;font-size:12px">You're getting this because you bought Pebble Pro. <a href="{{unsubscribeUrl}}">Stop these emails</a>.</p>
```

## Transactional emails

Sent by the API by the template's id: no event, no workflow, no unsubscribe link, and it reaches
everyone who buys. Setup prints each id under its **Var**, and the deploy passes it to the API.
The API keeps the same words as a fallback, for when the template is missing.

Variables: `{{firstName}}`, `{{key}}` and `{{unlockUrl}}` (the site's unlock page, the key after
the `#`, which browsers never send to a server). Neither is saved on the contact.

### Template `licence`

**Var:** `PLUNK_LICENCE_TEMPLATE`
**Subject:** `Your Pebble Pro key`

```html
<p>Hi {{firstName}},</p>
<p>Thanks for getting Pebble Pro. Here's your key:</p>
<p style="font-family:ui-monospace,Menlo,monospace;font-size:16px;padding:12px 14px;background:#f3f3f6;border-radius:10px;display:inline-block">{{key}}</p>
<p><a ses:no-track href="{{unlockUrl}}" style="display:inline-block;padding:11px 20px;border-radius:999px;background:#1c1c24;color:#ffffff;text-decoration:none;font-weight:600">Unlock Pebble</a></p>
<p>Keep this email: it's your key. Our payment provider sends your receipt separately.</p>
<p>Sam, who makes Pebble</p>
```
