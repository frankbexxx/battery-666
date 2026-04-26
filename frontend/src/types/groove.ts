/** GroovePad groove payload v1 — mirrors schemas/groove.v1.json */

export type GrooveEventKind = "drum" | "melody";

export interface GrooveEventV1 {
  kind: GrooveEventKind;
  /** Drum pad name (e.g. Kick) or melody note (e.g. C4). */
  target: string;
  /** Seconds from recording start (>= 0). */
  t: number;
}

export interface GroovePayloadV1 {
  version: 1;
  bpm: number;
  events: GrooveEventV1[];
  /** Quarter-note beats per loop; if omitted, clients may infer from last event + bar snap. */
  loop_beats?: number;
}

export interface GrooveRecord {
  id: string;
  title: string | null;
  bpm: number;
  payload: GroovePayloadV1;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_LOOP_BEATS = 16;

export function normalizePayload(
  partial: Omit<GroovePayloadV1, "version"> & { version?: number }
): GroovePayloadV1 {
  const bpm = Math.min(200, Math.max(60, Math.round(partial.bpm)));
  const events = [...partial.events]
    .map((e) => ({
      kind: e.kind,
      target: e.target,
      t: Math.max(0, e.t),
    }))
    .sort((a, b) => a.t - b.t);
  let loop_beats = partial.loop_beats ?? DEFAULT_LOOP_BEATS;
  loop_beats = Math.min(512, Math.max(1, Math.round(loop_beats)));
  return { version: 1, bpm, events, loop_beats };
}

/** Beat duration in seconds (one quarter note). */
export function beatSec(bpm: number): number {
  return 60 / bpm;
}

/** Snap time to nearest 1/16 note grid (optional playback polish). */
export function quantizeToStep16(t: number, bpm: number): number {
  const step = beatSec(bpm) / 4;
  if (step <= 0) return t;
  return Math.round(t / step) * step;
}
