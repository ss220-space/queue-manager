#!/bin/sh

SCRIPT=$(readlink -f "$0")
SCRIPT_DIR=$(dirname "$SCRIPT")


$SCRIPT_DIR/queue-backend/update.sh
$SCRIPT_DIR/queue-frontend/update.sh