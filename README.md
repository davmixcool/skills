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
| [`web-brand`](skills/web-brand/) | **WebBrand** — turns one SVG mark into a complete web brand kit: favicons (including a real `.ico`), app icons, PWA icons, social avatars, lockups, an X banner and an OG card, then wires the `<head>` tags, web manifest and JSON-LD into the site and verifies the result. |
| [`scrinly`](skills/scrinly/) | **Scrinly** — captures stored webpage screenshots, produces model-sized regions and Visual Style Guides, compares screenshots, polls asynchronous jobs, and reports credit usage through Scrinly's remote MCP server. |
| [`metamanager`](skills/metamanager/) | **MetaManager** — checks how a page presents itself (title, description, canonical, Open Graph, Twitter cards), scores it 0-100, returns framework-specific fixes, audits whole sites and verifies a fix by re-checking, through MetaManager's remote MCP server. |

## Requirements

- **Node 20+** to run a skill's scripts
- **Node 20.12+** if you install with `npx skills add` — the `skills` CLI uses
  `node:util`'s `styleText`, and older versions fail with a `SyntaxError` that
  looks like a broken package but is really a stale Node
- **Chrome or Chromium** for `web-brand`, which rasterises through headless
  Chrome. Common macOS and Linux paths are found automatically; otherwise pass
  `--chrome <path>` or set `$CHROME_PATH`

## Install

```bash
npx skills add davmixcool/skills --skill web-brand -g
npx skills add davmixcool/skills --skill scrinly -g
npx skills add davmixcool/skills --skill metamanager -g
```

`-g` installs at user level, so the skill is available in every project. Drop it
to install into the current project instead, under `./.agents/skills/`.

Or install manually for Claude Code:

```bash
cp -r skills/web-brand ~/.claude/skills/
cp -r skills/scrinly ~/.claude/skills/
cp -r skills/metamanager ~/.claude/skills/
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
