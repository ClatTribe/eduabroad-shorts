"""
Composes an original desi-pop track for one Short and writes public/audio/music.wav.
Everything is synthesised here (no samples), so every track is royalty-free.

The arrangement follows the episode's timeline:
  before the drop   hook heartbeat + tabla, then a 2-bar build with a snare roll
  the drop          full groove + sitar-style hook melody, right as the answer appears
  CTA               one big hit, the melody resolves home, then fade to silence (clean loop)
Each episode's seed picks a key, chord loop, melody variation and tabla pattern,
so no two Shorts sound identical.

Usage (tools/render.sh calls this for you):
  python tools/make_music.py --seed 1104 --drop 12.0 --duration 30.0 [--out public/audio/music.wav]
"""
import argparse
import math
import pathlib

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = 44100
BPM = 100
BEAT = 60 / BPM
BAR = 4 * BEAT

# Set per run by compose()
OFFSET = 0.0
N = 0
rng = np.random.default_rng(0)
drums = bass = keys = lead = None


def t_bar(bar: int, beat: float = 0.0) -> float:
    return OFFSET + bar * BAR + beat * BEAT


def midi_hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def lowpass(x, hz, order=2):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x, axis=0)


def highpass(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x, axis=0)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x, axis=0)


def place(bus, start, sig, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i]
    left = np.cos((pan + 1) * np.pi / 4)
    right = np.sin((pan + 1) * np.pi / 4)
    bus[i : i + len(sig), 0] += sig * gain * left * 1.414
    bus[i : i + len(sig), 1] += sig * gain * right * 1.414


def env(n, attack=0.005, decay=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


# ---------------- drum voices ----------------
def kick(length=0.45):
    n = int(length * SR)
    t = np.arange(n) / SR
    freq = 46 + 110 * np.exp(-t * 28)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t * 7)
    click = rng.standard_normal(n) * np.exp(-t * 400) * 0.25
    return np.tanh((body + click) * 1.6)


def clap():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    noise = bandpass(rng.standard_normal(n), 900, 5000)
    e = np.zeros(n)
    for d in (0.0, 0.011, 0.022):
        e += np.where(t >= d, np.exp(-(t - d) * 90), 0)
    e += np.exp(-t * 14) * 0.35
    return noise * e * 0.9


def hat(open_=False):
    n = int((0.2 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    return highpass(rng.standard_normal(n), 7000) * np.exp(-t * (18 if open_ else 90)) * 0.5


def shaker():
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    return bandpass(rng.standard_normal(n), 4000, 11000) * np.sin(np.pi * t / t[-1]) ** 2 * 0.35


def tabla_na(pitch=392.0):
    """Treble drum (dayan): harmonic membrane ring."""
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    sig = sum(a * np.sin(2 * np.pi * pitch * h * t) * np.exp(-t * d) for h, a, d in [(1, 1, 9), (2, 0.6, 12), (3, 0.4, 16), (4, 0.25, 22), (5, 0.15, 30)])
    strike = highpass(rng.standard_normal(n), 2500) * np.exp(-t * 160) * 0.4
    return (sig * 0.5 + strike) * 0.6


def tabla_ge(start_hz=85.0, glide=1.5):
    """Bass drum (bayan): the classic upward pitch glide."""
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    freq = start_hz * (1 + (glide - 1) * (1 - np.exp(-t * 6)))
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return np.sin(phase) * np.exp(-t * 4.5) * 0.9


def snare():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    noise = bandpass(rng.standard_normal(n), 1500, 8000) * np.exp(-t * 22)
    return (tone * 0.5 + noise * 0.8) * 0.7


# ---------------- tonal voices ----------------
def pluck(freq, length, bright=0.996, buzz=0.35):
    """Karplus-Strong string with a little 'jawari' buzz, for a sitar-ish pluck."""
    n = int(length * SR)
    period = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, period)
    out = np.zeros(n + period)
    out[:period] = buf
    k = period
    while k < n + period:
        prev = out[k - period : k]
        nxt = 0.5 * (prev + np.roll(prev, 1)) * bright
        m = min(period, n + period - k)
        out[k : k + m] = nxt[:m]
        k += period
    out = out[period:]
    t = np.arange(n) / SR
    sig = out * np.exp(-t * 2.2)
    sig = sig + buzz * np.tanh(sig * 4) * 0.4  # buzzy bridge
    sig = highpass(sig, 180)
    attack = np.minimum(1, t / 0.003)
    return sig * attack * 0.8


def ep_note(freq, length):
    """Soft electric-piano style chord tone."""
    n = int(length * SR)
    t = np.arange(n) / SR
    sig = (
        np.sin(2 * np.pi * freq * t + 0.6 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 3))
        + 0.25 * np.sin(2 * np.pi * freq * 3.01 * t) * np.exp(-t * 4)
    )
    return sig * env(n, 0.006, 1.1) * (1 - np.exp(-(length - t).clip(0) * 30))


def pad_note(freq, length):
    """Warm detuned pad."""
    n = int(length * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for det in (-0.08, 0.0, 0.07):
        f = freq * 2 ** (det / 12)
        for h in range(1, 7):
            sig += np.sin(2 * np.pi * f * h * t + rng.uniform(0, 6.28)) / h
    fade = np.minimum(1, t / 0.25) * np.minimum(1, (length - t).clip(0) / 0.3)
    return lowpass(sig * fade, 1800) * 0.18


def bass_note(freq, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    sig = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
    return np.tanh(sig * 1.4) * env(n, 0.004, 0.5) * (1 - np.exp(-(length - t).clip(0) * 60)) * 0.8


# ---------------- harmony (A minor family; transposed per seed) ----------------
CHORDS = {
    "Am": [57, 60, 64, 69],
    "F": [53, 57, 60, 65],
    "C": [55, 60, 64, 67],
    "G": [55, 59, 62, 67],
    "Dm": [53, 57, 62, 65],
    "E7": [56, 59, 62, 64],
}
ROOTS = {"Am": 45, "F": 41, "C": 48, "G": 43, "Dm": 50 - 12, "E7": 40}
LOOPS = [
    ["Am", "F", "C", "G"],
    ["Am", "G", "F", "G"],
    ["F", "G", "Am", "Am"],
    ["Am", "C", "G", "F"],
    ["Am", "Dm", "F", "G"],
]
# Melody ideas per chord: (beat, midi, length in beats). Several variants per chord.
MOTIFS = {
    "Am": [
        [(0, 76, 0.5), (0.5, 74, 0.5), (1, 72, 0.5), (1.5, 69, 1.0), (3, 72, 0.5), (3.5, 74, 0.5)],
        [(0, 81, 0.5), (0.5, 79, 0.5), (1, 76, 0.5), (1.5, 74, 0.5), (2, 76, 1.0), (3, 72, 1.0)],
        [(0, 69, 0.5), (0.5, 72, 0.5), (1, 76, 1.0), (2.5, 74, 0.5), (3, 72, 1.0)],
    ],
    "F": [
        [(0, 76, 1.0), (1, 79, 0.5), (1.5, 76, 0.5), (2, 74, 1.5), (3.5, 72, 0.5)],
        [(0, 72, 0.5), (0.5, 74, 0.5), (1, 76, 1.0), (2, 77, 0.5), (2.5, 76, 0.5), (3, 74, 1.0)],
    ],
    "C": [
        [(0, 76, 0.5), (0.5, 79, 0.5), (1, 81, 1.0), (2, 79, 0.5), (2.5, 76, 0.5), (3, 74, 1.0)],
        [(0, 72, 1.0), (1, 74, 0.5), (1.5, 76, 0.5), (2, 79, 1.5), (3.5, 76, 0.5)],
    ],
    "G": [
        [(0, 74, 0.5), (0.5, 76, 0.5), (1, 74, 0.5), (1.5, 71, 0.5), (2, 67, 1.5), (3.5, 69, 0.5)],
        [(0, 79, 0.5), (0.5, 76, 0.5), (1, 74, 1.0), (2, 71, 0.5), (2.5, 74, 0.5), (3, 76, 1.0)],
    ],
    "Dm": [
        [(0, 74, 0.5), (0.5, 77, 0.5), (1, 76, 0.5), (1.5, 74, 0.5), (2, 72, 1.5), (3.5, 74, 0.5)],
    ],
}
QUESTION = [(0, 69, 0.5), (0.5, 72, 0.5), (1, 74, 0.5), (1.5, 76, 1.5), (3, 74, 0.5), (3.5, 71, 0.5)]
RESOLVE = [(0, 76, 0.5), (0.5, 74, 0.5), (1, 72, 0.5), (1.5, 71, 0.5), (2, 69, 2.0)]


def play_melody(start_time, notes, transpose, gain=0.55):
    for beat, m, beats in notes:
        note = pluck(midi_hz(m + transpose), beats * BEAT + 0.6)
        place(lead, start_time + beat * BEAT, note, gain, pan=0.15)


def chord_bar(bar, chord, transpose, gain_pad, stabs):
    start = t_bar(bar)
    tones = [m + transpose for m in CHORDS[chord]]
    for m in tones:
        place(keys, start, pad_note(midi_hz(m), BAR + 0.1), gain_pad, pan=rng.uniform(-0.4, 0.4))
    for beat in stabs:
        for m in tones[1:]:
            place(keys, t_bar(bar, beat), ep_note(midi_hz(m + 12), BEAT * 0.9), 0.12, pan=0.25)


def compose(seed: int, drop: float, duration: float, out: pathlib.Path):
    global OFFSET, N, rng, drums, bass, keys, lead
    rng = np.random.default_rng(seed)
    N = int(duration * SR)
    drums, bass, keys, lead = (np.zeros((N, 2)) for _ in range(4))
    OFFSET = drop % BAR
    drop_bar = int(round((drop - OFFSET) / BAR))
    cta_time = duration - 3.0
    last_bar = int(math.floor((cta_time - OFFSET) / BAR))  # groove runs through this bar, cut at cta_time

    transpose = int(rng.choice([0, -2, 2, -3, 3]))
    loop = LOOPS[int(rng.integers(len(LOOPS)))]
    tabla_pitch = float(rng.choice([370, 392, 415]))
    fill_every = int(rng.choice([2, 4]))

    # --- before the drop ---
    for bar in range(0, drop_bar):
        bars_left = drop_bar - bar
        chord = "E7" if bars_left == 1 else ("Am" if bar % 2 == 0 else "F")
        if bars_left > 2:
            chord_bar(bar, chord, transpose, 0.7, ())
            if bar % 2 == 0:  # heartbeat + bayan glide
                for beat in (0, 0.4, 2, 2.4):
                    place(drums, t_bar(bar, beat), kick(), 0.8 if beat in (0, 2) else 0.45)
                place(drums, t_bar(bar, 3), tabla_ge(80, 1.6), 0.8)
                place(drums, t_bar(bar, 3.5), tabla_na(tabla_pitch + 23), 0.4, pan=0.3)
            else:  # light tabla + a questioning phrase
                for beat, kind in [(0, "ge"), (1, "na"), (1.5, "na"), (2, "ge"), (3, "na"), (3.25, "na"), (3.5, "na"), (3.75, "na")]:
                    sig = tabla_ge(90, 1.4) if kind == "ge" else tabla_na(tabla_pitch if beat % 1 == 0 else tabla_pitch * 1.12)
                    place(drums, t_bar(bar, beat), sig, 0.6, pan=0.25 if kind == "na" else -0.1)
                play_melody(t_bar(bar), QUESTION, transpose, 0.5)
        else:  # 2-bar build
            chord_bar(bar, chord, transpose, 0.55, (0, 2))
            root = midi_hz(ROOTS[chord] + transpose)
            for beat, beats in [(0, 1.5), (2, 1.5)]:
                place(bass, t_bar(bar, beat), bass_note(root, beats * BEAT), 0.9)
            for beat in (0, 2.5):
                place(drums, t_bar(bar, beat), kick(), 0.85)
            place(drums, t_bar(bar, 2), clap(), 0.6)
            for i in range(8):
                place(drums, t_bar(bar, i * 0.5 + (0.08 if i % 2 else 0)), shaker(), 0.5, pan=-0.3)
            if bars_left == 1:
                hits = np.concatenate([np.arange(0, 2, 0.5), np.arange(2, 3, 0.25), np.arange(3, 3.67, 0.125)])
                for i, beat in enumerate(hits):
                    place(drums, t_bar(bar, beat), snare(), 0.25 + 0.5 * i / len(hits))
    # A short pickup if the drop comes very early (less than one bar in)
    if drop_bar == 0:
        for i, beat in enumerate(np.arange(-1, 0, 0.25)):
            place(drums, drop + beat * BEAT, snare(), 0.3 + 0.1 * i)

    # --- the drop and the groove ---
    motif_pick = {c: int(rng.integers(len(v))) for c, v in MOTIFS.items()}
    for k, bar in enumerate(range(drop_bar, last_bar + 1)):
        chord = loop[k % len(loop)]
        chord_bar(bar, chord, transpose, 0.55, (0, 1.5, 2.5))
        root = midi_hz(ROOTS[chord] + transpose)
        for beat, beats in [(0, 0.75), (0.75, 0.25), (1.5, 0.5), (2.5, 0.5), (3, 0.5), (3.5, 0.5)]:
            place(bass, t_bar(bar, beat), bass_note(root, beats * BEAT), 0.9)
        for beat in (0, 1.5, 2, 3.5):
            place(drums, t_bar(bar, beat), kick(), 0.95)
        for beat in (1, 3):
            place(drums, t_bar(bar, beat), clap(), 0.7)
        for i in range(16):
            swing = 0.05 if i % 2 else 0.0
            place(drums, t_bar(bar, i * 0.25 + swing), hat(open_=(i % 8 == 6)), 0.55 if i % 4 == 0 else 0.35, pan=0.35)
        if k % fill_every == fill_every - 1:
            for j, beat in enumerate((3, 3.25, 3.5, 3.75)):
                place(drums, t_bar(bar, beat), tabla_na(tabla_pitch + 30 * j), 0.45, pan=0.3)
        variants = MOTIFS[chord]
        play_melody(t_bar(bar), variants[(motif_pick[chord] + k // len(loop)) % len(variants)], transpose, 0.6)

    # Cut the groove at the CTA, then: one big hit, tonic pad, the melody resolves home
    cut = int(cta_time * SR)
    for bus in (drums, bass, keys, lead):
        bus[cut:] = 0
    place(drums, cta_time, tabla_ge(70, 1.8), 1.0)
    place(drums, cta_time, clap(), 0.5)
    for m in CHORDS["Am"]:
        place(keys, cta_time, pad_note(midi_hz(m + transpose), 3.0), 0.6, pan=rng.uniform(-0.4, 0.4))
    play_melody(cta_time, RESOLVE, transpose, 0.6)

    mixdown(drop, drop_bar, last_bar, cta_time, out)


def mixdown(drop, drop_bar, last_bar, cta_time, out):
    global bass, keys, lead
    # Sidechain pump on bass + keys during the groove
    pump = np.ones(N)
    for bar in range(drop_bar, last_bar + 1):
        for beat in (0, 1.5, 2, 3.5):
            i = int(t_bar(bar, beat) * SR)
            n = int(0.25 * SR)
            if 0 <= i and i + n < N:
                pump[i : i + n] = np.minimum(pump[i : i + n], 1 - 0.55 * np.exp(-np.arange(n) / SR * 14))
    bass = bass * pump[:, None]
    keys = keys * pump[:, None] ** 0.6

    # Filter sweep opening across the build
    a, b = int(max(0, drop - 2 * BAR) * SR), int(drop * SR)
    if b > a:
        seg = keys[a:b]
        mixamt = np.linspace(0.85, 0.0, len(seg))[:, None]
        keys[a:b] = lowpass(seg, 700) * mixamt + seg * (1 - mixamt)

    # Tiny silence right before the drop
    ga, gb = int(max(0, drop - 0.18) * SR), int(drop * SR)
    for bus in (keys, bass, lead):
        bus[ga:gb] *= np.linspace(1, 0, max(1, gb - ga))[:, None]

    ir_n = int(1.8 * SR)
    ir_t = np.arange(ir_n) / SR
    ir = np.stack([lowpass(rng.standard_normal(ir_n), 6000) * np.exp(-ir_t * 3.2) for _ in range(2)], axis=1) * 0.06
    wet = np.stack([fftconvolve(keys[:, c] * 0.5 + lead[:, c], ir[:, c])[:N] for c in range(2)], axis=1)

    keys_hp = highpass(keys, 220, order=4)
    wet = highpass(wet, 300, order=2)
    mix = drums * 0.9 + bass * 0.75 + keys_hp * 0.55 + lead * 0.85 + wet * 0.5
    mix = highpass(mix, 30)

    fade_in = np.minimum(1, np.arange(N) / (0.12 * SR))
    fade_out = np.ones(N)
    tail = int((N / SR - 1.1) * SR)
    fade_out[tail:] = np.linspace(1, 0, N - tail) ** 2
    mix *= (fade_in * fade_out)[:, None]

    mix = np.tanh(mix / np.max(np.abs(mix)) * 1.3)
    mix = mix / np.max(np.abs(mix)) * 0.89
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, mix.astype(np.float32), SR)
    print(f"wrote {out} ({N / SR:.2f}s, drop at {drop:.2f}s)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, required=True)
    ap.add_argument("--drop", type=float, required=True, help="seconds where the answer appears")
    ap.add_argument("--duration", type=float, required=True)
    ap.add_argument("--out", default=str(ROOT / "public/audio/music.wav"))
    args = ap.parse_args()
    compose(args.seed, args.drop, args.duration, pathlib.Path(args.out))
