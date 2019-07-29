# demux & map & report

A snakemake pipeline that takes in basecalled fastq files, demultiplexes them using ``porechop`` and maps them against a reference panel and a coordinate reference  in fasta format using ``minimap2``. It then parses the barcode and mapping information and can append it to the read header and/or produce a csv report.

In cases of amplicon-based sequencing, the pipeline can also accept a bed file, which is used to infer which amplicon each read is likely to be. It then can either append the amplicon information to the header of the read and/or include it in the report.

There is also an optional BinLorry rule that will bin by read length (min, max) and barcode by default. 

### Dependencies

In addition to the ``RAMPART`` dependencies, this snakemake pipeline also requires ``snakemake=5.4.3``.

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

You can either run this pipeline by editing the yaml file or by explicitly stating the config parameters on the command line. For example: 

```
snakemake --snakefile pipelines/rampart_demux_map/Snakefile --config file_stem=fastq_runid_b10b0df343a0c44bc8f661f2cfbe235fce1fbedc_1 demuxedPath=pipeline_output referencePanelPath=rampart_config/norovirus/initial_record_set.fasta referenceConfigPath=rampart_config/norovirus/coordinate_reference.fasta basecalledPath=rampart_config/norovirus/data/basecalled
```