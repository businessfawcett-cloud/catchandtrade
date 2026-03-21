#!/bin/bash
set -e

echo "Installing Next.js in web app..."
cd ../../apps/web
npm install next react react-dom

echo "Building shared package..."
cd ../packages/shared
npm install
npm run build

echo "Building db package..."
cd ../db
npm install
npm run build

echo "Building web app..."
cd ../../apps/web
next build