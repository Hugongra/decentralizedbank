#!/bin/bash

PID=$(pgrep -f "solana-test-validator")
if [[ -n "$PID" ]]; then
  echo "Killing Solana Test Validator (PID: $PID)"
  kill "$PID"
  sleep 2
fi
