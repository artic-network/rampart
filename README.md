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
* mapped files are lost when the script restarts


## Software Installation

1. **Install conda** -- [Instructions here](https://conda.io/docs/user-guide/install/index.html)


2. **Clone the github repo** -- `git clone https://github.com/artic-network/rampart.git`

3. **Create & activate the conda environment**
```
cd rampart
conda env create -f environment.yml
source activate artic-rampart
cd ..
```

4. Install Node / JavaScript dependencies
```
cd rampart
yarn
cd ..
```

5. **Install Andrew's fork of porechop**
* (make sure you're in the artic-rampart conda environment)
```
git clone https://github.com/rambaut/Porechop.git
cd Porechop/
python setup.py install
```
* Check `porechop` is available on the command line by running `porechop -h` inside the artic-rampart conda environment.


## Config file(s)
There is one config file which defines details about the current run (e.g. barcodes, names etc) and a second config file which defines the reference genome, including gene annotations, amplicon positions etc.
The second config file is normally provided as part of the ARTIC toolkit and shouldn't need modification -- see `./EBOV/configuration.json` for the currently used example.

The run-specific config file currently looks like:
```
{
  "name": Run name
  "referenceConfigPath": path to the second (ARTIC-provided) config file
  "referencePanelPath": path to a FASTA of reference genomes
  "samples": [
      {
          "name": sample name
          "description": sample description
          "barcodes": array of barcodes associated with sample, e.g. [ "BC01" ]
      },
      ...
    ],
  "basecalledPath": path to the directory with guppy-produced FASTQs
  "demuxedPath": path to the directory to save demuxed FASTQs
}
```
All paths are relative to the `rampart` directory.


## Publicly available datasets & config files

* There is one (very small) dataset included in this repo. The config file for this is `./examples/EBOV/configuration.json`.
  * Note that you may need to run `mkdir ./examples/EBOV/data/demuxed` the first time!

* Guppy-basecalled EBOV dataset
  * Make the (gitignored) `./datasets` directory if it doesn't exist.
  * Download [ZEBOV_3Samples_NB_MinIT_guppy.tgz](https://artic.s3.climb.ac.uk/ZEBOV_3Samples_NB_MinIT_guppy.tgz)
 and unzip into the `./datasets` directory.
  * `mkdir ./datasets/ZEBOV_3Samples_NB/demuxed`
  * Use this config file: `./examples/EBOV/ZEBOV_3Samples_NB_config.json`

* The ZIKV & noro datasets are currently private.


## How to run RAMPART


#### Production version
See previous section for the different available `<CONFIG>` paths.
* `node rampart.js --config <CONFIG>`
* Open [localhost:3001](http://localhost:3001) in a browser

Note: run `node rampart.js -h` to see other options which may be applicable.


#### Development version
This runs a little slower, but the client will update automatically as you modify the source code.
* Start the daemon/server as above (`node rampart.js ...`)
* Run `npm run start` in a second terminal window
* Open [localhost:3000](http://localhost:3000) in a browser
