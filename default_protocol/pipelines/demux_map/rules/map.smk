rule minimap2:
    input:
        fastq= config["output_path"] + "/temp/{filename_stem}.fastq",
        ref= config["references_file"]
    output:
        temp(config["output_path"] + "/temp/{filename_stem}.paf")
    shell:
        "minimap2 -x map-ont --secondary=no --paf-no-hit {input.ref} {input.fastq} > {output}"
        
#This minimap call runs a mapping optimised for ont reads, only outputs the top hit for each
#read and writes all reads, even if they don't have a hit (no hit written as ``*`` in paf file)


rule parse_mapping:
    input:
        fastq= config["output_path"] + "/temp/{filename_stem}.fastq",
        mapped= config["output_path"] + "/temp/{filename_stem}.paf"
    params:
        path_to_script = workflow.current_basedir
    output:
        report = config["output_path"] + "/{filename_stem}.csv"
    shell:
        "python {params.path_to_script}/parse_paf.py "
        "--paf_file {input.mapped} "
        "--report {output.report} "
        "--annotated_reads {input.fastq}"
#produces a csv report
