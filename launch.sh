#!/usr/bin/env bash
# Lance les deux applications du dépôt depuis une seule adresse.
# Usage : ./launch.sh [--port 8001] [--host 0.0.0.0] [--no-browser]
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null; then
  exec python3 launch.py "$@"
elif command -v python >/dev/null; then
  exec python launch.py "$@"
else
  echo "Python 3 est requis : https://www.python.org/downloads/"
  exit 1
fi
