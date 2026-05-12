#!/usr/bin/env sh
# Prefer Docker Compose V2 plugin (`docker compose`); fall back to standalone `docker-compose`
# when the plugin is not installed (common on Homebrew Docker installs).
set -e
if docker compose version >/dev/null 2>&1; then
  exec docker compose "$@"
fi
if command -v docker-compose >/dev/null 2>&1; then
  exec docker-compose "$@"
fi
echo "Error: Neither 'docker compose' (plugin) nor 'docker-compose' (standalone) is available." >&2
echo "Install one of: Docker Compose V2 CLI plugin, or https://github.com/docker/compose standalone." >&2
exit 1
