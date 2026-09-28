# StashCue tools

All tools run as the connected account. `read` tools need the read permission;
`write` tools need "add drafts" (write). Errors come back as a normal result
with `isError: true` and a sentence saying what to do.

| Tool | Permission | Arguments | Returns |
| --- | --- | --- | --- |
| `list_workspaces` | read | none | `workspaces[]`: `slug`, `name`, `oneLiner`, `url` |
| `get_workspace` | read | `workspace` | The brief: `name`, `url`, `oneLiner`, `audience`, `pricing`, `facts`, `neverSay`, `voice`, `links[]`, `utm`, `trackedLinkExample`, `trackedLinks` |
| `create_workspace` | write | `slug`, `name`, plus any brief fields | `workspace`. The slug is global and permanent (3–39 of a–z, 0–9, `-`; some words reserved). |
| `list_items` | read | `workspace?`, `status?` (queued, posted, skipped), `platform?`, `from?`, `to?` (YYYY-MM-DD), `limit?` | `items[]` |
| `add_items` | write | `workspace`, `items[]` (1–25, see below) | `added`, `items[]` (id, kind, platform, community, postOn, title), `warnings[]` (`index`, `id`, `warnings[]`) |
| `update_item` | write | `id`, and any of `title`, `body`, `brief`, `notes`, `community`, `targetUrl`, `postOn`, `status`, `postedUrl` | `item`. `status: "posted"` needs `postedUrl`. A reply's `body` can't be set. |
| `list_communities` | read | `platform?`, `verdict?` | `communities[]` |
| `get_community` | read | `platform`, `name` | `community` (or null) with `verdict`, `how`, `rulesSummary`, `bansAiText`, `checkedAt`, `daysSinceChecked`; `last90Days[]` across all products |
| `save_community` | write | `platform`, `name`, `verdict`, `url?`, `members?`, `how?`, `rulesSummary?`, `bansAiText?` | `community`, stamped as checked today |
| `posting_history` | read | `workspace?`, `platform?`, `limit?` | `posted[]` with `postedUrl` and `postedOn` |

## Items

| Field | Post | Comment | Reply |
| --- | --- | --- | --- |
| `kind` | `post` | `comment` | `reply` |
| `platform` | reddit, x, linkedin, hn, other | same | same |
| `community` | Required on Reddit (`r/Name`) | Recommended | Recommended |
| `targetUrl` | HN link posts: the URL to submit. `other`: the page to open. | **Required:** the thread | **Required:** the thread |
| `title` | Reddit and HN | none | none |
| `body` | The full text (X, LinkedIn, other; Reddit and HN text posts) | **Required** | **Never:** refused |
| `brief` | none | none | **Required:** what they asked, the facts that would help |
| `notes` | Flair, rules to remember, "rewrite in your own words" | same | same |
| `postOn` | YYYY-MM-DD | same | same |

Community names: Reddit accepts `r/Name`, `/r/Name/`, `Name` or a URL, and
stores `r/Name`. Matching is case-insensitive.

## Warnings from add_items

- `… is marked never` / `… is answers-only`: remove the item.
- `… allows promotion only as a comment in its pinned thread`: make it a
  `comment` with the thread's URL.
- `… needs the moderators' approval first`: queue the modmail; hold the post.
- `… bans AI-written posts`: turn it into an outline, and say so first in
  `notes`.
- `… rules were last checked N days ago`: check again, then `save_community`.
- `No notes on …`: check the rules, then `save_community`.
- `… already has <product>'s post on …` or `Another Reddit post … on …`:
  reschedule.
- `N characters: over 280`: split it for X, unless the maker has X Premium.
- `postOn … is in the past`: pick a date from today on.
