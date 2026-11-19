#!/usr/bin/env bash
# Lance un petit serveur local (optionnel) puis ouvre l'application.
# Utile uniquement si votre navigateur bloque localStorage en file://.
cd "$(dirname "$0")" || exit 1
PORT="${1:-8000}"
echo "GestiProj → http://localhost:$PORT"
( command -v xdg-open >/dev/null && xdg-open "http://localhost:$PORT" ) || \
( command -v open >/dev/null && open "http://localhost:$PORT" ) || true
python3 -m http.server "$PORT" --bind 127.0.0.1
