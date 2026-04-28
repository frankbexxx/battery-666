/** Web Audio synthesis — ported from archive/battery_app.py (Option A, no pygame). */

const SAMPLE_RATE = 44100;

function mixStereo(ctx: AudioContext, mono: Float32Array): AudioBuffer {
  const buf = ctx.createBuffer(2, mono.length, SAMPLE_RATE);
  buf.copyToChannel(mono, 0, 0);
  buf.copyToChannel(mono, 1, 0);
  return buf;
}

export function generateToneBuffer(
  ctx: AudioContext,
  freq: number,
  duration = 0.6,
  volume = 0.35,
  decay = 4.0
): AudioBuffer {
  const n = Math.floor(SAMPLE_RATE * duration);
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const envelope = Math.exp(-t * decay);
    mono[i] = Math.sin(2 * Math.PI * freq * t) * envelope * volume;
  }
  return mixStereo(ctx, mono);
}

function drumKick(ctx: AudioContext): AudioBuffer {
  const duration = 0.45;
  const n = Math.floor(SAMPLE_RATE * duration);
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 160 * Math.pow(30 / 160, t / duration);
    const wave = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 8);
    mono[i] = wave * 0.9;
  }
  return mixStereo(ctx, mono);
}

function drumSnare(ctx: AudioContext): AudioBuffer {
  const duration = 0.35;
  const n = Math.floor(SAMPLE_RATE * duration);
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const noise = Math.random() * 2 - 1;
    const tone = Math.sin(2 * Math.PI * 180 * t) * 0.3;
    let wave = noise * 0.8 + tone;
    wave *= Math.exp(-t * 11);
    mono[i] = wave * 0.85;
  }
  return mixStereo(ctx, mono);
}

function drumClosedHh(ctx: AudioContext): AudioBuffer {
  const duration = 0.15;
  const n = Math.floor(SAMPLE_RATE * duration);
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const noise = Math.random() * 2 - 1;
    mono[i] = noise * Math.exp(-t * 28) * 0.65;
  }
  return mixStereo(ctx, mono);
}

function drumOpenHh(ctx: AudioContext): AudioBuffer {
  const duration = 0.7;
  const n = Math.floor(SAMPLE_RATE * duration);
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const noise = Math.random() * 2 - 1;
    mono[i] = noise * Math.exp(-t * 7) * 0.55;
  }
  return mixStereo(ctx, mono);
}

function drumClap(ctx: AudioContext): AudioBuffer {
  const duration = 0.4;
  const n = Math.floor(SAMPLE_RATE * duration);
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 12);
    mono[i] = noise * 0.75 * 0.8;
  }
  return mixStereo(ctx, mono);
}

function drumTom(ctx: AudioContext): AudioBuffer {
  const duration = 0.4;
  const n = Math.floor(SAMPLE_RATE * duration);
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 120 * Math.pow(0.4, t / duration);
    mono[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 6) * 0.8;
  }
  return mixStereo(ctx, mono);
}

const NOTE_FREQ: Record<string, number> = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
};

export const DRUM_PAD_ORDER = [
  "Kick",
  "Snare",
  "Clap",
  "Closed HH",
  "Open HH",
  "Tom Low",
  "Tom Mid",
  "Tom High",
  "Perc 1",
  "Perc 2",
] as const;

export const MELODY_NOTES = [
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  "C5",
] as const;

export type DrumName = (typeof DRUM_PAD_ORDER)[number];

export class GrooveAudioEngine {
  private ctx: AudioContext | null = null;
  /** Master output — stopAll can duck without suspending the clock (keeps scheduling accurate). */
  private master: GainNode | null = null;
  private drumBuffers = new Map<string, AudioBuffer>();
  private noteBuffers = new Map<string, AudioBuffer>();
  private externalBufferPromises = new Map<string, Promise<AudioBuffer>>();
  private metronomeBuffer: AudioBuffer | null = null;
  private metronomeTimer: ReturnType<typeof setInterval> | null = null;

  isRunning(): boolean {
    return this.ctx?.state === "running";
  }

  /** Wall-clock time of the audio graph (for loop scheduling). */
  getCurrentAudioTime(): number {
    return this.ctx?.currentTime ?? 0;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    }
    if (!this.master) {
      const g = this.ctx.createGain();
      g.gain.value = 1;
      g.connect(this.ctx.destination);
      this.master = g;
    }
    return this.ctx;
  }

  private getOutput(): AudioNode {
    this.ensureContext();
    return this.master!;
  }

  async resume(): Promise<AudioContext> {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    this.ensureBuffers();
    return ctx;
  }

  private ensureBuffers(): void {
    if (!this.ctx) return;
    if (this.drumBuffers.size) return;

    const c = this.ctx;
    this.drumBuffers.set("Kick", drumKick(c));
    this.drumBuffers.set("Snare", drumSnare(c));
    this.drumBuffers.set("Clap", drumClap(c));
    this.drumBuffers.set("Closed HH", drumClosedHh(c));
    this.drumBuffers.set("Open HH", drumOpenHh(c));
    this.drumBuffers.set("Tom Low", drumTom(c));
    this.drumBuffers.set("Tom Mid", drumTom(c));
    this.drumBuffers.set("Tom High", drumTom(c));
    this.drumBuffers.set("Perc 1", drumClap(c));
    this.drumBuffers.set("Perc 2", drumClosedHh(c));

    for (const note of MELODY_NOTES) {
      const f = NOTE_FREQ[note];
      this.noteBuffers.set(note, generateToneBuffer(c, f));
    }

    this.metronomeBuffer = generateToneBuffer(c, 800, 0.05, 30);
  }

  private async loadExternalBuffer(cacheKey: string, url: string): Promise<AudioBuffer> {
    const ctx = this.ensureContext();
    this.ensureBuffers();
    const existing = this.externalBufferPromises.get(cacheKey);
    if (existing) return existing;

    const promise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Sample failed: ${res.status}`);
        return res.arrayBuffer();
      })
      .then((bytes) => ctx.decodeAudioData(bytes.slice(0)));

    this.externalBufferPromises.set(cacheKey, promise);
    return promise;
  }

  async loadDrumSample(target: string, url: string): Promise<void> {
    const buffer = await this.loadExternalBuffer(`drum:${target}:${url}`, url);
    this.drumBuffers.set(target, buffer);
  }

  async loadMelodySample(target: string, url: string): Promise<void> {
    const buffer = await this.loadExternalBuffer(`melody:${target}:${url}`, url);
    this.noteBuffers.set(target, buffer);
  }

  /** Fire-and-forget resume from a user gesture (no await). */
  armFromUserGesture(): void {
    const ctx = this.ensureContext();
    this.ensureBuffers();
    if (ctx.state === "suspended") void ctx.resume();
  }

  /**
   * Start drum sample at AudioContext time `at`.
   * Use only when `ctx.state === "running"` (live pads after prime, or loop scheduler).
   */
  startDrumAt(name: string, at: number, gain = 1): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    this.ensureBuffers();
    const buf = this.drumBuffers.get(name);
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = Math.max(0, gain);
    src.connect(g);
    g.connect(this.getOutput());
    src.start(at);
  }

  startMelodyAt(note: string, at: number, gain = 1): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    this.ensureBuffers();
    const buf = this.noteBuffers.get(note);
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = Math.max(0, gain);
    src.connect(g);
    g.connect(this.getOutput());
    src.start(at);
  }

  /** Live pad hit — synchronous when context already running (low latency). */
  playDrum(name: string, when?: number, gain = 1): void {
    const ctx = this.ctx;
    if (!ctx) {
      void this.resume().then(() => this.playDrum(name, when, gain));
      return;
    }
    if (ctx.state !== "running") {
      void ctx.resume().then(() => this.playDrum(name, when, gain));
      return;
    }
    this.ensureBuffers();
    const at = when ?? ctx.currentTime;
    this.startDrumAt(name, at, gain);
  }

  playMelody(note: string, when?: number, gain = 1): void {
    const ctx = this.ctx;
    if (!ctx) {
      void this.resume().then(() => this.playMelody(note, when, gain));
      return;
    }
    if (ctx.state !== "running") {
      void ctx.resume().then(() => this.playMelody(note, when, gain));
      return;
    }
    this.ensureBuffers();
    const at = when ?? ctx.currentTime;
    this.startMelodyAt(note, at, gain);
  }

  stopAll(): void {
    this.stopMetronome();
    if (this.master && this.ctx && this.ctx.state === "running") {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setValueAtTime(0, t);
      this.master.gain.setValueAtTime(1, t + 0.02);
    }
  }

  startMetronome(bpm: number): void {
    void this.resume().then((ctx) => {
      this.stopMetronome();
      const click = this.metronomeBuffer;
      if (!click) return;
      const intervalMs = (60_000 / bpm) | 0;
      const out = this.getOutput();
      const tick = () => {
        const src = ctx.createBufferSource();
        src.buffer = click;
        src.connect(out);
        src.start();
      };
      tick();
      this.metronomeTimer = setInterval(tick, intervalMs);
    });
  }

  stopMetronome(): void {
    if (this.metronomeTimer) {
      clearInterval(this.metronomeTimer);
      this.metronomeTimer = null;
    }
  }

  scheduleLoop(
    bpm: number,
    events: { kind: "drum" | "melody"; target: string; t: number; gain?: number }[],
    loopBeats: number,
    startAt?: number
  ): { loopDurationSec: number; start: number } {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") {
      throw new Error("Call resume() before scheduling loops");
    }
    this.ensureBuffers();
    const beat = 60 / bpm;
    const loopDurationSec = loopBeats * beat;
    const t0 = startAt ?? ctx.currentTime + 0.05;
    const sorted = [...events].sort((a, b) => a.t - b.t);
    for (const ev of sorted) {
      const when = t0 + ev.t;
      if (ev.kind === "drum") this.startDrumAt(ev.target, when, ev.gain ?? 1);
      else this.startMelodyAt(ev.target, when, ev.gain ?? 1);
    }
    return { loopDurationSec, start: t0 };
  }
}
