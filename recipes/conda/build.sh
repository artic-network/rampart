#!/bin/bash

echo "Running build.sh"
pwd
node -v
npm --version
python --version


cd rampart # since the yml specifies a source folder
tgz=$(npm pack) # https://github.com/conda-forge/conda-forge.github.io/issues/597#issuecomment-394761735
npm install -g $tgz

echo "End of build.sh"
