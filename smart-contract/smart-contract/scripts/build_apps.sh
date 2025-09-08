#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_PATH="$SCRIPT_DIR/../apps"
PROD=false

print_help() {
  echo "Options:"
  echo "  --prod           Use production environment (default is dev)"
  echo "  --help           Show this help message and exit"
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod)
      PROD=true
      shift
      ;;
    --help)
      print_help
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

set -e
set -x

if [ "$PROD" = true ]; then
    ./stop_apps.sh
fi

echo "---------------------------------------------------------------------------------------"
echo "Building Watcher"
echo "---------------------------------------------------------------------------------------"

cd "$APPS_PATH/watcher" || exit 1

if [ "$PROD" = true ]; then
    > nohup.out
fi

npm run build

sleep 5

echo "---------------------------------------------------------------------------------------"
echo "Building Test"
echo "---------------------------------------------------------------------------------------"

cd "$APPS_PATH/test" || exit 1

if [ "$PROD" = true ]; then
    > nohup.out
fi

npm run build
