# Workflow file and steps

## The file

```json
{
  "properties": { "name": "YouTube reminder" },
  "sequence": [ /* steps, top to bottom */ ]
}
```

- `properties.name` is what the editor shows. Put nothing else in
  `properties`: the person's own settings (grouping and the rest) are kept when
  they import.
- `sequence` is a list of steps. A switch step (Condition, Duplicate?) holds more
  lists in `branches`.

Every step has the same outer shape:

```json
{
  "id": "yt-sleep",
  "componentType": "task",
  "type": "sleep",
  "name": "Sleep",
  "properties": { "type": "action", "task": "sleep", "isDeletable": true }
}
```

| Field | Rule |
|---|---|
| `id` | Any string, unique within the file. The editor issues its own when it loads. |
| `componentType` | `"switch"` for `rule` and `duplicate`; `"task"` for everything else. |
| `type` | The step, from the tables below. |
| `name` | The label in the editor. Use the names below. |
| `properties.type` | `"trigger"`, `"action"` or `"logic"`, as listed. |
| `properties.task` | Always the same as `type`. |

Add `"isDeletable": true` to every step's properties, and `"isLocked": false`
to triggers, as the editor does.

Durations are split into days, hours and minutes; any mix works, and the total
must be more than zero.

## Triggers (`properties.type: "trigger"`)

A tab waits at a trigger until it fires for that tab.

### Unused for — `idle`

Fires once the tab hasn't been looked at for this long. Counts from when it was
last used, so a second, longer one later in the same path works too (WithFew
1.0.4 or later).

```json
{ "id": "t1", "componentType": "task", "type": "idle", "name": "Unused for",
  "properties": { "type": "trigger", "isLocked": false, "isDeletable": true, "task": "idle",
    "idle_time_days": 0, "idle_time_hours": 3, "idle_time_minutes": 0 } }
```

### In Bin for — `in_bin`

Fires once the tab has been in Bin this long. Only tabs in Bin get past it, so
put **Move to Bin** before it. Few stretches this for pages it can see are
important, shortens it for throwaway ones (search results, sign-in pages), and
never fires it for pages that look private — that's deliberate.

```json
{ "id": "t2", "componentType": "task", "type": "in_bin", "name": "In Bin for",
  "properties": { "type": "trigger", "isLocked": false, "isDeletable": true, "task": "in_bin",
    "bin_time_days": 5, "bin_time_hours": 0, "bin_time_minutes": 0 } }
```

### Time spent — `time_spent`

Fires once the person has spent this many **minutes** looking at the tab, added
up across every visit to it.

```json
{ "id": "t3", "componentType": "task", "type": "time_spent", "name": "Time Spent",
  "properties": { "type": "trigger", "isLocked": false, "isDeletable": true, "task": "time_spent",
    "time": 20 } }
```

### Schedule — `schedule`

Fires at a set time for every tab it picks up, and can open pages. **Top level
only.** As the first step, it holds every tab until the time. Elsewhere, give it
`rules`, or it sends every tab at an earlier step straight past those steps.

```json
{ "id": "t4", "componentType": "task", "type": "schedule", "name": "Schedule",
  "properties": { "type": "trigger", "isLocked": false, "isDeletable": true, "task": "schedule",
    "schedule_type": "weekly", "time": "18:00", "days_of_week": [1, 2, 3, 4, 5],
    "interval_minutes": 60, "day_of_month": 1, "target_timestamp": "",
    "rules": [], "open_urls": [],
    "filter_pinned": false, "filter_grouped": false, "filter_audible": false } }
```

| Property | Meaning |
|---|---|
| `schedule_type` | `daily` (every day at `time`), `weekly` (`days_of_week` at `time`), `monthly` (`day_of_month` 1–31 at `time`), `interval` (every `interval_minutes`, first time straight away), `specific` (once, at `target_timestamp`) |
| `time` | `"HH:MM"`, 24-hour, the browser's local time. Fires only in that exact minute, and only if Chrome is open. |
| `days_of_week` | Numbers, 0 = Sunday … 6 = Saturday |
| `rules` | Which tabs it picks up, by address: `[{ "option": "contains", "value": "mail.google.com" }]`; `option` is `exact`, `starts` or `contains`; any rule matching is enough. Empty = every tab. |
| `open_urls` | Pages to open (in the background) when it fires. |
| `filter_pinned`, `filter_audible` | `false` = leave pinned tabs / tabs playing sound out. Keep them `false`. |
| `filter_grouped` | `false` = leave out tabs in the person's own tab groups (WithFew 1.0.4+; earlier versions left out every grouped tab, including Few's own groups). |

To open pages at a time without disturbing anything else, put the Schedule
**last**, with `rules` matching only the pages it opens.

### Duplicate? — `duplicate` (a switch)

Asks whether the same address is already open in a tab opened before this one.
Branches `Yes` and `No`. The first copy is always `No`, so it's kept.

```json
{ "id": "t5", "componentType": "switch", "type": "duplicate", "name": "Duplicate",
  "properties": { "type": "trigger", "isLocked": false, "isDeletable": true, "task": "duplicate", "condition": "" },
  "branches": { "Yes": [ /* e.g. Close */ ], "No": [] } }
```

Put it first, so a duplicate is closed as soon as it appears.

### Open — `open`

Fires for a newly opened tab, optionally only if its address matches `rules`.
Only works as the **very first step**, and tabs that don't match stop there for
good. Prefer a Condition.

## Actions (`properties.type: "action"`)

### Move to Bin — `bin`

Moves the tab into the collapsed Bin group and unloads it (`discard`).

```json
{ "id": "a1", "componentType": "task", "type": "bin", "name": "Move to Bin",
  "properties": { "type": "action", "isDeletable": true, "task": "bin",
    "ignore_pinned_tabs": true, "ignore_grouped_tabs": true, "ignore_tabs_playing_audio": true, "discard": true } }
```

`ignore_grouped_tabs` means the person's own groups; Few's groups are always
fair game. Keep all three `true` unless asked.

### Sleep — `sleep`

Unloads the tab to free memory; it stays where it is and reloads when clicked.
It doesn't end the tab's run: a minute later the tab carries on with the next
step, so a cleanup below still applies to it. Put the cleanup in the
Condition's Else if slept tabs should stay out of it.

```json
{ "id": "a2", "componentType": "task", "type": "sleep", "name": "Sleep",
  "properties": { "type": "action", "isDeletable": true, "task": "sleep",
    "ignore_pinned_tabs": true, "ignore_grouped_tabs": true, "ignore_tabs_playing_audio": true } }
```

### Close — `close`

Closes the tab. **Ends the tab's run.** When it closes tabs from Bin, the
person gets a notification with Undo.

```json
{ "id": "a3", "componentType": "task", "type": "close", "name": "Close",
  "properties": { "type": "action", "isDeletable": true, "task": "close",
    "min_open_tabs": 0, "ignore_pinned_tabs": true, "ignore_grouped_tabs": false, "ignore_tabs_playing_audio": true } }
```

- `min_open_tabs`: only closes while **more than** this many tabs are open in
  all. `0` = no floor. (The editor's toolbox starts at 5.)
- After Move to Bin, keep `ignore_grouped_tabs: false`; directly on tabs that
  weren't binned, set it to `true` so the person's own groups are spared.

### Notify — `nudge`

Shows a notification for the tab (it doesn't need the tab to be in the
background). `message` is required, 300 characters at most.

```json
{ "id": "a4", "componentType": "task", "type": "nudge", "name": "Notify",
  "properties": { "type": "action", "isDeletable": true, "task": "nudge",
    "message": "20 minutes on YouTube.", "sound": "off" } }
```

### Bookmark — `bookmark`

Bookmarks the tab. `folder: null` = the WithFew folder Few made at install.

```json
{ "id": "a5", "componentType": "task", "type": "bookmark", "name": "Bookmark",
  "properties": { "type": "action", "isDeletable": true, "task": "bookmark", "folder": null } }
```

### Pin, Focus, Reload — `pin`, `focus`, `reload`

```json
{ "id": "a6", "componentType": "task", "type": "pin", "name": "Pin",
  "properties": { "type": "action", "isDeletable": true, "task": "pin" } }
```

- **Pin** pins the tab.
- **Focus** switches to the tab (brings it to the front). Rarely wanted.
- **Reload** reloads it; takes the same three `ignore_*` settings as Sleep.

### Group — `group`

Moves the tab into one of the person's tab groups, by the group's id in their
browser — which you can't know. Leave it out of files; if they want it, tell
them to add a Group step in the editor and pick the group.

## Logic (`properties.type: "logic"`)

### Condition — `rule` (a switch)

Decided once, when the tab reaches it. `condition_logic` is `"AND"` (all must
hold) or `"OR"` (any). Conditions are in [conditions.md](conditions.md).
Branches `If` and `Else`; after either, the tab carries on below the Condition
unless the branch ended its run (Sleep, Close).

```json
{ "id": "c1", "componentType": "switch", "type": "rule", "name": "YouTube",
  "properties": { "type": "logic", "isDeletable": true, "task": "rule", "rules": [],
    "conditions": [ { "type": "domain", "value": ["youtube.com"] } ],
    "condition_logic": "OR" },
  "branches": { "If": [ /* steps */ ], "Else": [] } }
```

`name` is the label on the diagram: name it for what it matches ("YouTube",
"Social sites"). With no conditions, every tab takes `If`.

### Delay — `delay`

Waits this long, counted from when the tab reaches it.

```json
{ "id": "l1", "componentType": "task", "type": "delay", "name": "Delay",
  "properties": { "type": "logic", "isDeletable": true, "task": "delay",
    "days": 0, "hours": 0, "minutes": 10 } }
```
