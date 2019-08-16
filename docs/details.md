
# Technical details and file formats


## How RAMPART works

* MinKNOW (which uses `guppy`) produces basecalled reads as FASTQ files. By default there will be 4000 reads per FASTQ file and these files will appear as they are read and basecalled.
* RAMPART watches for the appearance of these files and processes them using a provided pipeline.
* The processing demuxes them (if required), and maps them to the closest reference.
* The progress of the sequencing is then displayed in the browser (port 3001 by default)

---
## Information needed for RAMPART

RAMPART needs a minimum of two pieces of information to run --

#### 1. Basecalled Directory Path
The path to the directory that contains either pre-basecalled files or the directory MinKNOW is writing basecalled files to.
This can be specified via the start-up screen in the GUI or the `--basecalledDir <PATH>` command line argument.

#### 2. Reference panel (FASTA)
To generate the reference heatmap a panel of references is required in FASTA format.
These do not have to be the same length / aligned to the provided reference genome above.
This can be specified via the start-up screen in the GUI or set using the `--referencesPath <FASTA>` argument.

With this minimum information, reads will be de-multiplexed, mapped to the closest reference sequence in the reference panel and the results will be displayed in the RAMPART application.

To get richer, more informative real-time analysis a folder of configuration files called a `protocol` directory can be provided. This is a directory of files with specified names and formats that tell RAMPART about what is being sequenced and allows it to visualize the sequencing more appropriately. It can also contain custom scripts to alter the behaviour or processing of the data.

The following files are optional but will be read if present:

* `protocol.json`
* `genome.json`
* `primers.json`
* `references.fasta`

If custom pipelines are being defined then also:
* `pipelines.json` 

#### Protocol description (`protocol.json`)
This JSON format file contains some basic information about the protocol.

#### Genome description (`genome.json`) 
This JSON format file describes the structure of the genome (positions of all the genes) and is used by RAMPART to visualize the coverage across the genome.

File format:
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

#### Primer scheme description (`primers.json`) 
This JSON format files describes the locations of the amplicons. The coordinates are in reference to the genome description and will be used by RAMPART to draw the the amplicons in the coverage plots.
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

#### Reference panel (`references.fasta`)
This is a FASTA file containing a panel of reference sequences as described above. This will be used for mapping reads if it is not overridden in the command line options.

#### Pipelines description (`pipelines.json`)
To add or override the built in RAMPART read processing pipelines this file can be used. This allows protocols to have domain-specific pipelines that accommodate the specific features of the experiment. This will be elaborated on in a future document.

## Running RAMPART with a protocol directory
To specify a protocol directory to use when running RAMPART, use the `--protocol` option:

```bash
node <rampart_install_path>/rampart.js --protocol <protocol_path> --basecalledPath <minknow_data_path>/<run_name>/pass
```

Where <protocol_path> is the path to the directory containing the above files.

If files with these names are found in the current working directory (where you are running RAMPART from) then these will override the ones in the protocol directory.

## Run configuration
Finally, an optional file, `run_configuration.json` can be present in the current working directory to provide details about the MinION run being performed. An example of this file looks like this:

```json
{
  "title": "EBOV Validation Run",
  "basecalledPath": "fastq/pass",
  "samples": [
    {
      "name": "Mayinga",
      "description": "",
      "barcodes": [ "BC01" ]
    },
    {
      "name": "Kikwit",
      "description": "",
      "barcodes": [ "BC03" ]
    },
    {
      "name": "Makona",
      "description": "",
      "barcodes": [ "BC04" ]
    },
    {
      "name": "Negative Control",
      "description": "",
      "barcodes": [ "BC02" ]
    }
  ]
}
```
This file can specify the basecalled read path (as an alternative to the command line `--basecalledPath`), a title for the run and also a list of samples, their names and the barcodes that are being used to distinguish them. If barcodes are specified in this way then only these barcodes will be used and visualized in RAMPART.

## Command line options
```
Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  --verbose             verbose output
  --ports PORTS PORTS   The ports to talk to the client over. First: client 
                        delivery, i.e. what localhost port to access rampart 
                        via (default: 3000). Second: socket to transfer data 
                        over (default: 3001)
  --protocol PROTOCOL   path to a directory containing protocol config files

Config commands:
  Override options from config files

  --title TITLE         experiment title
  --basecalledPath BASECALLEDPATH
                        path to basecalled FASTQ directory (default: don't 
                        annotate FASTQs)
  --annotatedPath ANNOTATEDPATH
                        path to destination directory for annotation CSVs - 
                        will be created if it doesn't exist (default: '.
                        /annotations')
  --barcodeNames BARCODENAMES [BARCODENAMES ...]
                        specify mapping of barcodes to sample names - e.g. 
                        'BC01=Sample1' (can have more than one barcode 
                        mapping to the same name)
  --annotationConfig ANNOTATIONCONFIG [ANNOTATIONCONFIG ...]
                        pass through config options to the annotation script 
                        (key=value pairs)

Runtime commands:
  Options to specify how RAMPART behaves

  --clearAnnotated      remove any annotation files present when RAMPART 
                        starts up (force re-annotation of all FASTQs)
  --simulateRealTime SIMULATEREALTIME
                        simulate real-time annotation with given delay 
                        between files (default none)

Development commands:
  --devClient           don't serve build (client)
  --mockFailures        stochastic failures (annotating / parsing)
```

