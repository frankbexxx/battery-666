export type LayerRow = {
  id: string;
  name: string;
  mute: boolean;
  solo: boolean;
  volume: number;
};

type Props = {
  layers: LayerRow[];
  activeLayerId: string;
  onActiveLayerChange: (id: string) => void;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
  onVolumeChange: (id: string, v: number) => void;
};

export function LayerMixer({
  layers,
  activeLayerId,
  onActiveLayerChange,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
}: Props) {
  return (
    <section className="gp-layer-panel" aria-label="Layer mixer">
      {layers.map((layer) => (
        <div key={layer.id} className="gp-layer-row">
          <button
            type="button"
            className={`gp-layer-pill ${activeLayerId === layer.id ? "gp-layer-pill--active" : ""}`}
            onClick={() => onActiveLayerChange(layer.id)}
          >
            {layer.name}
          </button>
          <button
            type="button"
            className={`gp-btn gp-btn--tiny ${layer.mute ? "gp-btn--error" : ""}`}
            onClick={() => onToggleMute(layer.id)}
          >
            M
          </button>
          <button
            type="button"
            className={`gp-btn gp-btn--tiny ${layer.solo ? "gp-btn--filled" : ""}`}
            onClick={() => onToggleSolo(layer.id)}
          >
            S
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(layer.volume * 100)}
            onChange={(e) => onVolumeChange(layer.id, Number(e.target.value) / 100)}
          />
        </div>
      ))}
    </section>
  );
}
