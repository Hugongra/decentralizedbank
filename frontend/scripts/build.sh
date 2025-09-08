#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_PATH="$SCRIPT_DIR/.."

echo "---------------------------------------------------------------------------------------"
echo "Building admin.getbank.es"
echo "---------------------------------------------------------------------------------------"

cd "${FRONTEND_PATH}/admin"
npm install
ng build
rm -rf /var/www/admin.getbank.es/*
cp -r dist/web/* /var/www/admin.getbank.es/

echo "---------------------------------------------------------------------------------------"
echo "Building app.getbank.es"
echo "---------------------------------------------------------------------------------------"

cd "${FRONTEND_PATH}/client"
npm install
ng build
rm -rf /var/www/app.getbank.es/*
cp -r dist/web/* /var/www/app.getbank.es/
