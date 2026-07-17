#!/bin/bash
set -euo pipefail

# Only needed in remote (Claude Code on the web) sessions; local machines
# manage their own tooling.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# ImageMagick provides the `montage` command (image grids/collages).
if ! command -v montage > /dev/null 2>&1; then
  # Package lists in the container can be stale; refresh but tolerate
  # failures from unrelated third-party repos.
  sudo apt-get update > /dev/null 2>&1 || true
  sudo apt-get install -y imagemagick > /dev/null
fi

# officecli: AI document generation CLI (PPTX/DOCX/XLSX/reports/images).
if ! command -v officecli > /dev/null 2>&1; then
  if command -v npm > /dev/null 2>&1; then
    # Try to install, but do not let npm failure abort the entire session-start hook.
    npm install -g officecli > /dev/null 2>&1 || true
  fi
fi

# Compose a robust status line: avoid running commands that may not exist.
montage_ver="$(montage --version 2>/dev/null | head -1 | awk '{print $2, $3}' || echo 'missing')"
if command -v officecli > /dev/null 2>&1; then
  officecli_ver="$(officecli --version 2>/dev/null | head -1 || echo 'unknown')"
else
  officecli_ver="not installed"
fi

echo "session-start: montage ${montage_ver} and ${officecli_ver} are available"
