#!/bin/bash

APPLICATION_PROPERTIES="application-dev.properties"
BANK_PUBKEY="Eh542Lti6k2MsAtiFu1a2FZB9tzqkWFfJUYF22tvy6Go"
BOTS=1
TOKENS=("SOL" "USDC" "BTC" "ETH" "USDT" "XRP" "ADA")

print_help() {
  echo "Options:"
  echo "  --prod           Use production environment (default is dev)"
  echo "  --bots <number>  Set the number of bots (default is 1)"
  echo "  --tokens token1  Set the tokens (default SOL USDC BTC ETH USDT XRP ADA). Available tokens: SOL USDC BTC ETH USDT XRP ADA"
  echo "  --help           Show this help message and exit"
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod)
      APPLICATION_PROPERTIES="application-prod.properties"
      BANK_PUBKEY="68yzfPX4YZ1exA8SMJvTSKbYRi9LivNyWv7nisdF2D1u"
      shift
      ;;
    --bots)
      BOTS="$2"
      shift 2
      ;;
    --tokens)
      shift
      while [[ $# -gt 0 && $1 != --* ]]; do
        TOKENS+=("$1")
        shift
      done
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

echo "---------------------------------------------------------------------------------------"
echo "Deploying GetBank"
echo "---------------------------------------------------------------------------------------"

anchor deploy

echo "---------------------------------------------------------------------------------------"
echo "Removing logs"
echo "---------------------------------------------------------------------------------------"

rm -rf ../apps/test/logs/*
mkdir -p ../apps/test/logs/data
touch ../apps/test/logs/history.txt

echo "---------------------------------------------------------------------------------------"
echo "Removing bot wallets"
echo "---------------------------------------------------------------------------------------"

rm -rf ../apps/test/wallets/bots/*

WALLETS=(
    "../apps/test/wallets/admin-wallet.json"
    "../apps/test/wallets/liquidator-wallet.json"
    "../apps/test/wallets/alice-wallet.json"
    "../apps/test/wallets/bob-wallet.json"
    "../apps/test/wallets/mallory-wallet.json"
    "../apps/test/wallets/fee-wallet.json"
    )

echo "Creating bots wallets"
for ((i = 1; i <= $BOTS; i++)); do
    WALLET_NAME="bot$i-wallet.json"
    WALLET_PATH="../apps/test/wallets/bots/$WALLET_NAME"
    WALLETS+=( "$WALLET_PATH" )
    solana-keygen new --outfile $WALLET_PATH --silent --no-bip39-passphrase
done

get_random_number() {
  local min=$1
  local max=$2
  local range=$((max - min + 1))
  local result=$((RANDOM % range + min))
  echo "$result"
}

echo "---------------------------------------------------------------------------------------"
echo "Airdropping to wallets"
echo "---------------------------------------------------------------------------------------"

for wallet in "${WALLETS[@]}"; do
  amount=$(get_random_number 100 2000)
  solana airdrop $amount --keypair $wallet
done

create_spl_token() {
  local TOKEN="$1"
  local MINT_DECIMALS="$2"
  local MIN="$3"
  local MAX="$4"
  echo "Creating $TOKEN"

  if [ "$1" == "SOL" ]; then
    TOKEN_OUTPUT=$(spl-token create-token --mint-authority $BANK_PUBKEY)
    SOL_REPRESENTATIVE_MINT_ADDRESS=$(echo "$TOKEN_OUTPUT" | grep -oP '(?<=Address:\s).*' | tr -d '[:space:]')
    echo "$TOKEN represnative mint address: $SOL_REPRESENTATIVE_MINT_ADDRESS"
    sed -i "s|SOL_REPRESENTATIVE_MINT_ADDRESS=.*|SOL_REPRESENTATIVE_MINT_ADDRESS=$SOL_REPRESENTATIVE_MINT_ADDRESS|" "../apps/test/.env"
  else
    TOKEN_OUTPUT=$(spl-token create-token --decimals $MINT_DECIMALS)
    TOKEN_MINT_ADDRESS=$(echo "$TOKEN_OUTPUT" | grep -oP '(?<=Address:\s).*' | tr -d '[:space:]')
    echo "$TOKEN mint address: $TOKEN_MINT_ADDRESS"
    MINT_VAR_NAME="${TOKEN}_MINT_ADDRESS"
    sed -i "s|$MINT_VAR_NAME=.*|$MINT_VAR_NAME=$TOKEN_MINT_ADDRESS|" "../apps/test/.env"
    sed -i "s|^$MINT_VAR_NAME=.*|$MINT_VAR_NAME=$TOKEN_MINT_ADDRESS|" "../../statistics-backend/src/main/resources/$APPLICATION_PROPERTIES"

    REPRESENTATIVE_MINT_VAR_NAME="${TOKEN}_REPRESENTATIVE_MINT_ADDRESS"
    TOKEN_OUTPUT=$(spl-token create-token --decimals $MINT_DECIMALS --mint-authority $BANK_PUBKEY)
    TOKEN_REPRESENTATIVE_MINT_ADDRESS=$(echo "$TOKEN_OUTPUT" | grep -oP '(?<=Address:\s).*' | tr -d '[:space:]')
    echo "$TOKEN representative mint address: $TOKEN_REPRESENTATIVE_MINT_ADDRESS"
    sed -i "s|$REPRESENTATIVE_MINT_VAR_NAME=.*|$REPRESENTATIVE_MINT_VAR_NAME=$TOKEN_REPRESENTATIVE_MINT_ADDRESS|" "../apps/test/.env"

    echo "Minting $TOKEN to wallets"
    for wallet in "${WALLETS[@]}"; do
      amount=$(get_random_number $MIN $MAX)
      TOKEN_ACCOUNT_OUTPUT=$(spl-token create-account $TOKEN_MINT_ADDRESS --owner $wallet --fee-payer $wallet)
      TOKEN_ACCOUNT_ADDRESS=$(echo "$TOKEN_ACCOUNT_OUTPUT" | grep -oP 'Creating account \K.*')
      spl-token mint $TOKEN_MINT_ADDRESS $amount $TOKEN_ACCOUNT_ADDRESS
    done
  fi
}

echo "---------------------------------------------------------------------------------------"
echo "Initializing tokens"
echo "---------------------------------------------------------------------------------------"

if [[ " ${TOKENS[@]} " =~ (^|[[:space:]])SOL($|[[:space:]]) ]]; then
  echo "Creating SOL spl token"
  create_spl_token "SOL" 9 0 0
fi

if [[ " ${TOKENS[@]} " =~ (^|[[:space:]])USDC($|[[:space:]]) ]]; then
  echo "Creating USDC spl token"
  create_spl_token "USDC" 6 5000 1000000
fi

if [[ " ${TOKENS[@]} " =~ (^|[[:space:]])BTC($|[[:space:]]) ]]; then
  echo "Creating BTC spl token"
  create_spl_token "BTC" 9 1 5
fi

if [[ " ${TOKENS[@]} " =~ (^|[[:space:]])ETH($|[[:space:]]) ]]; then
  echo "Creating ETH spl token"
  create_spl_token "ETH" 6 10 100
fi

if [[ " ${TOKENS[@]} " =~ (^|[[:space:]])USDT($|[[:space:]]) ]]; then
  echo "Creating USDT spl token"
  create_spl_token "USDT" 6 5000 1000000
fi

if [[ " ${TOKENS[@]} " =~ (^|[[:space:]])XRP($|[[:space:]]) ]]; then
  echo "Creating XRP spl token"
  create_spl_token "XRP" 6 2000 80000
fi

if [[ " ${TOKENS[@]} " =~ (^|[[:space:]])ADA($|[[:space:]]) ]]; then
  echo "Creating ADA spl token"
  create_spl_token "ADA" 9 10000 200000
fi
