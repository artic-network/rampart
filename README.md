# RAMPART
Read Assignment, Mapping, and Phylogenetic Analysis in Real Time

**Status: In development**

## Overview
MinION (MinKnow) produced `fast5` files are consumed by a script, basecalled, demuxed and mapped in real-time.
The results are then visualised through a web-app.


The mapping is a two-step process:
First, reads are mapped to a single reference sequence to obtain co-ordinates.
Secondly, reads are mapped against a panel of references to find the closest match.



### Current daemon / script progress:
* running using already-basecalled `fastq` files
* no filesystem watchers present
* demuxing & mapping working
* demuxed & mapped files are lost when the script restarts
* no support for samples comprised of more than one barcode

### Current frontend progress:
* unchanged from version 0.1.0. Needs lots of work!




## Installation / Pre-requisites


1. **Install conda** -- [Instructions here](https://conda.io/docs/user-guide/install/index.html)


2. **Clone the github repo** -- `git clone git@github.com:artic-network/rampart.git`

3. **Create & activate the conda environment**
```
cd rampart
conda env create -f environment.yml
source activate artic-rampart
cd ..
```

4. **Install Andrew's fork of porechop**
* (make sure you're in the artic-rampart conda environment)
```
git clone https://github.com/rambaut/Porechop.git
cd Porechop/
python setup.py install
```
* Check `porechop` is available on the command line by running `porechop -h` inside the artic-rampart conda environment.

5. **Download the guppy-basecalled EBOV dataset**
Download [https://artic.s3.climb.ac.uk/ZEBOV_3Samples_NB_MinIT_guppy.tgz](https://artic.s3.climb.ac.uk/ZEBOV_3Samples_NB_MinIT_guppy.tgz)
 and unzip into the `rampart` directory.
 (I.e. the directory `rampart/ZEBOV_3Samples_NB` now exists, and is is gitignored.)

6. **Miscellaneous steps**
* `mkdir rampart/ZEBOV_3Samples_NB/porechop`

## Config file(s)
There is one config file which defines details about the current run (e.g. barcodes, names etc) and a second config file which defines the reference genome, including gene annotations, amplicon positions etc.
The second config file is normally provided as part of the ARTIC toolkit and shouldn't need modification -- see `./EBOV/configuration.json` for the currently used example.

The run-specific config file currently looks like:
```
{
  "name": Run name
  "referenceConfigPath": path to the second (ARTIC-provided) config file
  "referencePanelPath": path to a FASTA of reference genomes
  "barcodes": array of barcode (sample) names
  "basecalledPath": path to the directory with guppy-produced FASTQs
  "demuxedPath": path to the directory to save demuxed FASTQs
}
```
All paths are relative to the `rampart` directory.

## Run yarn to install dependencies

```bash
yarn
```

## How to run RAMPART (currently only in development mode)

1. Start the file watcher / server process:
`node rampart.js --config ./EBOV/ZEBOV_3Samples_NB_config.json`
2. (in a seperate terminal window) start the web-app: `npm run start`. This should automatically open a web browser pointed to [localhost:3000](http://localhost:3000).
