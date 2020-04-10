#!/usr/bin/env bash

echo "Running EBOV test set."
echo "GUI at http://localhost:3000"

rampart --verbose --protocol ../../example_protocols/EBOV --clearAnnotated
