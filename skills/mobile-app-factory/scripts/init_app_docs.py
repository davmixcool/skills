#!/usr/bin/env python3
"""Initialize factory planning files in a project.

Usage:
  python scripts/init_app_docs.py --project /path/to/repo --name AutoDue --entity Vehicle --promise "Know what your car needs next"
"""

import argparse
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--entity", required=True)
    parser.add_argument("--promise", required=True)
    args = parser.parse_args()

    root = Path(__file__).resolve().parent.parent
    target = Path(args.project).resolve() / "docs" / "factory"
    target.mkdir(parents=True, exist_ok=True)

    app_brief = (root / "assets" / "app-brief-template.md").read_text()
    app_brief = app_brief.replace("[App Name]", args.name)
    app_brief = app_brief.replace("[Tracked Entity]", args.entity)
    app_brief = app_brief.replace("[Outcome the app delivers]", args.promise)
    (target / "APP_BRIEF.md").write_text(app_brief)

    domain = (root / "assets" / "domain-model-template.md").read_text()
    domain = domain.replace("[App Name]", args.name).replace("[EntityName]", args.entity)
    (target / "DOMAIN_MODEL.md").write_text(domain)

    config = (root / "assets" / "niche-config-template.yaml").read_text()
    config = config.replace("[App Name]", args.name).replace("[Tracked Entity]", args.entity).replace("[Outcome]", args.promise)
    (target / "niche.yaml").write_text(config)

    placeholders = {
        "V1_SCOPE.md": f"# {args.name} — V1 Scope\n\n## Must ship\n- \n\n## Later\n- \n\n## Not now\n- \n",
        "MONETIZATION_PLAN.md": f"# {args.name} — Monetization Plan\n\n## Free\n- \n\n## Premium\n- \n\n## Paywall trigger\n- \n",
        "ANALYTICS_PLAN.md": f"# {args.name} — Analytics Plan\n\n## Activation\n- \n\n## Reminder actions\n- \n\n## Monetization\n- \n",
        "LAUNCH_PLAN.md": f"# {args.name} — Launch Plan\n\n## Validation\n- \n\n## Store\n- \n\n## Acquisition\n- \n",
        "TODO.md": f"# {args.name} — TODO\n\n## V1\n- [ ] \n",
    }
    for filename, text in placeholders.items():
        path = target / filename
        if not path.exists():
            path.write_text(text)

    print(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
