#!/bin/bash

ADMIN_WALLET="../apps/test/wallets/admin-wallet.json"

while true; do
    solana airdrop 1 $ADMIN_WALLET --url https://api.devnet.solana.com
    sleep 3600
done