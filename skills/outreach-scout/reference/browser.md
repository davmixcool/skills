# The research browser: logins and forms

Most of outreach needs only public pages. Use a browser when it doesn't:

- **reading what needs a login:** X or LinkedIn searches, a creator's DMs-open status, a business
  email YouTube shows only to signed-in viewers;
- **filling a directory or launch-site form** (most need an account), including uploading the
  icon and screenshots.

**First choice: a browser tool the agent already has** (Claude in Chrome, a Playwright or
browser MCP server). Use it with the same rules. **Otherwise, the research browser:** a separate
Chrome profile with remote debugging that `scripts/browser.mjs` drives. It never touches the
person's everyday browser, and it keeps its sign-ins between runs.

## The rules

- **The person signs in, themselves.** When a page needs an account, stop and say exactly
  where: "In the research browser, sign in to JustMacApps (top right), then tell me." Never type
  a password, never sign up, never use "Sign in with Google" for them.
- **Account actions are theirs:** submit, publish, launch, pay, subscribe, reserve, delete, tick
  "I own this app" / "I agree" boxes, choose paid options. `browser.mjs` refuses buttons like
  these and never fills password fields; don't work around it.
- **Read social sites, don't act on them:** no liking, following, posting, DMing or commenting,
  even when signed in. Scroll slowly (a screen every few seconds) and read only what the task needs.
- **Saving a draft is fine** when the form has a "Save" or "Save as draft" that doesn't publish.

## Starting it

```bash
node scripts/browser.mjs start https://example-directory.example/submit
```

It opens Chrome with its own profile (`~/.outreach-browser`, or `$OUTREACH_BROWSER_PROFILE`) on
port 9333 (`--port`, or `$OUTREACH_BROWSER_PORT`). If the person already runs a browser with
remote debugging, use that port instead. Ask the person to sign in to whatever the task needs in
that window, and wait for them to say so.

## Filling a form

1. **Read it:** `node scripts/browser.mjs fields --tab <part of its URL>`. It opens collapsed
   sections (`<details>`) and lists every field with its label, name, id, type, current value
   and options. Collapsed sections built as buttons ("More details", "Advanced") need
   `click "<their text>"` first; then read again. Read the page's text too (`text`) for hints
   like "up to 3, separated by commas" or "one per line: question | answer".
2. **Check what's already there.** Many directories pre-fill from the website, and get things
   wrong: pricing model, processors or platforms, a description that's just the tagline,
   "not sure" for the technology. Correct them from the brief.
3. **Write `values.json`** with every field to set, keyed by `#id` (most reliable), name or
   label. Text as strings, checkboxes as `true`/`false`, radios as `"group name": "option"`.
   Respect length limits and list formats.
4. **Fill and verify:** `fill values.json --tab …`. It sets each field the way typing would,
   so forms built with React and similar keep the values, then reports any that didn't hold.
5. **Images:** `upload <index> <files…> --tab …` (the `index` comes from `fields`, under
   `file`). Uploads can take a while: check the count on the page (`text`) before going on. Use
   `click "Move screenshot 2 earlier"` and the like to reorder, if the form has such buttons.
6. **Screenshot it** (`shot form.png --full`) and look at the whole form before saying it's done.
7. **After the person signs in, check again.** Some forms reload on sign-in and empty fields
   that were filled before it: run `check values.json --tab …`, then `fill` again whatever comes
   back mismatched, and save the draft.
8. **Hand over:** list what's filled, what you changed from the site's guesses, and what's left
   for them (sign in, consent box, paid options, the launch date, submit).

## Reading behind a login

- `text --tab <match>` returns the page's visible text; `open <url> --tab <match>` navigates
  that tab. Read, note the facts with their URL as the source, and move on.
- If a site shows a login wall, a CAPTCHA or a "too many requests" page, stop and tell the
  person. Never retry around it.
