type Variant = "drum" | "melody";

type Props = {
  labels: string[];
  variant: Variant;
  onPad: (label: string, index: number) => void;
  flashIndex?: number | null;
};

export function PadGrid({ labels, variant, onPad, flashIndex = null }: Props) {
  return (
    <div className="gp-pad-grid" role="group" aria-label={variant === "drum" ? "Drum pads" : "Melody pads"}>
      {labels.map((label, i) => (
        <button
          key={`${label}-${i}`}
          type="button"
          className={`gp-pad gp-pad--${variant}${flashIndex === i ? " gp-pad--flash" : ""}`}
          onPointerDown={(e) => {
            /* `buttons` can be 0 on pointerdown in some browsers; use `button` for primary click. */
            if (e.pointerType === "mouse" && e.button !== 0) return;
            onPad(label, i);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
