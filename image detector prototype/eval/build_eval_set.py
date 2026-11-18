"""Build the evaluation set: every test image, sent through every messaging-app condition.

Run from inside "image detector prototype/" (after tests/make_fixtures.py):
    ../.venv/Scripts/python.exe -m eval.build_eval_set

Reads data/fixtures/expected.json and writes data/eval/<condition>/<file> for each condition in
degrade/messaging.py, plus data/eval/manifest.csv with the columns
    path, file, source, label, condition
(label is what the ORIGINAL carried: "ai", "ai_edit" or "none"). Then run: node eval/run_eval.js
"""
import csv
import json
from pathlib import Path

from degrade.messaging import CONDITIONS

HERE = Path(__file__).resolve().parent.parent
FIXTURES = HERE / "data" / "fixtures"
OUT = HERE / "data" / "eval"


def main():
    items = json.loads((FIXTURES / "expected.json").read_text())
    rows = []
    for condition, make in CONDITIONS.items():
        folder = OUT / condition
        folder.mkdir(parents=True, exist_ok=True)
        for item in items:
            source = FIXTURES / item["file"]
            data, ending = make(source.read_bytes())
            target = folder / (source.stem + (ending or source.suffix))
            target.write_bytes(data)
            rows.append({"path": target.relative_to(HERE).as_posix(), "file": item["file"],
                         "source": item["source"], "label": item["label"], "condition": condition})
    with open(OUT / "manifest.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["path", "file", "source", "label", "condition"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"wrote {len(rows)} files ({len(items)} pictures x {len(CONDITIONS)} conditions) to {OUT}")


if __name__ == "__main__":
    main()
