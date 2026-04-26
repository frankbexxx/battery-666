import type { RefObject } from "react";
import { useEffect } from "react";
import type { GrooveAudioEngine } from "../audio/engine";

/** First user interaction resumes AudioContext (browser autoplay policy). */
export function useAudioPrime(engine: GrooveAudioEngine, shellRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const onFirst = () => {
      engine.armFromUserGesture();
    };
    el.addEventListener("pointerdown", onFirst, { capture: true, once: true });
    return () => el.removeEventListener("pointerdown", onFirst, { capture: true });
  }, [engine, shellRef]);
}
