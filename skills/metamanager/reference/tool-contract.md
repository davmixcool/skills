# Tool contract

Exact arguments for MetaManager's MCP tools. Read this when you need a less
common argument or want to be certain of a name.

`*` marks a required argument.

## Free on every plan

### `check_url`
Score one page 0-100 and list its issues.

| Argument | Type | Notes |
| --- | --- | --- |
| `url`* | string | Full URL including `https://` |

Returns the score, the resolved final URL, the extracted metadata, the issues
with their codes, and image dimensions where a social image was found.

### `get_fix_prompt`
The same check, plus instructions written for a specific framework.

| Argument | Type | Notes |
| --- | --- | --- |
| `url`* | string | Full URL including `https://` |
| `framework` | `html` \| `laravel` \| `next` \| `nuxt` \| `other` | Defaults to `html` |

Pass the framework the site actually uses. A Laravel site gets Meta Manager
package calls; Next gets the App Router `metadata` export; Nuxt gets
`useSeoMeta`/`useHead`.

### `explain_issue`
What an issue code means, how serious it is, and its weight in the score.

| Argument | Type | Notes |
| --- | --- | --- |
| `code` | string | e.g. `missing_og_image`. Omit to list every code |

Returns `code`, `title`, `severity` (`error`/`warning`/`tip`), `importance` and
`weight`. It does not return per-page advice — that is what `check_url` and
`get_fix_prompt` give you, because the advice depends on the page.

## Pro

### `list_audits`
Audits on the account, newest first.

| Argument | Type | Notes |
| --- | --- | --- |
| `project` | string | Limit to one project id |

### `get_audit`
One audit in full: site score, band counts, issue categories, per-page results.

| Argument | Type | Notes |
| --- | --- | --- |
| `audit_id`* | string | From `list_audits` |
| `code` | string | Only pages carrying this issue code |
| `severity` | `error` \| `warning` \| `tip` | Only pages with an issue of this severity |

### `compare_audits`
What changed between an audit and the previous one of the same site.

| Argument | Type | Notes |
| --- | --- | --- |
| `audit_id`* | string | The later audit |
| `against` | string | An explicit baseline. Defaults to the previous run |

Returns new issues, fixed issues, changed tags with before and after, pages that
appeared, and pages that disappeared.

An audit crawled before MetaManager recorded page metadata cannot be diffed tag
by tag; the response says so via `fieldsComparable: false` and still reports
issue and page changes accurately. Do not present that as "nothing changed."

### `list_monitors`
Sites watched on a schedule. No arguments.

### `list_saved_urls`
Saved URLs with their latest score. No arguments.

## Pro, and a write key

### `start_audit`
Crawl a whole site. **Spends one of the account's monthly audits.**

| Argument | Type | Notes |
| --- | --- | --- |
| `url`* | string | The site root to crawl from |
| `project` | string | File the audit under this project id |

Returns immediately with an audit id. Poll `get_audit`; do not call `start_audit`
again for the same site while one is running.

### `save_url`
Save a URL so its score can be tracked.

| Argument | Type | Notes |
| --- | --- | --- |
| `url`* | string | Full URL including `https://` |
| `project` | string | File it under this project id |

## Scores and severities

| Band | Score | Meaning |
| --- | --- | --- |
| Excellent | 80-100 | Nothing meaningful missing |
| Needs attention | 50-79 | Real gaps, previews may still work |
| Critical | below 50 | Shared links will look broken |

A site score is the unweighted mean of its page scores. The band counts matter
more than the mean: a hundred good pages and twenty broken ones still average
well.
