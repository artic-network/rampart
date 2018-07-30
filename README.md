# RAMPART
Read Assignment, Mapping, and Phylogenetic Analysis in Real Time

## Status
In development

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
read_fast5_basecaller.py --resume -c r94_450bps_linear.cfg -i MinKNOW/data/reads/ -s basecalled_reads -o fastq -t 4 -r --barcoding -q 1000 -t 20
```

* start mapping daemon:

```
scripts/read_mapping_daemon.py -r ../artic-ebov/reference_genomes/ebov-reference-genomes-10.fasta -n 1000 -m basecalled_reads/workspace/pass data/real_time_reads/
```

#### Mock mapping (for debugging / computers without GPUs)
```
python scripts/mock_read_mapping_daemon.py &
```

### Start the server & frontend
* `npm run server &` which starts the server (to deliver reads)
* `npm run start` which starts the frontend (available at [http://localhost:3000/](http://localhost:3000/))
