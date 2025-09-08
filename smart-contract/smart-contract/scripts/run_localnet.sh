#!/bin/bash

# Configuration
LEDGER_DIR="test-ledger"
LEDGER_SIZE=216000

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
    > nohup.out
fi

echo "---------------------------------------------------------------------------------------"
echo "Running localnet"
echo "---------------------------------------------------------------------------------------"

nohup solana-test-validator --ledger "$LEDGER_DIR" --limit-ledger-size "$LEDGER_SIZE" --reset &
