---
name: outreach-scout
description: Find the people who should talk about a product (YouTube creators, newsletter writers, podcasters, accounts that post app lists, launch sites, directories and press), check each one fits, write a personal first message for each with the source it's based on, and build a local outreach page (outreach.html) to copy, send and track them from, with the replies ready for when they answer. Use when asked to "find creators to promote my app", "who should I reach out to", "outreach for my launch", "find YouTubers who review Mac apps / Chrome extensions / dev tools", "help me get listed on directories", "write messages to influencers", or to answer a creator who replied. Never sends, posts, signs in or buys anything: the person sends every message themselves.
---

# Outreach Scout

A small product grows when the right people mention it. You find those people, show why each
one fits, and write them a message about their own work. The person reads it, sends it from
their own inbox or DMs, and marks it sent. You never send anything.

The output is two files in the person's project:

- `outreach.json`: the brief, every contact with the evidence for why they fit, their
  messages, and the reply templates. You write this.
- `outreach.html`: the page the person works from: each contact with **Copy** buttons, a
  status (To send, Sent, Replied, Said yes, Not now) saved in their browser, who's due a
  follow-up, and the replies. `scripts/build-tracker.mjs` makes it from the JSON and checks it.

## The rules that never change

- **The person sends every message.** Never send, post, DM, comment, like, follow, sign up,
  sign in or pay for them, and never offer to.
- **Public pages, unless the person signs in.** Read what anyone can see. When something needs
  an account (a directory's form, a search on X, an email YouTube shows only when signed in),
  ask the person to sign in themselves in the research browser (`reference/browser.md`), then
  carry on there. Never type a password, sign up, or sign in for them.
- **Account actions are theirs:** submitting, publishing, paying, choosing paid options and
  ticking consent boxes ("I own this app"). You fill in, upload and save drafts; they press
  the button.
- **Every line about someone's work has a source.** "I liked your video on X" must link to
  that video in the contact's `sources`, and the person checks it before sending. Never claim
  you (or they) watched or read something; describe what it is.
- **No key, code or tracked link in a first message.** Lean on the product's free plan or
  trial; offer a free licence if they'd like to keep it, which gives them a reason to reply.
  Tracked links (`?utm_source=<them>`) go in the reply after they say yes. Exception: a long
  shot where one message is all you'll get may carry a code (mark it to fill in).
- **Never ask for a review or a mention, and never offer money for one.** A free licence and
  a good product are the offer.
- **Pace and persistence:** 3–5 messages a day, each by hand; one follow-up after 7 days with
  no answer, then let it go.
- **Contacts are people's details.** Keep them in the person's project only. Don't publish
  the list, and delete anyone who asks.

## How it works

### 1. The brief

Read the product before asking anything: its website, docs, store or marketplace listing,
pricing page, and any marketing folder in the project. Then ask only for what you couldn't
find, in one message:

- what it is in one line, and who it's for (you can propose this);
- **the demo to link** (a video URL, ideally under two minutes; or a page with a live demo);
- what's free, the trial, and the price, so messages can say "it comes with a free trial";
- **the sender:** their name as it should appear, and which inbox they'll send from (one
  inbox for all of it, so replies land in one place; a personal name, not a company name, on
  the sender line);
- languages they're happy to write in, and anyone or anything to avoid.

Write the brief into `outreach.json` (`product`). Keep it short; it's what every message draws on.

### 2. Find

Search where the product's audience already listens. Read `reference/finding.md` for where
to look by product type (Mac apps, Chrome extensions, SaaS, developer tools, mobile apps),
the searches that work, and the launch sites and directories worth submitting to.

Aim for 20–40 candidates, then cut. Prefer people who covered something close to the product
recently (a competitor, a "best apps" list in its category) over big names who never have.

### 3. Qualify

For each candidate: size, country and language, what they made that fits (with its link and
date), and how to reach them. Read `reference/qualifying.md`. For YouTube channels,
`scripts/youtube-channel.mjs` returns the subscriber count, country and listed links from the
channel's public pages; a business email is often listed on the channel's About page.

Sort them into groups, best first:

- **Best fit:** made something in the category recently, and a reachable size (roughly
  2k–150k followers, or a niche newsletter).
- **Other languages:** covered a direct competitor in their language. Write to them in it.
- **Long shots:** big audiences. One message, so it may carry a code.
- **Directories and launch sites:** submissions, not pitches.
- **Newsletters and press:** a short, factual pitch.

### 4. Draft

One message per contact, about their work, in their language. Read `reference/drafting.md`
before writing any: the shape of a good first message, email vs DM, subjects, the trial line,
other languages, and what never to write.

- First line: their specific piece of work, by name, linked in `sources`.
- Then what the product is in two sentences, the demo link, the trial and the free-licence
  offer, and "no strings: if it's not for you, no need to reply".
- Mark anything the person must fill in as `[UPPER CASE IN BRACKETS]` (or `[name]`); the page
  highlights it.
- Add a backup message when there's a second channel ("Backup: Instagram DM, if the email
  gets no answer in a week").

### 5. Build the page

Write `outreach.json` (the format is in `reference/tracker-format.md`; a complete example is in
`example/outreach.json`), then:

```bash
node scripts/build-tracker.mjs outreach.json outreach.html
```

It checks the file (every contact has a message and a source, ids are unique, groups exist),
warns about first messages that carry a code, a key or a tracked link, and lists what's left to
fill in. Fix the errors, consider the warnings, and build again. Then open the page for the
person (`open outreach.html` on macOS, `xdg-open` on Linux).

### Logins and forms

When a step needs an account (submitting to a directory or launch site, reading X or LinkedIn
search, a business email behind a sign-in), read `reference/browser.md`. In short: use the
agent's own browser tool if it has one, or start the research browser
(`node scripts/browser.mjs start <url>`); ask the person to sign in there; read the form
(`fields`), correct what the site pre-filled, fill it (`fill values.json`), upload the images
(`upload`), screenshot it, and check every field again after they sign in. Then hand over
what's left for them: the consent box, paid options, the date, and submit.

### 6. Replies

When someone answers, read `reference/replies.md` and draft the reply that fits: they said
yes, they asked about a giveaway, they want payment, they asked a question, they mentioned it,
they said no. For a yes: tell the person to make a single-use, 100%-off code (or a licence)
in their billing, named after the contact, and give the contact their own tracked link for
anything they publish. Update the contact in `outreach.json` (a note in `notes`), and rebuild.

## Present results

When the page is built, tell the person, briefly:

- how many contacts, by group, and the **five to start with**, each in one line (who, why,
  where to send);
- what they need to do first (fill in the highlighted parts, set the sender name in their mail
  settings if it shows a company name, make codes only when someone replies);
- where the files are, and that statuses are saved in the browser they open the page in;
- anything you couldn't reach (sites that blocked reading, emails behind a sign-in).

Never paste the whole list into chat: it's in the page.

## Troubleshooting

- **YouTube pages come back as a consent screen or without counts.** `youtube-channel.mjs`
  sends the consent cookies YouTube expects; if it still fails, fall back to the video's oEmbed
  (`https://www.youtube.com/oembed?url=<video>&format=json`) for the channel name, and leave the
  size blank rather than guessing.
- **X, LinkedIn and Instagram need a login to search.** Don't log in. Use web search for
  their public posts and profiles, or ask the person to paste handles they know.
- **The page shows no statuses after moving it.** Statuses live in the browser's storage for
  that file's location. Keep the file where it is, and open it in the same browser.
- **A form or directory needs an account.** Start the research browser, open the form, and
  ask the person to sign in there; then fill it (`reference/browser.md`). If there's no way to
  drive a browser, give them the copy to paste, field by field.
- **Fields empty again after the person signed in.** Some forms reload on sign-in. Run
  `browser.mjs check values.json`, fill what comes back mismatched, and save the draft.
- **`browser.mjs` says "Refused".** That button is for the person to press (submit, sign in,
  pay). Tell them it's ready for them.
