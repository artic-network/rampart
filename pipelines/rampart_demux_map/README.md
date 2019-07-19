# demux & map & report

A snakemake pipeline that takes in basecalled fastq files, demultiplexes them using ``porechop`` and maps them against a reference fasta file using ``minimap2``. It then parses the barcode and mapping information and can optionally append it to the read header and/or produce a csv report.

In cases of amplicon-based sequencing, the pipeline can also accept a bed file, which is used to infer which amplicon each read is likely to be. It then can either append the amplicon information to the header of the read and/or include it in the report.

### Usage

To start the pipeline running for one fastq file:
```
snakemake --cores 2 --config file_stem=your_fastq_file
```

All config variables can be overwritten as above.

To provide your own config file: 
```
snakemake --cores 2 --configfile=your_config_file.yaml
```
The config file can be in yaml or json format. 

