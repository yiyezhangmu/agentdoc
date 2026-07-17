#!/usr/bin/env sh

set -eu

PORT=3164
ADDRESS="127.0.0.1:${PORT}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

cd "$SCRIPT_DIR"

PIDS=""
if command -v lsof >/dev/null 2>&1; then
    PIDS=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
elif command -v fuser >/dev/null 2>&1; then
    PIDS=$(fuser "$PORT"/tcp 2>/dev/null || true)
elif command -v pgrep >/dev/null 2>&1; then
    PIDS=$(pgrep -f "mkdocs serve.*${ADDRESS}" 2>/dev/null || true)
else
    echo "[restart] Warning: lsof, fuser, and pgrep are unavailable; the old process cannot be detected."
fi

if [ -n "$PIDS" ]; then
    echo "[restart] Stopping the process listening on port ${PORT}: ${PIDS}"
    for PID in $PIDS; do
        kill "$PID" 2>/dev/null || true
    done

    sleep 1

    for PID in $PIDS; do
        if kill -0 "$PID" 2>/dev/null; then
            kill -9 "$PID" 2>/dev/null || true
        fi
    done
fi

echo "[restart] Starting MkDocs at http://${ADDRESS}/ ..."
exec mkdocs serve -a "$ADDRESS"
