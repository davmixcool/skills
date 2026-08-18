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

## Install

```bash
npx skills add davmixcool/skills --skill web-brand
```

Or install manually for Claude Code:

```bash
cp -r skills/web-brand ~/.claude/skills/
```

For claude.ai, add the skill to project knowledge, or paste the contents of
`SKILL.md` into the conversation. Skills that need network access require the
relevant domains to be allowed at `claude.ai/settings/capabilities`.

Then just ask:

```text
Use the web-brand skill to generate and integrate the complete
brand asset kit for this site from logo.svg.
```

## Contributing

[`AGENTS.md`](AGENTS.md) documents the layout, naming conventions and authoring
rules for skills in this repo — read it before adding one.

## Maintainer

Built and maintained by **David Oti** ([@davmixcool](https://github.com/davmixcool)).

## Licence

MIT — see [LICENSE](LICENSE).
