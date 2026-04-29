#!/bin/bash

STATISTICS_BACKEND_PATH=".."

echo "---------------------------------------------------------------------------------------"
echo "Running Statistics Backend"
echo "---------------------------------------------------------------------------------------"

./stop.sh

cd "$STATISTICS_BACKEND_PATH" || exit 1

cd target || exit 1
> nohup.out
nohup java -jar -Dspring.profiles.active=prod bank-0.0.1-GetBankStatistics.jar > nohup.out 2>&1 &
