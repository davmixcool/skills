# Reading X

You read X through the ReplyScout extension, in the maker's own Chrome where they're
logged in. The extension opens pages in a ReplyScout window that stays out of the way, and
reads them for you:

| Tool | What it reads |
| --- | --- |
| `x_search(query, limit)` | The latest posts for an X search |
| `x_open_post(url)` | One post, the posts above it, and the replies shown under it: exactly what `scout_post` takes |
| `x_notifications(limit)` | The maker's mentions: where answers to their replies show up |

All three are read-only. There's no tool that posts, likes, follows or types, and there
never will be.

## Stop at the first sign of trouble

If a tool's error starts with:
- **`LOGIN_NEEDED`:** X wants the maker to log in. Stop scouting (routine mode:
  `REPLYSCOUT_STATUS: login-needed`).
- **`BLOCKED`:** X showed a warning, a limit or a CAPTCHA. The extension pauses all X
  reading for 6 hours. Stop scouting and report what X said (routine mode:
  `REPLYSCOUT_STATUS: stopped - …`).

Never retry in a loop, and never try another way round.

## Searching

Turn the maker's interests (and your learned topics) into a few precise searches:
- `"too many tabs" min_faves:5`: a phrase plus a little traction, so you skip noise.
- `chrome (slow OR ram OR memory) min_faves:5`
- `#buildinpublic min_faves:10`
- `"chrome extension" launched`

Run **a few searches per run**. The extension allows 40 pages of X an hour, and each search
and each opened post is a page.

## What's worth scouting

- **Timely:** posted in the last few hours, without hundreds of replies. Skip anything over a
  day old.
- **A gap:** you can see something worth adding.
- **Relevant:** their interests or topics, a founder post, or something they'd enjoy joining.
- **Not already on the board:** `list_items` shows what's there; scouting a known thread
  just refreshes it.

Open the promising ones with `x_open_post`, read the replies, and `scout_post` the ones
that pass: **at most 8 per run**. The extension enforces 8 a run and 30 a day.

## Follow-ups

`x_notifications` lists recent mentions. For each that answers one of the maker's replies,
`x_open_post` it and `scout_post` it. ReplyScout links it to the maker's earlier reply (by
their X handle), and `get_item` shows `followUpOf`.
