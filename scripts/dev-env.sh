#!/usr/bin/env bash
set -euo pipefail

if [ -n "${BASH_SOURCE:-}" ]; then
  SCRIPT_PATH="${BASH_SOURCE[0]}"
elif [ -n "${ZSH_VERSION:-}" ]; then
  eval 'SCRIPT_PATH="${(%):-%x}"'
else
  SCRIPT_PATH="$0"
fi

ROOT_DIR="$(cd "$(dirname "$SCRIPT_PATH")/.." && pwd)"

export PATH="$ROOT_DIR/.tools/gh_2.92.0_macOS_arm64/bin:$ROOT_DIR/.tools/node-v22.21.1-darwin-arm64/bin:$ROOT_DIR/.tools/postgresql-16/bin:$ROOT_DIR/.venv/bin:$PATH"
export DATABASE_URL="${DATABASE_URL:-postgresql://camp_app:camp_app_dev@127.0.0.1:55432/debate_camp_dev}"
export DJANGO_SECRET_KEY="${DJANGO_SECRET_KEY:-dev-only-change-before-production}"
export DJANGO_DEBUG="${DJANGO_DEBUG:-true}"
export DJANGO_ALLOWED_HOSTS="${DJANGO_ALLOWED_HOSTS:-127.0.0.1,localhost}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://127.0.0.1:8000}"

echo "Development environment loaded."
echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo "Python: $(python --version)"
echo "PostgreSQL: $(postgres --version)"
echo "GitHub CLI: $(gh --version | head -n 1)"
