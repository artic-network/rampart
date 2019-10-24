rule binlorry:
    input:
    params:
        path_to_reads = config["basecalled_path"],
        report_dir = config["annotated_path"],
        outdir = config["output_path"],
        min_read_length = config["min_read_length"],
        max_read_length = config["max_read_length"],
        barcodes = barcodes,
        sample_name = sample_name
    output:
        output_prefix= config["output_path"] + "/binned_{sample_name}",
    shell:
        "binlorry -i {params.path_to_reads:q} "
        "-t {params.report_dir:q} "
        "-o {output.output_prefix:q} "
        "-n {params.min_read_length} "
        "-x {params.max_read_length} "
        "-v 0 "
        "--filter-by barcode {params.barcodes} "
        "--out-report"



