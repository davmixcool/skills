# Mobile App Factory Agent Skill

A portable Agent Skills package for evaluating, planning, building, auditing, and launching focused Flutter reminder/lifecycle apps.

## What it does

The skill teaches an agent to apply one repeatable product pattern:

`tracked thing -> lifecycle knowledge -> due event -> reminder -> action -> history/next event`

It can:
- score a niche idea before development
- turn an approved idea into app-specific product/technical documents
- guide or perform Flutter implementation in a writable repository
- audit reminder reliability, monetization, privacy, analytics, and launch readiness
- classify post-launch apps as Kill / Maintain / Grow / Graduate

## Structure

```text
mobile-app-factory/
├── SKILL.md
├── README.md
├── references/
├── assets/
└── scripts/
```

## Claude Code installation

Personal installation (available across projects):

```bash
mkdir -p ~/.claude/skills
cp -R mobile-app-factory ~/.claude/skills/mobile-app-factory
```

Project installation:

```bash
mkdir -p .claude/skills
cp -R mobile-app-factory .claude/skills/mobile-app-factory
```

Then invoke with `/mobile-app-factory` or ask a matching question and let the agent activate it automatically.

## Example prompts

```text
/mobile-app-factory Score a reminder app for dog vaccines and medication.
```

```text
/mobile-app-factory Turn my car maintenance reminder idea into the complete V1 plan and create the docs in this repo.
```

```text
/mobile-app-factory Audit this Flutter app's reminder scheduling before submission.
```

```text
/mobile-app-factory Implement the reminder engine described in docs/factory/DOMAIN_MODEL.md.
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
  --name AutoDue \
  --entity Vehicle \
  --promise "Know what your car needs next"
```
