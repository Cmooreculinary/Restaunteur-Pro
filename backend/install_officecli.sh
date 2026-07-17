#!/usr/bin/env bash
set -euo pipefail

# Installs OfficeCLI for the BCA OS / Restaurateur Pro backend runtime.
# Preferred source: official iOfficeAI installer. NPM is retained as a fallback
# for environments where shell installers are blocked but npm registry access is allowed.

if command -v officecli >/dev/null 2>&1; then
  echo "OfficeCLI already installed: $(officecli --version 2>/dev/null || echo unknown)"
  exit 0
fi

installed=false

if command -v curl >/dev/null 2>&2; then
  echo "Installing OfficeCLI with the official iOfficeAI installer..."
  if curl -fsSL https://raw.githubusercontent.com/iOfficeAI/OfficeCLI/main/install.sh | bash; then
    officecli --version || true
    installed=true
  fi
fi

if [ "$installed" = "false" ] && command -v npm >/dev/null 2>&1; then
  echo "Official installer unavailable; trying npm package fallback..."
  if npm install -g @officecli/officecli >/dev/null 2>&1 || npm install -g officecli >/dev/null 2>&1; then
    officecli --version || true
    installed=true
  fi
fi

if [ "$installed" != "true" ]; then
  # Non-fatal: do not fail the build. Log a clear warning so operators can act.
  echo "Warning: OfficeCLI could not be installed in this environment. Proceeding without officecli; enable network/registry access if OfficeCLI is required." >&2
  # Exit zero so build systems that run this script do not fail the build just because OfficeCLI isn't available.
  exit 0
fi

exit 0
