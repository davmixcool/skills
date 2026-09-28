---
name: withfew
description: Create, change or explain workflows for WithFew, the Chrome extension that tidies tabs automatically — a workflow is the chain of steps that decides when a tab moves to Bin, sleeps, closes, gets bookmarked or sends a reminder. Writes the workflow as a JSON file the person imports into WithFew, checks it with WithFew's own validator, and reads it back in plain words. Use when asked to "make a WithFew workflow", "set up Few to close/sleep/bin tabs", "automatically close YouTube tabs", "a tab rule for Chrome", "clean up my tabs at 6pm", "remind me after 20 minutes on a site", or to review or fix a WithFew workflow file. Not for other tab managers, and not for controlling the browser directly.
---

# WithFew workflows

WithFew ("Few") is a Chrome extension that keeps tabs under control. What it
does is set by one **workflow**: a chain of steps such as *Unused for 3 hours →
Move to Bin → In Bin for 5 days → Close*. You write that workflow as a JSON file;
the person imports it into Few and it runs in their browser. You never touch
their browser, and nothing about their tabs is sent anywhere.

## How Few runs a workflow

Read this before writing one. Most mistakes come from assuming it works like a
rule list; it doesn't.

1. **Every tab walks the workflow on its own**, top to bottom, checked once a
   minute. Each tab has its own place in the list.
2. **Triggers wait.** A tab stops at a trigger (*Unused for*, *In Bin for*,
   *Time spent*, *Schedule*, *Delay*) until it fires for that tab, then moves on.
3. **Actions act, then the tab moves on**: *Move to Bin*, *Bookmark*, *Notify*,
   *Pin*, *Reload*. If an action can't act on that tab yet (it's the tab being
   looked at, say), the tab waits at it and it is tried again next minute.
4. **Close ends the tab's run. Sleep doesn't:** it unloads the tab where it is,
   and a minute later the tab carries on with the next step. So a slept tab
   still reaches a cleanup further down — which is usually what people want
   ("sleep YouTube sooner, and tidy it like everything else later"). To keep
   slept tabs out of the cleanup, put the cleanup in the Condition's Else.
5. **A Condition is decided once**, when the tab reaches it: *If* or *Else*,
   then the tab follows that branch and carries on below the Condition. The
   same goes for *Duplicate?* (*Yes*/*No*).
6. **Using a tab starts it over.** When the person switches to a tab, or its
   address changes, it goes back to the top.
7. **Always protected:** the tab being looked at is never moved, slept or
   closed; sites on the person's protected list are never acted on; with the
   usual settings, Move to Bin skips pinned tabs, tabs playing sound, and the
   person's own tab groups.
8. **Bin** is a collapsed tab group Few makes. Tabs in it are unloaded (no
   memory), and the person gets one back by opening it and staying a few
   seconds. *In Bin for* counts from when the tab went in.

## The workflow

1. **Pin down what they want.** Which tabs (all, particular sites, a kind of
   site such as social or docs, pinned, playing sound…), what should happen
   (leave, sleep, Bin, bookmark, close, remind), and when (after how long
   unused, after time spent, at a set time). Ask when it's genuinely unclear —
   "close" versus "move to Bin" matters to people. Default to Bin over closing:
   it's reversible.
2. **Start from the closest example** in [`examples/`](examples/) (Few's own
   library, one file each) or a pattern in
   [`reference/patterns.md`](reference/patterns.md). Most requests are the
   default cleanup with one rule added in front of it.
3. **Write the file** using the step shapes in
   [`reference/steps.md`](reference/steps.md) and the condition shapes in
   [`reference/conditions.md`](reference/conditions.md). Keep the everyday
   cleanup in unless they asked for something else: a workflow that only
   handles YouTube tabs leaves every other tab alone forever.
4. **Check it**, and fix until it passes:

   ```bash
   node scripts/check-workflow.mjs my-workflow.json
   ```

   It runs the exact check Few's Import runs, then checks for things Import
   accepts but that won't work as intended (a step after Close, a Schedule in a
   branch, a condition that can never be true…), and prints the workflow as an
   outline. It's built from the extension's own code, so trust it over your
   reading of these docs. Exit code 0 means it imports and has no problems.
   Fix every `error` and `problem`; read the `note`s and pass on the ones that
   matter.
5. **Hand it over** (see [Present results](#present-results)).

Save the file where the person can find it: their Downloads folder or the
current directory, named for what it does (`youtube-reminder.json`).

## Rules that bite

- **Order is everything.** A step only runs for tabs that reach it. Put rules
  for particular tabs (a Condition) *before* the general cleanup, and let the
  Condition's Else branch be empty so other tabs carry on to the cleanup.
- **A Schedule belongs at the top level**, never inside a branch (it would never
  fire). As the *first* step it holds every tab until the set time ("tidy at
  6pm"). Anywhere else, give it URL rules: when it fires it moves every tab it
  picks up to the step after it, skipping whatever came before.
- **Schedules fire only in their exact minute**, and only if Chrome is open then.
- **Open** (the trigger) only works as the very first step, and tabs that don't
  match its URL rules stop there. Use a Condition instead.
- **Close** has a `min_open_tabs` setting: it only closes while more than that
  many tabs are open. The editor's default is 5; use 0 unless they want a floor.
  Set `ignore_pinned_tabs: true` unless they want pinned tabs closed.
- **Bookmark**: set `folder` to `null` (Few's own WithFew folder). A folder id
  from your machine means nothing in theirs.
- **Group** needs a tab group picked in their editor, so avoid it in a file; say
  what to pick instead.
- **Two "Unused for" in one path** (a short wait, then a longer one for some
  tabs) needs WithFew 1.0.4 or later; the second counts from last use too.
- **Kinds of site** (`category` conditions) are worked out by Few on the
  device from the address and title. Use them for broad groups ("social", "docs");
  use `domain` for particular sites.
- Keep it small. Few's editor shows the workflow as a diagram the person will
  read; five to ten steps is typical, and the most Few loads is 200.

## Present results

Tell the person, in this order:

1. **What it does**, in two or three plain sentences, not JSON. Use the
   checker's outline, rewritten for people: "YouTube tabs are put to sleep 20
   minutes after you leave them. Like every other tab, they go to Bin after 3
   hours unused and close 5 days later."
2. **The file**: its path.
3. **How to import it**:
   1. Click Few in Chrome's toolbar, then **Rules**.
   2. Click **Import** (bottom right of the editor) and choose the file.
   3. Check the diagram, then click **Save**.

   The steps replace their current workflow; their protected sites and
   grouping settings stay as they are. Every step can be changed in the editor
   afterwards.
4. **Anything to know**: the checker's notes that matter to them (a schedule
   needs Chrome open at that minute; the file needs WithFew 1.0.4 or later),
   and anything they asked for that Few can't do.

Don't paste the JSON into the reply unless they ask for it.

## What Few can't do

Say so plainly rather than approximating:

- Act on a tab's contents (it never reads pages), memory use per tab, or how
  many times a site was opened.
- Limit total time on a site per day: *Time spent* counts per tab, across that
  tab's visits.
- Run when Chrome is closed, or act across browsers or devices.
- Open, close or schedule anything in other apps.

## Troubleshooting

- **The checker needs Node 18 or later.** Without Node, check the file by hand
  against `reference/steps.md`; Few's Import also refuses a broken file with a
  message in plain words, and changes nothing.
- **"Would be refused by Import"**: the file's shape is wrong. The error names
  the step and the problem.
- **"Imports, but has problems"**: it loads, but a step will never run, never
  fire, or will hold tabs for good. Fix it; don't hand it over as is.
- **The person says it isn't working**: ask what they expected to happen to
  which tab, then walk that tab through the outline with the rules in
  [How Few runs a workflow](#how-few-runs-a-workflow). Using a tab starts it
  over, so a tab they keep visiting never reaches *Unused for*.
- More about Few: https://withfew.app/guides and https://withfew.app/docs.
