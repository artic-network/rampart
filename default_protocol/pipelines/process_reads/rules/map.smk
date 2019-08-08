rule minimap2:
    input:
        fastq= config["outputPath"] + "/demuxed/{file_stem}.fastq",
        ref= config["referencePanelPath"]
    output:
        config["outputPath"] + "/mapped/{file_stem}.paf"
    shell:
        "minimap2 -x map-ont --secondary=no --paf-no-hit {input.ref} {input.fastq} > {output}"

rule parse_mapping:
    input:
        fastq= config["outputPath"] + "/demuxed/{file_stem}.fastq",
        mapped=config["outputPath"] + "/mapped/{file_stem}.paf",
        coordinate=config["outputPath"] + "/coordinate_mapped/{file_stem}.paf"
    output:
        report = config["outputPath"] + "/reports/{file_stem}.csv",
        annotated_reads = config["outputPath"] + "/annotated_reads/{file_stem}.fastq"
    shell:
        "python pipelines/rampart_demux_map/parse_paf.py "
        "--paf_file {input.mapped} "
        "--annotated_reads {input.fastq} "
        "--report {output.report}"

