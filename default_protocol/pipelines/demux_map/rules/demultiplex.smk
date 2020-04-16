rule demultiplex_porechop:
    """
        Create a FASTQ with barcode information appended to the header using porechop
    """
    input:
        get_unzipped_fastq
    params:
        require_two_barcodes=require_two_barcodes,
        discard_middle=discard_middle,
        split_reads=split_reads,
        discard_unassigned=discard_unassigned,
        barcode_option = barcode_set,
        limit_barcodes_to = limit_barcodes_to,
        threshold = "--barcode_threshold " + str(config["barcode_threshold"]),
        diff = "--barcode_diff " + str(config["barcode_diff"])
    threads: config["threads"]
    output:
        temp(config["output_path"] + "/temp/{filename_stem}_demuxed.fastq")
    shell:
        """
        porechop \
        --verbosity 0 \
        -i {input:q} \
        -o {output:q} \
        --threads {threads} \
        --barcode_labels \
        {params.threshold} \
        {params.diff}\
        {params.limit_barcodes_to}\
        {params.require_two_barcodes}\
        {params.discard_middle}\
        {params.split_reads} \
        {params.discard_unassigned}\
        {params.barcode_option}
        """


def get_demuxed_fastq(wildcards):
    """
        For the fastq in question (gotten via wildcards), has it already been
        demuxed (via guppy)? If so, we can just hand this FASTQ straight to the
        next rule. If not we should call `demultiplex_porechop` in order to
        demux it. We effect this if/else logic via returning a input path
        which may require the invocation of the rule to create.
    """
    # We simply check the first line of the provided FASTQ -- if it includes "barcode" then demuxing has been done (guppy?)
    # if it's not, then we want to run rule `demultiplex_porechop` so we return its output value

    # There is a better way to do this -- we want to force the `unzip` rule to run if necessary
    # But, alas, snakemake is beyond me somethimes
    if config["filename_ext"] == ".fastq.gz":
        import gzip
        with gzip.open(expand(config["input_path"] + "/{filename_stem}.fastq.gz", filename_stem=wildcards.filename_stem)[0], 'rb') as fh:
            line1 = str(fh.readline())
    else:
        with open(expand(config["input_path"] + "/{filename_stem}.fastq", filename_stem=wildcards.filename_stem)[0]) as fh:
            line1 = fh.readline()

    if "barcode" in line1:
        return get_unzipped_fastq(wildcards)

    return config["output_path"] + "/temp/{filename_stem}_demuxed.fastq" # rule `demultiplex_porechop` will make this
