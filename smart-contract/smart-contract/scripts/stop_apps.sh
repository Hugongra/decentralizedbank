#!/bin/bash

PIDS=$(pgrep -f "watcher-main.js")
if [[ -n "$PIDS" ]]; then
  echo "Killing Watcher (PIDs: $PIDS)"
  kill $PIDS
  sleep 2
fi

PIDS=$(pgrep -f "test-main.js")
if [[ -n "$PIDS" ]]; then
  echo "Killing Test (PIDs: $PIDS)"
  kill $PIDS
  sleep 2
fi
