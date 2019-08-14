rule minimap2:
    input:
        fastq= config["output_path"] + "/temp/{file_stem}.fastq",
        ref= config["references"]
    output:
        config["output_path"] + "/temp/{file_stem}.paf"
    shell:
        "minimap2 -x map-ont --secondary=no --paf-no-hit {input.ref} {input.fastq} > {output}"
        
#This minimap call runs a mapping optimised for ont reads, only outputs the top hit for each
#read and writes all reads, even if they don't have a hit (no hit written as ``*`` in paf file)


rule parse_mapping:
    input:
        fastq= config["output_path"] + "/temp/{file_stem}.fastq",
        mapped=config["output_path"] + "/temp/{file_stem}.paf"
    output:
        report = config["output_path"] + "/{file_stem}.csv"
    shell:
        "python pipelines/rampart_demux_map/parse_paf.py "
        "--paf_file {input.mapped} "
        "--report {output.report} "
        "--annotated_reads {input.fastq}"
#produces a csv report
