# GroovePad — blueprint e roadmap (alinhado ao repo)

Este documento **substitui o blueprint genérico** “desktop Python primeiro” pela realidade deste projecto: **produto = web PWA** (TypeScript + Web Audio), **API Python** para dados, **Android-like UX** no browser, **desktop/pygame arquivado**. O texto longo que partilhaste serve de **inspiração funcional** (loops, packs, FX, escola, export); a **stack** e a **ordem** seguem abaixo.

---

## 1. Estado actual (o que “existe” de verdade)

| Camada | Onde | Notas |
|--------|------|--------|
| **UI / PWA** | `frontend/` (Vite, React, TS) | Tabs, pads, transporte, Library; tokens estilo Material dark; Radix Tabs. |
| **Áudio em tempo real** | `frontend/src/audio/engine.ts` | Web Audio; síntese procedural (espelho do arquivo Python). |
| **Domínio groove** | `schemas/groove.v1.json`, `frontend/src/types/groove.ts` | Eventos + BPM + `loop_beats`; tempo em segundos desde o início da gravação. |
| **API** | `backend/` (FastAPI, SQLAlchemy, Alembic, **psycopg v3**) | CRUD `/grooves/`, `/health`; URL Postgres normalizada `postgresql+psycopg://`. |
| **Deploy** | `render.yaml` | Postgres + API + site estático. |
| **Legado** | `archive/battery_app.py` | Referência; **não** é linha de produto. |

**Métrica de produto (acordada):** o que **não é visível e usável na web** é **infra / background** (Swagger, logs, CI, etc.) — útil para dev, não para “existe” para o utilizador final.

---

## 2. Visão — para onde vamos

- **Experiência:** escolher **estilo / pack** → grelha de pads + **live layers** (mudo/solo/volume) → **FX** → **gravar sessão** → **export** (WAV depois; MIDI/stems mais tarde).
- **Plataforma:** **browser primeiro** (PWA); **APK / loja** só quando fizer sentido (TWA/Capacitor ou nativo), sem abandonar a web.
- **Som:** mistura de **síntese** (baixa latência) + **samples / loops** em **packs** (lazy load, formatos WAV/OGG, metadados por pad).
- **Relógio musical:** **AudioContext.currentTime** como relógio mestre; `setInterval` só onde for aceitável (evitar deriva no loop longo).

---

## 3. Arquitectura alvo (padrões para este nicho)

```
┌─────────────────────────────────────────────────────────┐
│  UI (React) — rotas / tabs, acessibilidade, PWA         │
├─────────────────────────────────────────────────────────┤
│  Application state — groove, transport, packs (hooks)   │
├──────────────┬──────────────────────┬───────────────────┤
│ AudioEngine  │  GrooveRepository    │  PackCatalog      │
│ (Web Audio)  │  (fetch → API)       │  (manifest + lazy)│
└──────────────┴──────────────────────┴───────────────────┘
```

- **Separação:** `audio/` (motor + agendamento), `domain/` ou `types/` (modelo imutável), `api/` (HTTP), `ui/components/` (sem lógica de DSP).
- **Clock / sync:** agendar notas com `audioContext.currentTime`; quantização explícita no modelo antes de gravar (opcional).
- **Packs:** manifest JSON (pads → ficheiros + cores + BPM base); carregar **sob demanda**; nunca bloquear o primeiro paint com megabytes de WAV.
- **Persistência:** API já guarda **grooves**; projectos multi-track podem ser **novo schema v2** ou tabelas extra (não misturar com v1 sem versão).
- **FX:** cadeia Web Audio (`Gain` → `BiquadFilter` → `Convolver`/impulse) ou **AudioWorklet** quando a latência/complexidade o exigir.
- **Testes:** contratos do JSON de groove; smoke E2E crítico (primeiro toque + save) — *a definir tooling*.

---

## 4. Roadmap por fases

### Fase 0 — Feito (base)

- PWA + pads + melodia + metrónomo + gravar eventos + loop + save/list na API + Postgres + Render blueprint + arquivo desktop.

### Fase 1 — “Soa e responde em todo o lado”

- Áudio: **revisão do relógio** (menos `setInterval` para música; mais agendamento no AudioContext).
- **Feedback visual** por pad (glow / ripple) ligado ao mesmo evento que dispara o som.
- **Offline / rede:** mensagens claras quando a API falha; modo “só local” explícito na UI.
- **VM / som:** documentação mínima (já visto na prática).

### Fase 2 — Packs & género (primeira extensão de conteúdo)

- **Manifest de pack** (JSON) + pastas `public/packs/...` ou CDN.
- **Selector de pack / género** (cards no topo ou rail).
- **Lazy load** de buffers; barra de progresso ao trocar de pack.

### Fase 3 — Live layers (coração “Music Maker”)

- Várias **faixas de loop** (drums, bass, melody, FX) com **mute/solo/volume** e **sync** ao BPM.
- **Quantização** opcional na gravação e no playback.
- Modelo de dados **v2** se for preciso (camadas + clips).

### Fase 4 — Mixer & FX

- Cadeia **por faixa** + **master**; presets por género.
- Considerar **pedalboard**-equivalente no browser (efeitos simples primeiro).

### Fase 5 — Export & interoperabilidade

- **Export WAV** (mixdown via `OfflineAudioContext` ou gravação `MediaRecorder` da saída mestre).
- **MIDI / stems** — fase posterior; contratos com DAW.

### Fase 6 — Beat School, partilha, “loja” entre amigos

- Tutoriais **in-app** (passos sobre a UI real).
- **Login Google** (OAuth2); partilha de grooves entre contas; packs premium só se fizer sentido para o teu círculo.

### Fase 7 — Native shell

- TWA / Capacitor / loja — **depois** da web estar sólida.

---

## 5. O que **não** fazemos no tronco (sem decisão explícita)

- **CustomTkinter / Dear PyGui como app principal** — conflita com a decisão “web = produto”; só scripts internos se um dia precisares.
- **pygame como motor do produto** — substituído por Web Audio no cliente; Python fica **API + tooling offline** se precisares.

---

## 6. Decisões fechadas (produto + métrica “amigos a tocar de verdade”)

| # | Tema | Decisão |
|---|------|---------|
| 1 | **Packs / assets** | **Royalty-free** ou packs/samples **quando compensar** (som ou imagem, ex. botões). O dev **pede** packs concretos; tu **analisas** licença/custo antes de integrar. |
| 2 | **Stems vs sequencer** | **Métrica:** *time-to-first-jam*. **Prioridade:** **stems / loops pré-alinhados ao BPM** (Fase 3) **antes** de step-sequencer completo. |
| 3 | **Export** | **Gradual:** primeiro **WAV stereo**; **stems / MIDI** quando existir arquitectura de faixas (implementação o mais rápido que fizer sentido). |
| 4 | **Conta** | **Login Google** (OAuth2). **Fallback:** modo “só local” (`localStorage`) até OAuth estar pronto. |

**Objectivo:** oferecer a **amigos músicos** algo **tocável de verdade**; **não** é para venda; **qualquer sítio** = PWA + URL estável + offline honesto.

---

## 7. Execução por fases / sessões (“ondas”)

- Cada **fase** = uma ou mais **sessões**.
- Cada sessão: **uma super-onda** (prompt único: contexto, DoD, ficheiros, riscos) + **lista fechada de TODOS** dessa fase.
- **Regra:** não abrir fase N+1 até o **DoD** da fase N (secção 8) estar verificado.

### Fase 1 — TODOS (1ª onda)

1. Motor de loop com **`AudioContext.currentTime`** (menos `setInterval` musical; documentar limites).
2. **Feedback visual** por pad ao disparar som.
3. **Rede:** banner se a API falhar; Library clara; pads **sem** depender da API.
4. UI **“Só local”** explícita.
5. **Smoke** no README (toque + gravar + loop + refresh).
6. (Opcional) Nota de **bundle** no PR (meta para o shell).

*(Fases 2+: listas completas quando fecharmos a Fase 1.)*

---

## 8. Métricas de engenharia

| Métrica | Alvo | Medição |
|--------|------|---------|
| **Time-to-first-jam** | menos de 60 s da URL ao som + gravar | Manual + E2E (Playwright) |
| **Tap-to-sound (p95)** | menos de 50 ms percepção | DevTools + CHANGELOG |
| **PWA** | instalável; offline honesto | Lighthouse (CI opcional) |
| **API** | `/health`; erros visíveis na Library | manual |
| **DoD** | todos os TODOS da fase | checklist no fim da sessão |
| **Licenças** | trilho explícito em PRs com assets | revisão tua |

---

## 9. Opcional (beta)

**OAuth Google:** conta **aberta** vs **allowlist** de emails até estar estável? **Assumido se calares:** aberto; depois endureces.

---

*Última actualização: decisões + sessões/ondas + métricas.*
