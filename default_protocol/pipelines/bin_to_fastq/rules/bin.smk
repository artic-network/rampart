rule binlorry:
    input:
    params:
        report_dir= config["report_path"],
        path_to_reads= config["input_path"],
        barcodes= barcode_string,
        min_length= config["min_length"],
        max_length= config["max_length"],
        outdir = config["output_path"]
    output:
        reads= expand(config["output_path"] + "/barcode_{barcode}.fastq", barcode=config["barcodes"]),
        report= expand(config["output_path"] + "/barcode_{barcode}.csv", barcode=config["barcodes"])
    shell:
        "binlorry -i {params.path_to_reads} "
        "-t {params.report_dir} "
        "-o {params.outdir}/barcode "
        "-n {params.min_length} "
        "-x {params.max_length} "
        "--bin-by barcode "
        "--filter-by barcode{params.barcodes} "
        "--out-report"



