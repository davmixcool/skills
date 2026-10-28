# outreach.json

The one file you write. `scripts/build-tracker.mjs outreach.json outreach.html` turns it into
the page. `example/outreach.json` is a complete example.

```jsonc
{
  "product": {
    "name": "Ringo",                      // required
    "site": "https://ringo.app",          // required
    "line": "A launcher that opens around your cursor.",
    "demo": "https://youtu.be/…",         // the demo every message links
    "offer": "14 days of Pro, then a free licence for anyone who replies",
    "sender": "Alex Rivera, from hello@ringo.app"
  },
  "made": "2026-10-28",                   // shown under the title
  "setup": [                              // "Before you start": the person's steps, in order
    "**Sender name:** set your mail account's sender name to your own name.",
    "**Codes:** make a free licence only when someone replies (see Replies)."
  ],
  "groups": [                             // in page order; each contact names one
    { "id": "best", "title": "Best fit", "note": "Made something in the category recently." },
    { "id": "lang", "title": "Other languages" },
    { "id": "long", "title": "Long shots" },
    { "id": "directories", "title": "Directories and launch sites" },
    { "id": "press", "title": "Newsletters and press" }
  ],
  "start": ["sam", "leo", "macnative"],  // optional: the five to start with, by id
  "contacts": [
    {
      "id": "sam",                        // required, unique, a-z0-9-
      "group": "best",                    // required, one of groups[].id
      "name": "Sam Rivera",               // required
      "url": "https://www.youtube.com/@…",// their channel, site or profile
      "size": "31K subscribers · UK",
      "language": "English",
      "why": "Their video \"9 Mac Apps I Use Every Day\" (Apr 2026) is a round-up of exactly this kind of app.",
      "how": "Email sam@example.com. Backup: Instagram DM @sam.",   // where to send it
      "channel": "Email",                 // a short tag shown on the card: Email, DM, Form, Post…
      "sources": [                        // required: at least one
        { "title": "9 Mac Apps I Use Every Day", "url": "https://www.youtube.com/watch?v=…" }
      ],
      "messages": [                       // required: at least one; the first is the first message
        { "label": "Email", "subject": "A Mac app for your next round-up, if it earns a place", "body": "Hi Sam,\n\n…" },
        { "label": "Backup: Instagram DM (if no answer in a week)", "body": "Hi Sam, …" }
      ],
      "notes": "Replied 3 Nov: said yes."  // optional, free text
    }
  ],
  "replies": [                            // the reply templates (reference/replies.md)
    { "id": "yes", "title": "They said yes", "body": "Thanks [name]! …" }
  ]
}
```

**Text fields** (`setup`, `why`, `how`, `note`) may use `**bold**` and `` `code` ``; links in them
are made clickable. **Message bodies** are plain text, exactly as they'll be pasted.

**Placeholders:** `[UPPER CASE IN BRACKETS]` and `[name]` are highlighted on the page and listed
by the builder.

**Statuses** (To send, Sent, Replied, Said yes, Not now) aren't in the file: the person sets
them on the page, and they're saved in their browser under the product's name.
