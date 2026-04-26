export type PackPad = {
  label: string;
  target: string;
  color?: string;
  sampleUrl?: string;
};

export type GroovePack = {
  id: string;
  name: string;
  genre: string;
  description: string;
  suggestedBpm: number;
  drums: PackPad[];
  melody: PackPad[];
};

export type PackManifest = {
  version: 1;
  packs: GroovePack[];
};
