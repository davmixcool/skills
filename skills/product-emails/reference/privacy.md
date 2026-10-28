# Privacy and the product's pages

Change these in the same piece of work as the code: a policy that says "we don't receive your
email" while the product emails buyers is wrong the day it ships.

## The privacy policy

Say, in plain words:

- **What triggers an email and what you receive**: "When you buy Pebble Pro on pebble.app, our
  payment provider tells us your email address and the name you gave it, and we email you your
  key."
- **Where the address goes**: "We don't keep your address ourselves: it goes to Plunk, the email
  service we use, which sends through Amazon SES." (Name the provider and what it sends through.)
- **What else you'll get**: "two short emails in your first week (tips, and a note asking how it's
  going) and, now and then, news of a new version. Each has an unsubscribe link, and replying
  reaches us."
- **What isn't stored with it**: "Your key isn't saved with your address."
- **Who never gets email**: "Only buyers get these: using Pebble, or its free tier, never gives us
  your email."
- **How to stop and delete**: the unsubscribe link; "to have your address deleted from Plunk,
  write to us."

Update the policy's date. If the product has a short version at the top ("Pebble doesn't collect
anything about you"), make it true: add the exception in a clause.

Store listings (Chrome Web Store, App Store privacy labels) describe what the **app** collects:
an address the payment provider passes to the server isn't collected by the app, so they usually
don't change. Check the listing's own wording anyway.

## Pages that say who emails what

- The checkout's **success page** ("Polar has emailed your key"): it's now your email, with the
  one-click unlock; the payment provider sends the receipt.
- **FAQs** ("I lost my key"): the email from you, and the payment provider's portal.
- **Docs**: the unlock page, if the docs walk through activating.

## The page the email links to

A key after `#` (`/unlock#key=…`) never reaches a server or its logs. The page:

- reads the key in the browser, shows it with **Copy**, and a one-click unlock where the product
  can take it (an extension's `externally_connectable` message, an app's deep link, offered as a
  button: mail apps strip `app://` links);
- works without the one-click (instructions to paste the key);
- sends no referrer (`Referrer-Policy: no-referrer`), isn't cached (`no-store`), isn't indexed
  (`noindex`, and out of the sitemap).
