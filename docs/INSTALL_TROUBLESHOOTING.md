# Instalação quando o `apt` falha (Ubuntu resolute / pré-lançamento)

## O que aconteceu no teu caso

1. **`apt full-upgrade`** só actualizou o Cursor — o arquivo **não** trouxe ainda `python3.14-venv` / `python3.14` na mesma revisão que o teu `python3` (3.14.4), por isso **`python3.14-venv` pede `python3.14 (= 3.14.3-5)` mas o sistema tem `3.14.4-1`**.
2. **`get-pip.py --user`** com o `python3` do sistema falhou com **PEP 668** (`externally-managed-environment`) — é **correcto**: não se deve instalar pip/pacotes no Python do Ubuntu com `--user`; usa-se **venv** ou ferramentas como **uv**.

**Paraste no sítio certo:** não forces `--break-system-packages` no `python3` global.

---

## Caminho recomendado agora: **uv** (sem `python3-venv` do apt)

O [uv](https://docs.astral.sh/uv/) cria o `.venv` e instala dependências **sem** depender do pacote `python3.14-venv` do Ubuntu.

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Obrigatório:** o `uv` fica em `~/.local/bin`. Sem isto o shell diz `uv: not found` e o Ubuntu até sugere `snap` — **não precisas do snap**.

```bash
source "$HOME/.local/bin/env"
# opcional permanente: echo 'source "$HOME/.local/bin/env"' >> ~/.bashrc

cd ~/projects/battery
rm -rf .venv
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

Para a API (a partir da raiz com venv activo):

```bash
cp backend/.env.example backend/.env
cd backend && uv run alembic upgrade head && uv run uvicorn app.main:app --reload --port 8000
```

(Se preferires sem `uv run`: `source ../.venv/bin/activate` já activo e `alembic` / `uvicorn` no PATH.)

---

## Alternativa: venv + pip **só dentro** do venv (sem uv)

Se `python3 -m venv` **funcionar** (às vezes funciona mesmo quando o pacote `python3.14-venv` falha, se o módulo vier doutro pacote):

```bash
cd ~/projects/battery
python3 -m venv .venv
```

Se disser que falta `ensurepip` / venv, para aqui e usa **uv** em cima.

Se criou `.venv`:

```bash
curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py
.venv/bin/python /tmp/get-pip.py
.venv/bin/pip install -U pip
.venv/bin/pip install -r requirements.txt
```

**Importante:** corre o `get-pip.py` com **`.venv/bin/python`**, não com `python3` do sistema — assim evitas o PEP 668 e não sujas o Ubuntu.

---

## Node / npm (continua a evitar `apt install nodejs npm`)

- **fnm**: [https://github.com/Schniz/fnm](https://github.com/Schniz/fnm) → `fnm install 20 && fnm use 20`
- Ou tarball **LTS** em [https://nodejs.org/](https://nodejs.org/)

```bash
cd ~/projects/battery/frontend
npm install
npm run dev
```

---

## `psycopg2-binary` / `pg_config` no Python 3.14

Em Python **3.14**, o `psycopg2-binary` muitas vezes **não tem wheel** e tenta compilar — aí pede `pg_config`. Este projecto usa **`psycopg` 3** (`psycopg[binary]`) no [`backend/requirements.txt`](../backend/requirements.txt), com URL normalizada para `postgresql+psycopg://` em [`backend/app/db_url.py`](../backend/app/db_url.py). Volta a correr:

```bash
source "$HOME/.local/bin/env"
cd ~/projects/battery
source .venv/bin/activate
uv pip install -r requirements.txt
```

## Quando o arquivo Ubuntu estabilizar

Mais tarde poderás voltar a tentar:

```bash
sudo apt update && sudo apt full-upgrade
sudo apt install -y python3.14-venv python3-pip
```

Quando `python3.14` e `python3.14-venv` tiverem **a mesma versão** na mesma linha de arquivo, o `apt` deixa de dar estes erros.
