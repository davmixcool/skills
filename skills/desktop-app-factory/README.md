# Desktop App Factory Agent Skill

A portable Agent Skills package for evaluating, planning, building, auditing, launching, and growing focused desktop utilities with Tauri.

## Product thesis

The factory applies one repeatable pattern:

`recurring computer friction -> desktop trigger/context -> fast or automatic action -> visible result -> repeated time saved`

Examples include:
- menubar/tray utilities
- developer workflow tools
- clipboard tools
- file organization utilities
- screenshot/media helpers
- follow-up/waiting-for tools
- meeting prep utilities
- local AI transformation tools
- small creator/freelancer productivity apps

## Structure

```text
desktop-app-factory/
├── SKILL.md
├── README.md
├── references/
├── assets/
└── scripts/
```

## Claude Code installation

Personal installation:

```bash
mkdir -p ~/.claude/skills
cp -R desktop-app-factory ~/.claude/skills/desktop-app-factory
```

Project installation:

```bash
mkdir -p .claude/skills
cp -R desktop-app-factory .claude/skills/desktop-app-factory
```

Then invoke with `/desktop-app-factory` or ask a matching question and let the agent activate it automatically.

## Example prompts

```text
/desktop-app-factory Score a menubar app that organizes screenshots automatically.
```

```text
/desktop-app-factory Turn my Cuepark-style workflow idea into a complete V1 plan and create the factory docs in this repo.
```

```text
/desktop-app-factory Audit this Tauri app for tray, autostart, updater, signing, and permission issues before release.
```

```text
/desktop-app-factory Build the global-shortcut capture flow described in docs/factory/WORKFLOW_MODEL.md.
```

## Included scripts

Score a prepared idea JSON:

```bash
python scripts/score_idea.py idea.json
```

Initialize planning docs in a repository:

```bash
python scripts/init_app_docs.py \
  --project /path/to/repo \
  --name Stashshot \
  --user "people who take lots of screenshots" \
  --pain "screenshots become impossible to find" \
  --promise "Find any screenshot in seconds"
```
