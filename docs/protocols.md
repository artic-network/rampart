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
5. A description of the primers (amplicons) associated with this genome (`primers.json`).





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
The `annotation` pipeline is a special pipeline that will process reads as they are basecalled by MinKNOW. The default pipeline is in the `default_protocol` directory in the RAMPART directory but it can be overridden in a `protocol` directory to provide customised behaviour. 

The default pipeline will watch for new `.fastq` files appearing in the `basecalled_path` (usually the `fastq/pass` folder in the MinKNOW run's data folder). Each `.fastq` file will contain 4000 reads by default. The pipeline will then de-multiplex the reads looking for any barcodes that were used when creating the sequencing library. It then maps each read to a set of reference genomes, provided by the `protocol` or by the user, recording the closest reference genome and the mapping coordinates of the read on that reference. This information is then recorded for each read in a comma-seprated `.csv` text file with the same file name stem as the original `.fastq` file. It is this file which is then read by RAMPART and the data visualised.

### De-multiplexing

The `annotation` pipeline currently uses a customised version of `porechop` that was installed by `conda` when RAMPART was installed. `porechop` is an adapter trimming and demultiplexing package written by Ryan Wick. It's original source can be found at [https://github.com/rrwick/Porechop](https://github.com/rrwick/Porechop). For RAMPART we have modified it to focus on demultiplexing, making it faster. The forked, modified version can be found at [https://github.com/artic-network/Porechop](https://github.com/artic-network/Porechop).

### Reference mapping

Reference mapping is done using `minimap2` ([https://minimap2.org]()). This step requires a `FASTA` file containing at least one reference genome (or sub-genomic region if that is being targetted). The choice of reference sequences will depend on aim of the sequencing task. The reference genome panel could span a range of genotypes or completely different viruses if a metagenomic protocol is being used. The relatively high per-read error rate will probably mean that very close variants cannot be easily distinguished at this stage. 

The mapping coordinates will be recorded based on the closest mapped reference but RAMPART will scale to a single coordinate system based on the reference genome provided the `genome.json` file. 

### Options

The default `annotation` pipeline has a number of options that can be specified, primarily to control the demultiplexing step. These options can be specified in the `protocol.json` --- to provide the options that are most appropriate for the lab protocol --- or in the `run_configuration.json` for customization for a particular run. They can also be specified on the command line when RAMPART is started. 

- `require_two_barcodes` (default true)
  > When true this option requires there to be the same barcode on both ends of the reads to ensure accurate demultiplexing.
  
- `barcode_threshold <threshold>` (default 80)
  > How good does the % identity to the best match barcode have to be to assign that barcode to the read? 
  
- `barcode_diff <differences>` (default 5)
  > How much better (in % identity) does the best barcode match have to be compared to the send best match.
  
- `discard_unassigned` (default false)
  > With this option on, any reads that are not reliably assigned a barcode (because it fails one of the above criteria) are not processed further and will not appear in RAMPART. By default these reads are processed and will appear in a category called 'unassigned'. 

- `barcode_set [native | rapid | pcr | all]` (default native)
  > Specify which set of barcodes you are using. The `rapid` barcode set only uses a barcode at one end so `require_two_barcodes` should also be set to false when using these.
   
- `limit_barcodes_to [BC01, BC02, ...]` (default no limits)
  > Specify a list of barcodes that were used in the sequencing and limit demultiplexing to these (any others will be put in the unassigned category). The digits at the end of the barcode names are used to designate the barcodes and refer to the barcodes in the barcode set being used.

In `protocol.json` or `run_configuration.json` you can sepecify the annotation pipeline options with a section labelled `annotationOptions`:
```json
annotationOptions: {
  "require_two_barcodes": "false",
  "barcode_set": "rapid",
  "limit_barcodes_to": "BC04,BC05"
}
```

On the command line these options can be specified using the `--annotationOptions` argument with a list of option and value pairs ---
`<option>=<value>` --- with no spaces. More than one such option pair can be provided with spaces between them. For example:

```json
--annotationOptions require_two_barcodes=false barcode_set=rapid limit_barcodes_to=BC04,BC05
```

# Primer scheme description

The primer scheme description is defined via the `primers.json` file in the protocol directory.

This JSON format files describes the locations of the amplicons. The coordinates are in reference to the genome description in the `genome.json` file and will be used by RAMPART to draw the the amplicons in the coverage plots. If it is not present then no amplicons will be shown in RAMPART.


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