#!/usr/bin/env python3
"""Score a Mobile App Factory niche idea from a JSON file.

Input example:
{
  "name": "Car Maintenance Reminder",
  "scores": {
    "cost_of_forgetting": 5,
    "recurrence": 5,
    "domain_knowledge_advantage": 5,
    "automatic_reminder_generation": 5,
    "willingness_to_pay": 4,
    "ad_hook_strength": 5,
    "app_store_search_intent": 4,
    "build_simplicity": 4,
    "expansion_potential": 5,
    "global_portability": 5
  }
}
"""

import json
import sys
from pathlib import Path

CRITERIA = [
    "cost_of_forgetting",
    "recurrence",
    "domain_knowledge_advantage",
    "automatic_reminder_generation",
    "willingness_to_pay",
    "ad_hook_strength",
    "app_store_search_intent",
    "build_simplicity",
    "expansion_potential",
    "global_portability",
]


def verdict(total: int) -> str:
    if total >= 42:
        return "Build"
    if total >= 35:
        return "Validate first"
    if total >= 28:
        return "Reposition/narrow"
    return "Do not build yet"


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python scripts/score_idea.py <idea.json>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    try:
        data = json.loads(path.read_text())
    except Exception as exc:
        print(f"Could not read JSON: {exc}", file=sys.stderr)
        return 2

    scores = data.get("scores", {})
    missing = [key for key in CRITERIA if key not in scores]
    if missing:
        print("Missing criteria: " + ", ".join(missing), file=sys.stderr)
        return 2

    invalid = {k: scores[k] for k in CRITERIA if not isinstance(scores[k], int) or not 1 <= scores[k] <= 5}
    if invalid:
        print(f"Scores must be integers from 1 to 5. Invalid: {invalid}", file=sys.stderr)
        return 2

    total = sum(scores[key] for key in CRITERIA)
    result = {
        "name": data.get("name", "Unnamed idea"),
        "total": total,
        "max": 50,
        "verdict": verdict(total),
        "scores": {key: scores[key] for key in CRITERIA},
    }
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
