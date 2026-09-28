# Patterns

Whole workflows for common requests, as files you can copy and change. Every
file in [`../examples/`](../examples/) (Few's own library) and
[`../examples/patterns/`](../examples/patterns/) is generated from the
extension's code, imports cleanly and has no problems, and each pattern is
imported through Few's own Import in a real browser as part of Few's tests.

The **everyday cleanup** most of them end with is Few's default:

```
Unused for 3 hours → Move to Bin → In Bin for 5 days → Close
```

## Pick a starting point

| They want | Start from |
|---|---|
| Different timings for everything | `examples/gentle-cleanup.json`, `examples/aggressive-cleanup.json` |
| Never close anything | `examples/never-close.json` |
| Particular sites handled sooner (sleep) | `examples/patterns/sites-sleep-sooner.json` |
| Particular sites closed sooner | `examples/patterns/sites-close-sooner.json` |
| Several sites, each with its own timing | `examples/patterns/sites-each-their-own.json` |
| A kind of site kept longer | `examples/keep-reference.json` |
| Social media unloaded quickly | `examples/social-timeout.json` |
| A reminder after time on a site | `examples/patterns/youtube-reminder.json` |
| Only during certain hours or days | `examples/patterns/work-hours-video.json` |
| Tidy everything at a set time | `examples/end-of-day.json`, `examples/friday-reset.json` |
| Open pages at a set time | `examples/patterns/morning-pages.json` |
| Close duplicates | `examples/patterns/duplicates-then-cleanup.json` (with cleanup), `examples/duplicate-killer.json` (only that) |
| Keep a copy of everything closed | `examples/save-before-closing.json` |
| Save memory, move nothing | `examples/memory-saver.json` |
| Be told, not tidied | `examples/just-remind-me.json` |

## The shapes behind them

### Particular sites: Condition first, each path its own wait

```
Condition: site is youtube.com or netflix.com
  If:   Unused for 20 minutes → Sleep
  Else: (nothing)
Unused for 3 hours → Move to Bin → In Bin for 5 days → Close
```

Tabs that don't match fall through the empty Else to the cleanup; so do the
slept ones, a minute after sleeping, and move to Bin at their 3 hours. A site's
address is known as soon as the tab opens, and a new address starts the tab
over, so deciding first is safe. One wait per path: works in every version.

To close instead of sleep, use Close with `ignore_grouped_tabs: true` so the
person's own groups are spared (`sites-close-sooner.json`). To keep those sites
*longer*, put the whole longer path in If: `Unused for 1 day → Move to Bin →
In Bin for 14 days → Close`.

### A kind of site: a short wait first

```
Unused for 3 hours
Condition: kind of site is docs, code or research
  If:   Unused for 1 day → Move to Bin → In Bin for 14 days → Close
  Else: Move to Bin → In Bin for 5 days → Close
```

Few judges a kind of site from the page's title as well as its address, so let
the page load and settle before asking. The second *Unused for* in the If path
needs WithFew 1.0.4 or later; say so when you hand it over.

### A reminder

```
Condition: site is youtube.com
  If:   Time spent reaches 20 minutes → Notify "20 minutes on YouTube."
  Else: (nothing)
…the everyday cleanup
```

Time spent adds up the time on that one tab across visits. A matching tab
reaches the cleanup only after its reminder.

### At a set time

Tidy: the Schedule **first**, and every tab waits at it.

```
Schedule: weekly, Mon–Fri, 18:00 → Move to Bin → In Bin for 5 days → Close
```

Open pages: the Schedule **last**, with `rules` that match only the pages it
opens, so it leaves every other tab's cleanup alone.

```
…the everyday cleanup
Schedule: weekly, Mon–Fri, 09:00, rules "contains mail.google.com" or
          "contains calendar.google.com", opens those two pages
```

Either way it fires only in that minute, and only if Chrome is open.

### Only at certain times

```
Condition (AND): site is youtube.com; on weekdays; between 09:00 and 17:00
  If:   Unused for 10 minutes → Sleep
  Else: (nothing)
…the everyday cleanup
```

The day and time are checked when the tab reaches the Condition — when it's
opened, or first thing after the person last used it — not continuously.

### Duplicates

```
Duplicate?
  Yes: Close (min_open_tabs 1, ignore_pinned_tabs true)
  No:  (nothing)
…the everyday cleanup
```

First, so a duplicate closes as soon as it appears. The copy opened first
stays. Same address exactly: a different `#section` is a different page.
