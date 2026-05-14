#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PG_BIN="$ROOT_DIR/.tools/postgresql-16/bin"
PG_DATA="$ROOT_DIR/.local/pgdata"

"$PG_BIN/pg_ctl" -D "$PG_DATA" stop
