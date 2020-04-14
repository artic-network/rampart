rule minimap2:
    """
    This rule takes the FASTQ and maps it to the reference panel.
    It uses the FASTQ independent of demuxing -- i.e. it doesn't matter whether the file has barcode
    information in the header.
    """
    input:
        fastq=get_unzipped_fastq,
        ref= config["references_file"]
    output:
        temp(config["output_path"] + "/temp/{filename_stem}.paf")
    threads: config["threads"]
    shell:
        """
        minimap2 -t {threads} -x map-ont \
        --secondary=no \
        --paf-no-hit \
        --cs \
        {input.ref:q} \
        {input.fastq:q} > {output:q}
        """
        
#This minimap call runs a mapping optimised for ont reads, only outputs the top hit for each
#read and writes all reads, even if they don't have a hit (no hit written as ``*`` in paf file)


rule parse_mapping:
    """
    This rule takes the FASTQ with demuxing done as well as the minimap output (rule: `minimap2`)
    and returns the desired output for RAMPART to ingest.
    Since we don't know a priori whether guppy demuxing has been done, we call the function
    `get_demuxed_fastq` to conditionally require porechop demuxing.
    """
    input:
        fastq=get_demuxed_fastq,
        mapped=config["output_path"] + "/temp/{filename_stem}.paf",
        reference_file = config["references_file"],
    params:
        path_to_script = workflow.current_basedir,
        min_identity= minimum_identity, 
        reference_options = f'--reference_options "{reference_fields}"'
    output:
        report = config["output_path"] + "/{filename_stem}.csv"
    shell:
        """
        python {params.path_to_script}/parse_paf.py \
        --paf_file {input.mapped:q} \
        --report {output.report:q} \
        --annotated_reads {input.fastq:q} \
        --reference_file {input.reference_file:q} \
        {params.min_identity} \
        {params.reference_options}
        """
#produces a csv report
