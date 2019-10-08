# demux & map & report

A snakemake pipeline that takes in basecalled fastq files, demultiplexes them using ``porechop`` and maps them against a reference panel in fasta format using ``minimap2``. It then parses the barcode and mapping information and produces a csv report.

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

In addition to the ``RAMPART`` dependencies, this pipeline also requires ``snakemake``.

### Usage

To start the pipeline running for one fastq file:
```
snakemake \
--snakefile default_protocol/pipelines/demux_map/Snakefile \
--configfile default_protocol/pipelines/demux_map/config.yaml \
--config \
input_path=path/to/basecalled/ \
output_path=where/to/put/data/ \
filename_stem=my_file \
references_file=path/to/my_references.fasta \
barcodes=NB01,NB02,NB03
```

You can change the default options, either by editing the config file provided or by explicitly stating the config parameters via the command line. The default settings for ``Porechop`` demultiplexing are shown below:

```
--config \
require_two_barcodes=True \
discard_middle=True \
split_reads=False \
discard_unassigned=False \
barcode_set=native \
#Options are [native,rapid,all], `all` is much slower
limit_barcodes=True \
barcode_threshold=80 \
barcode_diff=5
```

If you wish to provide your own config file, it can be in yaml or json format.
