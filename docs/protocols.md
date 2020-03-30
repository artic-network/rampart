# Protocols

The "protocol" is what defines how RAMPART will behave and look.
It's the primary place where the reference genome(s), primers, analysis pipelines etc are defined.
For this reason a protocol is typically virus-specific, with the run-specific information overlaid.


#### A protocol is composed of 5 JSON files

A protocol is composed of 5 JSON fileswhich control various configuration options.
RAMPART will search for each of these JSON files in a cascading fashion, building up information from various sources (see "How RAMPART finds configuration files to build up the protocol" below).
This allows us to always start with RAMPARTs "default" protocol, and then add in run-specific information from different JSONs, and potentially modify these via command line arguments.


Each file is described in more detail below, but briefly the five files are:
* `protocol.json` Description of the protocol's purpose
* `genome.json` describes the reference genome of what's being sequenced
* `primers.json` describes the position of primers across the genome
* `pipelines.json` describes the pipelines used for data processing and analysis by RAMPART
* `run_configuration.json` contains information about the current run, including 


Typically, you would provide RAMPART with a virus-specific protocol directory containing the first four files, and the run-specific information would be either in a JSON in the current working directory or specified via command line args.


---
## How RAMPART finds configuration files to build up the protocol

RAMPART searches a number of folders in a cascading manner in order to build up the protocol for the run.
Each time it finds a matching JSON it adds it into the overall protocol, overriding previous options as necessary _(technically we're doing a shallow merge of the JSONs)_. Folders searched are, in order:

1. RAMPART's default protocol. See below for what defaults this sets.
2. Run specific protocol directory. This is set either with `--protocol <path>` or via the `RAMPART_PROTOCOL` environment variable.
3. The current working directory.

---
## Protocol file: `protocol.json`

This JSON format file contains some basic information about the protocol.
For instance, this is the protocol description for the provided EBOV example:

```json
{
  "name": "ARTIC Ebola virus protocol v1.1",
  "description": "Amplicon based sequencing of Ebola virus (Zaire species).",
  "url": "http://artic.network/"
}
```

You may also set `annotationOptions` and `displayOptions` in this file (see below for more info).


---
## Protocol file: `genome.json`

This JSON format file describes the structure of the genome (positions of all the genes) and is used by RAMPART to visualize the coverage across the genome.


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



---
## Protocol file: `primers.json`


The primer scheme description is defined via the `primers.json` file in the protocol directory.

This JSON format files describes the locations of the amplicons. The coordinates are in reference to the genome description in the `genome.json` file and will be used by RAMPART to draw the the amplicons in the coverage plots. If it is not present then no amplicons will be shown in RAMPART.

> These data are only used for display, not analysis.

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

---
## Protocol file: `pipelines.json`

Each pipeline defined here is an analysis toolkit available for RAMPART.
It's necessary to provide an `annotation` pipeline to parse and interpret basecalled FASTQ files.
Other pipelines are surfaced to the UI and can be triggered by the user.
For instance, you could define a "generate consensus genome" pipeline and then trigger it for a given sample when you are happy with the coverage statistics presented by RAMPART.


Each pipeline defined in the JSON must indicate a directory containing a `Snakemake` file which RAMPART will call. This call to snakemake is configured with an optional `config.yaml` file (see below), user defined `--config` options, and dynamicaly generated `--config` options RAMPART will add to indicate the "state of the world".


```json
{
    "pipeline_name": {...},
    ...
}
```

**Required properties**
* `"path" {string}` -- the path to the pipeline, relative to the "protocol" directory. There _must_ be a `Snakemake` file in this directory

**Optional properties**
* `"name" {string}` -- the name of the pipeline. Default: the JSON key name.
* `"run_per_sample" {bool}` -- is the pipeline able to be run for an individual sample? If this is set, then the pipeline will show up as a triggerable entry in the menu of each sample panel.
* `"run_for_all_samples" {bool}` _NOT YET IMPLEMENTED_
* `"config_file" {string}` -- the name of a config file (e.g. `config.yaml`) in the pipeline directory. This will be supplied to Snakemake via `--configfile`.
* `"configOptions" {object}` -- options here will be supplied to snakemake via the `--config` argument. The format of these options is `key=value`, and strings are quoted if needed. If `value` is an empty string, then the key is reported alone. If `value` is an array, then the entries are joined using a `,` charater. If `value` is a dictionary, then the keys & values of that are joined via `:`. The values of a dict / array must be strings. For instance, `"configOptions":  {"a": "", "b": "B", "c": ["C", "CC"], "d": {"D": "", "DD": "DDD"}}` will get turned into `--config a b=B c=C,CC d=D,DD:DDD`.
* `"requires" {object}` _only usable by the annotation pipeline. see below._


#### RAMPART injected `--config` information
When a pipeline is triggered, RAMPART will supply various information about the current state to the snakemake pipeline via `--config`. These will override any user settings with the same key names.

* `sample_name` the sample name for which the pipeline has been triggered. (Currently pipelines only work per-sample).
* `barcodes` a list of barcodes linked to the sample
* `annotated_path` absolute path to the files produced by the annotation pipeline
* `basecalled_path` absolute path to the basecalled FASTQs
* `output_path` absolute path to where the output of the pipeline should be saved

If filtering is enabled, then the following options are presented to the pipeline as applicable:

* `references` a list of references which the display is filtered to (i.e. only reads with a top hit to one of these references are being displayed)
* `maxReadLength` reads longer than this are being filtered out
* `minReadLength` reads shorter than this are being filtered out
* `minRefSimilarity` Lower cutoff (%) for read match similarity
* `maxRefSimilarity` Upper cutoff (%) for read match similarity

> More options will be added in the future.


#### The annotation pipeline

The `annotation` pipeline is a special pipeline that will process reads as they are basecalled by MinKNOW. The default pipeline is in the `default_protocol` directory in the RAMPART directory but it can be overridden in a `protocol` directory to provide customised behaviour. 

Unlike other pipelines, additional configuration can be provided here (see "Annotation options" below).

Furthermore, the annotation pipeline can use a `requires` property which specifies files to be handed to Snakemake via the `--config` parameter.


#### RAMPART's default annotation pipeline

The default pipeline will watch for new `.fastq` files appearing in the `basecalled_path` (usually the `fastq/pass` folder in the MinKNOW run's data folder). Each `.fastq` file will contain 4000 reads by default. The pipeline will then de-multiplex the reads looking for any barcodes that were used when creating the sequencing library. It then maps each read to a set of reference genomes, provided by the `protocol` or by the user, recording the closest reference genome and the mapping coordinates of the read on that reference. This information is then recorded for each read in a comma-seprated `.csv` text file with the same file name stem as the original `.fastq` file. It is this file which is then read by RAMPART and the data visualised.

For **de-multiplexing**, The `annotation` pipeline currently uses a customised version of `porechop` that was installed by `conda` when RAMPART was installed. `porechop` is an adapter trimming and demultiplexing package written by Ryan Wick. It's original source can be found at [https://github.com/rrwick/Porechop](https://github.com/rrwick/Porechop). For RAMPART we have modified it to focus on demultiplexing, making it faster. The forked, modified version can be found at [https://github.com/artic-network/Porechop](https://github.com/artic-network/Porechop).

If demuxing has been done by guppy, then the **de-multiplexing** step is skipped.

**Reference mapping** is done using `minimap2` ([https://minimap2.org]()). This step requires a `FASTA` file containing at least one reference genome (or sub-genomic region if that is being targetted). The choice of reference sequences will depend on aim of the sequencing task. The reference genome panel could span a range of genotypes or completely different viruses if a metagenomic protocol is being used. The relatively high per-read error rate will probably mean that very close variants cannot be easily distinguished at this stage. 

The mapping coordinates will be recorded based on the closest mapped reference but RAMPART will scale to a single coordinate system based on the reference genome provided the `genome.json` file. 


#### Annotation options

The default `annotation` pipeline has a number of options that can be specified, primarily to control the demultiplexing step. These options can be specified in the `protocol.json` --- to provide the options that are most appropriate for the lab protocol --- or in the `run_configuration.json` for customization for a particular run. They can also be specified on the command line when RAMPART is started via `--annotationOptions`. 
If demuxing has been performed by guppy, then these options have no effect!

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

---
## Protocol file: `run_configuration.json`

See [Setting up for your own run](setting-up.md) for general format of this file and how it is intended to be used.


**Optional properties**
* `"title" {string}` -- the run name
* `"basecalledPath" {string}` -- Path to the folder where basecalled FASTQs are stored
* `"samples" {object}` -- A mapping of sample names to the barcodes. See [Setting up for your own run](setting-up.md).
* `"clearAnnotated" {bool}` -- Should any FASTQ annotations (e.g. from a previous run) be removed before starting?
* `"simulateRealTime" {bool}`
* `"displayOptions" {object}` -- see below


---
## Command line overrides

It's possible to override protocol settings via the command line:
```
  --title TITLE         experiment title
  --basecalledPath BASECALLEDPATH
                        path to basecalled FASTQ directory (default: don't 
                        annotate FASTQs)
  --annotatedPath ANNOTATEDPATH
                        path to destination directory for annotation CSVs - 
                        will be created if it doesn't exist (default: '.
                        /annotations')
  --referencesPath REFERENCESPATH
                        path to a FASTA file containing a panel of reference 
                        sequences
  --referencesLabel REFERENCESLABEL
                        the reference header field to use as a reference 
                        label (if not just the reference name)
  --barcodeNames BARCODENAMES [BARCODENAMES ...]
                        specify mapping of barcodes to sample names - e.g. 
                        'BC01=Sample1' (can have more than one barcode 
                        mapping to the same name)
  --annotationOptions ANNOTATIONOPTIONS [ANNOTATIONOPTIONS ...]
                        pass through config options to the annotation script 
                        (key=value pairs)
```

---
## Extras


#### Display options

These are options which control the way the visualisation is first presented.
These are not currently documented and should be used with caution.
They can be included via the `protocol.json` or the `run_configuration.json`.




