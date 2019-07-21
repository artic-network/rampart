rule minimap2:
    input:
        fastq= demuxedPath + "/temp_demuxed/{file_stem}.fastq",
        ref= referencePanelPath
    output:
        demuxedPath + "/mapped/{file_stem}.paf"
    shell:
        "minimap2 -x map-ont --secondary=no --paf-no-hit {input.ref} {input.fastq} > {output}"

rule parse_mapping:
    input:
        fastq= demuxedPath + "/temp_demuxed/{file_stem}.fastq",
        mapped=demuxedPath + "/mapped/{file_stem}.paf",
        # bed=bedPath
    output:
        report = demuxedPath + "/reports/{file_stem}.csv",
        annotated_reads = demuxedPath + "/annotated_reads/{file_stem}.fastq"
    shell:
        "python parse_paf.py --paf_file {input.mapped} "
        "--reads {input.fastq} --reads_out {output.annotated_reads} "
        "--report {output.report} " 
        #"--bed_file {input.bed}"
