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
  npm install -g officecli > /dev/null
fi

echo "session-start: montage $(montage --version | head -1 | awk '{print $2, $3}') and $(officecli --version | head -1) are available"
