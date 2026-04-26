type Props = {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  metronomeOn: boolean;
  onToggleMetronome: () => void;
  recording: boolean;
  onToggleRecord: () => void;
  loopPlaying: boolean;
  onToggleLoop: () => void;
  hasEvents: boolean;
  onClear: () => void;
  onStopAll: () => void;
  onSaveCloud: () => void;
  localOnly: boolean;
  onLocalOnlyChange: (v: boolean) => void;
  cloudSaveEnabled: boolean;
};

export function TransportBar({
  bpm,
  onBpmChange,
  metronomeOn,
  onToggleMetronome,
  recording,
  onToggleRecord,
  loopPlaying,
  onToggleLoop,
  hasEvents,
  onClear,
  onStopAll,
  onSaveCloud,
  localOnly,
  onLocalOnlyChange,
  cloudSaveEnabled,
}: Props) {
  return (
    <section className="gp-transport" aria-label="Transport">
      <label className="gp-field gp-field--toggle">
        <input
          type="checkbox"
          checked={localOnly}
          onChange={(e) => onLocalOnlyChange(e.target.checked)}
        />
        Apenas local
      </label>
      <label className="gp-field">
        BPM
        <input
          className="gp-input"
          type="number"
          min={60}
          max={200}
          value={bpm}
          onChange={(e) => onBpmChange(Math.min(200, Math.max(60, Number(e.target.value) || 120)))}
        />
      </label>
      <button type="button" className="gp-btn gp-btn--metro" onClick={() => onToggleMetronome()}>
        {metronomeOn ? "Metronome off" : "Metronome"}
      </button>
      <button
        type="button"
        className={`gp-btn gp-btn--record ${recording ? "gp-btn--record-on" : ""}`}
        onClick={() => onToggleRecord()}
      >
        {recording ? "Stop rec" : "Record"}
      </button>
      <button
        type="button"
        className={`gp-btn gp-btn--loop ${loopPlaying ? "gp-btn--loop-on" : ""}`}
        disabled={!hasEvents}
        onClick={() => onToggleLoop()}
      >
        {loopPlaying ? "Stop loop" : "Play loop"}
      </button>
      <button type="button" className="gp-btn gp-btn--filled-tonal" onClick={() => onClear()}>
        Clear
      </button>
      <button type="button" className="gp-btn gp-btn--error" onClick={() => onStopAll()}>
        Stop all
      </button>
      <button
        type="button"
        className="gp-btn gp-btn--filled"
        disabled={!cloudSaveEnabled}
        title={!cloudSaveEnabled ? "Liga uma API ou desativa «Apenas local»" : undefined}
        onClick={() => onSaveCloud()}
      >
        Save cloud
      </button>
    </section>
  );
}
