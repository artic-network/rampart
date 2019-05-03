

## Prerequisites

1. **MinKNOW, dogfish**

See [this page](sequencing.md) for instructions on MinKNOW and dogfish set up.
Note that this isn't needed to run the pre-basecalled example datasets.

2. **Install conda** -- [Instructions here](https://conda.io/docs/user-guide/install/index.html)


## Installing RAMPART
1. **Clone the github repo & move into rampart directory**
```bash
git clone https://github.com/artic-network/rampart.git
cd rampart
```

2. **Create & activate the conda environment**
```bash
conda env create -f environment.yml
source activate artic-rampart
```

3. Install Node / JavaScript dependencies
```bash
yarn
```

4. Build the JavaScript frontend
```
npm run build
```

5. Ensure it works
```bash
node rampart.js -h
```


## Installing porechop
Make sure you're in the artic-rampart conda environment (see above), but not in the rampart directory
```
git clone https://github.com/rambaut/Porechop.git
cd Porechop/
python setup.py install
```
Check `porechop` is available on the command line by running `porechop -h` (inside the "artic-rampart" conda environment).


## Developing the client
This runs a little slower, but the client will update automatically as you modify the source code.
* Start the daemon/server as above (`node rampart.js ...`)
* Run `npm run start` in a second terminal window
* Open [localhost:3000](http://localhost:3000) in a browser (not 3001)




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


