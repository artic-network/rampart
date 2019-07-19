# configure this in future to demultiplex and write a report rather than copying the data

rule demultiplex_porechop:
    input:
        "../examples/norovirus/data/basecalled/{file_stem}.fastq"
    params:
        require_two_barcodes=config["require_two_barcodes"],
        discard_middle=config["discard_middle"],
        no_split=config["no_split"],
        discard_unassigned=config["discard_unassigned"],
        native_barcodes = config["demuxOption"]
    threads:
        2
    output:
        temp(demuxedPath + "/temp_demuxed/{file_stem}.fastq")
    shell:
        "porechop --verbosity 0 "
        "-i {input} "
        "-o {output} "
        "--barcode_threshold 80 "
        "--threads 2 "
        "--barcode_diff 5 "
        "--barcode_labels "
        "{params.require_two_barcodes} "
        "{params.discard_middle} "
        "{params.no_split} "
        "{params.discard_unassigned} "
        "{params.native_barcodes}"

