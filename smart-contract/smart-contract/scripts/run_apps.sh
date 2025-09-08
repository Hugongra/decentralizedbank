#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_PATH="$SCRIPT_DIR/../apps"

echo "---------------------------------------------------------------------------------------"
echo "Running Watcher"
echo "---------------------------------------------------------------------------------------"

cd "$APPS_PATH/watcher" || exit 1
nohup npm run start &

echo "---------------------------------------------------------------------------------------"
echo "Running Test"
echo "---------------------------------------------------------------------------------------"

cd "$APPS_PATH/test" || exit 1
nohup npm run start &
