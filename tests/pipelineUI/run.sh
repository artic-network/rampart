#!/usr/bin/env bash

echo "Running Pipeline UI test set."
echo "(Ensure RAMPART client is running in dev mode in another terminal)"

rampart --devClient  --verbose --protocol ../../example_protocols/EBOV
