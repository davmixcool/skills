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
| [`scrinly`](skills/scrinly/) | **Scrinly** — captures stored webpage screenshots, produces model-sized regions and Visual Style Guides, compares screenshots, polls asynchronous jobs, and reports credit usage through Scrinly's remote MCP server. |
| [`web-brand`](skills/web-brand/) | **WebBrand** — turns one SVG mark into a complete web brand kit: favicons (including a real `.ico`), app icons, PWA icons, social avatars, lockups, an X banner and an OG card, then wires the `<head>` tags, web manifest and JSON-LD into the site and verifies the result. |

## Requirements

Installing with `npx skills add` needs **Node 20.12+** — the `skills` CLI uses
`node:util`'s `styleText`, and older versions fail with a `SyntaxError` that
looks like a broken package but is really a stale Node.

Beyond that, each skill brings its own:

| Skill | Needs |
|---|---|
| `desktop-app-factory`, `mobile-app-factory` | **Python 3** for the scoring and scaffolding scripts (standard library only — nothing to install) |
| `metamanager`, `scrinly` | Their **MCP server** configured in your agent. The server holds the API key; the skill never takes one as an argument |
| `web-brand` | **Node 20+** and **Chrome or Chromium**, which it rasterises through. Common macOS and Linux paths are found automatically; otherwise pass `--chrome <path>` or set `$CHROME_PATH` |

## Install

```bash
npx skills add davmixcool/skills --skill web-brand -g
npx skills add davmixcool/skills --skill metamanager -g
npx skills add davmixcool/skills --skill scrinly -g
npx skills add davmixcool/skills --skill mobile-app-factory -g
npx skills add davmixcool/skills --skill desktop-app-factory -g
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
