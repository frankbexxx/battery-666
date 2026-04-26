import type { GroovePack, PackManifest } from "./types";

export const DEFAULT_PACK: GroovePack = {
  id: "classic-synth",
  name: "Classic Synth",
  genre: "Starter",
  description: "Procedural drums and simple melody tones.",
  suggestedBpm: 120,
  drums: [
    { label: "Kick", target: "Kick", color: "#00e5d4" },
    { label: "Snare", target: "Snare", color: "#ffb300" },
    { label: "Clap", target: "Clap", color: "#ff7043" },
    { label: "Closed HH", target: "Closed HH", color: "#90caf9" },
    { label: "Open HH", target: "Open HH", color: "#64b5f6" },
    { label: "Tom Low", target: "Tom Low", color: "#a5d6a7" },
    { label: "Tom Mid", target: "Tom Mid", color: "#81c784" },
    { label: "Tom High", target: "Tom High", color: "#66bb6a" },
    { label: "Perc 1", target: "Perc 1", color: "#ce93d8" },
    { label: "Perc 2", target: "Perc 2", color: "#ba68c8" },
  ],
  melody: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"].map((note) => ({
    label: note,
    target: note,
    color: "#fdd835",
  })),
};

export async function loadPackManifest(): Promise<PackManifest> {
  const res = await fetch("/packs/manifest.json");
  if (!res.ok) throw new Error(`Pack manifest failed: ${res.status}`);
  return res.json() as Promise<PackManifest>;
}

export function normalizePacks(manifest: PackManifest): GroovePack[] {
  const valid = manifest.packs.filter((pack) => pack.drums.length > 0 && pack.melody.length > 0);
  return valid.length ? valid : [DEFAULT_PACK];
}
