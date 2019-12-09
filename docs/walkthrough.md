# A suggested workflow for running MinKNOW and RAMPART 

This article presupposes that you have [installed RAMPART](installation).

Start MinKNOW

Create experiment name

Select `Output Location` 

Start run

Open terminal window

cd to `<output_location>/<experiment_name>'

create `run_configuration.json`

edit it to map barcodes to sample names

ensure basecalledPath is pointing to the location of the basecalled FASTQ files

Run RAMPART:

```bash
rampart --protocol ~/artic-ebov/rampart/PanEBOV
```

