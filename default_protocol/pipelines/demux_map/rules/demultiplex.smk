rule demultiplex_porechop:
    input:
        config["input_path"] + "/{filename_stem}.fastq"
    params:
    #Can overwrite all of these parameters at the command line when you call snakemake
        require_two_barcodes=config["require_two_barcodes"],
        discard_middle=config["discard_middle"],
        no_split=config["no_split"],
        discard_unassigned=config["discard_unassigned"],
        native_barcodes = config["demux_option"],
        barcodes = barcode_string
    threads:
        2
    output:
        temp(config["output_path"] + "/temp/{filename_stem}.fastq")
    shell:
        "porechop --verbosity 0 "
        "-i {input} "
        "-o {output} "
        "--barcode_threshold 60 "
        "--threads 2 "
        "--barcode_diff 5 "
        "--barcode_labels "
        "--limit_barcodes_to {params.barcodes} "
        "{params.require_two_barcodes} "
        "{params.discard_middle} "
        "{params.no_split} "
        "{params.discard_unassigned} " # if you don't want to see the reads without a barcode
        "{params.native_barcodes}"

