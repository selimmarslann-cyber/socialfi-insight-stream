#!/bin/bash

# SAFE CLEANUP – Kodlara dokunmadan sadece şişiren klasörleri siler

echo "🚮 Removing unnecessary heavy folders..."

# Root node_modules & build artifacts
rm -rf node_modules
rm -rf dist
rm -rf build
rm -rf .turbo
rm -rf .vercel

# Blockchain dev folders
rm -rf blockchain/node_modules
rm -rf blockchain/artifacts
rm -rf blockchain/cache

# VSCode/OS junk
rm -rf .cache
rm -rf .parcel-cache

echo "✅ Cleanup complete. Project is now slim and ready for ZIP."

