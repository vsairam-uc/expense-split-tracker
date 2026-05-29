#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# shellcheck source=scripts/podman-env.sh
source scripts/podman-env.sh
podman compose down
echo "PostgreSQL stopped"
