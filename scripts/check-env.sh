#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$ROOT_DIR/.tools/node-v22.21.1-darwin-arm64/bin:$ROOT_DIR/.tools/postgresql-16/bin:$ROOT_DIR/.venv/bin:$PATH"

node --version
npm --version
python --version
django-admin --version
postgres --version
psql -h 127.0.0.1 -p 55432 -U camp_app -d debate_camp_dev -c "SELECT current_database(), current_user;"
