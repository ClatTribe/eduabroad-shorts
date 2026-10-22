"""
Sounds for the whiteboard (sketch) Shorts, all synthesised here so they are royalty-free:
  public/audio/sketch-music.wav  calm lo-fi bed (soft electric piano chords, light beat, vinyl hiss)
  public/audio/pencil.wav        graphite on paper, a few seconds (trimmed to each line's writing time)
  public/audio/scribble.wav      quick box around a word
  public/audio/marker.wav        highlighter swipe

Usage: python tools/make_sketch_audio.py --duration 24 [--seed 7]
"""
import argparse
import pathlib

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio"
SR = 44100


def band(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def low(x, hz, order=4):
    return sosfilt(butter(order, hz, btype="low", fs=SR, output="sos"), x)


def pencil(seconds, rng):
    """Graphite scratch: band-limited noise shaped into short strokes (about 9 per second)."""
    n = int(seconds * SR)
    noise = band(rng.standard_normal(n), 1800, 7500)
    env = np.zeros(n)
    t = 0.0
    while t < seconds:
        length = rng.uniform(0.05, 0.14)
        a, b = int(t * SR), min(n, int((t + length) * SR))
        if b > a:
            env[a:b] = np.hanning(b - a) * rng.uniform(0.5, 1.0)
        t += length + rng.uniform(0.0, 0.05)
    return noise * env


def chord_voice(freqs, seconds, rng):
    """Soft electric-piano chord: a few harmonics with a gentle tine and slow decay."""
    t = np.arange(int(seconds * SR)) / SR
    out = np.zeros_like(t)
    for f in freqs:
        f = f * (1 + rng.uniform(-0.002, 0.002))
        tone = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.12 * np.sin(2 * np.pi * 3 * f * t)
        out += tone * np.exp(-t * 1.6)
    out *= np.minimum(1, t * 60)
    return out / max(1, len(freqs))


def music(duration, seed):
    rng = np.random.default_rng(seed)
    bpm = 78
    beat = 60 / bpm
    bar = 4 * beat
    n = int(duration * SR)
    mix = np.zeros(n + SR * 4)
    root = 57 + rng.integers(-2, 3)  # around A3
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    # Imaj7, vi7, IVmaj7, V (gentle and unresolved, so it loops)
    prog = [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 11, 14, 17]]
    bars = int(np.ceil(duration / bar)) + 1
    for b in range(bars):
        chord = prog[b % 4]
        for hit, length in ((0, 2.5), (2.5, 1.5)):
            start = int((b * bar + hit * beat) * SR)
            v = chord_voice([hz(root + c) for c in chord], length * beat + 1.2, rng) * (0.9 if hit == 0 else 0.55)
            mix[start : start + len(v)] += v[: len(mix) - start]
        bass = chord_voice([hz(root + chord[0] - 12)], bar, rng) * 0.8
        s = int(b * bar * SR)
        mix[s : s + len(bass)] += bass[: len(mix) - s]
    # light beat: soft kick on 1 and 3, brushed hat on the off-beats
    t = np.arange(int(0.25 * SR)) / SR
    kick = np.sin(2 * np.pi * (55 + 60 * np.exp(-t * 30)) * t) * np.exp(-t * 14) * 0.5
    hat = band(rng.standard_normal(int(0.08 * SR)), 6000, 12000) * np.exp(-np.arange(int(0.08 * SR)) / SR * 60) * 0.08
    for b8 in range(int(duration / (beat / 2)) + 1):
        s = int(b8 * beat / 2 * SR)
        if b8 % 4 == 0:
            mix[s : s + len(kick)] += kick[: len(mix) - s]
        if b8 % 2 == 1:
            mix[s : s + len(hat)] += hat[: len(mix) - s]
    mix = mix[:n]
    mix = low(mix, 5200)
    mix += band(rng.standard_normal(n), 2000, 9000) * 0.004  # vinyl hiss
    fade_in = np.minimum(1, np.arange(n) / (0.6 * SR))
    fade_out = np.minimum(1, (n - np.arange(n)) / (1.5 * SR))
    mix *= fade_in * fade_out
    return mix / np.max(np.abs(mix)) * 0.35


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    rng = np.random.default_rng(a.seed)
    OUT.mkdir(parents=True, exist_ok=True)
    sf.write(OUT / "sketch-music.wav", music(a.duration, a.seed), SR)
    p = pencil(6.0, rng)
    sf.write(OUT / "pencil.wav", p / np.max(np.abs(p)) * 0.5, SR)
    s = pencil(0.5, rng) * np.hanning(int(0.5 * SR))
    sf.write(OUT / "scribble.wav", s / np.max(np.abs(s)) * 0.5, SR)
    m_t = np.arange(int(0.4 * SR)) / SR
    m = band(rng.standard_normal(len(m_t)), 900, 4000) * np.sin(np.pi * m_t / 0.4) ** 2
    sf.write(OUT / "marker.wav", m / np.max(np.abs(m)) * 0.4, SR)
    print(f"wrote sketch audio ({a.duration:.1f}s music, seed {a.seed})")


if __name__ == "__main__":
    main()
