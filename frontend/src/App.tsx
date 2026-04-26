import * as Tabs from "@radix-ui/react-tabs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isApiUrlConfigured, pingApiHealth } from "./api/health";
import { createGroove, listGrooves } from "./api/grooves";
import { DRUM_PAD_ORDER, GrooveAudioEngine, MELODY_NOTES } from "./audio/engine";
import { LibraryPanel } from "./components/LibraryPanel";
import { PadGrid } from "./components/PadGrid";
import { TransportBar } from "./components/TransportBar";
import { useAudioPrime } from "./hooks/useAudioPrime";
import type { GrooveEventV1, GrooveRecord } from "./types/groove";
import { DEFAULT_LOOP_BEATS } from "./types/groove";

type Tab = "drums" | "melody" | "library";

const engine = new GrooveAudioEngine();

function padNamesForGrid(): string[] {
  const out: string[] = [];
  for (let i = 0; i < 16; i++) {
    out.push(DRUM_PAD_ORDER[i % DRUM_PAD_ORDER.length]);
  }
  return out;
}

function melodyNamesForGrid(): string[] {
  return [...MELODY_NOTES, ...MELODY_NOTES];
}

function computeLoopBeats(bpm: number, events: GrooveEventV1[]): number {
  let loopBeats = DEFAULT_LOOP_BEATS;
  const beat = 60 / bpm;
  const loopDuration = loopBeats * beat;
  const lastT = events.length ? Math.max(...events.map((e) => e.t)) : 0;
  if (loopDuration < lastT + 0.05) {
    const bars = Math.floor((lastT + beat) / (4 * beat)) + 1;
    loopBeats = Math.max(16, bars * 4);
  }
  return loopBeats;
}

export default function App() {
  const shellRef = useRef<HTMLDivElement>(null);
  useAudioPrime(engine, shellRef);

  const [tab, setTab] = useState<Tab>("drums");
  const [bpm, setBpm] = useState(120);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [events, setEvents] = useState<GrooveEventV1[]>([]);
  const [loopPlaying, setLoopPlaying] = useState(false);
  const [library, setLibrary] = useState<GrooveRecord[]>([]);
  const [libraryErr, setLibraryErr] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [localOnly, setLocalOnly] = useState(false);
  const [apiReachable, setApiReachable] = useState<boolean | null>(null);
  const [padFlash, setPadFlash] = useState<{ kind: "drums" | "melody"; index: number } | null>(null);

  const recordStart = useRef<number>(0);
  const loopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const padFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const drumGrid = useMemo(() => padNamesForGrid(), []);
  const melodyGrid = useMemo(() => melodyNamesForGrid(), []);

  useEffect(() => {
    if (metronomeOn) engine.startMetronome(bpm);
    else engine.stopMetronome();
    return () => engine.stopMetronome();
  }, [metronomeOn, bpm]);

  useEffect(() => {
    return () => {
      if (loopTimer.current) clearTimeout(loopTimer.current);
      if (padFlashTimer.current) clearTimeout(padFlashTimer.current);
      engine.stopMetronome();
    };
  }, []);

  const apiConfigured = isApiUrlConfigured();

  useEffect(() => {
    if (!apiConfigured) {
      setApiReachable(null);
      return;
    }
    let cancelled = false;
    const run = () => {
      void pingApiHealth().then((ok) => {
        if (!cancelled) setApiReachable(ok);
      });
    };
    run();
    const onOnline = () => run();
    window.addEventListener("online", onOnline);
    const id = window.setInterval(run, 45_000);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      clearInterval(id);
    };
  }, [apiConfigured]);

  useEffect(() => {
    if (localOnly && tab === "library") setTab("drums");
  }, [localOnly, tab]);

  const triggerPadFlash = useCallback((kind: "drums" | "melody", index: number) => {
    setPadFlash({ kind, index });
    if (padFlashTimer.current) clearTimeout(padFlashTimer.current);
    padFlashTimer.current = window.setTimeout(() => setPadFlash(null), 140);
  }, []);

  const stopLoopPlayback = useCallback(() => {
    if (loopTimer.current) {
      clearTimeout(loopTimer.current);
      loopTimer.current = null;
    }
    setLoopPlaying(false);
  }, []);

  const onDrumPad = useCallback(
    (name: string, index: number) => {
      triggerPadFlash("drums", index);
      void (async () => {
        await engine.resume();
        engine.playDrum(name);
      })();
      if (recording) {
        const t = (performance.now() - recordStart.current) / 1000;
        setEvents((prev) => [...prev, { kind: "drum", target: name, t }]);
      }
    },
    [recording, triggerPadFlash]
  );

  const onMelodyPad = useCallback(
    (note: string, index: number) => {
      triggerPadFlash("melody", index);
      void (async () => {
        await engine.resume();
        engine.playMelody(note);
      })();
      if (recording) {
        const t = (performance.now() - recordStart.current) / 1000;
        setEvents((prev) => [...prev, { kind: "melody", target: note, t }]);
      }
    },
    [recording, triggerPadFlash]
  );

  const toggleRecord = async () => {
    await engine.resume();
    if (!recording) {
      setEvents([]);
      recordStart.current = performance.now();
      setRecording(true);
      setSaveMsg(null);
    } else {
      setRecording(false);
      setEvents((prev) => [...prev].sort((a, b) => a.t - b.t));
    }
  };

  const clearAll = () => {
    stopLoopPlayback();
    setEvents([]);
    setRecording(false);
  };

  const stopAll = () => {
    stopLoopPlayback();
    setMetronomeOn(false);
    engine.stopAll();
    void engine.resume();
  };

  const toggleLoop = async () => {
    if (loopPlaying) {
      stopLoopPlayback();
      return;
    }
    if (!events.length) return;
    await engine.resume();
    const loopBeats = computeLoopBeats(bpm, events);

    let nextStartAt: number | undefined;
    const scheduleNext = () => {
      const arm = () => {
        const { start, loopDurationSec } = engine.scheduleLoop(bpm, events, loopBeats, nextStartAt);
        nextStartAt = start + loopDurationSec;
        const now = engine.getCurrentAudioTime();
        const delayMs = Math.max(8, (nextStartAt - now) * 1000 - 5);
        loopTimer.current = window.setTimeout(scheduleNext, delayMs);
      };
      try {
        arm();
      } catch {
        void engine.resume().then(() => {
          try {
            arm();
          } catch {
            stopLoopPlayback();
          }
        });
      }
    };

    scheduleNext();
    setLoopPlaying(true);
  };

  const refreshLibrary = useCallback(async () => {
    setLibraryErr(null);
    try {
      const rows = await listGrooves();
      setLibrary(rows);
    } catch (e) {
      setLibraryErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    if (tab === "library") void refreshLibrary();
  }, [tab, refreshLibrary]);

  /** After a failed ping, `false` blocks save; `null` while checking still allows trying save. */
  const cloudSaveEnabled = apiConfigured && apiReachable !== false && !localOnly;

  const saveCloud = async () => {
    setSaveMsg(null);
    if (!cloudSaveEnabled) {
      setSaveMsg("Cloud save disabled (modo local ou API indisponível).");
      return;
    }
    if (!events.length) {
      setSaveMsg("Nothing to save — record something first.");
      return;
    }
    const loop_beats = computeLoopBeats(bpm, events);
    const payload = {
      version: 1 as const,
      bpm,
      events: [...events].sort((a, b) => a.t - b.t),
      loop_beats,
    };
    try {
      await createGroove(payload, `Groove ${new Date().toISOString().slice(0, 19)}`);
      setSaveMsg("Saved.");
      if (tab === "library") void refreshLibrary();
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : "Save failed");
    }
  };

  const loadGroove = (g: GrooveRecord) => {
    setBpm(g.bpm);
    setEvents([...g.payload.events].sort((a, b) => a.t - b.t));
    setTab("drums");
    setSaveMsg(`Loaded "${g.title ?? g.id.slice(0, 8)}"`);
  };

  const showOfflineBanner = apiConfigured && apiReachable === false;
  const showNoApiBanner = !apiConfigured;

  return (
    <div ref={shellRef} className="gp-shell">
      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <header className="gp-header">
          <h1>GROOVEPAD</h1>
          <p>Drums · Melody · Cloud</p>
          {localOnly ? <span className="gp-chip">Só neste aparelho</span> : null}
        </header>

        {showOfflineBanner ? (
          <div className="gp-banner gp-banner--warn" role="status">
            Sem ligação ao servidor. Pads e loop funcionam; grava na nuvem quando voltar a API.
          </div>
        ) : null}
        {showNoApiBanner ? (
          <div className="gp-banner" role="status">
            Sem <code className="gp-code">VITE_API_URL</code> — só áudio local; define URL da API para Library e Save cloud.
          </div>
        ) : null}

        <div className="gp-tabs-root">
          <Tabs.Content value="drums" className="gp-tab-content gp-main-spacer">
            <PadGrid
              labels={drumGrid}
              variant="drum"
              onPad={onDrumPad}
              flashIndex={padFlash?.kind === "drums" ? padFlash.index : null}
            />
          </Tabs.Content>
          <Tabs.Content value="melody" className="gp-tab-content gp-main-spacer">
            <PadGrid
              labels={melodyGrid}
              variant="melody"
              onPad={onMelodyPad}
              flashIndex={padFlash?.kind === "melody" ? padFlash.index : null}
            />
          </Tabs.Content>
          <Tabs.Content value="library" className="gp-tab-content gp-main-spacer">
            <LibraryPanel items={library} error={libraryErr} onLoad={loadGroove} />
          </Tabs.Content>
        </div>

        <TransportBar
          bpm={bpm}
          onBpmChange={setBpm}
          metronomeOn={metronomeOn}
          onToggleMetronome={() => setMetronomeOn((v) => !v)}
          recording={recording}
          onToggleRecord={() => void toggleRecord()}
          loopPlaying={loopPlaying}
          onToggleLoop={() => void toggleLoop()}
          hasEvents={events.length > 0}
          onClear={clearAll}
          onStopAll={stopAll}
          onSaveCloud={() => void saveCloud()}
          localOnly={localOnly}
          onLocalOnlyChange={setLocalOnly}
          cloudSaveEnabled={cloudSaveEnabled}
        />

        {saveMsg ? <p className="gp-msg">{saveMsg}</p> : null}

        <Tabs.List className="gp-nav-root gp-nav-list" aria-label="Sections">
          <Tabs.Trigger value="drums" className="gp-nav-trigger">
            Drums
          </Tabs.Trigger>
          <Tabs.Trigger value="melody" className="gp-nav-trigger">
            Melody
          </Tabs.Trigger>
          <Tabs.Trigger value="library" className="gp-nav-trigger" disabled={localOnly}>
            Library
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </div>
  );
}
