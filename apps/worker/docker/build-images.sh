#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Building sandbox Docker images..."

echo "  [1/3] Building C++ sandbox image..."
docker build -t sandbox-cpp -f "$SCRIPT_DIR/Dockerfile.cpp" "$SCRIPT_DIR"

echo "  [2/3] Building JavaScript sandbox image..."
docker build -t sandbox-javascript -f "$SCRIPT_DIR/Dockerfile.javascript" "$SCRIPT_DIR"

echo "  [3/3] Building Python sandbox image..."
docker build -t sandbox-python -f "$SCRIPT_DIR/Dockerfile.python" "$SCRIPT_DIR"

echo ""
echo "All sandbox images built successfully!"
echo "  - sandbox-cpp"
echo "  - sandbox-javascript"
echo "  - sandbox-python"
