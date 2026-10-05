# X's limits, and ReplyScout's

X restricts automation, and accounts that break the rules lose reach or get
suspended. ReplyScout is built to stay well inside them.

## What X forbids (in short)

- **Automated replies, likes, follows and reposts** that aren't explicitly the
  user's own action, and bulk or aggressive engagement.
- **Scraping** X without permission.
- **Coordinated or duplicate** content: the same reply posted in many threads.

Read X's current automation rules and terms before building anything that acts on
X; they change.

## What ReplyScout does instead

| | ReplyScout |
| --- | --- |
| Finding posts | The maker scouts in one click, or their agent reads X through the ReplyScout extension in the maker's own logged-in Chrome: a few searches per run, at most 8 scouts a run and 30 a day, and it stops at any warning. No X API, no bulk scraping, no tricks to look human. |
| Reading a thread | One post's page and the replies shown under it. |
| Writing | The assistant drafts; the maker edits. Drafts are kept apart from what's sent. |
| Posting | Post on X on the board opens X's own reply box with the maker's approved text (or the extension fills it). The maker presses Post. Nothing else posts. |
| Likes, follows, reposts | Never. |
| Volume | Two replies at most per thread; timing over volume. |

## For you, the assistant

- Never offer to post, like, follow or engage, on a schedule or otherwise. Scheduled runs only scout (read) and draft.
- Never write the same reply for several threads. Each draft is for its thread.
- `scripts/x-thread.mjs` reads one post through a public mirror when the maker pastes
  a link. Don't loop it over many posts or searches.
- Reading X through the extension still counts as automation to X. The maker has
  accepted that risk for read-only scouting; keep to [`browsing.md`](browsing.md)'s limits
  so it stays small, and never do anything that posts or engages.
