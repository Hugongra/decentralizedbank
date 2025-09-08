#!/bin/bash

PROGRAM_ID="9isWLPPTZ2E5NZyseRmGVqsxcceRWg2JjVYMofwRbaR"

print_help() {
  echo "Options:"
  echo "  --prod           Use production environment (default is dev)"
  echo "  --help           Show this help message and exit"
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod)
      PROGRAM_ID="Geh97tZGzncv1soduTSeFcLozkiSTUkbFdLN1gdiuKqJ"
      sed -i "s|declare_id!("'.*'");|declare_id!(\"$PROGRAM_ID\");|" "../programs/get_bank/src/lib.rs"
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

echo "---------------------------------------------------------------------------------------"
echo "Building GetBank program"
echo "---------------------------------------------------------------------------------------"

anchor clean
anchor build

echo "---------------------------------------------------------------------------------------"
echo "Copying program type into apps"
echo "---------------------------------------------------------------------------------------"

cp -f ../target/types/get_bank.ts ../apps/test/src/get_bank.ts
cp -f ../target/types/get_bank.ts ../apps/liquidator/src/get_bank.ts
cp -f ../target/types/get_bank.ts ../apps/watcher/src/get_bank.ts
