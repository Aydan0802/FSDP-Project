"""Tests for the training options in train/finetune_head.py. Run from the project root:  python -m pytest tests"""
import numpy as np
import pandas as pd
import pytest
import torch
from transformers import Wav2Vec2Config, Wav2Vec2Model

from audio.rawboost import rawboost
from detectors.forensics_xlsr import CosineOutput
from eval.compare_heads import choose_stay
from train.finetune_head import augment, clean_phone_pairs, selection_score, unfreeze_last


def make_manifest():
    rows = [("data/train/real/a.wav", "real", "", "clean"),
            ("data/train/phone/real/a__p1.wav", "real", "", "phone1"),
            ("data/train/compressed/comp1/real/a.wav", "real", "", "comp1"),
            ("data/train/fake/piper/a.wav", "fake", "piper", "clean"),
            ("data/train/phone/fake/a__p1.wav", "fake", "piper", "phone1")]
    return pd.DataFrame(rows, columns=["path", "label", "generator", "version"])


def test_pairs_keep_real_and_fake_copies_of_one_name_apart():
    pairs = clean_phone_pairs(make_manifest())
    assert len(pairs) == 2
    real = pairs[pairs.label == "real"].iloc[0]
    assert real.path == "data/train/real/a.wav"
    assert real.path_phone == "data/train/phone/real/a__p1.wav"


def test_clean_clip_without_a_phone_copy_stops_training():
    with pytest.raises(ValueError):
        clean_phone_pairs(make_manifest().drop(index=4))


def test_cosine_output_is_a_logit_around_the_midpoint():
    layer = CosineOutput(torch.nn.Linear(4, 1))
    with torch.no_grad():
        same_direction, opposite = layer(layer.weight * 3), layer(-layer.weight)
    assert float(same_direction) == pytest.approx(CosineOutput.ALPHA * (1 - CosineOutput.MID), abs=1e-3)
    assert float(opposite) == pytest.approx(CosineOutput.ALPHA * (-1 - CosineOutput.MID), abs=1e-3)


def test_cosine_output_keeps_the_weight_names_of_the_linear_layer():
    linear = torch.nn.Linear(4, 1)
    assert set(CosineOutput(linear).state_dict()) == set(linear.state_dict())


def test_selection_ignores_vocoded_and_held_out_generators():
    v = {"clean": 1.0, "compressed": 3.0, "compressed_piper": 2.0, "compressed_orpheus": 9.0,
         "compressed_voc-dac": 30.0, "phone": 8.0, "phone_piper": 4.0, "phone_orpheus": 6.0}
    assert selection_score(v) == 5.0                               # (1 + 9) / 2
    assert selection_score(v, held_out=["orpheus"]) == 1.5         # (1 + 2) / 2
    assert selection_score(v, phone_head=True) == 7.0              # (8 + 6) / 2


def speech_like():
    return (0.5 * np.sin(np.arange(16000) / 7) * np.hanning(16000)).astype(np.float32)


def test_rawboost_is_repeatable_and_keeps_length_type_and_range():
    clip = speech_like()
    first = rawboost(clip, np.random.default_rng(1))
    assert np.array_equal(first, rawboost(clip, np.random.default_rng(1)))
    assert not np.array_equal(first, rawboost(clip, np.random.default_rng(2)))
    assert first.shape == clip.shape and first.dtype == clip.dtype
    assert np.abs(first).max() <= 1.0 + 1e-6


def test_augment_with_nothing_asked_for_only_normalises():
    clip = speech_like()
    assert np.allclose(augment(clip, 0, 0.0, False), clip / np.abs(clip).max())


def test_rawboost_does_not_depend_on_how_noisy_the_call_is(monkeypatch):
    """Both kinds of damage must draw their own random numbers. With one shared seed,
    RawBoost happened on every call below 17.5 dB and on none above."""
    import train.finetune_head as fh
    boosted, snr = [], {}
    monkeypatch.setattr(fh, "rawboost", lambda piece, rng: boosted.append(True) or piece)

    def fake_call(piece, seed, config):
        snr["db"] = np.random.default_rng(seed).uniform(*config.snr_db)  # degrade's first draw
        return piece, {}
    monkeypatch.setattr(fh, "degrade", fake_call)

    pairs = []
    for seed in range(400):
        boosted.clear()
        fh.augment(speech_like(), seed, 0.5, True)
        pairs.append((bool(boosted), snr["db"]))
    noisy = [b for b, db in pairs if db < 17.5]
    quiet = [b for b, db in pairs if db >= 17.5]
    assert 0.3 < np.mean(noisy) < 0.7 and 0.3 < np.mean(quiet) < 0.7


def test_augment_with_a_phone_call_leaves_nothing_above_the_phone_band():
    clip = (0.5 * np.sin(2 * np.pi * 6000 * np.arange(16000) / 16000)).astype(np.float32)
    clip += 0.5 * np.sin(2 * np.pi * 1000 * np.arange(16000) / 16000).astype(np.float32)
    spectrum = np.abs(np.fft.rfft(augment(clip, 3, 0.0, True))) ** 2
    assert spectrum[5000:].sum() < 0.01 * spectrum.sum()  # one bin is 1 Hz here


def test_unfreeze_opens_only_the_last_layers():
    config = Wav2Vec2Config(hidden_size=8, num_hidden_layers=3, num_attention_heads=2, intermediate_size=8,
                            conv_dim=(8,), conv_kernel=(3,), conv_stride=(2,), do_stable_layer_norm=True,
                            feat_extract_norm="layer", num_feat_extract_layers=1, num_conv_pos_embedding_groups=2)
    model = torch.nn.Module()
    model.wavlm = Wav2Vec2Model(config)
    model.wavlm.requires_grad_(False)
    unfreeze_last(model, 1)
    opened = {n for n, p in model.wavlm.named_parameters() if p.requires_grad}
    assert opened and all(n.startswith(("encoder.layers.2.", "encoder.layer_norm.")) for n in opened)


def test_current_mix_stays_unless_beaten_by_a_full_point():
    mixes = {"current": ["a", "b"], "new": ["a", "c"], "big": ["a", "b", "c"]}
    assert choose_stay({"current": 10.0, "new": 9.5, "big": 9.2}, mixes) == "current"
    assert choose_stay({"current": 10.0, "new": 8.5, "big": 8.2}, mixes) == "new"     # fewer heads, within 0.5
    assert choose_stay({"current": 10.0, "new": 9.0, "big": 8.0}, mixes) == "big"
