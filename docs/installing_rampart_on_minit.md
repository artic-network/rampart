```bash
sudo apt install python3-pip
```

```bash
git clone https://github.com/artic-network/rampart.git
```

Install v10 of nodejs:

```bash
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Install and run yarn:

```bash
sudo npm install yarn -g
yarn
```

```bash
git clone https://github.com/rambaut/Porechop.git
cd Porechop
sudo python3 setup.py install
```

```bash
https://github.com/lh3/minimap2.git
cd minimap2
make arm_neon=1 aarch64=1

# this doesn't compile on ARM (possibly arc settings needed)
# sudo python3 setup.py install

pip3 install mappy
```

Run RAMPART server:
```bash
nodejs rampart.js --config ./EBOV/ZEBOV_3Samples_NB_config.json
```

Testing porechop:
```bash
porechop --verbosity 1 -i /data/reads/<experiment>/fastq/pass/<fastq_file>.fastq -o /data/reads/<experiment>/porechop/demuxed.fastq --discard_middle --require_two_barcodes --barcode_threshold 80 --threads 2 --check_reads 10000 --barcode_diff 5 --barcode_labels
```

Testing minimap2 python script:
```bash
python3 server/map_single_fastq.py -p ./EBOV/reference-genomes.fasta -c ./coordinate_reference.fasta -f /data/reads/<experiment>/porechop/demuxed.fastq 
```