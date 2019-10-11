
# Bioinformatics pipelines in RAMPART

These are defined by the `pipelines.json` config file located in the protocol directory (this is specified when RAMPART is run via the `--protocol <PATH>` option).
If you don't supply a protocol, or your protocol doesn't contain a `pipelines.json` file then the `default_protocol` directory is used.

#### Structure of the JSON file:
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
