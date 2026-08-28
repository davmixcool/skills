#!/usr/bin/env python3
import json
import sys
from pathlib import Path

CRITERIA = [
    "pain_intensity",
    "frequency_or_consequence",
    "desktop_native_advantage",
    "time_or_effort_saved",
    "one_sentence_clarity",
    "willingness_to_pay",
    "v1_simplicity",
    "reliability_support_burden",
    "acquisition_reachability",
    "expansion_optionality",
]


def verdict(total: int) -> str:
    if total >= 42:
        return "Build"
    if total >= 35:
        return "Validate first"
    if total >= 27:
        return "Reposition/narrow"
    return "Do not build yet"


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: score_idea.py idea.json", file=sys.stderr)
        sys.exit(2)

    path = Path(sys.argv[1])
    data = json.loads(path.read_text())
    scores = data.get("scores", data)

    missing = [key for key in CRITERIA if key not in scores]
    if missing:
        raise SystemExit("Missing scores: " + ", ".join(missing))

    invalid = {k: scores[k] for k in CRITERIA if not isinstance(scores[k], int) or not 1 <= scores[k] <= 5}
    if invalid:
        raise SystemExit("Every score must be an integer from 1 to 5: " + repr(invalid))

    total = sum(scores[key] for key in CRITERIA)
    result = {
        "name": data.get("name"),
        "total": total,
        "max": 50,
        "verdict": verdict(total),
        "scores": {key: scores[key] for key in CRITERIA},
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
