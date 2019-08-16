rule binlorry:
    input:
    params:
        path_to_reads= config["input_path"],
        report_dir= config["annotated_path"],
        outdir = config["output_path"],
        min_length= config["min_length"],
        max_length= config["max_length"],
        bin_by_option= bin_string,
        barcodes = barcode_string,
        sample = sample_string
    output:
        reads= config["output_path"] + "/binned_{sample}.fastq",
        report= config["output_path"] + "/binned_{sample}.csv"
    shell:
        "binlorry -i {params.path_to_reads} "
        "-t {params.report_dir} "
        "-o {params.outdir}/binned_{params.sample} "
        "-n {params.min_length} "
        "-x {params.max_length} "
        "--filter-by barcode {params.barcodes} "
        "--out-report"
        " {params.bin_by_option}"



