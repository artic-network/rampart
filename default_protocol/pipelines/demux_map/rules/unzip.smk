rule unzip:
    """
    Uses the python standard library to copy a gzipped file to an unzipped file.
    Would be faster to use shell commands, but this reduces dependencies
    """
    input:
        config["input_path"] + "/{filename_stem}.fastq.gz"
    output:
        temp(config["output_path"] + "/temp/{filename_stem}.fastq")
    run:
        import gzip
        import shutil
        with gzip.open(input[0], 'rb') as f_in:
            with open(output[0], 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)


def get_unzipped_fastq(wildcards):
    if config["filename_ext"] == ".fastq.gz":
        return config["output_path"] + "/temp/{filename_stem}.fastq" # will call rule `unzip` to make this file
    return config["input_path"] + "/{filename_stem}.fastq"