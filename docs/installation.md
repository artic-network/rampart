# Installing RAMPART

There are currently two ways of installing RAMPART:
* [Installing on a GPU-accelerated laptop](#installing-on-a-gpu-accelerated-laptop)
* [Installing on MinIT](#installing-on-minit)

Both currently require you to be comfortable using the command line but we're working on improving this.


## Installing on a GPU-accelerated laptop

### Prerequisites:
* MinKNOW must be installed.
See the [Oxford Nanopore downloads page](https://community.nanoporetech.com/downloads) for instructions.
* Conda should be installed -- see [instructions here](https://conda.io/docs/user-guide/install/index.html).
Conda is a popular environment manager which makes it trivial to install dependencies & software in a fashion that won't break other software you may have installed. While you can run rampart without conda, it requires you to maintain local installations of nodejs and other dependencies.

### Install RAMPART

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
Whenever you run RAMPART you must be in the "artic-rampart" conda environment. You can enter / leave this environment via
```
source activate artic-rampart # some systems use `conda activate artic-rampart`
conda deactivate artic-rampart
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

### Install Porechop (used for demuxing reads)
_Make sure you are still in the "artic-rampart" conda environment -- you can run `conda env list` to check_

```bash
cd .. # leave the RAMPART directory
git clone https://github.com/rambaut/Porechop.git
cd Porechop/
python setup.py install
cd ..
```
Check `porechop` is available on the command line by running `porechop -h`.


### Run example datasets
We're done 🎉
Why not [run some example datasets](examples.md) to get familiar with RAMPART and make sure everything's working.

---


## Installing on MinIT

> Note that these instructions are rather old & you should expect to do some debugging!


Install RAMPART
```bash
git clone https://github.com/artic-network/rampart.git
```

There is no miniconda for ARM8 so everything needs to be hand installed.

Install python 3 & pip:
```bash
sudo apt install python3-pip
```

Install v10 of nodejs:
```bash
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Install custom version of Porechop:
```bash
git clone https://github.com/rambaut/Porechop.git
cd Porechop
sudo python3 setup.py install
```

Install and compile minimap2:
```bash
https://github.com/lh3/minimap2.git
cd minimap2
make arm_neon=1 aarch64=1
```

Compile and install mappy (minmap2's python wrapper):
```
# setup doesn't compile mappy on ARM (possibly above make settings needed)
# sudo python3 setup.py install

# but pip installs it fine...
pip3 install mappy
```

Install and run yarn:
```bash
cd rampart
sudo npm install yarn -g
yarn
```

Build the rampart code:
```bash
npm run build
```

We're done 🎉
Why not [run some example datasets](examples.md) to get familiar with RAMPART and make sure everything's working.


Testing porechop:
```bash
porechop --verbosity 1 -i /data/reads/<experiment>/fastq/pass/<fastq_file>.fastq -o /data/reads/<experiment>/porechop/demuxed.fastq --discard_middle --require_two_barcodes --barcode_threshold 80 --threads 2 --check_reads 10000 --barcode_diff 5 --barcode_labels
```

Testing minimap2 python script:
```bash
python3 server/map_single_fastq.py -p ./EBOV/reference-genomes.fasta -c ./coordinate_reference.fasta -f /data/reads/<experiment>/porechop/demuxed.fastq 
```

Running Guppy manually (on MinIT's GPU):
```bash
guppy_basecaller --device cuda:0 --flowcell FLO-MIN106 --kit SQK-LSK108 --recursive -i /data/reads/<experiment>/fast5/ -s ./basecalled
```


