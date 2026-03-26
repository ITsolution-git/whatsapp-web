#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"

echo "[whatsapp-web] Installing dependencies..."
cd "$DIR"
npm install

echo "[whatsapp-web] Building (Vite)..."
npm run build

echo "[whatsapp-web] Done."
