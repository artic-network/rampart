rule demultiplex_porechop:
    input:
        config["input_path"] + "/{filename_stem}.fastq"
    params:
        require_two_barcodes=require_two_barcodes,
        discard_middle=discard_middle,
        split_reads=split_reads,
        discard_unassigned=discard_unassigned,
        barcode_option = barcode_set,
        limit_barcodes_to = limit_barcodes_to,
        threshold = "--barcode_threshold " + str(config["barcode_threshold"]),
        diff = "--barcode_diff " + str(config["barcode_diff"])
    threads:
        2
    output:
        temp(config["output_path"] + "/temp/{filename_stem}.fastq")
    shell:
        """
        porechop \
        --verbosity 0 \
        -i {input:q} \
        -o {output:q} \
        --threads 2 \
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

