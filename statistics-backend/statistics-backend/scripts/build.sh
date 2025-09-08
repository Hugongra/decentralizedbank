#!/bin/bash

STATISTICS_BACKEND_PATH=".."

echo "---------------------------------------------------------------------------------------"
echo "Building Statistics Backend"
echo "---------------------------------------------------------------------------------------"

./stop.sh

cd "$STATISTICS_BACKEND_PATH" || exit 1
mvn clean install -Dmaven.test.skip=true
