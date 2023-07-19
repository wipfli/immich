#!/bin/sh

: "${MACHINE_LEARNING_HOST:=0.0.0.0}"
: "${MACHINE_LEARNING_PORT:=3003}"

gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 1 -b $MACHINE_LEARNING_HOST:$MACHINE_LEARNING_PORT --access-logfile -