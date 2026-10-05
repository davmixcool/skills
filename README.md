# skills

David Oti's agent skills — packaged instructions and scripts that give AI coding
agents a repeatable workflow for a specific job.

Each skill is a directory under [`skills/`](skills/) containing a `SKILL.md` the
agent reads, plus any scripts and reference docs it needs. They work with Claude
Code, Codex, OpenCode, Cursor, Windsurf, Cline, and other agents that support
reusable skills.

## Skills

| Skill | What it does |
|---|---|
| [`desktop-app-factory`](skills/desktop-app-factory/) | **Desktop App Factory** — evaluates, plans, builds, audits and launches focused Tauri desktop utilities: menu bar tools, global shortcuts, clipboard and filesystem helpers, background automation. Takes one recurring computer annoyance from idea score to architecture, V1 backlog and monetization plan. |
| [`metamanager`](skills/metamanager/) | **MetaManager** — checks how a page presents itself (title, description, canonical, Open Graph, Twitter cards), scores it 0-100, returns framework-specific fixes, audits whole sites and verifies a fix by re-checking, through MetaManager's remote MCP server. |
| [`mobile-app-factory`](skills/mobile-app-factory/) | **Mobile App Factory** — the same factory pattern for Flutter apps that own one recurring responsibility: expiry trackers, renewal and maintenance reminders, invoice follow-ups. Turns a niche into a scored idea, an architecture, a V1 and a launch plan. |
| [`replyscout`](skills/replyscout/) | **ReplyScout** — the maker's reply scout on X: scouts X read-only through the ReplyScout extension, reads each thread, judges whether it's worth replying, picks where a reply will be seen, and drafts 1–3 replies in their voice onto their board to approve and post themselves. Learns their voice from what they posted and how they edited drafts, suggests posts of their own, and runs on a schedule. Never posts, likes or follows. |
| [`scrinly`](skills/scrinly/) | **Scrinly** — captures stored webpage screenshots, produces model-sized regions and Visual Style Guides, compares screenshots, polls asynchronous jobs, and reports credit usage through Scrinly's remote MCP server. |
| [`withfew`](skills/withfew/) | **WithFew** — writes workflows for the WithFew Chrome extension: automatic rules for when tabs sleep, move to Bin, close, get bookmarked or send a reminder. Checks each file with WithFew's own Import validator and an engine lint, reads it back in plain words, and hands over a file to import. |
| [`web-brand`](skills/web-brand/) | **WebBrand** — turns one SVG mark into a complete web brand kit: favicons (including a real `.ico`), app icons, PWA icons, social avatars, lockups, an X banner and an OG card, then wires the `<head>` tags, web manifest and JSON-LD into the site and verifies the result. |

## Requirements

Installing with `npx skills add` needs **Node 20.12+** — the `skills` CLI uses
`node:util`'s `styleText`, and older versions fail with a `SyntaxError` that
looks like a broken package but is really a stale Node.

Beyond that, each skill brings its own:

| Skill | Needs |
|---|---|
| `desktop-app-factory`, `mobile-app-factory` | **Python 3** for the scoring and scaffolding scripts (standard library only — nothing to install) |
| `metamanager`, `scrinly` | Their **MCP server** configured in your agent. The server holds the credential; the skill never takes one as an argument |
| `replyscout` | The **ReplyScout** Chrome extension and its local MCP server (`claude mcp add replyscout -s user -- npx -y replyscout-mcp`); without them, it works from pasted links and hands drafts over in chat. **Node 18+** for the pasted-link reader (no packages; uses an unofficial public mirror) |
| `withfew` | The **WithFew** Chrome extension, to import the workflow into. **Node 18+** for the file checker (no packages to install) |
| `web-brand` | **Node 20+** and **Chrome or Chromium**, which it rasterises through. Common macOS and Linux paths are found automatically; otherwise pass `--chrome <path>` or set `$CHROME_PATH` |

## Install

```bash
npx skills add davmixcool/skills --skill web-brand -g
npx skills add davmixcool/skills --skill metamanager -g
npx skills add davmixcool/skills --skill scrinly -g
npx skills add davmixcool/skills --skill mobile-app-factory -g
npx skills add davmixcool/skills --skill desktop-app-factory -g
npx skills add davmixcool/skills --skill withfew -g
npx skills add davmixcool/skills --skill replyscout -g
```

`-g` installs at user level, so the skill is available in every project. Drop it
to install into the current project instead, under `./.agents/skills/`. Swap in
any skill name from the table above, pass `--skill` more than once for several,
or use `--all` to take the lot.

Or install manually for Claude Code:

```bash
cp -r skills/web-brand ~/.claude/skills/    # or any other skill directory
```

For claude.ai, add the skill to project knowledge, or paste the contents of
`SKILL.md` into the conversation. Skills that need network access require the
relevant domains to be allowed at `claude.ai/settings/capabilities`.

Then just ask:

```text
Use the web-brand skill to generate and integrate the complete
brand asset kit for this site from logo.svg.

Use the scrinly skill to capture a stored full-page screenshot with regions.
```

## Contributing

[`AGENTS.md`](AGENTS.md) documents the layout, naming conventions and authoring
rules for skills in this repo — read it before adding one.

## Maintainer

Built and maintained by **David Oti** ([@davmixcool](https://github.com/davmixcool)).

## Licence

MIT — see [LICENSE](LICENSE).
