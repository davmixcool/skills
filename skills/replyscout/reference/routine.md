# Routine mode: scheduled runs

A scheduled run (`ops/run-scout.sh`, or `/loop`) asks for the replyscout skill "in routine
mode". Nobody is watching, so:

- **Ask nothing.** Make the reasonable call, and say what you did in the summary.
- **Work in this order:**
  1. `get_profile`.
  2. **Follow-ups:** `x_notifications`, then `x_open_post` and `scout_post` for answers to the
     maker's replies ([`browsing.md`](browsing.md)).
  3. **Scouting:** a few `x_search` from their interests and topics, then `x_open_post` and
     `scout_post`, at most 8 ([`browsing.md`](browsing.md)).
  4. **Drafting:** every `list_items` with `needsBrief: true` (what you scouted, plus what
     the maker scouted by hand), as in SKILL.md steps 3–7. Close what's late with
     `status: "skipped"` and a short `closedReason`.
  5. **Learning** (first run of the day, or 10 new posted cards): [`learning.md`](learning.md).
- **Everything lands in Backlog.** Never set a card's text or move it.
- **If the extension isn't connected,** stop and say so; the run script tells the maker.

## The last line

End with exactly one of:

```
REPLYSCOUT_SUMMARY: scouted <n>, drafted <n>, skipped <n>, ideas <n>, hot waiting <n>
REPLYSCOUT_STATUS: login-needed
REPLYSCOUT_STATUS: stopped - <what X said>
```

The run script turns it into a notification for the maker. "Hot waiting" is the count of
drafted Backlog cards whose timing is hot: the ones worth reviewing now.
