# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, Copilot, etc.) when working with code in this repository.

## Repository Overview

A collection of skills for AI coding agents. Skills are packaged instructions and scripts that extend agent capabilities.

## Creating a New Skill

### Directory Structure

```
skills/
  {skill-name}/           # kebab-case directory name
    SKILL.md              # Required: skill definition
    scripts/              # Optional: executable scripts
      {script-name}.sh    # Bash scripts
      {script-name}.mjs   # Node scripts
      {script-name}.py    # Python scripts
    reference/            # Optional: supporting docs loaded on demand
    assets/               # Optional: templates the skill fills in and emits
    agents/               # Optional: per-agent config (e.g. openai.yaml)
    example/              # Optional: runnable sample input
    lib/                  # Optional: shared code for scripts
```

`reference/` and `references/` are both in use and both fine — match whichever
the skill already uses rather than renaming, since every path in its `SKILL.md`
points at it. Only `SKILL.md` itself is mandatory; a skill that is purely
instructions (see `metamanager`, `scrinly`) needs nothing else.

A per-skill `README.md` is optional. `SKILL.md` is what the agent loads; a
README is for humans browsing the repo on GitHub, and is worth adding only when
the skill is large enough that its SKILL.md is a poor introduction.

### Naming Conventions

- **Skill directory**: `kebab-case` (e.g., `web-brand`, `log-monitor`)
- **SKILL.md**: Always uppercase, always this exact filename
- **Scripts**: `kebab-case.sh`, `kebab-case.mjs`, or `snake_case.py` (e.g., `deploy.sh`, `collect-signals.mjs`, `score_idea.py`)

### SKILL.md Format

```markdown
---
name: {skill-name}
description: {One sentence describing when to use this skill. Include trigger phrases like "Deploy my app", "Check logs", etc.}
---

# {Skill Title}

{Brief description of what the skill does.}

## How It Works

{Numbered list explaining the skill's workflow}

## Usage

```bash
bash /mnt/skills/user/{skill-name}/scripts/{script}.sh [args]
```

**Arguments:**
- `arg1` - Description (defaults to X)

**Examples:**
{Show 2-3 common usage patterns}

## Output

{Show example output users will see}

## Present Results to User

{Template for how Claude should format results when presenting to users}

## Troubleshooting

{Common issues and solutions, especially network/permissions errors}
```

### Best Practices for Context Efficiency

Skills are loaded on-demand — only the skill name and description are loaded at startup. The full `SKILL.md` loads into context only when the agent decides the skill is relevant. To minimize context usage:

- **Keep SKILL.md under 500 lines** — put detailed reference material in separate files
- **Write specific descriptions** — helps the agent know exactly when to activate the skill
- **Use progressive disclosure** — reference supporting files that get read only when needed
- **Prefer scripts over inline code** — script execution doesn't consume context (only output does)
- **File references work one level deep** — link directly from SKILL.md to supporting files

### Script Requirements

- Bash scripts: use `#!/bin/bash` and `set -e`
- Node scripts: use `#!/usr/bin/env node` and `.mjs`
- Python scripts: use `#!/usr/bin/env python3` and stick to the standard
  library, so there is nothing for the user to install
- Write status messages to stderr
- Write machine-readable output (JSON) to stdout
- Include a cleanup trap for temp files when scripts create them
- Reference scripts by relative path, for example `node scripts/{script}.mjs`

### End-User Installation

Document skills.sh installation for public skills:

```bash
npx skills add davmixcool/skills --skill {skill-name} -g
```

`-g` installs at user level; without it the skill lands in the current project
under `./.agents/skills/`. The CLI itself needs Node 20.12+.

For manual installs, document the native path when the skill needs one. If the
skill depends on an MCP server or any other runtime the repo does not ship,
state that plainly in `SKILL.md` and add a row to the README's requirements
table.

**Claude Code:**
```bash
cp -r skills/{skill-name} ~/.claude/skills/
```

**claude.ai:**
Add the skill to project knowledge or paste SKILL.md contents into the conversation.

If the skill requires network access, instruct users to add required domains at `claude.ai/settings/capabilities`.