rule binlorry:
    input:
    params:
        report_dir= config["output_path"]+'/reports',
        sample= "{barcode}",
        path_to_reads= config["input_path"],
        min_length= config["min_length"],
        max_length= config["max_length"],
        outdir = config["output_path"]+'/binned/barcode_{barcode}'
    output:
        reads= config["output_path"] + "/binned/barcode_{barcode}/barcode_{barcode}.fastq",
        report= config["output_path"] + "/binned/barcode_{barcode}/barcode_{barcode}.csv"
    shell:
        "binlorry -i {params.path_to_reads} "
        "-n {params.min_length} "
        "-x {params.max_length} "
        "-t {params.report_dir} "
        "-o {params.outdir}/barcode "
        "--bin-by barcode "
        "--filter-by barcode {params.sample} "
        "--out-report"



