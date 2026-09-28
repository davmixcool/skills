# Conditions

A Condition step holds a list of conditions, joined by `condition_logic`:
`"OR"` (any) or `"AND"` (all). Each is checked once, when the tab reaches the
step. A condition list can't nest, so "(YouTube or Netflix) and evening" is
written as one `domain` condition with both sites, AND a time condition.

## What the tab is

| Condition | Shape | Matches |
|---|---|---|
| Site | `{ "type": "domain", "value": ["youtube.com", "netflix.com"] }` | The address's host is one of these, or a subdomain of one (`youtube.com` matches `m.youtube.com`). A single string works too. Leave out `www.` and `https://`. |
| Kind of site | `{ "type": "category", "value": ["social", "video"] }` | What Few decided the tab is, on the device, from its address and title. Kinds are below. |
| Title | `{ "type": "title_contains", "value": ["invoice", "receipt"] }` | The tab's title contains any of these, ignoring case. |
| Address contains | `{ "type": "url_contains", "value": "google.com/search" }` | One piece of text, not a list. For several, add one condition each and use `"OR"`. |
| Address starts with | `{ "type": "url_starts", "value": "https://github.com/myorg/" }` | One piece of text. |
| Address is | `{ "type": "url_exact", "value": "https://mail.google.com/mail/u/0/#inbox" }` | The whole address, exactly. Rarely what's wanted. |

## The tab's state

`expected` is `true` or `false` ("is pinned" / "isn't pinned").

| Condition | Shape |
|---|---|
| Pinned | `{ "type": "is_pinned", "expected": true }` |
| In a tab group | `{ "type": "is_grouped", "expected": true }` — any group, Bin and Few's own included |
| Playing sound | `{ "type": "is_audible", "expected": true }` |
| The tab being looked at | `{ "type": "is_active", "expected": true }` |

## Numbers

`operator` is `greater`, `lesser`, `equals`, `greater_or_equal` or
`lesser_or_equal`.

| Condition | Shape | Meaning |
|---|---|---|
| Open tabs | `{ "type": "tab_count", "operator": "greater", "value": 20 }` | How many tabs are open in all |
| Tab age | `{ "type": "tab_age", "operator": "greater", "value": 1440 }` | Minutes since Few first saw the tab (for tabs already open when Few was installed, since then) |

There is no working memory condition: `memory_usage` exists in old files but
is never true, because Chrome doesn't tell extensions a tab's memory.

## Time

In the browser's local time, when the tab reaches the Condition.

| Condition | Shape |
|---|---|
| Time of day | `{ "type": "time_of_day", "operator": "between", "time_start": "17:00", "time_end": "22:00" }` — `before` and `after` take only `time_start`. `between` works across midnight (`22:00`–`06:00`). |
| Day of week | `{ "type": "day_of_week", "days": [0, 6] }` — 0 = Sunday … 6 = Saturday |

A time condition is checked once, when the tab reaches it, so it picks a path
rather than waiting for the time. To act *at* a time, use a Schedule.

## Kinds of site

For `category`. Few works these out on the person's device; nothing is sent
anywhere.

| Kind | What it covers |
|---|---|
| `docs` | Reference documentation, API references, developer guides, manuals — not documents people write themselves |
| `code` | Source code and repositories — a file view on GitHub, a GitLab tree |
| `issues` | Bug trackers, pull requests, project boards |
| `ai` | AI assistants and chatbots, model playgrounds and consoles — ChatGPT, Claude, Gemini, Perplexity |
| `files` | Documents, spreadsheets, slides, notes, whiteboards, design files and their drives — a Google Doc, Notion, Figma, Dropbox |
| `chat` | Team chat, messaging and video calls — Slack, Teams, Discord, WhatsApp Web, Zoom |
| `email` | Webmail inboxes |
| `social` | Social networks and discussion forums |
| `video` | Video, music and streaming |
| `shopping` | Product pages, carts, marketplaces |
| `news` | News, blogs, long-form articles |
| `research` | Papers, datasets, encyclopaedias, search result pages |
| `tools` | Dashboards, admin consoles, calendars, web apps, browser settings |
| `finance` | Banking, invoices, accounting, payments |

For one or two particular sites, `domain` is exact and predictable; use kinds
for "all my social media" and the like.
