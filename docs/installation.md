# Installation

## Step 1: Install MinKNOW

See the [Oxford Nanopore downloads page](https://community.nanoporetech.com/downloads) for instructions.

## Step 2: Install conda

Conda is a popular environment manager which allows you to install dependencies & software in a fashion that won't break other software you may have installed.
While you _can_ run rampart without conda, it requires you to maintain local installations of nodejs and other dependencies.
The instructions on this page assume conda has been installed.

See [instructions here](https://conda.io/docs/user-guide/install/index.html) to install conda on your machine.

## Step 3: Install RAMPART

> Currently rampart must be installed from source. We are working on making this a conda package - stay tuned!

Clone the github repo.

```bash
git clone https://github.com/artic-network/rampart.git
```
(If you don't have `git` you can get it via `conda install git`.)


Install dependencies etc by creating a conda environment from the `environment.yml` file.

```bash
cd rampart
conda env create -f environment.yml
source activate artic-rampart
npm install # installs node (javascript) dependencies
npm run build # builds RAMPART
npm install -g . # makes `rampart` available as a command line program
```

Check that things work by running `rampart --help`


