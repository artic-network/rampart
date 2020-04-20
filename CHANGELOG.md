# CHANGELOG

## __NEXT__

* Fastqs with identical names (but which are in different subdirectories) are now able to be processed.
The annotated CSVs are now stored in subdirectories which reflect the FASTQ structure.
* Gzipped FASTQ files can now be used. They must have the filename extension `.fastq.gz`
* We now provide a `--cores` argument to Snakemake, allowing snakemake v5.11 and higher to be used
* We provide better information about samples for which no reads are yet available (i.e. no FASTQ has been written)


## 1.1.0 (01 April 2020)

#### Major changes
* Guppy-demuxed FASTQs can now be used. If this is the case, then `porechop` is no longer a
requirement for RAMPART to run.
* Memory footprint has been drastically reduced. Testing with 1 million SARS-CoV-2 reads results
in only ~20Mb for the server and ~10Mb for the client. This has necessitated the removal of filtering
& the ability to change barcode-sample names via the UI. We hope to bring back this functionality
in a future release.
* Improved installation documentation


#### Minor changes
* Fastqs can now be in nested folders (currently 2 levels are allowed)
* Light and Dark themes are now available and may be changed via a toggle in the header.
* We now display the version number in the footer to help with bug reports & debugging.

## 1.0.5

