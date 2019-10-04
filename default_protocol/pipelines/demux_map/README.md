# demux & map & report

A snakemake pipeline that takes in basecalled fastq files, demultiplexes them using ``porechop`` and maps them against a reference panel in fasta format using ``minimap2``. It then parses the barcode and mapping information and produces a csv report.
<!-- 
In cases of amplicon-based sequencing, the pipeline can also accept a bed file, which is used to infer which amplicon each read is likely to be. It then can either append the amplicon information to the header of the read and/or include it in the report. -->
<!-- 
There is also an optional BinLorry rule that will bin by read length (min, max) and barcode by default.  -->

### Header annotations 

The parse_paf.py script reads in barcode and start_time information from the header. 

e.g.
```
@6d3d6bff-4c48-4b5c-8fc9-bc0765e27016 runid=b10b0df343a0c44bc8f661f2cfbe235fce1fbedc \
sampleid=seq_run read=58437 ch=444 start_time=2019-05-29T20:48:48Z \
barcode=NB01 
AGTTACTAAGGTTAACACTGCAGTGAACCTCCTCTTGACACCTCTCTCATTGTGTCATCAACCTGTTTGTCGTCTGCCCACAC
+
$)''$'(%+38>?6'$*(&'&'&1(&%''(&,&+%%+,,-22131545230/)(%+&&-$&.-+)%&'&&$*421(&&&%&11
```

### CSV return format

The resulting CSV report includes the following header fields:

- read_name
- read_len
- start_time
- barcode
- best_reference
- ref_len
- start_coords
- end_coords
- num_matches
- aln_block_len

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
snakemake --snakefile pipelines/rampart_demux_map/Snakefile \
--config file_stem=your_file_stem_here \
demuxedPath=pipeline_output \
referencePanelPath=rampart_config/norovirus/initial_record_set.fasta \
basecalledPath=rampart_config/norovirus/data/basecalled
```
