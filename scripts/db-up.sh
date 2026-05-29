#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=scripts/podman-env.sh
source scripts/podman-env.sh

if ! podman machine list --format '{{.Name}}' 2>/dev/null | grep -q .; then
  echo "Initializing Podman machine (first run may take a minute)..."
  podman machine init --cpus 2 --memory 2048 --disk-size 20
fi

podman machine start 2>/dev/null || true
podman compose up -d
echo "PostgreSQL is running on localhost:5432"
