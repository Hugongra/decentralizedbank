#!/bin/bash

PID=$(pgrep -f "bank-0.0.1-GetBankStatistics.jar")
if [[ -n "$PID" ]]; then
  echo "Killing Statistics backend (PID: $PID)"
  kill "$PID"
  sleep 2
fi
