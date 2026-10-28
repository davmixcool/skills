---
name: withdirector
description: Plan, cut and revise the creator's talking-to-camera videos in WithDirector, their Mac video studio with a live AI Director, through the local withdirector-mcp server. Turn a rough idea into a brief the live Director records from (angle, beats, follow-up questions it asks aloud), then cut the takes into a video by submitting an edit plan the app checks and renders (pause trimming, captions, zooms), and revise it. Use when asked to "plan a video", "help me with my next video", "make a brief for…", "make the first cut", "cut my latest take", "make it shorter", or about the creator's WithDirector projects. Never records, exports or deletes anything; the creator does that in the app.
---

# WithDirector

The creator records themselves talking to camera while a live Director nudges them; you help
before and after: you plan the video, then cut and revise what they recorded.

**The playbook comes from the `withdirector` MCP tools, and is always current:** call
`get_guide({ topic: 'workflow' })` first, and the topic it points you to (`planning`,
`recordings`, `cutting`).
Follow the guides over anything you remember.

## The rules that never change

- **The creator's words are theirs.** Never invent their stories, numbers or opinions.
- **You never record, export, delete, or touch video files.** You plan, cut and revise through
  the tools (a cut is an edit plan the app renders); the creator does the rest in the app.
- **Write to the creator as "you".** Never assume anyone's pronouns.
- **The Director's voice is calm and direct.** No cheerleading, no repeating their words back.

## If the tools aren't there

- **"WithDirector isn't running":** ask the creator to open the WithDirector app.
- **No `withdirector` tools at all:** they need `claude mcp add withdirector -s user -- npx -y withdirector-mcp@latest`,
  or **Connect** under **Your agent** in the app.
