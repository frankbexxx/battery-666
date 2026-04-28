# GroovePad

PWA web (React + TypeScript + Web Audio) com API Python opcional para guardar grooves na nuvem.

## Arquivo

O protótipo desktop original (tkinter + pygame) está em [`archive/battery_app.py`](archive/battery_app.py). Ver [`archive/README.md`](archive/README.md) e [`docs/DSP_PORT.md`](docs/DSP_PORT.md) para a migração da lógica de som para [`frontend/src/audio/engine.ts`](frontend/src/audio/engine.ts).

## Audio strategy

**Web Audio API (TypeScript):** síntese procedural no browser; a API em Python só persiste JSON (BPM, eventos, loop).

## Groove format (v1)

See [`schemas/groove.v1.json`](schemas/groove.v1.json) and [`frontend/src/types/groove.ts`](frontend/src/types/groove.ts).

## User help

Ver [`docs/USER_HELP.md`](docs/USER_HELP.md) para saber o que cada botão faz na app.

## Local development

Se `sudo apt install python3-venv python3-pip nodejs npm` falhar (versões Python desalinhadas no **resolute**, PEP 668 no `pip --user`, etc.), vê **[`docs/INSTALL_TROUBLESHOOTING.md`](docs/INSTALL_TROUBLESHOOTING.md)** — caminho curto: **`uv`** para o venv + pip, **fnm** ou tarball para Node.

### PostgreSQL

Run Postgres locally (or Docker) and set `DATABASE_URL` for the API.

### Backend

```bash
cd ~/projects/battery
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp backend/.env.example backend/.env   # edit DATABASE_URL
cd backend && alembic upgrade head && uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

### Smoke (rápido)

1. Com API: `alembic upgrade head` + `uvicorn` na porta 8000; frontend com `VITE_API_URL=http://localhost:8000`.
2. Abre o dev server, troca de **Pack**, toca num pad (som), grava, **Play loop**, **Save cloud**; separador Library lista o groove.
3. Sem API ou com URL errada: pads e loop continuam; banner indica offline ou falta de `VITE_API_URL`.

O bundle PWA deve manter-se enxuto (alvo aspiracional: ~500 KB gzip no chunk principal); síntese Web Audio evita samples pesados.

## Packs

O catálogo inicial vive em [`frontend/public/packs/manifest.json`](frontend/public/packs/manifest.json). Os packs mudam layout, nomes, cores e BPM sugerido; cada pad pode também definir `sampleUrl` para WAV/OGG em `public/` ou CDN.

Sem `sampleUrl`, o `target` aponta para sons procedurais do Web Audio. Com `sampleUrl`, o browser carrega só os samples do pack ativo e substitui esse `target` no motor, sem partir grooves antigos.

Grooves novos guardam `pack_id` opcional para conseguir reabrir o pack certo a partir da Library. O pack **Club Neon** inclui alguns WAVs leves de demonstração em `frontend/public/packs/club-neon/`.

## Render

Use [`render.yaml`](render.yaml) as a Blueprint.

1. Create the blueprint; provision **groovepad-db** and both web services.
2. Set **`CORS_ORIGINS`** on `groovepad-api` to your static site URL (e.g. `https://groovepad-web.onrender.com`).
3. Set **`VITE_API_URL`** on `groovepad-web` to your API URL (e.g. `https://groovepad-api.onrender.com`) and **redeploy** the static site so the build picks up the variable.
