# RAMPART
Read Assignment, Mapping, and Phylogenetic Analysis in Real Time

## Status
In development

## General data-flow
Rampart consists of 2 parts:
1. The basecalling & mapping daemon(s), which monitor produced fast5 files, basecall them, and produce timestamped JSONs describing the mapping results.
In the future, this may include consensus sequence building & phylogenetic placement.
Additionaly an info file summarising the references used, barcode names etc is produced.

2. The server & frontend. This watches for the JSONs produced from step 1, and visualises the result.
This can either be used as a localhost website or an electron app.
(Note that the code is not production ready.)



## Installation
* [Install conda](https://conda.io/docs/user-guide/install/index.html)
* `git clone git@github.com:artic-network/rampart.git && cd rampart`
* `conda env create -f environment.yml`
* `source activate artic-rampart`
* `yarn` to install javascript / node-js packages (dependencies of the server and the frontend)



## How to Run

You'll need some way of creating reads - this can either be mocked or done in real-time using Albacore & the mapping daemon.
Either way creates files in `data/real_time_reads/`, which the server then reads and passes to the frontend.

#### Live mapping:
* start Albacore:

```
read_fast5_basecaller.py --resume -c r94_450bps_linear.cfg -i MinKNOW/data/reads/ -s basecalled_reads -o fastq -t 4 -r --barcoding -q 1000
```

* start mapping daemon:

```
scripts/read_mapping_daemon.py -r ../artic-ebov/reference_genomes/ebov-reference-genomes-10.fasta -n 1000 -m basecalled_reads/workspace/pass data/real_time_reads/
```

#### Mock basecalling & mapping (for debugging / computers without GPUs)

Step 1: Group ONT fast5 files into time slices for mapping (where `N` limits the number of FAST5 directories processed)

```
python scripts/split_fast5s_according_to_timestamps.py --n-stop N FAST5DIR TIME_SLICED_FAST5_DIR
```

Step 2: Basecall each of these time-sliced-fast5-directories using albacore

```
mkdir basecalled_time_slices && for i in $( ls time_sliced_fast5/ ); do mkdir basecalled_time_slices/${i}; read_fast5_basecaller.py -c r94_450bps_linear.cfg -i time_sliced_fast5/${i} -s basecalled_time_slices/${i} -o fastq -r --barcoding -q 1000 -t 3; done
```

Step 3: Map these FASTQs to a panel of reference sequences and produce a JSON per time slice.
This also produces a `info.json` file which details the barcodes, references etc.
The barcodes are specified in increasing order (i.e. the first corresponds to "barcode01").

```
mkdir mapped_time_slices && for i in  $( ls basecalled_time_slices ); do mkdir mapped_time_slices/${i}; python ~/artic-network/rampart/scripts/read_mapping_daemon.py -r ~/artic-network/artic-ebov/reference_genomes/ebov-reference-genomes-10.fasta -b barcode01 barcode03 barcode04 barcode09 -n 1000 --dont_observe -i basecalled_time_slices/${i}/workspace/pass -o mapped_time_slices/${i} -t "EBOV Validation Run"; done
```

```
mkdir mapped_time_slices && for i in  $( ls basecalled_time_slices ); do mkdir mapped_time_slices/${i}; python ~/artic-network/rampart/scripts/read_mapping_daemon.py -r ~/artic-network/rampart/data/zika_reference_genomes.fasta -b VI34_p1 VI35_p1 VI36_p1 VI37_p1 VI38_p1 negative VI34_p2 VI35_p2 VI36_p2 empty VI37_p2 VI38_p2 -n 1000 --dont_observe -i basecalled_time_slices/${i}/workspace/pass -o mapped_time_slices/${i} -t "ZIKV USVI 7"; done
```

Step 4: To mimic steps 1-3 happening in real time, copy these JSONs into the RAMPRT-watched directory at some prescribed rate.
The `--rate` parameter specifies how many seconds 1 minute of capture represents.

```
python scripts/periodically_copy_mapped_jsons.py --rate 10 ~/reads/20180531_2057_EBOV/mapped_time_slices data/real_time_reads
```

```
python scripts/periodically_copy_mapped_jsons.py --rate 10 ~/reads/ZIKV_USVI_7/mapped_time_slices data/real_time_reads
```


### Start the server & frontend

As an electron app... _CURRENTLY BROKEN_
* `npm run start` (in one terminal window).
* _You must then close any browser windows open at localhost:3000_
* `npm run electron-dev` (in another)

As a more traditional server process & localhost client...
* `npm run server data/ebola_annotation.json` (in one terminal window) (or `npm run server data/zika_annotation.json`)
* `npm run start` (in another) -- this should open  [http://localhost:3000/](http://localhost:3000/)
