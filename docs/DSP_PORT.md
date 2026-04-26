# Migração DSP: arquivo Python → Web Audio (TS)

O protótipo em [`archive/battery_app.py`](../archive/battery_app.py) define:

- **Tom sinusoidal** com envelope exponencial (`generate_tone` / `generateToneBuffer` em TS).
- **Percussão procedural** por tipo (`kick`, `snare`, `closed_hh`, `open_hh`, `clap`, `tom`) — mesmas durações, exponenciais e (para kick/tom) varrimento de frequência.
- **Notas melódicas** com frequências Hz iguais ao dicionário `NOTE_FREQ` no frontend.

A implementação **oficial** para o produto é [`frontend/src/audio/engine.ts`](../frontend/src/audio/engine.ts) (sem pygame): buffers a 44.1 kHz, reprodução via `AudioBufferSourceNode`.
