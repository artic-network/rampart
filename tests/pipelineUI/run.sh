#!/usr/bin/env bash

echo "Running Pipeline UI test set."
echo "(Ensure RAMPART client has been built)"

node ../../rampart.js --devClient  --verbose --protocol ../../example_protocols/EBOV  --clearAnnotated