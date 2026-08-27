# Workflows

Worked sequences. Each is a real series of tool calls, in order.

## Fix one page

The common case. Someone says a link preview looks wrong.

1. `check_url` with the page URL. Note the score and the issue codes.
2. `explain_issue` for any code you cannot act on confidently.
3. `get_fix_prompt` with the same URL and the site's `framework`.
4. Apply the change **in the source template**, not in a build output.
5. Deploy. MetaManager reads the deployed page.
6. `check_url` again. Report both scores.

If the score did not move, do not re-apply the same edit. Check whether the page
is cached, whether the template you edited renders for that route, and whether
something downstream overwrites the tag.

## Audit a site and work through it

1. `list_audits` first. A recent audit is better than spending a new one.
2. `start_audit` only if none is recent enough and the user wants a fresh crawl.
   It returns an audit id immediately.
3. `get_audit` to poll while it runs. Report progress rather than waiting silently.
4. When it is done, read the issue categories. **Sort by page count, not by
   severity** — an issue on two hundred pages is one template, and fixing it once
   moves the site score more than any single-page work.
5. `get_audit` with `code` set to that issue to list exactly the affected pages.
6. Fix the template, deploy, then `check_url` two or three affected pages to
   confirm before spending another audit on the whole site.

## Verify a release

After a round of fixes, prove they landed.

1. `start_audit` on the site.
2. `compare_audits` with the new audit id once it finishes.
3. Report `fixedIssues` and `newIssues` — the second matters more. A deploy that
   fixes ten pages and breaks three is not a clean release.
4. Check `disappeared`: a page that vanished between audits usually means a
   route broke or a link went stale, not that it was deleted on purpose.

If `fieldsComparable` is `false`, the earlier audit predates metadata capture.
Say so. Issue and page changes are still accurate; tag-level diffs are not
available for that pair.

## Investigate a monitoring alert

Someone got an email saying a site broke.

1. `list_monitors` to find the monitor and its site.
2. `list_audits` to get the two most recent runs for that site.
3. `compare_audits` on the newer one. The alert was triggered by `newIssues` or
   by pages in `disappeared` — start there rather than reading the whole audit.
4. `check_url` on one affected page to see its current state, which may already
   differ from the audit if somebody has been working on it.

Alerts fire only for new issues and vanished pages, never for reworded copy. If
the comparison shows only changed tags, the alert came from something else — look
again rather than reporting a false alarm.

## Before shipping a page

Worth doing unprompted when you have just written or edited a page's metadata,
`<head>`, or social tags.

1. Deploy or preview the page at a public URL.
2. `check_url`.
3. Report the score. If it is below 80, fix what is named before calling the work
   done.

This is the cheapest tool in the set and it costs nothing but a rate-limit slot.
