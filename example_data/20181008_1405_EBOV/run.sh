#!/usr/bin/env bash

echo "Running EBOV test set."
echo "(Ensure RAMPART client is running in dev mode in another terminal)"

rampart --devClient  --verbose --protocol ../../example_protocols/EBOV --clearAnnotated
