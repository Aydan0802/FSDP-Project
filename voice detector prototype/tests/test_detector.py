"""Tests for the detector's windows, safety checks, calibration and scoring maths.
Run from the project root:  python -m pytest tests"""
import argparse
import json

import numpy as np
import pandas as pd
import pytest

import detectors.forensics_xlsr as fx
from detectors.calibration import combine
from detectors.verdict import CALIBRATION, phone_band_share
from eval import run_info
from eval.calibrate import eer as calibrate_eer
from eval.calibrate import setups
from eval.run_eval import metrics
from train.finetune_head import eer as training_eer

SR = fx.SR
N = int(fx.WINDOW_S * SR)
HOP = int(fx.HOP_S * SR)


def ramp(seconds):
    """A clip whose every sample is different, so a window shows where it was cut from."""
    return np.arange(int(seconds * SR), dtype=np.float32)


def test_windows_step_by_the_hop_and_the_last_one_ends_with_the_clip():
    wav = ramp(12)
    windows = fx.make_windows(wav)
    assert windows.shape == (4, N)
    for window, start in zip(windows[:3], (0, HOP, 2 * HOP)):
        np.testing.assert_array_equal(window, wav[start:start + N])
    np.testing.assert_array_equal(windows[-1], wav[-N:])  # no audio at the end is skipped


def test_a_clip_of_exactly_one_window_gives_one_window():
    assert fx.make_windows(ramp(fx.WINDOW_S)).shape == (1, N)


def test_a_short_clip_is_repeated_to_fill_one_window():
    wav = ramp(2)
    windows = fx.make_windows(wav)
    assert windows.shape == (1, N)
    np.testing.assert_array_equal(windows[0][:len(wav)], wav)
    np.testing.assert_array_equal(windows[0][len(wav):2 * len(wav)], wav)


def test_windows_are_the_same_every_time():
    """No random crops at inference: the same clip always gives the same windows."""
    wav = np.random.default_rng(0).normal(size=7 * SR).astype(np.float32)
    np.testing.assert_array_equal(fx.make_windows(wav), fx.make_windows(wav))


def test_key_check_accepts_exactly_the_four_unused_tensors():
    fx.check_keys(missing=[], unexpected=sorted(fx.KNOWN_UNUSED))


@pytest.mark.parametrize("missing, unexpected", [
    (["pool.layer.weight"], sorted(fx.KNOWN_UNUSED)),                     # a tensor the model needs is missing
    ([], sorted(fx.KNOWN_UNUSED) + ["projection.4.weight"]),              # one more than the known four
    ([], sorted(fx.KNOWN_UNUSED)[:3]),                                    # the checkpoint is not the one we read
])
def test_key_check_stops_on_any_other_mismatch(missing, unexpected):
    with pytest.raises(RuntimeError):
        fx.check_keys(missing, unexpected)


def test_a_changed_model_file_is_not_run(tmp_path, monkeypatch):
    (tmp_path / "model.py").write_text("raise SystemExit('this must never run')\n")
    (tmp_path / "weights.safetensors").write_bytes(b"")
    monkeypatch.setattr(fx, "MODEL_DIR", tmp_path)
    monkeypatch.setattr(fx, "WEIGHTS", tmp_path / "weights.safetensors")
    with pytest.raises(RuntimeError, match="SHA-256"):
        fx._load_author_classes()


def test_combine_with_one_head_and_weight_one_gives_the_score_back():
    params = {"weights": [1.0], "bias": 0.0}
    np.testing.assert_allclose(combine([0.8], params), 0.8)


def test_combine_scores_every_row_of_a_table():
    params = {"weights": [1.0, 2.0], "bias": -0.5}
    table = np.array([[0.5, 0.5], [0.9, 0.2], [0.1, 0.99]])
    expected = [combine(row, params) for row in table]
    np.testing.assert_allclose(combine(table, params), expected)


def test_combine_never_returns_exactly_0_or_1():
    chance = combine(np.array([[0.0], [1.0]]), {"weights": [1.0], "bias": 0.0})
    assert 0 < chance.min() and chance.max() < 1


@pytest.mark.parametrize("name", ["calibration.json", "calibration_phone_tuned.json"])
def test_each_calibration_file_has_one_weight_per_head_for_each_kind_of_audio(name):
    cal = json.loads((CALIBRATION.parent / name).read_text())
    for channel in ("wideband", "phone"):
        assert len(cal[channel]["heads"]) == len(cal[channel]["weights"])


def test_eer_on_a_small_known_case():
    # 4 real and 4 fake clips; at a cut-off of 0.7 one of each is wrong, so EER = 25%
    y = np.array([0, 0, 0, 0, 1, 1, 1, 1])
    s = np.array([0.1, 0.2, 0.3, 0.7, 0.6, 0.8, 0.9, 0.95])
    assert calibrate_eer(y, s) == pytest.approx(25.0)
    assert calibrate_eer(y, -s + 1) == pytest.approx(75.0)  # scores the wrong way round


def test_the_three_copies_of_eer_agree():
    rng = np.random.default_rng(1)
    y = rng.integers(0, 2, 300)
    s = np.clip(0.3 * y + rng.normal(0.35, 0.2, 300), 0, 1)
    table = pd.DataFrame({"label": np.where(y == 1, "fake", "real"), "fake_score_raw": s})
    assert calibrate_eer(y, s) == pytest.approx(training_eer(y, s))
    assert metrics(table, 0.5)["EER_%"] == pytest.approx(calibrate_eer(y, s), abs=0.01)


def test_phone_band_share_tells_phone_audio_from_wideband():
    t = np.arange(3 * SR) / SR
    assert phone_band_share(np.sin(2 * np.pi * 1000 * t)) < 0.0002   # all inside the phone band
    assert phone_band_share(np.sin(2 * np.pi * 6000 * t)) > 0.99     # all above it


def test_run_info_accepts_the_same_run_and_stops_another(tmp_path):
    run_info.write(tmp_path, head="models/finetuned/a.safetensors", manifest="data/m.csv", split="val")
    run_info.check(tmp_path, head="models/finetuned/a.safetensors", split="val")
    with pytest.raises(SystemExit):
        run_info.check(tmp_path, head="models/finetuned/b.safetensors")
    with pytest.raises(SystemExit):
        run_info.check(tmp_path, head=None)  # the original model


def test_run_info_only_warns_for_folders_scored_before_it_existed(tmp_path, capsys):
    run_info.check(tmp_path, head=None)
    assert "no run.json" in capsys.readouterr().out


def test_head_names_are_spelled_one_way():
    assert run_info.head_name("original") is None and run_info.head_name(None) is None
    assert run_info.head_name("models\\finetuned\\a.safetensors") == "models/finetuned/a.safetensors"


def test_calibrate_stops_when_a_folder_was_scored_with_another_head(tmp_path, monkeypatch):
    import eval.calibrate as cal
    monkeypatch.setattr(cal, "ROOT", tmp_path)
    for name, head in (("val_orig", None), ("val_ft", "models/finetuned/ft.safetensors")):
        (tmp_path / name).mkdir()
        (tmp_path / name / "run.json").write_text(json.dumps({"head": head}))
    args = argparse.Namespace(heads=["original", "models/finetuned/ft.safetensors"],
                              fit=["val_ft", "val_orig"], test=["val_ft", "val_orig"],  # folders swapped
                              phone_heads=None, phone_fit=None, phone_test=None)
    with pytest.raises(SystemExit):
        setups(args)
    args.fit = args.test = ["val_orig", "val_ft"]
    assert setups(args)["phone"][0] == args.heads  # phone audio uses --heads unless told otherwise
