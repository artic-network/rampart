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

Run RAMPART:
```bash
nodejs rampart.js --config ./EBOV/ZEBOV_3Samples_NB_config.json
```
Open [localhost:3001](http://localhost:3001) in a browser



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