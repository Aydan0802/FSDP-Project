"""
run_info.py - remember how a scores.csv was made, and check it before reuse.

eval.run_eval, eval.splice_test and eval.false_alarm_check reuse a saved
scores.csv to save time. A scores.csv does not say which head, manifest or split
made it, so a folder scored with one head could be reused for another without
any warning. These scripts now write run.json next to scores.csv, and check it
before reusing the scores. eval.calibrate checks it too, so a folder given in
the wrong order stops the fit instead of giving wrong weights.
"""
import json
from pathlib import Path


def head_name(head):
    """One spelling per head: None for the original model, else the path with / separators."""
    return None if head in (None, "", "original") else Path(head).as_posix()


def write(folder, **info):
    (Path(folder) / "run.json").write_text(json.dumps(info, indent=2))


def check(folder, **wanted):
    """Stop if folder/run.json says the scores were made another way. Folders
    scored before run.json existed cannot be checked, so they get a warning."""
    path = Path(folder) / "run.json"
    if not path.exists():
        print(f"Warning: {folder} has no run.json, so its scores cannot be checked against {wanted}")
        return
    saved = json.loads(path.read_text())
    wrong = [f"{key} was {saved.get(key)!r}, not {value!r}" for key, value in wanted.items()
             if saved.get(key) != value]
    if wrong:
        raise SystemExit(f"{folder} was scored another way: {'; '.join(wrong)}. "
                         "Use another folder, or score it again.")
