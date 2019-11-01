rule minimap2:
    input:
        fastq= config["output_path"] + "/temp/{filename_stem}.fastq",
        ref= config["references_file"]
    output:
        temp(config["output_path"] + "/temp/{filename_stem}.paf")
    shell:
        """
        minimap2 -x map-ont \
        --secondary=no \
        --paf-no-hit \
        {input.ref:q} \
        {input.fastq:q} > {output:q}
        """
        
#This minimap call runs a mapping optimised for ont reads, only outputs the top hit for each
#read and writes all reads, even if they don't have a hit (no hit written as ``*`` in paf file)


rule parse_mapping:
    input:
        fastq= config["output_path"] + "/temp/{filename_stem}.fastq",
        mapped= config["output_path"] + "/temp/{filename_stem}.paf",
        reference_file = config["references_file"],
    params:
        path_to_script = workflow.current_basedir,
        min_read_length = config["min_read_length"],
        max_read_length = config["max_read_length"],
        reference_options = f'--reference_options "{reference_fields}"'
    output:
        report = config["output_path"] + "/{filename_stem}.csv"
    shell:
        """
        python {params.path_to_script}/parse_paf.py \
        --paf_file {input.mapped:q} \
        --report {output.report:q} \
        --annotated_reads {input.fastq:q} \
        --min_read_length {params.min_read_length} \
        --max_read_length {params.max_read_length} \
        --reference_file {input.reference_file} \
        {params.reference_options}
        """
#produces a csv report
