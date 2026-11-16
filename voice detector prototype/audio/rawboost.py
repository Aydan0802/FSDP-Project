"""
rawboost.py - random channel damage for training slices.

RawBoost (Tak et al. 2022, see CITATIONS.md) changes a clip in a new random way
each time it is used, with no noise recordings. It stands in for the phone
lines, microphones and amplifiers we have no recordings of, so the head cannot
rely on any one of them. We use the two parts the paper found best together:

  1. convolutive: x, x^2 ... x^5, each through its own random filter, added up.
     x is a straight filter (a line or a room); the powers are distortion
     (a cheap microphone or amplifier).
  2. impulsive: up to 10% of samples get a random jolt, sized by the sample.

The numbers below are the defaults of the authors' public code. The code itself
is ours. This is for training only: it must never touch a clip being scored.
"""
import numpy as np
from scipy.signal import fftconvolve, firwin, freqz

SR = 16000
TERMS = 5                  # x, x^2 ... x^5
NOTCHES = 5                # each term's filter removes 5 random bands
CENTRE_HZ = (20, 8000)     # where a removed band can sit
WIDTH_HZ = (100, 1000)     # how wide it can be
TAPS = (10, 100)           # filter length, which sets how sharp its edges are
QUIETER_DB = (5, 20)       # the distortion terms are this much quieter than x
MAX_HIT_PERCENT = 10       # impulsive: at most this share of samples is hit
JOLT = 2.0                 # impulsive: size of a jolt, relative to its sample


def random_filter(rng, peak_db):
    """A chain of random notch filters whose loudest frequency reaches peak_db."""
    taps = np.ones(1)
    for _ in range(NOTCHES):
        centre, width = rng.uniform(*CENTRE_HZ), rng.uniform(*WIDTH_HZ)
        low, high = max(centre - width / 2, 1), min(centre + width / 2, SR / 2 - 1)
        length = int(rng.integers(*TAPS)) | 1  # a notch filter needs an odd length
        taps = np.convolve(taps, firwin(length, [low, high], fs=SR))
    _, response = freqz(taps, fs=SR)
    return taps * 10 ** (peak_db / 20) / np.abs(response).max()


def convolutive(x, rng):
    out = np.zeros_like(x)
    for power in range(1, TERMS + 1):
        peak_db = 0.0 if power == 1 else -rng.uniform(*QUIETER_DB)
        out += fftconvolve(x ** power, random_filter(rng, peak_db), mode="same").astype(x.dtype)
    out -= out.mean()
    return out / max(np.abs(out).max(), 1.0)  # only scale down, and only if it would clip


def impulsive(x, rng):
    hit = rng.permutation(len(x))[:int(len(x) * rng.uniform(0, MAX_HIT_PERCENT) / 100)]
    out = x.copy()
    out[hit] += JOLT * x[hit] * (rng.uniform(-1, 1, len(hit)) * rng.uniform(-1, 1, len(hit))).astype(x.dtype)
    return out / max(np.abs(out).max(), 1.0)


def rawboost(x, rng):
    """One new random version of a float32 slice with peak at most 1."""
    return impulsive(convolutive(x, rng), rng)
