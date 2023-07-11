#!/bin/bash

gunicorn -k uvicorn.workers.UvicornWorker -w 1 -b $MACHINE_LEARNING_HOST:$MACHINE_LEARNING_PORT app.main:app