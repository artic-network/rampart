# Protocols

To get richer, more informative real-time analysis a folder of configuration files called a `protocol` directory can be provided.
This is a directory of files with specified names and formats that tell RAMPART about what is being sequenced and allows it to visualize the sequencing more appropriately. 
It can also contain custom scripts to alter the behaviour or processing of the data.


Normally the protocol directory is virus-specific, not run-specific.


A protocol directory typically defines 5 things, but not all have to be specified and RAMPART will fall back to defaults, or can in some cases use command-line arguments to override some of these. All options are described in more detail below.

1. A JSON describing the protocol (`protocol.json`).
2. A JSON describing the (reference) genome of what's being sequenced.
3. A reference panel (`references.fasta`)
4. A description of the pipelines (`pipelines.json`)
5. A description of the primers (amplicons) associated with this genome (`primers.md`).





## How RAMPART finds configuration files to build up the protocol

RAMPART looks for its configuration files by their name (`protocol.json`, `genome.json`, `primers.json`, `references.fasta`, `pipelines.json` and `run_configuration.json`) but it will look for them in a sequence of directories:

1) The `default_protocol` directory in the RAMPART directory.
2) The specified directory specified by the `--protocol` command line option.
3) The current working directory (the 'runtime' directory).    

If the file is found in multiple places in the above list, options in the subsequent file will be added to the previous one and overwrite if the top-level key is the same.




# Protocol description

This JSON format file contains some basic information about the protocol.
For instance, this is the protocol description for the provided EBOV example:

```json
{
  "name": "ARTIC Ebola virus protocol v1.1",
  "description": "Amplicon based sequencing of Ebola virus (Zaire species).",
  "url": "http://artic.network/"
}
```





# Genome description 

The genome description is defined via the `genome.json` file in the protocol directory.


This JSON format file describes the structure of the genome (positions of all the genes) and is used by RAMPART to visualize the coverage across the genome.


### File format:

```json
{
  "label": "Ebola virus (EBOV)",
  "length": 18959,
  "genes": {
    "<GENE_NAME>": {
      "start": 469,
      "end": 2689,
      "strand": 1
    },
    ...
  },
  "reference": {
	"label": "<REFERENCE_NAME>",
	"accession": "<ACCESSION>",
        "sequence": "atcg..."
  }
}
```











# Reference panel
This is a FASTA file containing a panel of reference sequences.
This will be used for mapping reads if it is not overridden in the command line options.
This file is actually passed on to the annotation pipeline -- see below for more details.











# Bioinformatics pipelines in RAMPART

These are defined by the `pipelines.json` config file located in the protocol directory (this is specified when RAMPART is run via the `--protocol <PATH>` option).
If you don't supply a protocol, or your protocol doesn't contain a `pipelines.json` file then the `default_protocol` directory is used.

### Structure of the JSON file:

```js
{
    "annotation": {...}, // see "Read Annotation Pipeline" below
    "processing": [...]  // see "User definable post-processing pipelines" below
}
```


## User definable post-processing pipelines
RAMPART allows you to define your own pipelines which can then be triggered by the user.
For instance, you may have a consensus-generation pipeline which a user can trigger on a per-sample basis when they are happy with the coverage (e.g.) for that sample.

For each pipeline you'll need to create a `Snakemake` file which RAMPART will call. Options provided to snakemake take two forms:
1. a config file -- useful for options that don't need to be dynamically set
2. config arguments -- when you set up your `pipelines.json` you can instruct RAMPART to suppy a number of parameters when the pipeline is triggered.

An array of such pipelines is defined in the JSON each with the following properties:

**Required properties**

* `"name"` -- the name of the pipeline (displayed in the menus)
* `"path"` -- the path to the pipeline, relative to the "protocol" directory. There _must_ be a `Snakemake` file in this directory

**Optional properties**
* `"config_file" {string}` -- the name of a config file (e.g. `config.yaml`) in the pipeline directory.
* `"run_per_sample" {bool}` -- is the pipeline able to be run for an individual sample?
* `"options" {Object}` -- an object defining config arguments which RAMPART can supply to the snakemake file. Available properties:
    * `"min_length" {bool}` set via GUI
    * `"max_length" {bool}` set via GUI
    * `"sample_name" {bool}` set via server. Only makes sense with the "run_per_sample" option.
    * `"barcodes" {bool}` set via server. barcodes associated with a selected sample
    * `"basecalled_path" {bool}` set via server
    * `"annotated_path" {bool}` set via server
    * `"output_path" {bool}` set via server




## Read annotation pipeline

### De-multiplexing

### Reference mapping

### Options

- require_two_barcodes (default true)
- discard_middle (default true)
- split_reads (default false)
- discard_unassigned (default true) 
  > keep unassigned, change to --discard_unassigned if you don't want to see unbarcoded reads
- barcode_set [native | rapid | all] (default native)
- limit_barcodes_to [BC01, BC02, ...] (default no limits)
- barcode_threshold <threshold> (default 80)
- barcode_diff <differences> (default 5)

In `protocol.json` or `run_configuration.json`
```json
annotationOptions: {
  "require_two_barcodes": "false",
  "barcode_set": "rapid",
  "limit_barcodes_to": "BC04,BC05"
}
```

`<option>=<value>` with no spaces

```json
--annotationOptions require_two_barcodes=false barcode_set=rapid limit_barcodes_to=BC04,BC05
```




# Primer scheme description

The primer scheme description is defined via the `primers.json` file in the protocol directory.


This JSON format files describes the locations of the amplicons. The coordinates are in reference to the genome description and will be used by RAMPART to draw the the amplicons in the coverage plots.


### File format:

```json
{
	"name": "EBOV primer scheme v1.0",
	"amplicons": [
		[32, 1057],
		[907, 1881],
        .
        .
        . 
		[17182, 18183],
		[17941, 18916]
	]
}

```