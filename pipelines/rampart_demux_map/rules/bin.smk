rule binlorry:
    input:
    params:
        sample= "{barcode}",
        outputPath= config["outputPath"],
        min_length= config["min_length"],
        max_length= config["max_length"],
        outdir = config["outputPath"]+'/binned'
    output:
        reads= config["outputPath"] + "/binned/barcode_{barcode}.fastq"
    shell:
        "binlorry -i {params.outputPath}  "
        "-n {params.min_length} "
        "-x {params.max_length} "
        "--o {params.outdir}/barcode "
        "--bin-by barcode "
        "--filter-by barcode {params.sample}"


#{params.path_to_demuxed}

