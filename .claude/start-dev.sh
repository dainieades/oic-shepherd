#!/bin/bash
set -e

PROJECT="/Users/dainieades/Code_Projects/oic-shepherd"

# Try nvm (common macOS setup)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Extend PATH with all common node/npm install locations
for candidate in \
  "/opt/homebrew/bin" \
  "/usr/local/bin" \
  "/opt/local/bin" \
  "$HOME/.volta/bin" \
  "$HOME/.fnm" \
  "$HOME/Library/Application Support/fnm" \
  /usr/local/n/versions/*/bin \
  "$NVM_DIR"/versions/node/*/bin; do
  [ -d "$candidate" ] && export PATH="$candidate:$PATH"
done

if ! command -v npm &>/dev/null; then
  echo "ERROR: npm not found. Please install Node.js from https://nodejs.org and re-run." >&2
  exit 1
fi

cd "$PROJECT"
exec npm run dev
