#!/usr/bin/env bash
set -euo pipefail

# Installs OfficeCLI for the BCA OS / Restaurateur Pro backend runtime.
# Preferred source: official iOfficeAI installer. NPM is retained as a fallback
# for environments where shell installers are blocked but npm registry access is allowed.

if command -v officecli >/dev/null 2>&1; then
  echo "OfficeCLI already installed: $(officecli --version 2>/dev/null || echo unknown)"
  exit 0
fi

if command -v curl >/dev/null 2>&1; then
  echo "Installing OfficeCLI with the official iOfficeAI installer..."
  if curl -fsSL https://raw.githubusercontent.com/iOfficeAI/OfficeCLI/main/install.sh | bash; then
    officecli --version || true
    exit 0
  fi
fi

if command -v npm >/dev/null 2>&1; then
  echo "Official installer unavailable; trying npm package fallback..."
  if npm install -g @officecli/officecli; then
    officecli --version || true
    exit 0
  fi
  if npm install -g officecli; then
    officecli --version || true
    exit 0
  fi
fi

echo "OfficeCLI installation failed. Check network/package registry access." >&2
exit 1
