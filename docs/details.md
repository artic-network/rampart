
# Technical details and file formats


## How RAMPART works

* MinKNOW (which uses `guppy`) produces basecalled reads as FASTQ files.
* RAMPART watches for the appearance of these files and processes them using a provided pipeline.
* The processing demuxes them (if required), and maps them to the closest reference.
* The progress of the sequencing is then displayed in the browser (port 3001 by default)

---
## Information needed for RAMPART

RAMPART needs four pieces of information to run -- all of which can either be specified via the command line or set via the GUI.

### 1. Basecalled Directory
The directory that contains either pre-basecalled files or the directory MinKNOW is writing basecalled files to.
This can be specified via the start-up screen in the GUI or the `--basecalledDir <PATH>` command line argument.

### 2. Demuxed Directory
The directory that RAMPART will write demuxed FASTQs to.
This can be specified via the start-up screen in the GUI or the `--demuxedDir <PATH>` command line argument.

> NOTE: RAMPART will remove all files in this directory when it starts up.

### 3. Reference Genome Config (JSON)
The (single) reference genome and annotations.
Reads are mapped to this to generate the converage plots.
It can be specified via the "config" sidebar in the GUI or set using the `--referenceConfigPath <JSON>` argument.
There are example config files available -- see the [examples](examples.md) page, or look in `./assets/includedConfigs/`


File format:
```json
{
  "reference": {
    "label": "Yambuku-Mayinga|DRC|1976",
    "length": 18959,
    "genes": {
      "<GENE_NAME>": {
        "start": 6038,
        "end": 8068,
        "strand": 1
      },
      ...
    },
    "amplicons": [
      [32, 1057],
      [907, 1881],
      ...
    ],
    "sequence": "atcg..."
  }
}

```

### 3. Reference panel (FASTA)
To generate the reference heatmap a panel of references is required in FASTA format.
These do not have to be the same length / aligned to the provided reference genome above.
This can be specified via the "config" sidebar in the GUI or set using the `--referencePanelPath <FASTA>` argument.



