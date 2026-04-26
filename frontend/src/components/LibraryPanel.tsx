import type { GrooveRecord } from "../types/groove";

type Props = {
  items: GrooveRecord[];
  error: string | null;
  onLoad: (g: GrooveRecord) => void;
};

export function LibraryPanel({ items, error, onLoad }: Props) {
  return (
    <div>
      {error && <p className="gp-msg" style={{ color: "var(--md-sys-color-error)" }}>{error}</p>}
      {!items.length && !error && <p className="gp-library-empty">No grooves yet. Save from the transport bar.</p>}
      <div role="list">
        {items.map((g) => (
          <button key={g.id} type="button" className="gp-library-row" role="listitem" onClick={() => onLoad(g)}>
            <strong>{g.title ?? "Untitled"}</strong>
            <div style={{ fontSize: 12, color: "var(--md-sys-color-on-surface-variant)", marginTop: 4 }}>
              BPM {g.bpm} · {g.payload.events.length} hits
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
