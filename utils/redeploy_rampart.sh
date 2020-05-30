#!/bin/bash - 
set -o nounset                              # Treat unset variables as an error
# Redeploy rampart.

`which conda > /dev/null`
if [[ $? -ne 0 ]];
then
	echo Please install miniconda3 from: https://docs.conda.io/en/latest/miniconda.html
	exit 1
fi

export PS1="$"
eval "$(conda shell.bash hook)"
`conda env list | grep artic-rampart > /dev/null`
if [[ $? -eq 0 ]];
then
	echo Removing existing conda enviroment.
	#conda deactivate
	conda env remove -n artic-rampart
fi

echo Creating new artic-rampart environment.
conda install -y mamba
mamba env create -f environment.yml
conda deactivate
conda activate artic-rampart

echo Create new artic-rampart environment.
npm install
npm install --global .
