#!/usr/bin/env python3
import argparse
from pathlib import Path


def write_if_missing(path: Path, content: str) -> None:
    if path.exists():
        print(f"skip  {path}")
        return
    path.write_text(content)
    print(f"write {path}")


def main() -> None:
    p = argparse.ArgumentParser(description="Initialize desktop app factory planning docs")
    p.add_argument("--project", required=True)
    p.add_argument("--name", required=True)
    p.add_argument("--user", required=True)
    p.add_argument("--pain", required=True)
    p.add_argument("--promise", required=True)
    args = p.parse_args()

    root = Path(args.project).expanduser().resolve()
    docs = root / "docs" / "factory"
    docs.mkdir(parents=True, exist_ok=True)

    name = args.name
    write_if_missing(docs / "APP_BRIEF.md", f"""# {name} — App Brief\n\n## One-line promise\n{args.promise}\n\n## Target user\n{args.user}\n\n## Recurring annoyance\n{args.pain}\n\n## Current workaround\n[TBD]\n\n## Frequency / cost\n[TBD]\n\n## Desktop-native advantage\n[TBD]\n\n## First-session value moment\n[TBD]\n\n## Core loop\n`trigger -> context/input -> action -> result -> repeated time saved`\n\n## Premium promise\n[TBD]\n\n## V1\n- [TBD]\n\n## Later\n- [TBD]\n\n## Explicitly not now\n- [TBD]\n\n## Primary acquisition hook\n[TBD]\n\n## Success signal\n[TBD]\n""")

    write_if_missing(docs / "WORKFLOW_MODEL.md", f"""# {name} — Workflow Model\n\n## Primary workflow\n\n### Trigger\n[TBD]\n\n### Context/input\n[TBD]\n\n### Action\n[TBD]\n\n### Result\n[TBD]\n\n### Confirmation boundary\n[TBD]\n\n### Undo / recovery\n[TBD]\n\n## Persisted state\n- [TBD]\n\n## Failure modes\n| Failure | User-visible behavior | Retry/recovery |\n|---|---|---|\n| [TBD] | [TBD] | [TBD] |\n\n## OS differences\n### macOS\n[TBD]\n\n### Windows\n[TBD]\n\n### Linux\n[Not targeted / TBD]\n""")

    write_if_missing(docs / "V1_SCOPE.md", f"# {name} — V1 Scope\n\n## Must ship\n- [ ] [TBD]\n\n## Later\n- [ ] [TBD]\n\n## Not now\n- [ ] [TBD]\n")
    write_if_missing(docs / "DESKTOP_INTEGRATIONS.md", f"# {name} — Desktop Integrations\n\n| Integration | V1 / Later / No | Why | Scope/permission |\n|---|---|---|---|\n| Tray/menu bar | No | | |\n| Global shortcut | No | | |\n| Autostart | No | | |\n| Notifications | No | | |\n| Clipboard | No | | |\n| Filesystem | No | | |\n| Watcher | No | | |\n| Single instance | Later | | |\n| Updater | V1 | Release reliability | |\n")
    write_if_missing(docs / "MONETIZATION_PLAN.md", f"# {name} — Monetization Plan\n\n## Model\n[TBD: one-time / annual / hybrid / team]\n\n## Free or trial experience\n[TBD]\n\n## Paid value\n[TBD]\n\n## Licensing behavior\n[TBD]\n")
    write_if_missing(docs / "ANALYTICS_PLAN.md", f"# {name} — Analytics Plan\n\n## Activation\n[TBD first successful action]\n\n## Repeat value\n[TBD]\n\n## Funnel\n`first_open -> first_successful_action -> repeated_successful_action -> trial/paywall -> paid`\n\n## Sensitive data exclusions\n- clipboard contents\n- file contents\n- full paths/filenames\n- credentials\n")
    write_if_missing(docs / "DISTRIBUTION_PLAN.md", f"# {name} — Distribution Plan\n\n## Target OSes\n- [ ] macOS\n- [ ] Windows\n- [ ] Linux\n\n## Route\n[TBD direct / store]\n\n## Signing/notarization\n[TBD]\n\n## Updater\n[TBD]\n")
    write_if_missing(docs / "LAUNCH_PLAN.md", f"# {name} — Launch Plan\n\n## Demo hook\n[TBD]\n\n## Primary channel\n[TBD]\n\n## Launch assets\n- [ ] Landing page\n- [ ] Short demo video/GIF\n- [ ] Signed installer/package\n- [ ] Pricing\n\n## Decision checkpoint\n[TBD]\n")
    write_if_missing(docs / "TODO.md", f"# {name} — TODO\n\n## Product\n- [ ] Complete APP_BRIEF.md\n- [ ] Complete WORKFLOW_MODEL.md\n- [ ] Lock V1\n\n## Build\n- [ ] Implement core trigger -> action -> result\n- [ ] Implement required native integrations\n- [ ] Test restart/recovery\n\n## Ship\n- [ ] Licensing\n- [ ] Analytics\n- [ ] Signing/package\n- [ ] Launch assets\n")
    write_if_missing(docs / "niche.yaml", f"""app:\n  name: {name}\n  promise: {args.promise}\n  target_user: {args.user}\n  recurring_pain: {args.pain}\n\ntargets:\n  macos: true\n  windows: true\n  linux: false\n\ncapabilities:\n  tray: false\n  global_shortcuts: false\n  autostart: false\n  notifications: false\n  clipboard: false\n  filesystem: false\n  watcher: false\n\nmonetization:\n  model: one_time\n""")


if __name__ == "__main__":
    main()
