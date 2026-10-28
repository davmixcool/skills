# Deciding who gets what

Settle this before writing a word: it decides the trigger, the consent, the privacy wording and
what the product stores.

## Who

| The product has… | Email | Because |
| --- | --- | --- |
| No accounts (a licence key, an app) | **buyers only** | They gave an address to pay; the key has to reach them. Using the free tier never gives you an address. |
| Accounts with email sign-in | **signups**, plus buyers | They gave an address to sign in. Marketing needs their agreement (a box at signup, or the law where they are). |
| A trial tied to an email | **trial users** | They gave it to start the trial; trial-ending is service, tips are marketing. |

Never email an address the product got some other way (a support thread, a scraped list), and
never add people to a sequence they didn't sign up for.

## The transactional email

One per thing the person must receive: the licence key, the sign-in link, a "your trial ends
tomorrow" if it changes what they pay. For each, write down:

- **Trigger**: which event, from where (`benefit_grant.created` from Polar, a signup route).
- **What it carries**: the key, the link, and how they use it in one click (an unlock page, a
  deep link). A deep link (`app://`) is often stripped by mail apps: link to a web page that
  offers it.
- **Fallback**: the same words in code, sent inline if the template is refused.
- **If the payment provider also emails**: say so in the email ("Polar sends your receipt
  separately") so two emails don't confuse.

## The sequence

Short, few, and each with a job:

| Email | Wait | Job |
| --- | --- | --- |
| tips | 1–3 days after the trigger | Three things people miss in the first days, with how to do each. |
| check-in | 4–7 days after that | Ask how it's going; replies go to a person. Ask for a recommendation only here. |

Add one only with a reason (a trial ending, a feature they paid for and haven't tried). Release
news goes out as broadcasts from the dashboard to the same contacts: nothing to build.

Write in the product's voice (its copy guide), from a person ("Sam"), plain HTML that reads well
with images off, one link per email where possible, and the unsubscribe line in the footer
("You're getting this because you bought Pebble Pro. Stop these emails.").

## Senders

- A **sending subdomain** (`updates.<domain>`), so the main domain's reputation and mail setup
  are untouched.
- **Marketing**: a person's name at the product (`Sam at Pebble`, `sam@updates.pebble.app`).
- **Transactional**: the product (`Pebble`, `hello@updates.pebble.app`).
- **Reply-to**: an address a person reads (`hello@pebble.app`), never the sending subdomain.

## What the product stores

The trigger's id (Polar's key id, the order id, the user id) and when it was emailed: nothing
else. The provider holds the contact (address, first name, subscribed or not). Secrets in an email
are one-shot variables, never saved on the contact.
