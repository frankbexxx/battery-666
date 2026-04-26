import type { GroovePack } from "../packs/types";

type Props = {
  packs: GroovePack[];
  activePackId: string;
  status: string | null;
  onSelect: (packId: string) => void;
};

export function PackSelector({ packs, activePackId, status, onSelect }: Props) {
  const active = packs.find((pack) => pack.id === activePackId) ?? packs[0];

  return (
    <section className="gp-pack-panel" aria-label="Pack selector">
      <label className="gp-field gp-pack-field">
        Pack
        <select className="gp-select" value={activePackId} onChange={(e) => onSelect(e.target.value)}>
          {packs.map((pack) => (
            <option key={pack.id} value={pack.id}>
              {pack.name}
            </option>
          ))}
        </select>
      </label>
      {active ? (
        <p className="gp-pack-copy">
          <strong>{active.genre}</strong> · {active.description} · BPM {active.suggestedBpm}
        </p>
      ) : null}
      {status ? <p className="gp-pack-status">{status}</p> : null}
    </section>
  );
}
