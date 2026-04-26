import type { GrooveEventV1, GroovePayloadV1, GrooveRecord } from "../types/groove";

const base = () => (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

type ApiGroove = {
  id: string;
  title: string | null;
  bpm: number;
  events: GrooveEventV1[];
  loop_beats: number;
  created_at: string;
  updated_at: string;
};

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

function mapGroove(r: ApiGroove): GrooveRecord {
  return {
    id: r.id,
    title: r.title,
    bpm: r.bpm,
    payload: {
      version: 1,
      bpm: r.bpm,
      events: r.events,
      loop_beats: r.loop_beats,
    },
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export async function listGrooves(): Promise<GrooveRecord[]> {
  const res = await fetch(`${base()}/grooves/`);
  const rows = await parse<ApiGroove[]>(res);
  return rows.map(mapGroove);
}

export async function createGroove(payload: GroovePayloadV1, title?: string | null) {
  const body = {
    title: title ?? null,
    bpm: payload.bpm,
    events: payload.events,
    loop_beats: payload.loop_beats ?? 16,
  };
  const res = await fetch(`${base()}/grooves/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const row = await parse<ApiGroove>(res);
  return mapGroove(row);
}

export async function updateGroove(
  id: string,
  partial: Partial<{
    title: string | null;
    bpm: number;
    events: GrooveEventV1[];
    loop_beats: number;
  }>
) {
  const res = await fetch(`${base()}/grooves/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(partial),
  });
  const row = await parse<ApiGroove>(res);
  return mapGroove(row);
}
